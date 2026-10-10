<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->foreignId('ingredient_id')->nullable()->after('product_id')->constrained('ingredients')->nullOnDelete();
            $table->enum('reference_type', ['order', 'manual', 'opname', 'waste', 'supplier'])->nullable()->after('reference_note');
            $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');

            // Make product_id nullable since ingredient mutations don't need product
            $table->foreignId('product_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->dropForeign(['ingredient_id']);
            $table->dropColumn(['ingredient_id', 'reference_type', 'reference_id']);
        });
    }
};
