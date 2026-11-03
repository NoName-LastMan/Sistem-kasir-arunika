<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'category_id',
        'name',
        'sku',
        'description',
        'price',
        'cost_price',
        'stock',
        'track_stock',
        'image',
        'is_active',
        'is_best_seller',
        'is_new',
        'is_manual_brew',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'stock' => 'integer',
            'track_stock' => 'boolean',
            'is_active' => 'boolean',
            'is_best_seller' => 'boolean',
            'is_new' => 'boolean',
            'is_manual_brew' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function modifierGroups(): BelongsToMany
    {
        return $this->belongsToMany(ModifierGroup::class, 'product_modifier_group');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function stockMutations(): HasMany
    {
        return $this->hasMany(StockMutation::class);
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'product_ingredients')
            ->withPivot(['quantity_needed', 'recipe_unit', 'conversion_factor']);
    }

    public function hasEnoughStock(int $quantity): bool
    {
        if (! $this->track_stock) {
            return true;
        }

        return $this->stock >= $quantity;
    }

    public function effectiveUnitPrice(float ...$modifierPrices): float
    {
        $base = round((float) $this->price, 2);

        foreach ($modifierPrices as $mp) {
            $base = round($base + round((float) $mp, 2), 2);
        }

        return $base;
    }

    /**
     * Hitung HPP dinamis (Food Cost) berdasarkan total kebutuhan bahan baku resep BOM.
     */
    public function calculateDynamicCostPrice(): float
    {
        $totalCost = 0.0;
        foreach ($this->ingredients as $ingredient) {
            $qtyNeeded        = (float) ($ingredient->pivot->quantity_needed ?? 0);
            $conversionFactor = (float) ($ingredient->pivot->conversion_factor ?? 1.0);
            $costPerUnit      = (float) ($ingredient->cost_per_unit ?? 0);

            $totalCost += ($qtyNeeded * $conversionFactor * $costPerUnit);
        }

        return round($totalCost, 2);
    }

    /**
     * Rasio Food Cost Percentage standar F&B: (HPP / Harga Jual) * 100
     */
    public function getFoodCostPercentageAttribute(): float
    {
        $sellingPrice = (float) $this->price;
        $cost = (float) ($this->cost_price ?: $this->calculateDynamicCostPrice());

        return $sellingPrice > 0 ? round(($cost / $sellingPrice) * 100, 1) : 0.0;
    }
}
