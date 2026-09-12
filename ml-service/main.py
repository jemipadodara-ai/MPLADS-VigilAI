"""
MPLADS VigilAI - FastAPI Machine Learning Inference Microservice
Serves trained Isolation Forest, Delay Regressor, and Cost Regressor.
"""

import os
import sys
import json
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure training directory is on python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(CURRENT_DIR, "training"))

from feature_engineering import extract_features, FEATURE_NAMES

app = FastAPI(
    title="MPLADS VigilAI ML Inference Service",
    description="Machine Learning service for Anomaly Detection, Delay Forecasting, and Cost Benchmarking",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(CURRENT_DIR, "models")

# Load trained models into memory once at startup
scaler = None
iso_forest = None
delay_regressor = None
cost_regressor = None
model_metadata = {}
evaluation_metrics = {}

try:
    scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.joblib"))
    iso_forest = joblib.load(os.path.join(MODELS_DIR, "isolation_forest.joblib"))
    delay_regressor = joblib.load(os.path.join(MODELS_DIR, "delay_regressor.joblib"))
    cost_regressor = joblib.load(os.path.join(MODELS_DIR, "cost_regressor.joblib"))
    
    with open(os.path.join(MODELS_DIR, "model_metadata.json")) as f:
        model_metadata = json.load(f)
    with open(os.path.join(MODELS_DIR, "evaluation_metrics.json")) as f:
        evaluation_metrics = json.load(f)
    print("All ML models and scaler loaded successfully into memory.")
except Exception as e:
    print(f"Warning loading model artifacts: {e}")

class ProjectInput(BaseModel):
    projectId: Optional[str] = "P-001"
    workCode: Optional[str] = "MPLADS/2026/001"
    title: Optional[str] = "Community Facility"
    category: Optional[str] = "Community Infrastructure"
    sanctionedAmountLakhs: Optional[float] = 25.0
    expenditureAmountLakhs: Optional[float] = 18.0
    completionPercentage: Optional[float] = 45.0
    status: Optional[str] = "In Progress"
    projectAgeMonths: Optional[float] = 14.0
    expectedDurationMonths: Optional[float] = 12.0
    delayDays: Optional[float] = None
    paymentCount: Optional[int] = 3
    contractorProjectCount: Optional[int] = 4
    contractorTotalValueLakhs: Optional[float] = 80.0
    citizenReportCount: Optional[int] = 0
    documentationCompleteness: Optional[float] = 0.85
    satelliteVerified: Optional[bool] = True
    distanceToSimilarKm: Optional[float] = 20.0

class BatchInput(BaseModel):
    projects: List[Dict[str, Any]]

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "MPLADS VigilAI ML Service",
        "modelsLoaded": bool(iso_forest and delay_regressor and cost_regressor),
        "featureCount": len(FEATURE_NAMES)
    }

@app.get("/model-info")
def model_info():
    return {
        "metadata": model_metadata,
        "evaluation": evaluation_metrics,
        "features": FEATURE_NAMES
    }

@app.post("/predict/anomaly")
def predict_anomaly(project: Dict[str, Any]):
    if not iso_forest or not scaler:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    vec = extract_features(project)
    scaled_vec = scaler.transform(vec.reshape(1, -1))
    
    # decision_function gives negative for anomalies, positive for inliers
    decision_score = float(iso_forest.decision_function(scaled_vec)[0])
    raw_pred = int(iso_forest.predict(scaled_vec)[0])
    
    # Normalize score to 0.0 - 1.0 (higher = more anomalous)
    # Typical decision_function range is roughly -0.3 to +0.3
    anomaly_probability = float(np.clip(0.5 - (decision_score * 1.8), 0.05, 0.98))
    level = "CRITICAL" if anomaly_probability >= 0.75 else "HIGH" if anomaly_probability >= 0.55 else "MEDIUM" if anomaly_probability >= 0.35 else "LOW"
    
    return {
        "projectId": project.get("projectId") or project.get("id") or "unknown",
        "anomaly": {
            "score": round(anomaly_probability, 3),
            "decisionScore": round(decision_score, 4),
            "level": level,
            "isAnomaly": bool(raw_pred == -1 or anomaly_probability >= 0.55)
        }
    }

