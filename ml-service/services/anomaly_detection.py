import numpy as np
from typing import Dict, Any, Tuple

def predict_isolation_forest_anomaly(project: Dict[str, Any], iso_forest, scaler, extract_features_fn) -> Dict[str, Any]:
    """
    Evaluates project vector using trained Isolation Forest.
    Returns anomaly probability, decision score, and categorical risk level.
    """
    vec = extract_features_fn(project)
    scaled_vec = scaler.transform(vec.reshape(1, -1))
    
    # decision_function gives negative for anomalies, positive for regular points
    decision_score = float(iso_forest.decision_function(scaled_vec)[0])
    raw_pred = int(iso_forest.predict(scaled_vec)[0])
    
    # Sigmoidal/linear calibration to 0.05 - 0.98 probability
    anomaly_probability = float(np.clip(0.5 - (decision_score * 1.8), 0.05, 0.98))
    
    if anomaly_probability >= 0.75:
        level = "CRITICAL"
    elif anomaly_probability >= 0.55:
        level = "HIGH"
    elif anomaly_probability >= 0.35:
        level = "MEDIUM"
    else:
        level = "LOW"
        
    return {
        "score": round(anomaly_probability, 3),
        "decisionScore": round(decision_score, 4),
        "level": level,
        "isAnomaly": bool(raw_pred == -1 or anomaly_probability >= 0.55)
    }
