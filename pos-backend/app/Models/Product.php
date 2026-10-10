<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $guarded = ['id'];

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
}
