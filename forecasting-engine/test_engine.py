from main import calculate_auto_ets, calculate_croston, calculate_wma, app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_health_check():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

def test_auto_ets_fast_moving():
    # 20 hari konsumsi stabil ~10
    series = [9.5, 10.2, 10.0, 11.0, 9.8, 10.5, 10.1, 9.9, 10.3, 10.0, 10.2, 10.4, 9.7, 10.1, 10.0, 10.5, 10.2, 9.8, 10.1, 10.0]
    res = client.post("/forecast", json={
        "ingredient_id": 1,
        "time_series": series,
        "prediction_horizon": 7
    })
    assert res.status_code == 200
    data = res.json()
    assert data["model_used"] == "AutoETS"
    assert 8.0 < data["daily_burn_rate"] < 12.0
    assert data["safety_stock_qty"] > 0
    assert data["predicted_horizon_demand"] > 0

def test_croston_intermittent():
    # Pola intermittent (banyak 0)
    series = [0, 0, 5.0, 0, 0, 0, 6.0, 0, 0, 0, 0, 5.5, 0, 0]
    res = client.post("/forecast", json={
        "ingredient_id": 2,
        "time_series": series,
        "prediction_horizon": 7
    })
    assert res.status_code == 200
    data = res.json()
    assert data["model_used"] == "Croston"
    assert data["daily_burn_rate"] > 0

if __name__ == "__main__":
    test_health_check()
    test_auto_ets_fast_moving()
    test_croston_intermittent()
    print("All Python forecasting tests passed successfully!")
