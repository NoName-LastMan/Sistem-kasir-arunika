<?php

namespace Tests\Unit\Services;

use App\Models\ModifierItem;
use App\Models\Product;
use App\Services\OrderPricingService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderPricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private OrderPricingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new OrderPricingService();
    }

    public function test_single_item_no_modifiers(): void
    {
        $product = Product::create([
            'name'        => 'Mie Ayam',
            'price'       => 25000,
            'cost_price'  => 12000,
            'stock'       => 100,
            'track_stock' => true,
            'is_active'   => true,
            'category_id' => $this->createCategory(),
        ]);

        $result = $this->service->calculateLineItem([
            'product_id' => $product->id,
            'quantity'   => 3,
            'modifiers'  => [],
        ]);

        $this->assertEquals(25000.00, $result['unit_price']);
        $this->assertEquals(75000.00, $result['subtotal']);
        $this->assertEquals(3, $result['quantity']);
        $this->assertEmpty($result['modifiers']);
    }

    public function test_item_with_modifiers(): void
    {
        $categoryId = $this->createCategory();
        $product = Product::create([
            'name' => 'Mie Ayam', 'price' => 25000, 'cost_price' => 12000,
            'stock' => 100, 'track_stock' => true, 'is_active' => true,
            'category_id' => $categoryId,
        ]);

        $modGroup = \App\Models\ModifierGroup::create([
            'name' => 'Topping', 'is_mandatory' => false,
            'min_selection' => 0, 'max_selection' => 3,
        ]);

        $modItem = ModifierItem::create([
            'modifier_group_id' => $modGroup->id,
            'name' => 'Telur', 'price' => 5000,
        ]);

        $result = $this->service->calculateLineItem([
            'product_id' => $product->id,
            'quantity'   => 2,
            'modifiers'  => [['id' => $modItem->id]],
        ]);

        // unit_price = base product price (25000), subtotal = (25000 + 5000) * 2 = 60000
        $this->assertEquals(25000.00, $result['unit_price']);
        $this->assertEquals(60000.00, $result['subtotal']);
        $this->assertCount(1, $result['modifiers']);
        $this->assertEquals(10000.00, $result['modifiers'][0]['subtotal']);
    }

    public function test_percentage_discount(): void
    {
        $this->assertEquals(10.00, $this->service->calculateDiscount(100, 'percentage', 10));
        $this->assertEquals(50.00, $this->service->calculateDiscount(100, 'percentage', 50));
        $this->assertEquals(100.00, $this->service->calculateDiscount(100, 'percentage', 100));
        // Clamped at 100%
        $this->assertEquals(100.00, $this->service->calculateDiscount(100, 'percentage', 200));
    }

    public function test_fixed_discount(): void
    {
        $this->assertEquals(50.00, $this->service->calculateDiscount(100, 'fixed', 50));
        // Cannot exceed subtotal
        $this->assertEquals(100.00, $this->service->calculateDiscount(100, 'fixed', 200));
    }

    public function test_no_discount(): void
    {
        $this->assertEquals(0.0, $this->service->calculateDiscount(100, 'none', 0));
        $this->assertEquals(0.0, $this->service->calculateDiscount(100, null, null));
    }

    public function test_tax_calculation(): void
    {
        $this->assertEquals(10.00, $this->service->calculateTax(100, 10));
        $this->assertEquals(9.00, $this->service->calculateTax(100, 9));
        $this->assertEquals(0.00, $this->service->calculateTax(0, 10));
        $this->assertEquals(22500.00, $this->service->calculateTax(150000, 15));
    }

    public function test_change_due(): void
    {
        $this->assertEquals(5000.00, $this->service->calculateChangeDue(45000, 50000));
        $this->assertEquals(0.0, $this->service->calculateChangeDue(50000, 50000));
    }

    public function test_change_due_throws_when_insufficient(): void
    {
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $this->service->calculateChangeDue(50000, 45000);
    }

    public function test_full_pricing_breakdown(): void
    {
        $categoryId = $this->createCategory();
        $product = Product::create([
            'name' => 'Kopi Susu', 'price' => 10000, 'cost_price' => 4000,
            'stock' => 50, 'track_stock' => true, 'is_active' => true,
            'category_id' => $categoryId,
        ]);

        $result = $this->service->calculateOrderPricing(
            items:         [['product_id' => $product->id, 'quantity' => 2, 'modifiers' => []]],
            discountType:  'percentage',
            discountValue: 10.0,
            taxRate:       10.0,
            cashTendered:  25000.0,
            paymentMethod: 'cash',
        );

        // subtotal = 20000, discount = 2000, taxable = 18000, tax = 1800, total = 19800
        $this->assertEquals(20000.00, $result['subtotal']);
        $this->assertEquals(2000.00, $result['discount_amount']);
        $this->assertEquals(18000.00, $result['taxable_amount']);
        $this->assertEquals(1800.00, $result['tax_amount']);
        $this->assertEquals(19800.00, $result['total_amount']);
        $this->assertEquals(5200.00, $result['change_due']);
    }

    public function test_full_pricing_non_cash(): void
    {
        $categoryId = $this->createCategory();
        $product = Product::create([
            'name' => 'Teh Manis', 'price' => 8000, 'cost_price' => 2000,
            'stock' => 30, 'track_stock' => true, 'is_active' => true,
            'category_id' => $categoryId,
        ]);

        $result = $this->service->calculateOrderPricing(
            items:         [['product_id' => $product->id, 'quantity' => 1, 'modifiers' => []]],
            discountType:  'none',
            discountValue: null,
            taxRate:       10.0,
            cashTendered:  null,
            paymentMethod: 'qris',
        );

        // subtotal = 8000, discount = 0, tax = 800, total = 8800
        $this->assertEquals(8000.00, $result['subtotal']);
        $this->assertEquals(0.0, $result['discount_amount']);
        $this->assertEquals(800.00, $result['tax_amount']);
        $this->assertEquals(8800.00, $result['total_amount']);
        $this->assertNull($result['change_due']);
    }

    public function test_rounding_precision(): void
    {
        $categoryId = $this->createCategory();
        $product = Product::create([
            'name' => 'Roti', 'price' => 3333, 'cost_price' => 1500,
            'stock' => 20, 'track_stock' => true, 'is_active' => true,
            'category_id' => $categoryId,
        ]);

        $result = $this->service->calculateOrderPricing(
            items:         [['product_id' => $product->id, 'quantity' => 3, 'modifiers' => []]],
            discountType:  'percentage',
            discountValue: 7.5,
            taxRate:       11.0,
            cashTendered:  null,
            paymentMethod: 'transfer',
        );

        // subtotal = 9999.00, discount = 749.93 (9999 * 7.5 / 100 = 749.925 → 749.93)
        // taxable = 9249.07, tax = 1017.40 (9249.07 * 11 / 100 = 1017.3977 → 1017.40)
        // total = 10266.47
        $this->assertEquals(9999.00, $result['subtotal']);
        $this->assertEquals(749.93, $result['discount_amount']);
        $this->assertEquals(1017.40, $result['tax_amount']);
        $this->assertEquals(10266.47, $result['total_amount']);
    }

    private function createCategory(): int
    {
        return \App\Models\Category::create([
            'name' => 'Makanan',
            'slug' => 'makanan',
            'is_active' => true,
        ])->id;
    }
}
