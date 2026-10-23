<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forecast_snapshots', function (Blueprint $table) {
            $table->id();
            $table->date('forecast_date')->index(); // Tanggal pembuatan snapshot
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->string('model_used', 50)->default('WMA_Fallback'); // 'AutoETS', 'LightGBM', 'Croston', 'WMA_Fallback'

            // Metrik Kuantitas Fisik (Admin & Owner)
            $table->decimal('current_stock', 12, 2)->default(0);
            $table->decimal('predicted_daily_burn', 12, 2)->default(0);
            $table->decimal('safety_stock_qty', 12, 2)->default(0); // Diambil dari P90 Prediction Interval
            $table->decimal('days_until_stockout', 8, 1)->nullable();
            $table->decimal('recommended_reorder_qty', 12, 2)->default(0);
            $table->enum('urgency_status', ['CRITICAL', 'WARNING', 'SAFE'])->default('SAFE');

            // Metrik Finansial & Evaluasi (Khusus Owner)
            $table->decimal('unit_cost_rp', 15, 2)->default(0);
            $table->decimal('estimated_reorder_cost_rp', 15, 2)->default(0);
            $table->decimal('actual_usage_yesterday', 12, 2)->nullable();
            $table->decimal('accuracy_percentage', 5, 2)->nullable(); // 100 - WAPE
            $table->timestamps();

            $table->unique(['forecast_date', 'ingredient_id']);
        });

        Schema::create('ai_briefing_logs', function (Blueprint $table) {
            $table->id();
            $table->date('briefing_date')->unique();
            $table->json('admin_operational_payload')->nullable(); // Narasi dapur & saran belanja fisik staf
            $table->json('owner_executive_payload')->nullable();   // Analisis modal cashflow, audit waste, & anomali opname
            $table->string('llm_provider', 50)->default('rule-based-fallback'); // 'groq-llama-3.3' atau 'gemini-2.5-flash'
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forecast_snapshots');
        Schema::dropIfExists('ai_briefing_logs');
    }
};
