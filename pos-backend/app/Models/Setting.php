<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'store_name',
        'store_address',
        'store_phone',
        'store_email',
        'receipt_header',
        'receipt_footer',
        'default_tax_rate',
        'service_charge_rate',
        'invoice_prefix',
    ];

    protected $casts = [
        'default_tax_rate'     => 'decimal:2',
        'service_charge_rate' => 'decimal:2',
    ];
}
