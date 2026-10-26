<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Indexes to speed up POS queries, sales reports, and inventory forecasting.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'idx_orders_status_created');
            $table->index(['payment_status', 'created_at'], 'idx_orders_payment_created');
            $table->index('created_at', 'idx_orders_created_at');
        });

        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->index(['ingredient_id', 'created_at'], 'idx_stock_mutations_ing_created');
            $table->index(['type', 'created_at'], 'idx_stock_mutations_type_created');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['is_active', 'category_id'], 'idx_products_active_cat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_status_created');
            $table->dropIndex('idx_orders_payment_created');
            $table->dropIndex('idx_orders_created_at');
        });

        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->dropIndex('idx_stock_mutations_ing_created');
            $table->dropIndex('idx_stock_mutations_type_created');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_active_cat');
        });
    }
};
