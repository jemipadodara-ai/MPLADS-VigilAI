from typing import Dict, Any

def compute_risk_fusion(
    ml_anomaly_prob: float,
    predicted_delay_days: float,
    cost_deviation_pct: float,
    project: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes statutory Risk Fusion Score according to the mandated MoSPI Vigilance weights:
    - 40% ML Anomaly Detection (Isolation Forest)
    - 25% Compliance Rules (Annexure-II, tender splitting, single bidder, UC delay)
    - 15% Delay Prediction (Random Forest)
    - 10% Cost Deviation (Random Forest Benchmark)
    - 10% Citizen / Field Verification
    """
    # 1. ML Anomaly component (0-100)
    ml_score = float(min(100.0, max(0.0, ml_anomaly_prob * 100.0)))
    
    # 2. Compliance rules component (0-100)
    compliance_score = 0.0
    category = str(project.get("category", "")).lower()
    title = str(project.get("title", "")).lower()
    
    # Check Annexure-II ineligible work
    ineligible_keywords = ["temple", "church", "mosque", "private", "commercial", "memorial", "statue", "religious"]
    if any(kw in title or kw in category for kw in ineligible_keywords):
        compliance_score += 45.0
        
    # Check tender splitting / smurfing (sanctioned amount near threshold ₹10-15 Lakhs)
    sanctioned = float(project.get("sanctionedAmountLakhs") or project.get("sanctionedAmount") or 0.0)
    if 9.5 <= sanctioned <= 10.0 or 14.5 <= sanctioned <= 15.0:
        compliance_score += 25.0
        
    # Check single bidder or contractor concentration
    contractor_count = int(project.get("contractorProjectCount", 0))
    if contractor_count >= 5:
        compliance_score += 20.0
        
    # Documentation / UC delay
    doc_comp = float(project.get("documentationCompleteness", 1.0))
    if doc_comp < 0.6:
        compliance_score += 20.0
        
    compliance_score = min(100.0, max(10.0, compliance_score))
    
    # 3. Delay Score (0-100)
    delay_score = float(min(100.0, max(0.0, (predicted_delay_days / 90.0) * 100.0)))
    
    # 4. Cost Deviation Score (0-100)
    cost_score = float(min(100.0, max(0.0, (max(0.0, cost_deviation_pct) / 40.0) * 100.0)))
    
    # 5. Citizen / Field Verification Score (0-100)
    reports = int(project.get("citizenReportCount", 0))
    satellite = bool(project.get("satelliteVerified", True))
    citizen_score = min(100.0, reports * 25.0 + (0.0 if satellite else 40.0))
    if citizen_score == 0 and reports == 0:
        citizen_score = 15.0  # Baseline neutral
        
    # Weighted calculation
    composite_score = (
        (ml_score * 0.40) +
        (compliance_score * 0.25) +
        (delay_score * 0.15) +
        (cost_score * 0.10) +
        (citizen_score * 0.10)
    )
    
    composite_score = round(min(100.0, max(0.0, composite_score)), 1)
    
    if composite_score >= 70.0:
        status = "CRITICAL"
        statutory_recommendation = "Issue notice under MPLADS Guidelines 2023 Clause 6.4 and freeze tranche release"
    elif composite_score >= 50.0:
        status = "HIGH"
        statutory_recommendation = "Order technical verification by District Vigilance Committee within 14 days"
    elif composite_score >= 30.0:
        status = "MEDIUM"
        statutory_recommendation = "Request updated Measurement Book (MB) and revised completion schedule"
    else:
        status = "LOW"
        statutory_recommendation = "Standard periodic inspection under routine monitoring"
        
    return {
        "finalRiskScore": composite_score,
        "status": status,
        "statutoryRecommendation": statutory_recommendation,
        "breakdown": {
            "mlScore": round(ml_score, 1),
            "complianceScore": round(compliance_score, 1),
            "delayScore": round(delay_score, 1),
            "costScore": round(cost_score, 1),
            "citizenScore": round(citizen_score, 1)
        },
        "weights": {
            "mlWeight": 0.40,
            "complianceWeight": 0.25,
            "delayWeight": 0.15,
            "costWeight": 0.10,
            "citizenWeight": 0.10
        }
    }
