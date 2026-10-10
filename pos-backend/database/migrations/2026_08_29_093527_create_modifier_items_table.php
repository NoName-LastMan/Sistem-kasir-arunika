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
        Schema::create('modifier_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('modifier_group_id')->constrained()->cascadeOnDelete();
    $table->string('name'); // e.g., Telur Ceplok, Keju Parut, Extra Shot
    $table->decimal('price', 12, 2)->default(0);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modifier_items');
    }
};
