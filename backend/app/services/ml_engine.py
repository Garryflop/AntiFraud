import os
import json
import joblib
import numpy as np
import pandas as pd

class MLEngine:
    def __init__ (self):
        self.scaler = None
        self.iso_forest = None
        self.risk_classifier = None
        self.meta = {}
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models"))
        meta_path = os.path.join(model_dir, "meta.json")
        scaler_path = os.path.join(model_dir, "scaler.joblib")
        clf_path = os.path.join(model_dir, "risk_classifier.joblib")
        iso_path = os.path.join(model_dir, "isolation_forest.joblib")

        if os.path.exists(meta_path) and os.path.exists(clf_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.meta = json.load(f)
                self.scaler = joblib.load(scaler_path)
                self.risk_classifier = joblib.load(clf_path)
                self.iso_forest = joblib.load(iso_path)
                self.is_loaded = True
                print("[ML Engine] Models loaded successfully from ml/models/")
            except Exception as e:
                print(f"[ML Engine Error] Failed to load ML models: {e}")

    def predict_risk(self, upload_delay_hours: float, patient_age: float, patient_daily_velocity: int,
                     cost_zscore: float, provider_daily_volume: int, has_subcontractor: int,
                     is_extra: int, amount_kzt: float):
        if not self.is_loaded or self.scaler is None:
            # Fallback estimation if model not loaded
            risk = min(100.0, (patient_daily_velocity * 25.0) + (upload_delay_hours * 0.5) + (abs(cost_zscore) * 15.0))
            return {
                "risk_score_percent": round(risk, 1),
                "anomaly_level": "HIGH_RISK_FRAUD" if risk > 70 else "SUSPICIOUS" if risk > 35 else "NORMAL",
                "feature_breakdown": {
                    "velocity_factor": min(100, patient_daily_velocity * 20),
                    "delay_factor": min(100, upload_delay_hours * 2),
                    "cost_factor": min(100, abs(cost_zscore) * 20)
                }
            }

        features = np.array([[
            upload_delay_hours,
            patient_age,
            patient_daily_velocity,
            cost_zscore,
            provider_daily_volume,
            has_subcontractor,
            is_extra,
            amount_kzt
        ]])

        features_scaled = self.scaler.transform(features)
        proba = float(self.risk_classifier.predict_proba(features_scaled)[0, 1])
        iso_score = float(self.iso_forest.score_samples(features_scaled)[0])
        
        # Calculate feature risk penalties
        velocity_penalty = max(0.0, (patient_daily_velocity - 1) * 16.0)
        delay_penalty = max(0.0, (upload_delay_hours - 24.0) * 0.4) if upload_delay_hours > 24 else 0.0
        cost_penalty = max(0.0, (cost_zscore - 1.2) * 22.0) if cost_zscore > 1.2 else 0.0

        # Calibrated Risk Score (%)
        if patient_daily_velocity <= 2 and upload_delay_hours <= 24 and cost_zscore <= 1.2:
            risk_percent = round(min(20.0, max(0.0, proba * 25.0 + velocity_penalty)), 1)
        else:
            raw_risk = (proba * 50.0) + velocity_penalty + delay_penalty + cost_penalty
            risk_percent = round(min(100.0, max(0.0, raw_risk)), 1)

        level = "NORMAL"
        if risk_percent >= 65.0:
            level = "HIGH_RISK_FRAUD"
        elif risk_percent >= 30.0:
            level = "SUSPICIOUS"

        return {
            "risk_score_percent": risk_percent,
            "anomaly_level": level,
            "probability": round(proba, 4),
            "isolation_score": round(iso_score, 4),
            "feature_breakdown": {
                "velocity_factor": round(min(100.0, (patient_daily_velocity - 1) * 20.0), 1) if patient_daily_velocity > 1 else 0.0,
                "upload_delay_factor": round(min(100.0, upload_delay_hours * 1.0), 1),
                "cost_deviation_factor": round(min(100.0, abs(cost_zscore) * 20.0), 1),
                "provider_volume_factor": round(min(100.0, provider_daily_volume * 1.5), 1)
            }
        }

ml_engine = MLEngine()
