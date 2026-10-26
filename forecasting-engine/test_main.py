import unittest
from fastapi.testclient import TestClient
from main import app, calculate_croston, calculate_auto_ets, calculate_wma

client = TestClient(app)

class TestForecastingEngine(unittest.TestCase):

    def test_health_check(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("AutoETS", data["supported_models"])

    def test_wma_calculation(self):
        series = [10.0, 20.0, 30.0]
        burn_rate, safety_stock = calculate_wma(series, horizon=7)
        self.assertGreater(burn_rate, 0)
        self.assertGreater(safety_stock, 0)

    def test_croston_calculation(self):
        # Intermittent demand: mostly zeros with occasional bursts
        series = [0.0, 5.0, 0.0, 0.0, 10.0, 0.0, 4.0, 0.0]
        burn_rate, safety_stock = calculate_croston(series)
        self.assertGreater(burn_rate, 0)
        self.assertGreater(safety_stock, 0)

    def test_auto_ets_calculation(self):
        # Steady fast-moving series
        series = [15.0, 16.0, 14.5, 17.0, 18.0, 16.5, 19.0, 20.0, 21.0, 19.5, 22.0, 20.5, 23.0, 22.5, 24.0]
        burn_rate, safety_stock, ci = calculate_auto_ets(series, horizon=7)
        self.assertGreater(burn_rate, 0)
        self.assertGreater(safety_stock, 0)
        self.assertEqual(len(ci), 2)
        self.assertLessEqual(ci[0], ci[1])

    def test_forecast_endpoint_empty_series(self):
        response = client.post("/forecast", json={
            "ingredient_id": 99,
            "time_series": [],
            "prediction_horizon": 7
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["model_used"], "NoData")
        self.assertEqual(data["daily_burn_rate"], 0.0)

    def test_forecast_endpoint_fast_moving(self):
        series = [10.0 + (i * 0.5) for i in range(20)]
        response = client.post("/forecast", json={
            "ingredient_id": 1,
            "time_series": series,
            "prediction_horizon": 7
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["model_used"], "AutoETS")
        self.assertGreater(data["daily_burn_rate"], 0)
        self.assertGreater(data["predicted_horizon_demand"], 0)

    def test_forecast_endpoint_intermittent(self):
        # 14 items with less than 50% non-zero
        series = [0.0, 0.0, 12.0, 0.0, 0.0, 0.0, 15.0, 0.0, 0.0, 0.0, 0.0, 8.0, 0.0, 0.0]
        response = client.post("/forecast", json={
            "ingredient_id": 2,
            "time_series": series,
            "prediction_horizon": 7
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["model_used"], "Croston")

    def test_forecast_endpoint_sanitizes_negative_values(self):
        series = [-5.0, 10.0, -2.0, 15.0]
        response = client.post("/forecast", json={
            "ingredient_id": 3,
            "time_series": series,
            "prediction_horizon": 5
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["daily_burn_rate"], 0)

if __name__ == "__main__":
    unittest.main()
