<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class DigestController extends Controller
{
    /**
     * Kirim email uji coba (Test Dispatch) langsung ke user superadmin yang login.
     */
    public function sendTestDigest(Request $request): JsonResponse
    {
        $user = $request->user();
        $targetEmail = $user->email;

        try {
            Artisan::call('report:owner-morning-digest', [
                '--email' => $targetEmail,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => "Email laporan pagi uji coba berhasil dikirim ke {$targetEmail}",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => "Gagal mengirim email: " . $e->getMessage(),
            ], 500);
        }
    }
}
