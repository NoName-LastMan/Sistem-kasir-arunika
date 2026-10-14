<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMutation extends Model
{
    protected $guarded = ['id'];

    const TYPE_IN     = 'in';
    const TYPE_OUT    = 'out';
    const TYPE_OPNAME = 'opname';
    const TYPE_SALES  = 'out';

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
