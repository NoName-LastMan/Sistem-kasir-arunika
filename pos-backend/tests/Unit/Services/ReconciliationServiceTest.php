<?php

namespace Tests\Unit\Services;

use App\Models\Ingredient;
use App\Models\StockMutation;
use App\Models\User;
use App\Services\ReconciliationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReconciliationServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReconciliationService $service;
    private User $user;
    private Ingredient $ingredient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ReconciliationService::class);

        $this->user = User::create([
            'name'     => 'Supervisor',
            'email'    => 'spv@example.com',
            'password' => bcrypt('password123'),
            'role'     => 'admin',
        ]);

        $this->ingredient = Ingredient::create([
            'name'            => 'Gula Pasir',
            'base_unit'       => 'kg',
            'stock_quantity'  => 20.0,
            'cost_per_unit'   => 15000,
            'min_stock_alert' => 5.0,
        ]);
    }

    public function test_calculate_expected_stock_with_date_range(): void
    {
        $today = Carbon::today()->toDateString();

        StockMutation::create([
            'ingredient_id'  => $this->ingredient->id,
            'user_id'        => $this->user->id,
            'type'           => 'in',
            'quantity'       => 10.0,
            'stock_before'   => 20.0,
            'stock_after'    => 30.0,
            'reference_type' => 'supplier',
            'created_at'     => Carbon::today()->setTime(8, 0),
        ]);

        StockMutation::create([
            'ingredient_id'  => $this->ingredient->id,
            'user_id'        => $this->user->id,
            'type'           => 'out',
            'quantity'       => -4.5,
            'stock_before'   => 30.0,
            'stock_after'    => 25.5,
            'reference_type' => 'order',
            'created_at'     => Carbon::today()->setTime(12, 0),
        ]);

        $result = $this->service->calculateExpectedStock($this->ingredient->id, $today, $today);

        $this->assertEquals(20.0, $result['initial_stock']);
        $this->assertEquals(10.0, $result['total_in']);
        $this->assertEquals(4.5, $result['total_out']);
        $this->assertEquals(25.5, $result['expected_stock']);
    }

    public function test_reconcile_creates_opname_mutation_and_updates_ingredient_stock(): void
    {
        // System thinks we have 20 kg. Actual physical count is 18.5 kg (-1.5 kg difference)
        $result = $this->service->reconcile(
            ingredientId: $this->ingredient->id,
            actualStock: 18.5,
            userId: $this->user->id,
            notes: 'Pemeriksaan stok mingguan'
        );

        $this->assertEquals(18.5, $result['actual_stock']);
        $this->assertEquals(-1.5, $result['discrepancy']);
        $this->assertEquals(18.5, (float) $this->ingredient->fresh()->stock_quantity);

        $mutation = StockMutation::where('ingredient_id', $this->ingredient->id)
            ->where('type', 'opname')
            ->first();

        $this->assertNotNull($mutation);
        $this->assertEquals(-1.5, (float) $mutation->quantity);
        $this->assertEquals(20.0, (float) $mutation->stock_before);
        $this->assertEquals(18.5, (float) $mutation->stock_after);
    }
}
