import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, classification_report, precision_score, recall_score
from preprocess import load_and_preprocess_dataset

def train_and_export_models():
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    output_model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
    os.makedirs(output_model_dir, exist_ok=True)

    print(f"==================================================")
    print(f"  Training AntiFraud ML Models (Ophthalmosurgery Data)")
    print(f"==================================================")
    
    # 1. Load Data
    X, y, df = load_and_preprocess_dataset(data_dir)
    feature_names = list(X.columns)
    
    # 2. Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # 3. Train Unsupervised Isolation Forest
    print("\n[ML Training] Fitting Isolation Forest for Unsupervised Anomaly Detection...")
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.08,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_scaled)
    # Convert decision function to risk score [0, 1]
    raw_scores = iso_forest.score_samples(X_scaled)
    # Lower score means more anomalous
    iso_risk_scores = 1.0 - (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-6)
    
    # 4. Train Supervised Anomaly Classifier for Feature Importance & Probability Calibration
    print("[ML Training] Fitting Calibrated Random Forest Risk Classifier...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_scaled, y)
    y_pred_proba = clf.predict_proba(X_scaled)[:, 1]
    
    auc = roc_auc_score(y, y_pred_proba)
    prec = precision_score(y, (y_pred_proba >= 0.5).astype(int))
    rec = recall_score(y, (y_pred_proba >= 0.5).astype(int))
    
    print(f"\n--- Model Performance Metrics ---")
    print(f" Dataset Size: {len(X):,} records")
    print(f" ROC-AUC Score: {auc:.4f}")
    print(f" Precision: {prec:.4f}")
    print(f" Recall:    {rec:.4f}")
    
    # Feature Importances
    importances = dict(zip(feature_names, [round(float(imp), 4) for imp in clf.feature_importances_]))
    print(f"\nFeature Importances: {json.dumps(importances, indent=2)}")
    
    # 5. Export Model Artifacts
    print(f"\n[ML Export] Saving model weights to {output_model_dir}...")
    joblib.dump(scaler, os.path.join(output_model_dir, "scaler.joblib"))
    joblib.dump(iso_forest, os.path.join(output_model_dir, "isolation_forest.joblib"))
    joblib.dump(clf, os.path.join(output_model_dir, "risk_classifier.joblib"))
    
    meta = {
        "model_type": "Hybrid IsolationForest + RandomForest Risk Classifier",
        "dataset_size": len(X),
        "total_amount_kzt": float(df['Сумма'].sum()),
        "roc_auc": round(float(auc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "feature_names": feature_names,
        "feature_importances": importances,
        "trained_at": pd.Timestamp.now().isoformat()
    }
    
    with open(os.path.join(output_model_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
        
    print("[ML Export Complete] All artifacts saved successfully!")

if __name__ == "__main__":
    train_and_export_models()
