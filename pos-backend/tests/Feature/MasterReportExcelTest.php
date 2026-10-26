<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterReportExcelTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_export_master_excel_with_all_sheets(): void
    {
        $owner = User::factory()->create([
            'role' => 'superadmin',
        ]);

        $response = $this->actingAs($owner)->get('/api/reports/export-excel?start_date=2026-01-01&end_date=2026-12-31');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.ms-excel; charset=UTF-8');

        $content = $response->getContent();

        // Verifikasi dokumen XML Spreadsheet 2003 valid
        $this->assertStringContainsString('<?xml version="1.0" encoding="UTF-8"?>', $content);
        $this->assertStringContainsString('<?mso-application progid="Excel.Sheet"?>', $content);
        $this->assertStringContainsString('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"', $content);

        // Verifikasi seluruh 9 sheet laporan untuk Owner ada di dalam 1 file
        $this->assertStringContainsString('ss:Name="Ringkasan Eksekutif"', $content);
        $this->assertStringContainsString('ss:Name="Laba Rugi &amp; HPP"', $content);
        $this->assertStringContainsString('ss:Name="Tren Omzet Harian"', $content);
        $this->assertStringContainsString('ss:Name="Menu Terlaris"', $content);
        $this->assertStringContainsString('ss:Name="Performa Kasir"', $content);
        $this->assertStringContainsString('ss:Name="Limbah Dapur"', $content);
        $this->assertStringContainsString('ss:Name="Audit Opname &amp; Anomali"', $content);
        $this->assertStringContainsString('ss:Name="Prediksi Stok &amp; Belanja"', $content);
        $this->assertStringContainsString('ss:Name="Rincian Transaksi"', $content);

        // Verifikasi keabsahan sintaks XML
        $xml = simplexml_load_string($content);
        $this->assertNotFalse($xml, 'XML format harus valid dan dapat diparsing oleh parser XML/Excel');
    }
}
