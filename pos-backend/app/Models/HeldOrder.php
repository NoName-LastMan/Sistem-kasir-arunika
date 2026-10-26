<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeldOrder extends Model
{
    protected $fillable = [
        'user_id',
        'table_id',
        'customer_name',
        'reference_note',
        'order_type',
        'subtotal',
        'cart_data',
    ];

    protected $casts = [
        'cart_data' => 'array',
        'subtotal'  => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }
}
