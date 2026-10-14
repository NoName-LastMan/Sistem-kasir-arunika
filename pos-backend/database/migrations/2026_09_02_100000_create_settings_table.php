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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_name')->default('Warmindo & Cafe POS');
            $table->string('store_address')->nullable()->default('Jl. Contoh Alamat No. 123');
            $table->string('store_phone')->nullable()->default('0812-3456-7890');
            $table->string('store_email')->nullable();
            $table->text('receipt_header')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->decimal('default_tax_rate', 5, 2)->default(10.00);
            $table->decimal('service_charge_rate', 5, 2)->default(0.00);
            $table->string('invoice_prefix')->default('INV-');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
