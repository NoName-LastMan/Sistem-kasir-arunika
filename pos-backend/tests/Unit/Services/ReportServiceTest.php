<?php

namespace Tests\Unit\Services;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReportService $service;
    private User $user;
    private Product $productA;
    private Product $productB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ReportService::class);

        $this->user = User::create([
            'name'     => 'Kasir Satu',
            'email'    => 'kasir1@example.com',
            'password' => bcrypt('secret123'),
            'role'     => 'cashier',
        ]);

        $category = Category::create([
            'name' => 'Minuman',
            'slug' => 'minuman',
        ]);

        $this->productA = Product::create([
            'category_id' => $category->id,
            'name'        => 'Es Kopi Susu',
            'price'       => 20000,
            'cost_price'  => 8000,
            'stock'       => 100,
            'track_stock' => true,
        ]);

        $this->productB = Product::create([
            'category_id' => $category->id,
            'name'        => 'Croissant',
            'price'       => 25000,
            'cost_price'  => 12000,
            'stock'       => 50,
            'track_stock' => true,
        ]);
    }

    public function test_calculate_profit_loss(): void
    {
        $today = Carbon::today()->toDateString();

        $order = Order::create([
            'invoice_number'  => 'INV-TEST-001',
            'user_id'         => $this->user->id,
            'order_type'      => 'dine_in',
            'subtotal'        => 65000,
            'tax_amount'      => 6500,
            'service_charge'  => 0,
            'discount_amount' => 5000,
            'total_amount'    => 66500,
            'payment_method'  => 'cash',
            'cash_tendered'   => 70000,
            'change_due'      => 3500,
            'payment_status'  => 'paid',
            'status'          => 'completed',
            'created_at'      => Carbon::today()->setTime(10, 0),
        ]);

        // 2x Es Kopi Susu (Rev: 40k, COGS: 16k)
        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->productA->id,
            'quantity'   => 2,
            'unit_price' => 20000,
            'subtotal'   => 40000,
        ]);

        // 1x Croissant (Rev: 25k, COGS: 12k)
        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->productB->id,
            'quantity'   => 1,
            'unit_price' => 25000,
            'subtotal'   => 25000,
        ]);

        $result = $this->service->calculateProfitLoss($today, $today);

        // Revenue = 65,000, COGS = (2*8000) + (1*12000) = 28,000
        // Gross Profit = (65,000 - 5,000 discount) - 28,000 = 32,000
        $this->assertEquals(65000.0, $result['total_revenue']);
        $this->assertEquals(5000.0, $result['total_discounts']);
        $this->assertEquals(28000.0, $result['cost_of_goods_sold']);
        $this->assertEquals(32000.0, $result['gross_profit']);
        $this->assertEquals(49.23, $result['profit_margin_percent']);
    }

    public function test_calculate_sales_summary_kpi_and_breakdowns(): void
    {
        $today = Carbon::today()->toDateString();

        Order::create([
            'invoice_number'  => 'INV-TEST-002',
            'user_id'         => $this->user->id,
            'order_type'      => 'dine_in',
            'subtotal'        => 50000,
            'tax_amount'      => 5000,
            'service_charge'  => 0,
            'discount_amount' => 0,
            'total_amount'    => 55000,
            'payment_method'  => 'qris',
            'payment_status'  => 'paid',
            'status'          => 'completed',
            'created_at'      => Carbon::today()->setTime(11, 0),
        ]);

        Order::create([
            'invoice_number'  => 'INV-TEST-003',
            'user_id'         => $this->user->id,
            'order_type'      => 'takeaway',
            'subtotal'        => 30000,
            'tax_amount'      => 3000,
            'service_charge'  => 0,
            'discount_amount' => 2000,
            'total_amount'    => 31000,
            'payment_method'  => 'cash',
            'payment_status'  => 'paid',
            'status'          => 'completed',
            'created_at'      => Carbon::today()->setTime(12, 0),
        ]);

        $summary = $this->service->calculateSalesSummary($today, $today);

        $this->assertEquals(2, $summary['kpi']['total_orders']);
        $this->assertEquals(86000.0, $summary['kpi']['net_sales']);
        $this->assertEquals(43000.0, $summary['kpi']['average_order_value']);
        $this->assertEquals(31000.0, $summary['by_payment_method']['cash']);
        $this->assertEquals(55000.0, $summary['by_payment_method']['qris']);
        $this->assertEquals(1, $summary['by_order_type']['dine_in']);
        $this->assertEquals(1, $summary['by_order_type']['takeaway']);
    }
}
