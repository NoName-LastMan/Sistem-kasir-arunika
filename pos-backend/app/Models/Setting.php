<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'default_tax_rate'     => 'decimal:2',
        'service_charge_rate' => 'decimal:2',
    ];
}
