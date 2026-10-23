<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiBriefingLog extends Model
{
    protected $guarded = ['id'];

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
