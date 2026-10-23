<?php

namespace Tests\Feature;

use App\Models\ForecastSnapshot;
use App\Models\Ingredient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ForecastingEndpointTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $superadminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'name'     => 'Admin Gudang',
            'email'    => 'admin@pos.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
        ]);

        $this->superadminUser = User::create([
            'name'     => 'Pak Owner',
            'email'    => 'owner@pos.com',
            'password' => bcrypt('password'),
            'role'     => 'superadmin',
        ]);

        $ingredient = Ingredient::create([
            'name'            => 'Biji Kopi Arabica',
            'base_unit'       => 'kg',
            'stock_quantity'  => 10.0,
            'cost_per_unit'   => 120000,
            'min_stock_alert' => 2.0,
        ]);

        ForecastSnapshot::create([
            'forecast_date'           => Carbon::today()->toDateString(),
            'ingredient_id'           => $ingredient->id,
            'model_used'              => 'AutoETS',
            'current_stock'           => 10.0,
            'predicted_daily_burn'    => 1.5,
            'safety_stock_qty'        => 0.8,
            'days_until_stockout'     => 6.7,
            'recommended_reorder_qty' => 5.0,
            'urgency_status'          => 'SAFE',
            'unit_cost_rp'            => 120000,
            'estimated_reorder_cost_rp'=> 600000,
            'accuracy_percentage'     => 95.5,
        ]);
    }

    public function test_admin_inventory_forecasting_endpoint(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/admin/inventory/forecasting');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'insight',
                'summary' => ['total_items', 'critical_items', 'warning_items', 'safe_items'],
                'data' => [
                    '*' => [
                        'ingredient_id',
                        'name',
                        'unit',
                        'model_used',
                        'current_stock',
                        'daily_burn_rate',
                        'safety_stock_qty',
                        'days_until_stockout',
                        'recommended_reorder_qty',
                        'urgency',
                    ]
                ]
            ]);

        // Verifikasi admin tidak melihat estimasi rupiah
        $data = $response->json('data.0');
        $this->assertArrayNotHasKey('estimated_cost', $data);
    }

    public function test_superadmin_executive_forecasting_endpoint(): void
    {
        Sanctum::actingAs($this->superadminUser);

        $response = $this->getJson('/api/superadmin/inventory/forecasting');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'insight',
                'financial_summary' => [
                    'total_reorder_budget',
                    'critical_reorder_budget',
                    'critical_count',
                    'warning_count',
                    'average_accuracy',
                ],
                'data' => [
                    '*' => [
                        'ingredient_id',
                        'name',
                        'unit',
                        'model_used',
                        'current_stock',
                        'estimated_cost',
                        'accuracy_percentage',
                    ]
                ]
            ]);

        // Verifikasi owner melihat estimasi rupiah dan akurasi
        $data = $response->json('data.0');
        $this->assertEquals(600000, $data['estimated_cost']);
        $this->assertEquals(95.5, $data['accuracy_percentage']);
    }

    public function test_admin_cannot_access_superadmin_executive_forecasting(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/superadmin/inventory/forecasting');

        $response->assertStatus(403);
    }
}
