<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    protected $guarded = ['id'];
    protected $appends = ['unit', 'stock', 'minimum_stock', 'current_stock'];

    protected static function booted(): void
    {
        static::saved(function (Ingredient $ingredient) {
            if ($ingredient->wasChanged('stock_quantity')) {
                app(\App\Services\StockForecastingService::class)->syncIngredientStockSnapshot(
                    $ingredient->id,
                    (float) $ingredient->stock_quantity
                );
            }
        });
    }

    public function getUnitAttribute(): ?string
    {
        return $this->base_unit;
    }

    public function getStockAttribute(): ?float
    {
        return (float) $this->stock_quantity;
    }

    public function getCurrentStockAttribute(): ?float
    {
        return (float) $this->stock_quantity;
    }

    public function getMinimumStockAttribute(): ?float
    {
        return (float) $this->min_stock_alert;
    }

    protected function casts(): array
    {
        return [
            'stock_quantity'      => 'decimal:3',
            'min_stock_alert'     => 'decimal:3',
            'cost_per_unit'       => 'decimal:2',
            'lead_time_days'      => 'integer',
            'purchase_unit_ratio' => 'decimal:3',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_ingredients')
            ->withPivot(['quantity_needed', 'recipe_unit', 'conversion_factor']);
    }

    public function stockMutations(): HasMany
    {
        return $this->hasMany(StockMutation::class);
    }

    public function wasteRecords(): HasMany
    {
        return $this->hasMany(WasteRecord::class);
    }

    public function isLowStock(): bool
    {
        return $this->stock_quantity <= $this->min_stock_alert;
    }
}
