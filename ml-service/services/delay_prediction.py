from typing import Dict, Any

def predict_project_delay(project: Dict[str, Any], delay_regressor, extract_features_fn) -> Dict[str, Any]:
    """
    Predicts completion delay in calendar days using trained RandomForestRegressor.
    """
    vec = extract_features_fn(project)
    pred_days = float(delay_regressor.predict(vec.reshape(1, -1))[0])
    pred_days = max(0.0, pred_days)
    
    if pred_days >= 90:
        risk = "HIGH"
    elif pred_days >= 30:
        risk = "MEDIUM"
    else:
        risk = "LOW"
        
    return {
        "predictedDays": round(pred_days, 1),
        "risk": risk
    }
