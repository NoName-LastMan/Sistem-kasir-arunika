<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForecastSnapshot extends Model
{
    protected $fillable = [
        'forecast_date',
        'ingredient_id',
        'model_used',
        'lead_time_days',
        'current_stock',
        'predicted_daily_burn',
        'safety_stock_qty',
        'days_until_stockout',
        'recommended_reorder_qty',
        'purchase_unit',
        'recommended_purchase_packs',
        'urgency_status',
        'unit_cost_rp',
        'estimated_reorder_cost_rp',
        'actual_usage_yesterday',
        'accuracy_percentage',
    ];

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
