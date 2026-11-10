<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ForecastSnapshot;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shift;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\WasteRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use ZipArchive;

class MasterReportExcelTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_export_valid_xlsx_master_workbook_with_all_9_sheets_and_charts(): void
    {
        $owner = User::factory()->create([
            'name' => 'Pak Budi Owner',
            'role' => 'superadmin',
        ]);
        $cashier = User::factory()->create([
            'name' => 'Kasir Pagi',
            'role' => 'cashier',
        ]);

        $catCoffee = Category::create([
            'name' => 'Kopi Signature',
            'slug' => 'kopi-signature',
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $catCoffee->id,
            'name' => 'Kopi Susu Arunika',
            'sku' => 'KPI-001',
            'price' => 22000,
            'cost_price' => 8000,
            'stock' => 100,
            'track_stock' => false,
            'is_active' => true,
        ]);

        $ingredientCritical = Ingredient::create([
            'name' => 'Biji Kopi Arabica',
            'base_unit' => 'kg',
            'stock_quantity' => 1.5,
            'min_stock_alert' => 2.0,
            'cost_per_unit' => 120000,
            'track_stock' => true,
            'lead_time_days' => 5,
            'purchase_unit' => 'sak',
            'purchase_unit_ratio' => 1,
        ]);
        $ingredientSafe = Ingredient::create([
            'name' => 'Gula Aren Cair',
            'base_unit' => 'liter',
            'stock_quantity' => 25.0,
            'min_stock_alert' => 5.0,
            'cost_per_unit' => 35000,
            'track_stock' => true,
            'lead_time_days' => 3,
        ]);

        $shift = Shift::create([
            'user_id' => $cashier->id,
            'opened_at' => '2026-10-15 08:00:00',
            'closed_at' => '2026-10-15 16:00:00',
            'starting_cash' => 200000,
            'expected_cash' => 244000,
            'actual_cash' => 240000,
            'cash_difference' => -4000,
            'status' => 'closed',
        ]);

        $order = Order::create([
            'invoice_number' => 'ARN-20261015-0001',
            'user_id' => $cashier->id,
            'shift_id' => $shift->id,
            'order_type' => 'dine_in',
            'subtotal' => 44000,
            'tax_amount' => 4400,
            'discount_amount' => 0,
            'total_amount' => 48400,
            'payment_method' => 'qris',
            'payment_status' => 'paid',
            'status' => 'completed',
            'created_at' => '2026-10-15 10:30:00',
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 22000,
            'subtotal' => 44000,
        ]);

        Order::create([
            'invoice_number' => 'ARN-20261015-0002',
            'user_id' => $cashier->id,
            'order_type' => 'takeaway',
            'subtotal' => 22000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => 22000,
            'payment_method' => 'cash',
            'payment_status' => 'refunded',
            'status' => 'cancelled',
            'void_reason' => 'Salah input varian',
            'voided_at' => '2026-10-15 11:00:00',
            'voided_by' => $owner->id,
            'created_at' => '2026-10-15 10:55:00',
        ]);

        WasteRecord::create([
            'ingredient_id' => $ingredientCritical->id,
            'quantity' => 0.25,
            'reason' => 'spoilage',
            'notes' => 'Biji lembab terkena air',
            'user_id' => $owner->id,
            'created_at' => '2026-10-15 14:00:00',
        ]);

        StockMutation::create([
            'ingredient_id' => $ingredientCritical->id,
            'user_id' => $owner->id,
            'type' => 'opname',
            'quantity' => -0.15,
            'stock_before' => 2.0,
            'stock_after' => 1.85,
            'reference_note' => 'Audit fisik sore',
            'reference_type' => 'opname',
            'created_at' => '2026-10-15 17:00:00',
        ]);

        ForecastSnapshot::create([
            'forecast_date' => '2026-10-15',
            'ingredient_id' => $ingredientSafe->id,
            'model_used' => 'WMA_Fallback',
            'lead_time_days' => 3,
            'current_stock' => 25.0,
            'predicted_daily_burn' => 0.5,
            'safety_stock_qty' => 2.0,
            'days_until_stockout' => 50,
            'recommended_reorder_qty' => 0,
            'urgency_status' => 'SAFE',
            'unit_cost_rp' => 35000,
            'estimated_reorder_cost_rp' => 0,
        ]);

        ForecastSnapshot::create([
            'forecast_date' => '2026-10-15',
            'ingredient_id' => $ingredientCritical->id,
            'model_used' => 'AutoETS',
            'lead_time_days' => 5,
            'current_stock' => 1.5,
            'predicted_daily_burn' => 0.75,
            'safety_stock_qty' => 4.5,
            'days_until_stockout' => 2,
            'recommended_reorder_qty' => 6.0,
            'purchase_unit' => 'sak',
            'recommended_purchase_packs' => 6,
            'urgency_status' => 'CRITICAL',
            'unit_cost_rp' => 120000,
            'estimated_reorder_cost_rp' => 720000,
            'accuracy_percentage' => 92.5,
        ]);

        $response = $this->actingAs($owner)->get('/api/reports/export-excel?start_date=2026-10-01&end_date=2026-10-31');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $binary = $response->getContent();
        $this->assertStringStartsWith('PK', $binary, 'Output harus berupa file ZIP / OOXML .xlsx valid');

        $tmp = tempnam(sys_get_temp_dir(), 'test_xlsx_');
        file_put_contents($tmp, $binary);

        try {
            $zip = new ZipArchive();
            $this->assertTrue($zip->open($tmp) === true, 'Archive .xlsx harus dapat dibuka ZipArchive');

            $workbookXml = $zip->getFromName('xl/workbook.xml');
            $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
            $stylesXml = $zip->getFromName('xl/styles.xml');
            $contentTypesXml = $zip->getFromName('[Content_Types].xml');

            $this->assertNotFalse($workbookXml);
            $this->assertNotFalse($sharedStringsXml);
            $this->assertNotFalse($stylesXml);
            $this->assertNotFalse($contentTypesXml);

            // Pastikan seluruh 9 sheet ada pada workbook.xml
            $expectedSheets = [
                'Ringkasan Eksekutif',
                'Laba Rugi &amp; HPP',
                'Tren Omzet Harian',
                'Menu Terlaris',
                'Performa Kasir',
                'Limbah Dapur',
                'Audit Opname &amp; Anomali',
                'Prediksi Stok &amp; Belanja',
                'Rincian Transaksi',
            ];
            foreach ($expectedSheets as $sheetTitle) {
                $this->assertStringContainsString("name=\"{$sheetTitle}\"", $workbookXml);
            }

            // Pastikan chart OOXML native ikut terbangun & tidak ada typo lama
            $this->assertNotFalse($zip->getFromName('xl/charts/chart1.xml'));
            $this->assertNotFalse($zip->getFromName('xl/drawings/drawing1.xml'));
            $this->assertStringNotContainsString('PREDRAWN', $sharedStringsXml);

            // Verifikasi formula dinamis ada pada worksheet transaksi & opname
            $sheet2Xml = $zip->getFromName('xl/worksheets/sheet2.xml');
            $sheet7Xml = $zip->getFromName('xl/worksheets/sheet7.xml');
            $sheet8Xml = $zip->getFromName('xl/worksheets/sheet8.xml');
            $this->assertStringContainsString('<f>SUM(', $sheet2Xml);
            $this->assertStringContainsString('ANOMALI (&gt;5%)', $sharedStringsXml);
            $this->assertNotFalse($sheet7Xml);

            // Verifikasi CRITICAL muncul sebelum AMAN pada Sheet 8
            $posCritical = strpos($sharedStringsXml, 'KRITIS - BELI SEGERA');
            $posSafe = strpos($sharedStringsXml, '>AMAN<');
            $this->assertNotFalse($posCritical);
            $this->assertNotFalse($posSafe);
            $this->assertLessThan($posSafe, $posCritical);

            // Validasi tiap file XML di dalam arsip dapat diparsing sempurna
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entryName = $zip->getNameIndex($i);
                if (str_ends_with($entryName, '.xml') || str_ends_with($entryName, '.rels')) {
                    $xml = @simplexml_load_string($zip->getFromIndex($i));
                    $this->assertNotFalse($xml, "XML part {$entryName} harus valid tanpa error syntax.");
                }
            }

            $zip->close();
        } finally {
            @unlink($tmp);
        }
    }

    public function test_export_excel_handles_empty_period_gracefully(): void
    {
        $owner = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($owner)->get('/api/reports/export-excel?start_date=2025-01-01&end_date=2025-01-31');
        $response->assertStatus(200);

        $tmp = tempnam(sys_get_temp_dir(), 'test_empty_xlsx_');
        file_put_contents($tmp, $response->getContent());

        try {
            $zip = new ZipArchive();
            $this->assertTrue($zip->open($tmp) === true);
            $this->assertNotFalse($zip->getFromName('xl/worksheets/sheet1.xml'));
            $this->assertNotFalse($zip->getFromName('xl/worksheets/sheet9.xml'));
            $zip->close();
        } finally {
            @unlink($tmp);
        }
    }
}
