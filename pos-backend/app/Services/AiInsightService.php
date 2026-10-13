<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiInsightService
{
    /**
     * Memanggil Groq API atau Google Gemini API untuk mendapatkan analisis naratif.
     *
     * @param array $metrics Data forecasting stok & operasional toko
     * @param bool $isExecutive True jika insight ditujukan untuk Owner
     * @return string
     */
    public function generateInsights(array $metrics, bool $isExecutive = false): string
    {
        $groqKey = config('services.groq.key', env('GROQ_API_KEY'));
        $geminiKey = config('services.gemini.key', env('GEMINI_API_KEY'));

        // Coba Groq LPU terlebih dahulu jika ada key (sangat cepat & responsif)
        if ($groqKey) {
            $insight = $this->callGroq($groqKey, $metrics, $isExecutive);
            if ($insight) {
                return $insight;
            }
        }

        // Coba Google Gemini jika key Groq tidak ada atau gagal
        if ($geminiKey) {
            $insight = $this->callGemini($geminiKey, $metrics, $isExecutive);
            if ($insight) {
                return $insight;
            }
        }

        // Fallback aman tanpa dependensi eksternal (Rule-based narrative)
        return $this->generateFallbackNarrative($metrics, $isExecutive);
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
                ->timeout(8)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => "Data Metrik Bahan Baku: " . json_encode($metrics)],
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
     * Panggilan ke Google Gemini API (Gemini 2.0 / 1.5 Flash).
     */
    private function callGemini(string $apiKey, array $metrics, bool $isExecutive): ?string
    {
        $roleInstruction = $isExecutive
            ? "Anda adalah CFO dan analis F&B eksekutif untuk Owner kafe. Berikan ringkasan risiko stok, perkiraan kebutuhan modal belanja, dan tindakan prioritas dalam 3-4 kalimat Bahasa Indonesia yang profesional."
            : "Anda adalah manajer gudang kafe. Berikan instruksi belanja praktis dan peringatan stok kritis kepada staf dapur dalam 2-3 kalimat Bahasa Indonesia.";

        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";
            $response = Http::timeout(8)->post($url, [
                'system_instruction' => [
                    'parts' => [['text' => $roleInstruction]]
                ],
                'contents' => [
                    [
                        'parts' => [
                            ['text' => "Data Stok: " . json_encode($metrics)]
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
