<?php

namespace Tests\Unit\Services;

use App\Models\ForecastSnapshot;
use App\Models\Ingredient;
use App\Models\StockMutation;
use App\Models\User;
use App\Services\StockForecastingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForecastingServiceTest extends TestCase
{
    use RefreshDatabase;

    private StockForecastingService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(StockForecastingService::class);
        $this->user = User::create([
            'name'     => 'Admin Test',
            'email'    => 'admin@test.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
        ]);
    }

    public function test_forecast_generates_and_persists_snapshot(): void
    {
        $ingredient = Ingredient::create([
            'name'            => 'Beras Rojolele',
            'base_unit'       => 'kg',
            'stock_quantity'  => 50.0,
            'cost_per_unit'   => 12000,
            'min_stock_alert' => 10.0,
        ]);

        // Simulasikan 20 hari konsumsi
        for ($i = 20; $i >= 1; $i--) {
            StockMutation::create([
                'ingredient_id' => $ingredient->id,
                'user_id'       => $this->user->id,
                'type'          => 'out',
                'quantity'      => -2.5,
                'stock_before'  => 50.0,
                'stock_after'   => 47.5,
                'created_at'    => Carbon::today()->subDays($i),
            ]);
        }

        $forecasts = $this->service->getForecast($ingredient->id, true);

        $this->assertNotEmpty($forecasts);
        $item = $forecasts->first();

        $this->assertEquals('Beras Rojolele', $item['name']);
        $this->assertGreaterThan(0, $item['daily_burn_rate']);
        $this->assertGreaterThan(0, $item['days_until_stockout']);
        $this->assertArrayHasKey('estimated_cost', $item);
        $this->assertArrayHasKey('unit_cost_rp', $item);

        // Verifikasi tabel forecast_snapshots memiliki data
        $this->assertDatabaseHas('forecast_snapshots', [
            'ingredient_id' => $ingredient->id,
            'forecast_date' => Carbon::today()->toDateString(),
        ]);
    }

    public function test_forecast_rbac_hides_financials_for_admin(): void
    {
        $ingredient = Ingredient::create([
            'name'            => 'Kopi Arabica',
            'base_unit'       => 'kg',
            'stock_quantity'  => 5.0,
            'cost_per_unit'   => 150000,
            'min_stock_alert' => 2.0,
        ]);

        $adminForecast = $this->service->getForecast($ingredient->id, false)->first();
        $ownerForecast = $this->service->getForecast($ingredient->id, true)->first();

        // Admin: tidak melihat nilai rupiah belanja
        $this->assertArrayNotHasKey('estimated_cost', $adminForecast);
        $this->assertArrayNotHasKey('unit_cost_rp', $adminForecast);

        // Owner: melihat nilai rupiah belanja
        $this->assertArrayHasKey('estimated_cost', $ownerForecast);
        $this->assertArrayHasKey('unit_cost_rp', $ownerForecast);
    }

    public function test_self_evaluating_wape_accuracy(): void
    {
        $ingredient = Ingredient::create([
            'name'            => 'Telur Ayam',
            'base_unit'       => 'butir',
            'stock_quantity'  => 100.0,
            'cost_per_unit'   => 2000,
            'min_stock_alert' => 20.0,
        ]);

        $yesterday = Carbon::yesterday()->toDateString();

        // Prediksi kemarin: 10 butir
        ForecastSnapshot::create([
            'forecast_date'           => $yesterday,
            'ingredient_id'           => $ingredient->id,
            'model_used'              => 'AutoETS',
            'current_stock'           => 110.0,
            'predicted_daily_burn'    => 10.0,
            'safety_stock_qty'        => 5.0,
            'days_until_stockout'     => 11.0,
            'recommended_reorder_qty' => 0.0,
            'urgency_status'          => 'SAFE',
            'unit_cost_rp'            => 2000,
            'estimated_reorder_cost_rp'=> 0,
        ]);

        // Pemakaian riil kemarin: 9 butir (WAPE error = |9 - 10| / 9 = 11.1%, akurasi = 88.9%)
        StockMutation::create([
            'ingredient_id' => $ingredient->id,
            'user_id'       => $this->user->id,
            'type'          => 'out',
            'quantity'      => -9.0,
            'stock_before'  => 110.0,
            'stock_after'   => 101.0,
            'created_at'    => Carbon::yesterday()->midDay(),
        ]);

        $snapshots = $this->service->generateAndSaveDailySnapshot(Carbon::today());
        $telurToday = $snapshots->where('ingredient_id', $ingredient->id)->first();

        $this->assertNotNull($telurToday->accuracy_percentage);
        $this->assertEquals(88.9, $telurToday->accuracy_percentage);
    }

    public function test_ingredient_stock_update_syncs_today_snapshot(): void
    {
        $ingredient = Ingredient::create([
            'name'            => 'Susu Segar UHT',
            'base_unit'       => 'liter',
            'stock_quantity'  => 30.0,
            'cost_per_unit'   => 18000,
            'min_stock_alert' => 5.0,
        ]);

        $today = Carbon::today()->toDateString();

        // Buat snapshot awal hari ini
        ForecastSnapshot::create([
            'forecast_date'           => $today,
            'ingredient_id'           => $ingredient->id,
            'model_used'              => 'AutoETS',
            'current_stock'           => 30.0,
            'predicted_daily_burn'    => 5.0,
            'safety_stock_qty'        => 5.0,
            'days_until_stockout'     => 6.0,
            'recommended_reorder_qty' => 10.0,
            'urgency_status'          => 'SAFE',
            'unit_cost_rp'            => 18000,
            'estimated_reorder_cost_rp'=> 180000,
        ]);

        // Trigger mutasi stok: stok berkurang dari 30.0 jadi 4.0 (menghasilkan sisa 0.8 hari -> CRITICAL)
        $ingredient->update(['stock_quantity' => 4.0]);

        // Periksa snapshot otomatis ter-update secara real-time
        $updatedSnapshot = ForecastSnapshot::where('ingredient_id', $ingredient->id)
            ->whereDate('forecast_date', $today)
            ->first();

        $this->assertEquals(4.0, (float) $updatedSnapshot->current_stock);
        $this->assertEquals(0.8, (float) $updatedSnapshot->days_until_stockout);
        $this->assertEquals('CRITICAL', $updatedSnapshot->urgency_status);
        $this->assertGreaterThan(0, (float) $updatedSnapshot->recommended_reorder_qty);
    }

    public function test_waste_is_excluded_from_consumption_forecasting(): void
    {
        $ingredient = Ingredient::create([
            'name'            => 'Minyak Goreng',
            'base_unit'       => 'liter',
            'stock_quantity'  => 20.0,
            'cost_per_unit'   => 15000,
            'min_stock_alert' => 5.0,
        ]);

        // Konsumsi penjualan normal kemarin: 5 liter (reference_type = 'order')
        StockMutation::create([
            'ingredient_id'  => $ingredient->id,
            'user_id'        => $this->user->id,
            'type'           => 'out',
            'quantity'       => -5.0,
            'stock_before'   => 75.0,
            'stock_after'    => 70.0,
            'reference_type' => 'order',
            'created_at'     => Carbon::yesterday()->midDay(),
        ]);

        // Kejadian tumpah / rusak kemarin: 50 liter (reference_type = 'waste')
        StockMutation::create([
            'ingredient_id'  => $ingredient->id,
            'user_id'        => $this->user->id,
            'type'           => 'out',
            'quantity'       => -50.0,
            'stock_before'   => 70.0,
            'stock_after'    => 20.0,
            'reference_type' => 'waste',
            'created_at'     => Carbon::yesterday()->midDay(),
        ]);

        $snapshots = $this->service->generateAndSaveDailySnapshot(Carbon::today());
        $minyakToday = $snapshots->where('ingredient_id', $ingredient->id)->first();

        // Pemakaian aktual kemarin yang dihitung sistem harus 5.0 (TIDAK menyertakan waste 50.0)
        $this->assertEquals(5.0, (float) $minyakToday->actual_usage_yesterday);
        $this->assertLessThan(15.0, (float) $minyakToday->predicted_daily_burn);
    }

    public function test_dynamic_lead_time_and_purchase_packs_conversion(): void
    {
        $ingredient = Ingredient::create([
            'name'                => 'Beras Premium',
            'base_unit'           => 'kg',
            'stock_quantity'      => 5.0,
            'cost_per_unit'       => 14000,
            'min_stock_alert'     => 10.0,
            'lead_time_days'      => 3,
            'purchase_unit'       => 'karung',
            'purchase_unit_ratio' => 25.0, // 1 karung = 25 kg
        ]);

        // Simulasikan pemakaian 10 kg/hari
        StockMutation::create([
            'ingredient_id'  => $ingredient->id,
            'user_id'        => $this->user->id,
            'type'           => 'out',
            'quantity'       => -10.0,
            'stock_before'   => 15.0,
            'stock_after'    => 5.0,
            'reference_type' => 'order',
            'created_at'     => Carbon::yesterday()->midDay(),
        ]);

        $snapshots = $this->service->generateAndSaveDailySnapshot(Carbon::today());
        $berasToday = $snapshots->where('ingredient_id', $ingredient->id)->first();

        $this->assertEquals(3, $berasToday->lead_time_days);
        $this->assertEquals('karung', $berasToday->purchase_unit);
        $this->assertGreaterThan(0, (float) $berasToday->recommended_reorder_qty);
        // Jika butuh misal 37.5 kg beras, maka dalam kemasan karung (25kg) disarankan ceil(37.5 / 25) = 2 karung
        $this->assertGreaterThanOrEqual(1.0, (float) $berasToday->recommended_purchase_packs);
    }

    public function test_forecast_prune_command_deletes_old_snapshots(): void
    {
        $ingredient = Ingredient::create([
            'name'            => 'Gula Pasir',
            'base_unit'       => 'kg',
            'stock_quantity'  => 10.0,
            'cost_per_unit'   => 16000,
        ]);

        // Snapshot usang 100 hari lalu
        ForecastSnapshot::create([
            'forecast_date'           => Carbon::today()->subDays(100)->toDateString(),
            'ingredient_id'           => $ingredient->id,
            'model_used'              => 'WMA_Fallback',
            'current_stock'           => 10.0,
            'predicted_daily_burn'    => 2.0,
            'safety_stock_qty'        => 1.0,
            'days_until_stockout'     => 5.0,
            'recommended_reorder_qty' => 0.0,
            'urgency_status'          => 'SAFE',
            'unit_cost_rp'            => 16000,
            'estimated_reorder_cost_rp'=> 0,
        ]);

        // Snapshot hari ini
        ForecastSnapshot::create([
            'forecast_date'           => Carbon::today()->toDateString(),
            'ingredient_id'           => $ingredient->id,
            'model_used'              => 'WMA_Fallback',
            'current_stock'           => 10.0,
            'predicted_daily_burn'    => 2.0,
            'safety_stock_qty'        => 1.0,
            'days_until_stockout'     => 5.0,
            'recommended_reorder_qty' => 0.0,
            'urgency_status'          => 'SAFE',
            'unit_cost_rp'            => 16000,
            'estimated_reorder_cost_rp'=> 0,
        ]);

        $this->artisan('forecast:prune', ['--days' => 90])->assertSuccessful();

        // Snapshot 100 hari lalu harus terhapus
        $this->assertDatabaseMissing('forecast_snapshots', [
            'ingredient_id' => $ingredient->id,
            'forecast_date' => Carbon::today()->subDays(100)->toDateString(),
        ]);

        // Snapshot hari ini harus tetap ada
        $this->assertDatabaseHas('forecast_snapshots', [
            'ingredient_id' => $ingredient->id,
            'forecast_date' => Carbon::today()->toDateString(),
        ]);
    }
}


