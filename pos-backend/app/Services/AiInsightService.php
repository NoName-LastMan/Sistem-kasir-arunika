<?php

namespace App\Services;

use App\Models\AiBriefingLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiInsightService
{
    /**
     * Memanggil Groq API atau Google Gemini API untuk mendapatkan analisis naratif.
     * Menggunakan snapshot AiBriefingLog jika sudah tersedia untuk hari ini (Hemat Token & Cepat).
     */
    public function generateInsights(array $metrics, bool $isExecutive = false, bool $forceRefresh = false): string
    {
        $today = Carbon::today()->toDateString();

        // 1. Cek apakah narasi hari ini sudah dibuat di AiBriefingLog
        if (!$forceRefresh) {
            $log = AiBriefingLog::whereDate('briefing_date', $today)->first();
            if ($log) {
                if ($isExecutive && !empty($log->owner_executive_payload['narrative'])) {
                    return $log->owner_executive_payload['narrative'];
                }
                if (!$isExecutive && !empty($log->admin_operational_payload['narrative'])) {
                    return $log->admin_operational_payload['narrative'];
                }
            }
        }

        // 2. Generate insight narasi jika belum ada
        $groqKey = config('services.groq.key', env('GROQ_API_KEY'));
        $geminiKey = config('services.gemini.key', env('GEMINI_API_KEY'));
        $providerUsed = 'rule-based-fallback';
        $insight = null;

        // Coba Groq LPU terlebih dahulu (sangat cepat & hemat latency)
        if ($groqKey) {
            $insight = $this->callGroq($groqKey, $metrics, $isExecutive);
            if ($insight) {
                $providerUsed = 'groq-llama-3.3';
            }
        }

        // Coba Google Gemini jika Groq tidak tersedia atau gagal
        if (!$insight && $geminiKey) {
            $insight = $this->callGemini($geminiKey, $metrics, $isExecutive);
            if ($insight) {
                $providerUsed = 'gemini-2.5-flash';
            }
        }

        // Fallback deterministik bebas ketergantungan jaringan
        if (!$insight) {
            $insight = $this->generateFallbackNarrative($metrics, $isExecutive);
        }

        // 3. Simpan ke AiBriefingLog hari ini
        try {
            $log = AiBriefingLog::firstOrNew(['briefing_date' => $today]);
            $log->llm_provider = $providerUsed;

            if ($isExecutive) {
                $payload = $log->owner_executive_payload ?? [];
                $payload['narrative'] = $insight;
                $payload['generated_at'] = Carbon::now()->toIso8601String();
                $log->owner_executive_payload = $payload;
            } else {
                $payload = $log->admin_operational_payload ?? [];
                $payload['narrative'] = $insight;
                $payload['generated_at'] = Carbon::now()->toIso8601String();
                $log->admin_operational_payload = $payload;
            }

            $log->save();
        } catch (\Throwable $e) {
            Log::warning("Gagal menyimpan AiBriefingLog: " . $e->getMessage());
        }

        return $insight;
    }

    /**
     * Panggilan ke Groq Cloud API (Llama 3.3 70B).
     */
    private function callGroq(string $apiKey, array $metrics, bool $isExecutive): ?string
    {
        $systemPrompt = $isExecutive
            ? "Anda adalah konsultan keuangan dan auditor operasional F&B profesional untuk pemilik toko (Owner). Berikan evaluasi tajam mengenai kebutuhan dana belanja, potensi risiko kehabisan stok, serta saran prioritas dalam 3-4 kalimat ringkas dan jelas."
            : "Anda adalah kepala gudang & asisten operasional kafe. Berikan petunjuk belanja bahan praktis dan peringatan bahan yang kritis kepada staf dapur dalam 2-3 kalimat lugas.";

        try {
            $response = Http::withToken($apiKey)
                ->timeout(6)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => "Data Metrik Bahan Baku: " . json_encode(array_slice($metrics, 0, 10))],
                    ],
                    'temperature' => 0.3,
                    'max_tokens'  => 300,
                ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                if ($content) {
                    return trim($content);
                }
            }
        } catch (\Throwable $e) {
            Log::warning("AI Groq request failed: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Panggilan ke Google Gemini API (Gemini 2.0 / 2.5 Flash).
     */
    private function callGemini(string $apiKey, array $metrics, bool $isExecutive): ?string
    {
        $roleInstruction = $isExecutive
            ? "Anda adalah CFO dan analis F&B eksekutif untuk Owner kafe. Berikan ringkasan risiko stok, perkiraan kebutuhan modal belanja, dan tindakan prioritas dalam 3-4 kalimat Bahasa Indonesia yang profesional."
            : "Anda adalah manajer gudang kafe. Berikan instruksi belanja praktis dan peringatan stok kritis kepada staf dapur dalam 2-3 kalimat Bahasa Indonesia.";

        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";
            $response = Http::timeout(6)->post($url, [
                'system_instruction' => [
                    'parts' => [['text' => $roleInstruction]]
                ],
                'contents' => [
                    [
                        'parts' => [
                            ['text' => "Data Stok: " . json_encode(array_slice($metrics, 0, 10))]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.3,
                    'maxOutputTokens' => 300,
                ]
            ]);

            if ($response->successful()) {
                $text = $response->json('candidates.0.content.parts.0.text');
                if ($text) {
                    return trim($text);
                }
            }
        } catch (\Throwable $e) {
            Log::warning("AI Gemini request failed: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Narasi Fallback deterministik berbasis kondisi data.
     */
    private function generateFallbackNarrative(array $metrics, bool $isExecutive): string
    {
        $items = collect($metrics);
        $critical = $items->where('urgency', 'CRITICAL');
        $warning = $items->where('urgency', 'WARNING');

        if ($critical->isEmpty() && $warning->isEmpty()) {
            return "Kondisi persediaan seluruh bahan baku dalam batas aman untuk operasional minggu ini.";
        }

        $criticalNames = $critical->pluck('name')->join(', ');

        if ($isExecutive) {
            $totalEstCost = $critical->sum('estimated_cost');
            $costFormatted = 'Rp ' . number_format($totalEstCost, 0, ',', '.');
            if ($critical->isNotEmpty()) {
                return "⚠️ Perhatian Eksekutif: Terdapat {$critical->count()} bahan dalam status kritis ({$criticalNames}) yang diproyeksikan habis dalam < 2 hari. Estimasi kebutuhan dana belanja darurat bahan kritis ini adalah {$costFormatted}.";
            }
            return "Terdapat beberapa bahan yang memasuki masa waspada (sisa 2-3 hari). Tidak ada kebutuhan dana mendesak hari ini.";
        }

        if ($critical->isNotEmpty()) {
            return "🚨 Perhatian Gudang: Stok {$criticalNames} kritis dan diperkirakan segera habis. Segera jadwalkan pembelian ke supplier atau pasar hari ini.";
        }

        return "Peringatan: Beberapa stok bahan mendekati batas pemesanan ulang. Periksa kuantitas fisik sebelum akhir pekan.";
    }
}
