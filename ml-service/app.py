"""
MPLADS VigilAI - FastAPI Machine Learning Inference Microservice
Integrates Isolation Forest, Random Forest Delay & Cost Regressors, and Risk Fusion.
Port: 5001 (configurable via PORT env)
"""

import os
import sys
import json
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(CURRENT_DIR, "training"))
sys.path.append(os.path.join(CURRENT_DIR, "services"))
sys.path.append(os.path.join(CURRENT_DIR, "schemas"))

from feature_engineering import extract_features, FEATURE_NAMES
from services.anomaly_detection import predict_isolation_forest_anomaly
from services.delay_prediction import predict_project_delay
from services.cost_prediction import predict_cost_benchmark
from services.risk_fusion import compute_risk_fusion
from schemas.models import BatchProjectsInput

app = FastAPI(
    title="MPLADS VigilAI ML Microservice",
    description="Python ML Inference Engine for MoSPI MPLADS VigilAI",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(CURRENT_DIR, "models")

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
    
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            model_metadata = json.load(f)
            
    eval_path = os.path.join(MODELS_DIR, "evaluation_metrics.json")
    if os.path.exists(eval_path):
        with open(eval_path) as f:
            evaluation_metrics = json.load(f)
    print("VigilAI ML: All 3 models and scaler loaded successfully.")
except Exception as e:
    print(f"VigilAI ML Warning: Could not load some artifacts: {e}")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "MPLADS VigilAI Python ML Engine",
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
    return {
        "projectId": project.get("projectId") or project.get("id") or project.get("workCode") or "unknown",
        "anomaly": predict_isolation_forest_anomaly(project, iso_forest, scaler, extract_features)
    }

@app.post("/predict/delay")
def predict_delay(project: Dict[str, Any]):
    if not delay_regressor:
        raise HTTPException(status_code=503, detail="Delay model not loaded")
    return {
        "projectId": project.get("projectId") or project.get("id") or project.get("workCode") or "unknown",
        "delay": predict_project_delay(project, delay_regressor, extract_features)
    }

@app.post("/predict/cost")
def predict_cost(project: Dict[str, Any]):
    if not cost_regressor:
        raise HTTPException(status_code=503, detail="Cost model not loaded")
    return {
        "projectId": project.get("projectId") or project.get("id") or project.get("workCode") or "unknown",
        "cost": predict_cost_benchmark(project, cost_regressor, extract_features)
    }

@app.post("/predict/all")
def predict_all(project: Dict[str, Any]):
    p_id = project.get("projectId") or project.get("id") or project.get("workCode") or "unknown"
    anomaly_res = predict_isolation_forest_anomaly(project, iso_forest, scaler, extract_features)
    delay_res = predict_project_delay(project, delay_regressor, extract_features)
    cost_res = predict_cost_benchmark(project, cost_regressor, extract_features)
    
    risk_fusion_res = compute_risk_fusion(
        ml_anomaly_prob=anomaly_res["score"],
        predicted_delay_days=delay_res["predictedDays"],
        cost_deviation_pct=cost_res["deviationPercent"],
        project=project
    )
    
    return {
        "projectId": p_id,
        "anomaly": anomaly_res,
        "delay": delay_res,
        "cost": cost_res,
        "riskFusion": risk_fusion_res
    }

@app.post("/predict/batch")
def predict_batch(body: BatchProjectsInput):
    results = [predict_all(p) for p in body.projects]
    return {
        "count": len(results),
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting MPLADS VigilAI ML Microservice on 127.0.0.1:{port}...")
    uvicorn.run(app, host="127.0.0.1", port=port)
