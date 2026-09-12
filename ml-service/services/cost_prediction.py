from typing import Dict, Any

def predict_cost_benchmark(project: Dict[str, Any], cost_regressor, extract_features_fn) -> Dict[str, Any]:
    """
    Computes fair benchmark cost in Lakhs and calculates variance against actual/observed expenditure.
    """
    vec = extract_features_fn(project)
    pred_cost_lakhs = float(cost_regressor.predict(vec.reshape(1, -1))[0])
    
    observed = float(
        project.get("expenditureAmountLakhs") or
        project.get("expenditure") or
        project.get("sanctionedAmountLakhs") or
        pred_cost_lakhs
    )
    
    diff = observed - pred_cost_lakhs
    deviation_pct = float((diff / max(pred_cost_lakhs, 0.1)) * 100.0)
    
    if deviation_pct >= 30.0:
        risk = "HIGH"
    elif deviation_pct >= 15.0:
        risk = "MEDIUM"
    else:
        risk = "LOW"
        
    return {
        "expectedCost": round(pred_cost_lakhs * 100000.0, 0), # INR
        "expectedCostLakhs": round(pred_cost_lakhs, 2),
        "observedCost": round(observed * 100000.0, 0),
        "observedCostLakhs": round(observed, 2),
        "deviationPercent": round(deviation_pct, 1),
        "risk": risk
    }
