<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiBriefingLog extends Model
{
    protected $fillable = [
        'briefing_date',
        'admin_operational_payload',
        'owner_executive_payload',
        'llm_provider',
        'email_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'briefing_date'             => 'date:Y-m-d',
            'admin_operational_payload' => 'array',
            'owner_executive_payload'   => 'array',
            'email_sent_at'             => 'datetime',
        ];
    }
}
