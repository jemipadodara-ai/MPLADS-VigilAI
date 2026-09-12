"""
MPLADS VigilAI - Model Evaluation Script
Evaluates regression models (MAE, RMSE, R²) and unsupervised anomaly detection (Precision, Recall, F1)
against a documented validation benchmark.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, precision_score, recall_score, f1_score
from feature_engineering import FEATURE_NAMES
from train_models import generate_synthetic_training_data, MODELS_DIR

def evaluate():
    scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.joblib"))
    iso_forest = joblib.load(os.path.join(MODELS_DIR, "isolation_forest.joblib"))
    delay_regressor = joblib.load(os.path.join(MODELS_DIR, "delay_regressor.joblib"))
    cost_regressor = joblib.load(os.path.join(MODELS_DIR, "cost_regressor.joblib"))
    
    # Generate holdout test set with fresh seed
    test_df = generate_synthetic_training_data(n_samples=300, random_state=999)
    X = test_df[FEATURE_NAMES]
    X_scaled = scaler.transform(X)
    
    # 1. Evaluate Delay Regressor
    pred_delays = delay_regressor.predict(X)
    delay_mae = float(mean_absolute_error(test_df["target_delay_days"], pred_delays))
    delay_rmse = float(np.sqrt(mean_squared_error(test_df["target_delay_days"], pred_delays)))
    delay_r2 = float(r2_score(test_df["target_delay_days"], pred_delays))
    
    # 2. Evaluate Cost Regressor
    pred_costs = cost_regressor.predict(X)
    cost_mae = float(mean_absolute_error(test_df["target_cost_lakhs"], pred_costs))
    cost_rmse = float(np.sqrt(mean_squared_error(test_df["target_cost_lakhs"], pred_costs)))
    cost_r2 = float(r2_score(test_df["target_cost_lakhs"], pred_costs))
    
    # 3. Evaluate Isolation Forest
    # In IsolationForest, -1 indicates anomaly, 1 indicates inlier
    raw_preds = iso_forest.predict(X_scaled)
    pred_anomalies = (raw_preds == -1).astype(int)
    
    prec = float(precision_score(test_df["is_anomaly"], pred_anomalies))
    rec = float(recall_score(test_df["is_anomaly"], pred_anomalies))
    f1 = float(f1_score(test_df["is_anomaly"], pred_anomalies))
    
    results = {
        "dataset": "Documented Synthetic Benchmark (n=300, 20% Anomaly Injection)",
        "delay_prediction": {
            "model": "RandomForestRegressor",
            "MAE_days": round(delay_mae, 2),
            "RMSE_days": round(delay_rmse, 2),
            "R2_score": round(delay_r2, 3)
        },
        "cost_prediction": {
            "model": "RandomForestRegressor",
            "MAE_Lakhs": round(cost_mae, 2),
            "RMSE_Lakhs": round(cost_rmse, 2),
            "R2_score": round(cost_r2, 3)
        },
        "anomaly_detection": {
            "model": "IsolationForest",
            "Precision": round(prec, 3),
            "Recall": round(rec, 3),
            "F1_Score": round(f1, 3)
        },
        "evaluated_at": pd.Timestamp.now().isoformat()
    }
    
    with open(os.path.join(MODELS_DIR, "evaluation_metrics.json"), "w") as f:
        json.dump(results, f, indent=2)
        
    print("Model Evaluation Summary:")
    print(json.dumps(results, indent=2))
    return results

if __name__ == "__main__":
    evaluate()
