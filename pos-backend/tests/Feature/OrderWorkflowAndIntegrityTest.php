<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\Product;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderWorkflowAndIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;
    private User $admin;
    private User $superadmin;
    private Table $table;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::create([
            'name'     => 'Kasir Satu',
            'email'    => 'cashier@test.com',
            'password' => bcrypt('password'),
            'role'     => 'cashier',
        ]);

        $this->admin = User::create([
            'name'     => 'Admin Utama',
            'email'    => 'admin@test.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
        ]);

        $this->superadmin = User::create([
            'name'     => 'Owner Resto',
            'email'    => 'owner@test.com',
            'password' => bcrypt('password'),
            'role'     => 'superadmin',
        ]);

        $this->table = Table::create([
            'table_number' => 'T-01',
            'capacity'     => 4,
            'status'       => 'available',
        ]);

        $category = Category::create([
            'name'      => 'Minuman',
            'slug'      => 'minuman',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'name'        => 'Kopi Susu Gula Aren',
            'price'       => 20000,
            'cost_price'  => 8000,
            'stock'       => 50,
            'track_stock' => true,
            'is_active'   => true,
            'category_id' => $category->id,
        ]);
    }

    public function test_pos_store_saves_customer_name_notes_and_loads_table_number(): void
    {
        $response = $this->actingAs($this->cashier)->postJson('/api/orders', [
            'order_type'     => 'dine_in',
            'table_id'       => $this->table->id,
            'customer_name'  => 'Budi Santoso',
            'notes'          => 'Jangan terlalu manis',
            'payment_method' => 'cash',
            'cash_tendered'  => 50000,
            'items'          => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 2,
                    'notes'      => 'Less ice',
                ]
            ]
        ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertEquals('Budi Santoso', $data['customer_name']);
        $this->assertEquals('Jangan terlalu manis', $data['notes']);
        $this->assertNotNull($data['table']);
        $this->assertEquals('T-01', $data['table']['table_number']);

        $this->assertDatabaseHas('orders', [
            'id'            => $data['id'],
            'customer_name' => 'Budi Santoso',
            'notes'         => 'Jangan terlalu manis',
        ]);
    }

    public function test_public_create_order_saves_customer_name_and_notes(): void
    {
        $response = $this->postJson('/api/public/orders', [
            'table_code'    => 'T-01',
            'customer_name' => 'Siti Rahma',
            'notes'         => 'Meja dekat jendela',
            'items'         => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'notes'      => 'Extra sedotan',
                ]
            ]
        ]);

        $response->assertStatus(201);
        $order = Order::latest()->first();

        $this->assertNotNull($order);
        $this->assertEquals('Siti Rahma', $order->customer_name);
        $this->assertEquals('Meja dekat jendela', $order->notes);
        $this->assertEquals('pending', $order->status);
    }

    public function test_superadmin_can_void_order_created_by_cashier(): void
    {
        $order = Order::create([
            'invoice_number'  => 'INV-SUPERVOID',
            'user_id'         => $this->cashier->id,
            'subtotal'        => 20000,
            'total_amount'    => 20000,
            'payment_method'  => 'cash',
            'payment_status'  => 'paid',
            'status'          => 'completed',
        ]);

        $response = $this->actingAs($this->superadmin)->postJson("/api/orders/{$order->id}/void", [
            'void_reason' => 'Customer salah pesan menu',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $order->fresh()->status);
        $this->assertEquals('refunded', $order->fresh()->payment_status);
        $this->assertEquals($this->superadmin->id, $order->fresh()->voided_by);
    }

    public function test_serve_order_validations(): void
    {
        // 1. Pending order cannot be served directly
        $pendingOrder = Order::create([
            'invoice_number' => 'INV-PENDING',
            'user_id'        => $this->cashier->id,
            'subtotal'       => 20000,
            'total_amount'   => 20000,
            'status'         => 'pending',
        ]);

        $resPending = $this->actingAs($this->cashier)->postJson("/api/orders/{$pendingOrder->id}/serve");
        $resPending->assertStatus(422)
            ->assertJson(['message' => 'Hanya pesanan dengan status processing yang dapat disajikan.']);

        // 2. Cancelled order cannot be served
        $cancelledOrder = Order::create([
            'invoice_number' => 'INV-CANCELLED',
            'user_id'        => $this->cashier->id,
            'subtotal'       => 20000,
            'total_amount'   => 20000,
            'status'         => 'cancelled',
        ]);

        $resCancelled = $this->actingAs($this->cashier)->postJson("/api/orders/{$cancelledOrder->id}/serve");
        $resCancelled->assertStatus(422)
            ->assertJson(['message' => 'Pesanan yang sudah dibatalkan tidak dapat disajikan.']);

        // 3. Processing order can be served successfully
        $processingOrder = Order::create([
            'invoice_number' => 'INV-PROCESSING',
            'user_id'        => $this->cashier->id,
            'subtotal'       => 20000,
            'total_amount'   => 20000,
            'status'         => 'processing',
        ]);

        $resProcessing = $this->actingAs($this->cashier)->postJson("/api/orders/{$processingOrder->id}/serve");
        $resProcessing->assertStatus(200);
        $this->assertEquals('completed', $processingOrder->fresh()->status);

        // 4. Already completed order cannot be re-served
        $resCompleted = $this->actingAs($this->cashier)->postJson("/api/orders/{$processingOrder->id}/serve");
        $resCompleted->assertStatus(422)
            ->assertJson(['message' => 'Pesanan sudah disajikan sebelumnya.']);
    }

    public function test_cashier_can_cancel_pending_order(): void
    {
        $pendingOrder = Order::create([
            'invoice_number' => 'INV-CANCELME',
            'user_id'        => $this->cashier->id,
            'table_id'       => $this->table->id,
            'subtotal'       => 20000,
            'total_amount'   => 20000,
            'status'         => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->cashier)->postJson("/api/orders/{$pendingOrder->id}/cancel", [
            'reason' => 'Pelanggan tidak jadi memesan',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $pendingOrder->fresh()->status);
        $this->assertEquals('unpaid', $pendingOrder->fresh()->payment_status);
        $this->assertEquals('Pelanggan tidak jadi memesan', $pendingOrder->fresh()->void_reason);
    }

    public function test_table_status_syncs_to_occupied_and_available(): void
    {
        // 1. Create order linked to table
        $order = Order::create([
            'invoice_number' => 'INV-TABLESYNC',
            'user_id'        => $this->cashier->id,
            'table_id'       => $this->table->id,
            'order_type'     => 'dine_in',
            'subtotal'       => 20000,
            'total_amount'   => 20000,
            'status'         => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'unit_price' => 20000,
            'subtotal'   => 20000,
        ]);

        // Table index shows occupied due to pending order
        $tablesRes = $this->actingAs($this->cashier)->getJson('/api/tables');
        $matchedTable = collect($tablesRes->json('data'))->firstWhere('id', $this->table->id);
        $this->assertEquals('occupied', $matchedTable['status']);

        // 2. Confirm order -> table becomes explicitly occupied
        $this->actingAs($this->cashier)->postJson("/api/orders/{$order->id}/confirm", [
            'payment_method' => 'cash',
            'cash_tendered'  => 50000,
        ]);
        $this->assertEquals('occupied', $this->table->fresh()->status);

        // 3. Serve order -> table resets to available
        $this->actingAs($this->cashier)->postJson("/api/orders/{$order->id}/serve");
        $this->assertEquals('available', $this->table->fresh()->status);
    }

    public function test_soft_deletes_preserve_audit_records(): void
    {
        $this->product->delete();
        $this->assertSoftDeleted('products', ['id' => $this->product->id]);

        $ingredient = Ingredient::create([
            'name'           => 'Biji Kopi Arabika',
            'base_unit'      => 'gr',
            'stock_quantity' => 1000,
        ]);
        $ingredient->delete();
        $this->assertSoftDeleted('ingredients', ['id' => $ingredient->id]);
    }

    public function test_confirming_and_voiding_order_with_modifier_item_ingredient_deducts_and_restores_stock(): void
    {
        $extraShotIng = Ingredient::create([
            'name'           => 'Espresso Roast Extra',
            'base_unit'      => 'gr',
            'stock_quantity' => 500,
            'track_stock'    => true,
        ]);

        $modGroup = \App\Models\ModifierGroup::create([
            'name'          => 'Topping Kopi',
            'is_required'   => false,
            'min_selection' => 0,
            'max_selection' => 2,
        ]);

        $modItem = \App\Models\ModifierItem::create([
            'modifier_group_id' => $modGroup->id,
            'name'              => 'Extra Shot',
            'price'             => 5000,
            'ingredient_id'     => $extraShotIng->id,
            'quantity_needed'   => 18,
        ]);

        $order = Order::create([
            'invoice_number' => 'ARN-MODTEST01',
            'user_id'        => $this->cashier->id,
            'table_id'       => $this->table->id,
            'order_type'     => 'dine_in',
            'subtotal'       => 50000,
            'tax_amount'     => 5000,
            'total_amount'   => 55000,
            'status'         => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $orderItem = $order->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 2,
            'unit_price' => 25000,
            'subtotal'   => 50000,
        ]);

        $orderItem->modifiers()->create([
            'modifier_item_id' => $modItem->id,
            'unit_price'       => 5000,
            'subtotal'         => 10000,
        ]);

        // Confirm pending order -> must NOT throw undefined relationship [ingredient] and must deduct 2 * 18 = 36gr
        $confirmRes = $this->actingAs($this->cashier)->postJson("/api/orders/{$order->id}/confirm", [
            'payment_method' => 'qris',
            'cash_tendered'  => 55000,
        ]);
        $confirmRes->assertOk();
        $this->assertEquals(464.0, (float) $extraShotIng->fresh()->stock_quantity);

        // Void by Admin -> must restore 36gr back to 500gr
        $voidRes = $this->actingAs($this->admin)->postJson("/api/orders/{$order->id}/void", [
            'void_reason' => 'Test pembatalan modifier BOM',
        ]);
        $voidRes->assertOk();
        $this->assertEquals(500.0, (float) $extraShotIng->fresh()->stock_quantity);
    }
}
