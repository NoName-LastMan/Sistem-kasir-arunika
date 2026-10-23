<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->unsignedSmallInteger('lead_time_days')->default(7)->after('track_stock');
            $table->string('purchase_unit', 50)->nullable()->after('lead_time_days'); // karung, karton, tray, botol, pack
            $table->decimal('purchase_unit_ratio', 12, 3)->default(1.0)->after('purchase_unit'); // 1 purchase_unit = X base_unit
        });

        Schema::table('forecast_snapshots', function (Blueprint $table) {
            $table->unsignedSmallInteger('lead_time_days')->default(7)->after('model_used');
            $table->string('purchase_unit', 50)->nullable()->after('recommended_reorder_qty');
            $table->decimal('recommended_purchase_packs', 12, 2)->default(0)->after('purchase_unit');
        });
    }

    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->dropColumn(['lead_time_days', 'purchase_unit', 'purchase_unit_ratio']);
        });

        Schema::table('forecast_snapshots', function (Blueprint $table) {
            $table->dropColumn(['lead_time_days', 'purchase_unit', 'recommended_purchase_packs']);
        });
    }
};
