<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Mengambil profil toko & pengaturan POS (admin).
     */
    public function show()
    {
        $setting = Setting::firstOrCreate([], [
            'store_name'          => 'Warmindo & Cafe POS',
            'store_address'       => 'Jl. Contoh Alamat No. 123',
            'store_phone'         => '0812-3456-7890',
            'receipt_header'      => 'WARMINDO & CAFE POS',
            'receipt_footer'      => 'Terima kasih atas kunjungan Anda!',
            'default_tax_rate'     => 10.00,
            'service_charge_rate' => 0.00,
            'invoice_prefix'      => 'INV-',
        ]);

        return response()->json([
            'message' => 'Pengaturan toko & struk',
            'data'    => $setting
        ]);
    }

    /**
     * Mengambil pengaturan toko untuk POS frontend (read-only, non-admin).
     */
    public function showPublic()
    {
        $setting = Setting::firstOrCreate([], [
            'store_name'          => 'Warmindo & Cafe POS',
            'store_address'       => 'Jl. Contoh Alamat No. 123',
            'store_phone'         => '0812-3456-7890',
            'receipt_header'      => 'WARMINDO & CAFE POS',
            'receipt_footer'      => 'Terima kasih atas kunjungan Anda!',
            'default_tax_rate'     => 10.00,
            'service_charge_rate' => 0.00,
            'invoice_prefix'      => 'INV-',
        ]);

        return response()->json([
            'data' => $setting
        ]);
    }

    /**
     * Memperbarui pengaturan toko & struk.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'store_name'          => 'required|string|max:150',
            'store_address'       => 'nullable|string',
            'store_phone'         => 'nullable|string|max:50',
            'store_email'         => 'nullable|email|max:100',
            'receipt_header'      => 'nullable|string',
            'receipt_footer'      => 'nullable|string',
            'default_tax_rate'     => 'required|numeric|min:0|max:100',
            'service_charge_rate' => 'nullable|numeric|min:0|max:100',
            'invoice_prefix'      => 'nullable|string|max:20',
        ]);

        $setting = Setting::firstOrCreate([]);
        $setting->update($validated);

        return response()->json([
            'message' => 'Pengaturan toko berhasil diperbarui',
            'data'    => $setting
        ]);
    }
}