@app.post("/predict/delay")
def predict_delay(project: Dict[str, Any]):
    if not delay_regressor:
        raise HTTPException(status_code=503, detail="Delay regressor not loaded")
    
    vec = extract_features(project)
    pred_days = float(delay_regressor.predict(vec.reshape(1, -1))[0])
    pred_days = max(0.0, pred_days)
    
    risk = "HIGH" if pred_days >= 90 else "MEDIUM" if pred_days >= 30 else "LOW"
    return {
        "projectId": project.get("projectId") or project.get("id") or "unknown",
        "delay": {
            "predictedDays": round(pred_days, 1),
            "risk": risk
        }
    }

@app.post("/predict/cost")
def predict_cost(project: Dict[str, Any]):
    if not cost_regressor:
        raise HTTPException(status_code=503, detail="Cost regressor not loaded")
        
    vec = extract_features(project)
    pred_cost = float(cost_regressor.predict(vec.reshape(1, -1))[0])
    observed = float(project.get("expenditureAmountLakhs") or project.get("expenditure") or project.get("sanctionedAmountLakhs") or pred_cost)
    
    diff = observed - pred_cost
    deviation_pct = float((diff / max(pred_cost, 0.1)) * 100.0)
    
    risk = "HIGH" if deviation_pct >= 30.0 else "MEDIUM" if deviation_pct >= 15.0 else "LOW"
    return {
        "projectId": project.get("projectId") or project.get("id") or "unknown",
        "cost": {
            "expectedCost": round(pred_cost * 100000.0, 0), # in INR
            "expectedCostLakhs": round(pred_cost, 2),
            "observedCost": round(observed * 100000.0, 0),
            "observedCostLakhs": round(observed, 2),
            "deviationPercent": round(deviation_pct, 1),
            "risk": risk
        }
    }

@app.post("/predict/all")
def predict_all(project: Dict[str, Any]):
    p_id = project.get("projectId") or project.get("id") or project.get("workCode") or "unknown"
    
    vec = extract_features(project)
    scaled_vec = scaler.transform(vec.reshape(1, -1))
    
    decision_score = float(iso_forest.decision_function(scaled_vec)[0])
    raw_pred = int(iso_forest.predict(scaled_vec)[0])
    anomaly_prob = float(np.clip(0.5 - (decision_score * 1.8), 0.05, 0.98))
    anomaly_level = "CRITICAL" if anomaly_prob >= 0.75 else "HIGH" if anomaly_prob >= 0.55 else "MEDIUM" if anomaly_prob >= 0.35 else "LOW"
    
    pred_days = float(delay_regressor.predict(vec.reshape(1, -1))[0])
    pred_days = max(0.0, pred_days)
    delay_risk = "HIGH" if pred_days >= 90 else "MEDIUM" if pred_days >= 30 else "LOW"
    
    pred_cost = float(cost_regressor.predict(vec.reshape(1, -1))[0])
    observed = float(project.get("expenditureAmountLakhs") or project.get("expenditure") or project.get("sanctionedAmountLakhs") or pred_cost)
    deviation_pct = float(((observed - pred_cost) / max(pred_cost, 0.1)) * 100.0)
    cost_risk = "HIGH" if deviation_pct >= 30.0 else "MEDIUM" if deviation_pct >= 15.0 else "LOW"
    
    return {
        "projectId": p_id,
        "anomaly": {
            "score": round(anomaly_prob, 3),
            "decisionScore": round(decision_score, 4),
            "level": anomaly_level,
            "isAnomaly": bool(raw_pred == -1 or anomaly_prob >= 0.55)
        },
        "delay": {
            "predictedDays": round(pred_days, 1),
            "risk": delay_risk
        },
        "cost": {
            "expectedCost": round(pred_cost * 100000.0, 0),
            "expectedCostLakhs": round(pred_cost, 2),
            "observedCost": round(observed * 100000.0, 0),
            "observedCostLakhs": round(observed, 2),
            "deviationPercent": round(deviation_pct, 1),
            "risk": cost_risk
        }
    }

@app.post("/predict/batch")
def predict_batch(body: BatchInput):
    results = [predict_all(p) for p in body.projects]
    return {
        "count": len(results),
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
