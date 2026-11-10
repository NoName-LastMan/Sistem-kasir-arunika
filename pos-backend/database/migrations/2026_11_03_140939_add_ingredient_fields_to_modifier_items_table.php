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
        Schema::table('modifier_items', function (Blueprint $table) {
            if (! Schema::hasColumn('modifier_items', 'ingredient_id')) {
                $table->foreignId('ingredient_id')->nullable()->constrained('ingredients')->nullOnDelete();
            }
            if (! Schema::hasColumn('modifier_items', 'quantity_needed')) {
                $table->decimal('quantity_needed', 10, 3)->default(0);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modifier_items', function (Blueprint $table) {
            if (Schema::hasColumn('modifier_items', 'ingredient_id')) {
                $table->dropConstrainedForeignId('ingredient_id');
            }
            if (Schema::hasColumn('modifier_items', 'quantity_needed')) {
                $table->dropColumn('quantity_needed');
            }
        });
    }
};
