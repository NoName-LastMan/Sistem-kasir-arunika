<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemModifier extends Model
{
    protected $guarded = ['id'];

    public function modifierItem(): BelongsTo
    {
        return $this->belongsTo(ModifierItem::class);
    }
}