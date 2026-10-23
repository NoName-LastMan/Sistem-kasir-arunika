"""
Arunika F&B POS - Smart Forecasting Microservice Engine
Multi-tier Model Routing: AutoETS (Fast-Moving), Croston (Intermittent), WMA (Cold-Start)
"""

import math
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="Arunika F&B Forecasting Engine",
    description="Microservice peramalan kebutuhan stok bahan baku F&B berbasis statistik deret waktu dan machine learning",
    version="1.0.0"
)

class ForecastRequest(BaseModel):
    ingredient_id: int
    time_series: List[float] = Field(..., description="Histori pemakaian harian 14-90 hari (urutan kronologis)")
    prediction_horizon: Optional[int] = Field(default=7, description="Jumlah hari proyeksi ke depan (default 7 hari)")

class ForecastResponse(BaseModel):
    ingredient_id: int
    model_used: str
    daily_burn_rate: float
    safety_stock_qty: float
    predicted_horizon_demand: float
    confidence_interval_p90: List[float]


def calculate_croston(series: List[float]) -> tuple[float, float]:
    """Croston's Method untuk demand intermittent (banyak hari nol)."""
    alpha = 0.2
    z = None  # demand size
    p = 1.0   # inter-arrival interval
    q = 1     # intervals since last demand

    for val in series:
        if val > 0:
            if z is None:
                z = val
                p = 1.0
            else:
                z = (alpha * val) + ((1.0 - alpha) * z)
                p = (alpha * q) + ((1.0 - alpha) * p)
            q = 1
        else:
            q += 1

    if z is None or p <= 0:
        return 0.0, 0.0

    burn_rate = round(z / p, 2)
    safety_stock = round(z * 1.25, 2)
    return burn_rate, safety_stock


def calculate_auto_ets(series: List[float], horizon: int) -> tuple[float, float, List[float]]:
    """AutoETS (Exponential Smoothing with Trend & P90 Prediction Interval)."""
    n = len(series)
    if n == 0:
        return 0.0, 0.0, [0.0, 0.0]

    alpha = 0.3
    beta = 0.1

    level = series[0]
    trend = (series[-1] - series[0]) / max(n - 1, 1)
    residuals = []

    for val in series[1:]:
        pred = level + trend
        residuals.append(abs(val - pred))
        prev_level = level
        level = (alpha * val) + ((1.0 - alpha) * (prev_level + trend))
        trend = (beta * (level - prev_level)) + ((1.0 - beta) * trend)

    # Batasi trend agar tidak meledak
    trend = max(-level * 0.2, min(level * 0.2, trend))
    daily_burn = max(0.01, round(level + trend, 2))

    # P90 Prediction Interval (Z = 1.645)
    variance = sum(r ** 2 for r in residuals) / max(len(residuals), 1) if residuals else (daily_burn * 0.2) ** 2
    std_dev = math.sqrt(variance)

    safety_stock = round(1.645 * std_dev * math.sqrt(horizon), 2)
    ci_lower = max(0.0, round(daily_burn - (1.645 * std_dev), 2))
    ci_upper = round(daily_burn + (1.645 * std_dev), 2)

    return daily_burn, safety_stock, [ci_lower, ci_upper]


def calculate_wma(series: List[float], horizon: int) -> tuple[float, float]:
    """Weighted Moving Average untuk cold start."""
    n = len(series)
    if n == 0:
        return 0.0, 0.0

    weighted_sum = sum(val * (idx + 1) for idx, val in enumerate(series))
    weight_sum = sum(range(1, n + 1))
    daily_burn = round(weighted_sum / weight_sum, 2) if weight_sum > 0 else 0.0
    safety_stock = round(daily_burn * horizon * 0.15, 2)
    return daily_burn, safety_stock


@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "Arunika Smart Inventory Forecasting Microservice",
        "version": "1.0.0",
        "supported_models": ["AutoETS", "Croston", "WMA_Fallback"]
    }


@app.post("/forecast", response_model=ForecastResponse)
def generate_forecast(req: ForecastRequest):
    series = [float(x) for x in req.time_series]
    n = len(series)
    horizon = max(1, req.prediction_horizon)

    if n == 0:
        return ForecastResponse(
            ingredient_id=req.ingredient_id,
            model_used="NoData",
            daily_burn_rate=0.0,
            safety_stock_qty=0.0,
            predicted_horizon_demand=0.0,
            confidence_interval_p90=[0.0, 0.0]
        )

    non_zero = [x for x in series if x > 0]
    non_zero_ratio = len(non_zero) / n

    # Multi-Tier Routing
    if len(non_zero) >= 14 and non_zero_ratio >= 0.5:
        # Tier 1: Fast-Moving (AutoETS)
        model_used = "AutoETS"
        burn_rate, safety_stock, ci = calculate_auto_ets(series, horizon)
    elif len(non_zero) > 0 and non_zero_ratio < 0.5:
        # Tier 2: Intermittent (Croston)
        model_used = "Croston"
        burn_rate, safety_stock = calculate_croston(series)
        ci = [max(0.0, burn_rate * 0.7), burn_rate * 1.5]
    else:
        # Tier 3: Cold-Start (WMA)
        model_used = "WMA_Fallback"
        burn_rate, safety_stock = calculate_wma(series, horizon)
        ci = [max(0.0, burn_rate * 0.8), burn_rate * 1.3]

    predicted_demand = round((burn_rate * horizon) + safety_stock, 2)

    return ForecastResponse(
        ingredient_id=req.ingredient_id,
        model_used=model_used,
        daily_burn_rate=burn_rate,
        safety_stock_qty=safety_stock,
        predicted_horizon_demand=predicted_demand,
        confidence_interval_p90=ci
    )
