<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModifierItem extends Model
{
    protected $fillable = [
        'modifier_group_id',
        'name',
        'price',
        'ingredient_id',
        'quantity_needed',
    ];

    protected function casts(): array
    {
        return [
            'price'           => 'decimal:2',
            'quantity_needed' => 'decimal:3',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ModifierGroup::class, 'modifier_group_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}
