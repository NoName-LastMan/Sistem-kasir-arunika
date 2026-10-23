<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForecastSnapshot extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'forecast_date'             => 'date:Y-m-d',
            'current_stock'             => 'float',
            'predicted_daily_burn'      => 'float',
            'safety_stock_qty'          => 'float',
            'days_until_stockout'       => 'float',
            'recommended_reorder_qty'   => 'float',
            'unit_cost_rp'               => 'float',
            'estimated_reorder_cost_rp'  => 'float',
            'actual_usage_yesterday'     => 'float',
            'accuracy_percentage'        => 'float',
            'lead_time_days'             => 'integer',
            'recommended_purchase_packs' => 'float',
        ];
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
