"""
MPLADS VigilAI - Model Training Pipeline
Trains:
1. Isolation Forest for unsupervised anomaly detection
2. Random Forest Regressor for Project Delay Prediction
3. Random Forest Regressor for Expected Cost Prediction
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from feature_engineering import FEATURE_NAMES, extract_features

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
os.makedirs(MODELS_DIR, exist_ok=True)

def generate_synthetic_training_data(n_samples=500, random_state=42):
    """Generates realistic MPLADS project data conforming to MoSPI guidelines."""
    np.random.seed(random_state)
    
    # 1. Sanction amounts typically 5 to 50 Lakhs
    sanction_amounts = np.random.lognormal(mean=2.8, sigma=0.6, size=n_samples)
    sanction_amounts = np.clip(sanction_amounts, 2.5, 95.0)
    
    # 2. Project duration 6 to 24 months
    expected_durations = np.random.choice([6, 9, 12, 18, 24], size=n_samples, p=[0.15, 0.25, 0.40, 0.15, 0.05])
    project_ages = expected_durations * np.random.uniform(0.3, 1.8, size=n_samples)
    
    # 3. Completion and expenditure correlations
    normal_ratio = np.random.beta(a=3, b=2, size=n_samples)
    expenditures = sanction_amounts * normal_ratio
    
    # Standard physical progress tracks expenditure with variance
    physical_progress = normal_ratio * 100.0 + np.random.normal(0, 8, size=n_samples)
    physical_progress = np.clip(physical_progress, 0, 100)
    
    # Inject anomalous patterns (20% of projects)
    n_anomalies = int(n_samples * 0.20)
    anomaly_indices = np.random.choice(n_samples, size=n_anomalies, replace=False)
    
    delays = np.maximum(0, (project_ages - expected_durations) * 30.0)
    costs = sanction_amounts.copy()
    
    for idx in anomaly_indices:
        case_type = np.random.choice(["progress_gap", "cost_overrun", "ghost_delay", "cartel"])
        if case_type == "progress_gap":
            # 80-95% expenditure with <35% physical completion
            expenditures[idx] = sanction_amounts[idx] * np.random.uniform(0.85, 1.05)
            physical_progress[idx] = np.random.uniform(15.0, 38.0)
            delays[idx] += np.random.uniform(60, 180)
        elif case_type == "cost_overrun":
            # Observed cost 40-90% higher than benchmark
            costs[idx] = sanction_amounts[idx] * np.random.uniform(1.4, 1.9)
            delays[idx] += np.random.uniform(45, 120)
        elif case_type == "ghost_delay":
            # Idle projects
            delays[idx] += np.random.uniform(180, 360)
            physical_progress[idx] = np.random.uniform(0.0, 15.0)
            
    df = pd.DataFrame({
        "sanctionAmount": sanction_amounts,
        "expenditure": expenditures,
        "expenditureRatio": expenditures / sanction_amounts,
        "financialProgress": np.clip((expenditures / sanction_amounts) * 100.0, 0, 150),
        "physicalProgress": physical_progress,
        "progressGap": ((expenditures / sanction_amounts) * 100.0) - physical_progress,
        "projectAge": project_ages,
        "expectedDuration": expected_durations,
        "daysDelayed": delays,
        "paymentCount": np.random.randint(1, 8, size=n_samples),
        "paymentVelocity": expenditures / np.maximum(1.0, project_ages),
        "contractorProjectCount": np.random.randint(1, 15, size=n_samples),
        "contractorTotalValue": sanction_amounts * np.random.uniform(1.2, 5.0, size=n_samples),
        "citizenReportCount": np.random.poisson(lam=0.4, size=n_samples),
        "documentationCompleteness": np.random.beta(a=8, b=2, size=n_samples),
        "geoVerification": np.random.binomial(n=1, p=0.85, size=n_samples),
        "distanceToSimilarProject": np.random.exponential(scale=15.0, size=n_samples)
    })
    
    # Ground truth labels for evaluation
    df["is_anomaly"] = 0
    df.loc[anomaly_indices, "is_anomaly"] = 1
    df["target_delay_days"] = delays
    df["target_cost_lakhs"] = costs
    
    return df

def train_and_save_models():
    print("Generating training dataset...")
    df = generate_synthetic_training_data(n_samples=1000)
    
    X = df[FEATURE_NAMES]
    
    # 1. Fit Scaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # 2. Train Isolation Forest (contamination=0.20)
    print("Fitting Isolation Forest model...")
    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.20,
        max_samples=256,
        random_state=42
    )
    iso_forest.fit(X_scaled)
    
    # 3. Train Delay Predictor (Random Forest Regressor)
    print("Fitting Delay Predictor (Random Forest Regressor)...")
    delay_regressor = RandomForestRegressor(
        n_estimators=120,
        max_depth=10,
        min_samples_split=4,
        random_state=42
    )
    delay_regressor.fit(X, df["target_delay_days"])
    
    # 4. Train Cost Predictor (Random Forest Regressor)
    print("Fitting Cost Predictor (Random Forest Regressor)...")
    cost_regressor = RandomForestRegressor(
        n_estimators=120,
        max_depth=10,
        min_samples_split=4,
        random_state=42
    )
    cost_regressor.fit(X, df["target_cost_lakhs"])
    
    # Save artifacts
    print(f"Saving models to {MODELS_DIR}...")
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(iso_forest, os.path.join(MODELS_DIR, "isolation_forest.joblib"))
    joblib.dump(delay_regressor, os.path.join(MODELS_DIR, "delay_regressor.joblib"))
    joblib.dump(cost_regressor, os.path.join(MODELS_DIR, "cost_regressor.joblib"))
    
    metadata = {
        "feature_names": FEATURE_NAMES,
        "n_samples": len(df),
        "contamination": 0.20,
        "models": ["IsolationForest", "RandomForestRegressor(Delay)", "RandomForestRegressor(Cost)"],
        "trained_at": pd.Timestamp.now().isoformat()
    }
    with open(os.path.join(MODELS_DIR, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    print("Model training pipeline completed successfully!")

if __name__ == "__main__":
    train_and_save_models()
