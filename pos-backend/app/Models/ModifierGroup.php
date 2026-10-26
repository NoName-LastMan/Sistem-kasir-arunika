<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModifierGroup extends Model
{
    protected $fillable = [
        'name',
        'is_required',
        'min_selection',
        'max_selection',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'min_selection' => 'integer',
            'max_selection' => 'integer',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(ModifierItem::class);
    }
}