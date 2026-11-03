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
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_best_seller')->default(false)->after('is_active');
            $table->boolean('is_new')->default(false)->after('is_best_seller');
            $table->boolean('is_manual_brew')->default(false)->after('is_new');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_best_seller', 'is_new', 'is_manual_brew']);
        });
    }
};

