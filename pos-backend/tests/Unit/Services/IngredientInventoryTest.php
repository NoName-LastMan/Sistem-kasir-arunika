<?php

namespace Tests\Unit\Services;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\WasteRecord;
use App\Services\InventoryService;
use App\Services\ReconciliationService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class IngredientInventoryTest extends TestCase
{
    use RefreshDatabase;

    private InventoryService $inventoryService;
    private ReconciliationService $reconciliationService;
    private User $user;
    private Product $product;
    private Ingredient $beras;
    private Ingredient $telur;
    private Ingredient $minyak;

    protected function setUp(): void
    {
        parent::setUp();

        $this->inventoryService = new InventoryService();
        $this->reconciliationService = new ReconciliationService();

        $this->user = User::create([
            'name'     => 'Admin',
            'email'    => 'admin@test.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
        ]);

        $category = Category::create([
            'name' => 'Makanan', 'slug' => 'makanan', 'is_active' => true,
        ]);

        $this->product = Product::create([
            'name'        => 'Nasi Goreng',
            'price'       => 25000,
            'cost_price'  => 12000,
            'stock'       => 100,
            'track_stock' => true,
            'is_active'   => true,
            'category_id' => $category->id,
        ]);

        // Create ingredients
        $this->beras = Ingredient::create([
            'name' => 'Beras', 'base_unit' => 'kg',
            'stock_quantity' => 10, 'min_stock_alert' => 2,
            'cost_per_unit' => 15000, 'track_stock' => true,
        ]);

        $this->telur = Ingredient::create([
            'name' => 'Telur', 'base_unit' => 'butir',
            'stock_quantity' => 100, 'min_stock_alert' => 20,
            'cost_per_unit' => 2000, 'track_stock' => true,
        ]);

        $this->minyak = Ingredient::create([
            'name' => 'Minyak Goreng', 'base_unit' => 'liter',
            'stock_quantity' => 5, 'min_stock_alert' => 1,
            'cost_per_unit' => 25000, 'track_stock' => true,
        ]);

        // Create recipe: Nasi Goreng = 200gr beras, 2 butir telur, 50ml minyak
        $this->product->ingredients()->attach([
            $this->beras->id => [
                'quantity_needed' => 200,
                'recipe_unit' => 'gr',
                'conversion_factor' => 0.001, // 200gr = 0.2kg
            ],
            $this->telur->id => [
                'quantity_needed' => 2,
                'recipe_unit' => 'butir',
                'conversion_factor' => 1, // 1:1
            ],
            $this->minyak->id => [
                'quantity_needed' => 50,
                'recipe_unit' => 'ml',
                'conversion_factor' => 0.001, // 50ml = 0.05 liter
            ],
        ]);
    }

    public function test_deduct_ingredients_for_order(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST001',
            'user_id' => $this->user->id,
            'subtotal' => 25000,
            'total_amount' => 25000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity' => 2,
            'unit_price' => 25000,
            'subtotal' => 50000,
        ]);

        $mutations = $this->inventoryService->deductIngredientsForOrder($order, $this->user->id);

        // Beras: 200gr × 0.001 × 2 = 0.4kg deducted from 10kg = 9.6kg
        $this->assertEqualsWithDelta(9.6, (float) $this->beras->fresh()->stock_quantity, 0.001);

        // Telur: 2 × 1 × 2 = 4 deducted from 100 = 96
        $this->assertEqualsWithDelta(96, (float) $this->telur->fresh()->stock_quantity, 0.001);

        // Minyak: 50ml × 0.001 × 2 = 0.1 liter deducted from 5 = 4.9
        $this->assertEqualsWithDelta(4.9, (float) $this->minyak->fresh()->stock_quantity, 0.001);

        $this->assertCount(3, $mutations);
    }

    public function test_deduct_ingredients_throws_when_insufficient(): void
    {
        $this->telur->update(['stock_quantity' => 1]); // Not enough for 2 butir

        $order = Order::create([
            'invoice_number' => 'INV-TEST002',
            'user_id' => $this->user->id,
            'subtotal' => 25000,
            'total_amount' => 25000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_price' => 25000,
            'subtotal' => 25000,
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $this->inventoryService->deductIngredientsForOrder($order, $this->user->id);
    }

    public function test_deduct_ingredients_skips_untracked(): void
    {
        $this->beras->update(['track_stock' => false]);

        $order = Order::create([
            'invoice_number' => 'INV-TEST003',
            'user_id' => $this->user->id,
            'subtotal' => 25000,
            'total_amount' => 25000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_price' => 25000,
            'subtotal' => 25000,
        ]);

        $mutations = $this->inventoryService->deductIngredientsForOrder($order, $this->user->id);

        // Only telur and minyak should be deducted (beras skipped)
        $this->assertCount(2, $mutations);
        $this->assertEquals(10, $this->beras->fresh()->stock_quantity); // Unchanged
    }

    public function test_restore_ingredients_for_void(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST004',
            'user_id' => $this->user->id,
            'subtotal' => 25000,
            'total_amount' => 25000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'status' => 'completed',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_price' => 25000,
            'subtotal' => 25000,
        ]);

        // Deduct first
        $this->inventoryService->deductIngredientsForOrder($order, $this->user->id);

        $berasAfterDeduct = (float) $this->beras->fresh()->stock_quantity;
        $this->assertEqualsWithDelta(9.8, $berasAfterDeduct, 0.001);

        // Restore
        $this->inventoryService->restoreIngredientsForVoid($order, $this->user->id);

        $this->assertEqualsWithDelta(10, (float) $this->beras->fresh()->stock_quantity, 0.001);
        $this->assertEqualsWithDelta(100, (float) $this->telur->fresh()->stock_quantity, 0.001);
        $this->assertEqualsWithDelta(5, (float) $this->minyak->fresh()->stock_quantity, 0.001);
    }

    public function test_waste_record_reduces_stock(): void
    {
        $waste = WasteRecord::create([
            'ingredient_id' => $this->beras->id,
            'quantity' => 0.5,
            'reason' => 'expired',
            'notes' => 'Beras basah',
            'user_id' => $this->user->id,
        ]);

        $stockBefore = 10;
        $stockAfter = round($stockBefore - 0.5, 3);

        $this->beras->update(['stock_quantity' => $stockAfter]);

        StockMutation::create([
            'ingredient_id' => $this->beras->id,
            'user_id' => $this->user->id,
            'type' => 'out',
            'quantity' => -0.5,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'reference_type' => 'waste',
            'reference_id' => $waste->id,
            'reference_note' => 'Waste: expired - Beras basah',
        ]);

        $this->assertEqualsWithDelta(9.5, (float) $this->beras->fresh()->stock_quantity, 0.001);
    }

    public function test_reconciliation_calculates_expected_stock(): void
    {
        // Simulate some mutations
        StockMutation::create([
            'ingredient_id' => $this->beras->id,
            'user_id' => $this->user->id,
            'type' => 'in',
            'quantity' => 5,
            'stock_before' => 10,
            'stock_after' => 15,
            'reference_type' => 'supplier',
            'reference_note' => 'Restock',
        ]);

        StockMutation::create([
            'ingredient_id' => $this->beras->id,
            'user_id' => $this->user->id,
            'type' => 'out',
            'quantity' => -2,
            'stock_before' => 15,
            'stock_after' => 13,
            'reference_type' => 'order',
            'reference_note' => 'Penjualan',
        ]);

        $result = $this->reconciliationService->calculateExpectedStock($this->beras->id);

        $this->assertEquals('Beras', $result['ingredient_name']);
        $this->assertEqualsWithDelta(13, $result['expected_stock'], 0.001);
    }

    public function test_reconciliation_detects_anomaly(): void
    {
        // Set current stock to 10
        $this->beras->update(['stock_quantity' => 10]);

        // Reconcile with actual stock of 8 (20% discrepancy = anomaly)
        $result = $this->reconciliationService->reconcile(
            ingredientId: $this->beras->id,
            actualStock: 8,
            userId: $this->user->id,
            notes: 'Stock opname bulanan',
        );

        $this->assertTrue($result['is_anomaly']);
        $this->assertEqualsWithDelta(-2, $result['discrepancy'], 0.001);
        $this->assertEquals(20, $result['discrepancy_percent']);
    }

    public function test_reconciliation_no_anomaly_under_5_percent(): void
    {
        // Set current stock to 10
        $this->beras->update(['stock_quantity' => 10]);

        // Reconcile with actual stock of 9.7 (3% discrepancy = normal)
        $result = $this->reconciliationService->reconcile(
            ingredientId: $this->beras->id,
            actualStock: 9.7,
            userId: $this->user->id,
        );

        $this->assertFalse($result['is_anomaly']);
    }

    public function test_ingredient_low_stock_detection(): void
    {
        $this->assertFalse($this->beras->isLowStock()); // 10 > 2

        $this->beras->update(['stock_quantity' => 2]);
        $this->assertTrue($this->beras->isLowStock()); // 2 <= 2

        $this->beras->update(['stock_quantity' => 1]);
        $this->assertTrue($this->beras->isLowStock()); // 1 <= 2
    }
}
