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
        // ..._create_shifts_table.php
Schema::create('shifts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Kasir yang bertugas
    $table->timestamp('opened_at');
    $table->timestamp('closed_at')->nullable();
    $table->decimal('starting_cash', 12, 2);
    $table->decimal('expected_cash', 12, 2)->nullable();
    $table->decimal('actual_cash', 12, 2)->nullable();
    $table->decimal('cash_difference', 12, 2)->nullable();
    $table->text('notes')->nullable();
    $table->enum('status', ['open', 'closed'])->default('open');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
