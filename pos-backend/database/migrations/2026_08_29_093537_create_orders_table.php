<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->string('invoice_number')->unique();
    $table->foreignId('user_id')->constrained(); // Kasir yang memproses
    $table->foreignId('shift_id')->nullable()->constrained();
    $table->foreignId('table_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('order_type', ['dine_in', 'takeaway', 'delivery'])->default('dine_in');
    
    // Keuangan
    $table->decimal('subtotal', 12, 2);
    $table->decimal('tax_amount', 12, 2)->default(0);
    $table->decimal('service_charge', 12, 2)->default(0);
    $table->decimal('discount_amount', 12, 2)->default(0);
    $table->decimal('total_amount', 12, 2);
    
    // Pembayaran
    $table->enum('payment_method', ['cash', 'qris', 'transfer', 'card'])->nullable();
    $table->decimal('cash_tendered', 12, 2)->nullable(); // Uang yang dibayar
    $table->decimal('change_due', 12, 2)->nullable();     // Kembalian
    $table->enum('payment_status', ['unpaid', 'paid', 'refunded'])->default('unpaid');
    $table->enum('status', ['pending', 'processing', 'completed', 'cancelled'])->default('pending');
    
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
