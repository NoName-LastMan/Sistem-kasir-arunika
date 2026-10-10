<?php

namespace Tests\Unit\Services;

use App\Models\Product;
use App\Models\StockMutation;
use App\Models\User;
use App\Services\InventoryService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    private InventoryService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new InventoryService();
        $this->user = User::create([
            'name'     => 'Admin',
            'email'    => 'admin@test.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
        ]);
    }

    public function test_stock_in(): void
    {
        $product = $this->createProduct(['stock' => 10, 'track_stock' => true]);

        $mutation = $this->service->adjustStock(
            productId: $product->id,
            type:      StockMutation::TYPE_IN,
            quantity:  50,
            userId:    $this->user->id,
        );

        $this->assertEquals(60, $product->fresh()->stock);
        $this->assertEquals(StockMutation::TYPE_IN, $mutation->type);
        $this->assertEquals(50, $mutation->quantity);
        $this->assertEquals(10, $mutation->stock_before);
        $this->assertEquals(60, $mutation->stock_after);
    }

    public function test_stock_out(): void
    {
        $product = $this->createProduct(['stock' => 10, 'track_stock' => true]);

        $mutation = $this->service->adjustStock(
            productId: $product->id,
            type:      StockMutation::TYPE_OUT,
            quantity:  5,
            userId:    $this->user->id,
        );

        $this->assertEquals(5, $product->fresh()->stock);
        $this->assertEquals(StockMutation::TYPE_OUT, $mutation->type);
        $this->assertEquals(-5, $mutation->quantity);
    }

    public function test_stock_out_cannot_go_below_zero(): void
    {
        $product = $this->createProduct(['stock' => 3, 'track_stock' => true]);

        $mutation = $this->service->adjustStock(
            productId: $product->id,
            type:      StockMutation::TYPE_OUT,
            quantity:  10,
            userId:    $this->user->id,
        );

        $this->assertEquals(0, $product->fresh()->stock);
        $this->assertEquals(-10, $mutation->quantity);
        $this->assertEquals(0, $mutation->stock_after);
    }

    public function test_stock_opname(): void
    {
        $product = $this->createProduct(['stock' => 50, 'track_stock' => true]);

        $this->service->adjustStock(
            productId: $product->id,
            type:      StockMutation::TYPE_OPNAME,
            quantity:  42,
            userId:    $this->user->id,
        );

        $this->assertEquals(42, $product->fresh()->stock);
    }

    public function test_deduct_for_order_creates_mutation(): void
    {
        $product = $this->createProduct(['stock' => 100, 'track_stock' => true]);

        $mutation = $this->service->deductForOrder(
            product:  $product,
            quantity: 3,
            orderId:  1,
            userId:   $this->user->id,
        );

        $this->assertEquals(97, $product->fresh()->stock);
        $this->assertNotNull($mutation);
        $this->assertEquals(StockMutation::TYPE_OUT, $mutation->type);
        $this->assertEquals(-3, $mutation->quantity);
        $this->assertEquals(100, $mutation->stock_before);
        $this->assertEquals(97, $mutation->stock_after);
        $this->assertStringContainsString('Order #1', $mutation->reference_note);
    }

    public function test_deduct_for_order_throws_when_insufficient(): void
    {
        $product = $this->createProduct(['stock' => 2, 'track_stock' => true]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $this->service->deductForOrder($product, 5, 1, $this->user->id);
    }

    public function test_deduct_for_order_skips_when_track_stock_false(): void
    {
        $product = $this->createProduct(['stock' => 0, 'track_stock' => false]);

        $mutation = $this->service->deductForOrder($product, 10, 1, $this->user->id);

        $this->assertNull($mutation);
        $this->assertEquals(0, $product->fresh()->stock);
    }

    public function test_set_initial_stock(): void
    {
        $product = $this->createProduct(['stock' => 0, 'track_stock' => true]);

        $mutation = $this->service->setInitialStock($product, 50, $this->user->id);

        $this->assertEquals(50, $product->fresh()->stock);
        $this->assertNotNull($mutation);
        $this->assertEquals(StockMutation::TYPE_IN, $mutation->type);
        $this->assertEquals(50, $mutation->quantity);
        $this->assertEquals(0, $mutation->stock_before);
        $this->assertEquals(50, $mutation->stock_after);
    }

    public function test_set_initial_stock_returns_null_when_zero(): void
    {
        $product = $this->createProduct(['stock' => 0, 'track_stock' => true]);

        $mutation = $this->service->setInitialStock($product, 0, $this->user->id);

        $this->assertNull($mutation);
        $this->assertEquals(0, $product->fresh()->stock);
    }

    public function test_update_stock_creates_delta_mutation(): void
    {
        $product = $this->createProduct(['stock' => 50, 'track_stock' => true]);

        $mutation = $this->service->updateStock($product, 30, $this->user->id);

        $this->assertEquals(30, $product->fresh()->stock);
        $this->assertNotNull($mutation);
        $this->assertEquals(StockMutation::TYPE_OUT, $mutation->type);
        $this->assertEquals(-20, $mutation->quantity);
        $this->assertEquals(50, $mutation->stock_before);
        $this->assertEquals(30, $mutation->stock_after);
    }

    public function test_update_stock_increase(): void
    {
        $product = $this->createProduct(['stock' => 20, 'track_stock' => true]);

        $mutation = $this->service->updateStock($product, 35, $this->user->id);

        $this->assertEquals(35, $product->fresh()->stock);
        $this->assertEquals(StockMutation::TYPE_IN, $mutation->type);
        $this->assertEquals(15, $mutation->quantity);
    }

    public function test_update_stock_no_change_returns_null(): void
    {
        $product = $this->createProduct(['stock' => 50, 'track_stock' => true]);

        $mutation = $this->service->updateStock($product, 50, $this->user->id);

        $this->assertNull($mutation);
    }

    public function test_multiple_deductions_track_correctly(): void
    {
        $product = $this->createProduct(['stock' => 10, 'track_stock' => true]);

        $this->service->deductForOrder($product, 3, 1, $this->user->id);
        $this->service->deductForOrder($product->fresh(), 2, 2, $this->user->id);
        $this->service->deductForOrder($product->fresh(), 1, 3, $this->user->id);

        $this->assertEquals(4, $product->fresh()->stock);

        $mutations = StockMutation::where('product_id', $product->id)->get();
        $this->assertCount(3, $mutations);
        $this->assertEquals(4, $mutations->last()->stock_after);
    }

    private function createProduct(array $overrides = []): Product
    {
        $categoryId = \App\Models\Category::create([
            'name' => 'Makanan', 'slug' => 'makanan', 'is_active' => true,
        ])->id;

        return Product::create(array_merge([
            'name'        => 'Mie Ayam',
            'price'       => 25000,
            'cost_price'  => 12000,
            'stock'       => 0,
            'track_stock' => true,
            'is_active'   => true,
            'category_id' => $categoryId,
        ], $overrides));
    }
}
