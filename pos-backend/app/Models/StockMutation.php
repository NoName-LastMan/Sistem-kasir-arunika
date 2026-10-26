<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMutation extends Model
{
    protected $fillable = [
        'product_id',
        'ingredient_id',
        'user_id',
        'type',
        'quantity',
        'stock_before',
        'stock_after',
        'reference_note',
        'reference_type',
        'reference_id',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'stock_before' => 'float',
            'stock_after' => 'float',
        ];
    }

    const TYPE_IN     = 'in';
    const TYPE_OUT    = 'out';
    const TYPE_OPNAME = 'opname';
    const TYPE_SALES  = 'out';

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
