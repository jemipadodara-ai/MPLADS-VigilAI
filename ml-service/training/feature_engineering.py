"""
MPLADS VigilAI - Feature Engineering Pipeline
Extracts standardized numerical features for Isolation Forest, Delay Regression, and Cost Regression.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_NAMES = [
    "sanctionAmount",
    "expenditure",
    "expenditureRatio",
    "financialProgress",
    "physicalProgress",
    "progressGap",
    "projectAge",
    "expectedDuration",
    "daysDelayed",
    "paymentCount",
    "paymentVelocity",
    "contractorProjectCount",
    "contractorTotalValue",
    "citizenReportCount",
    "documentationCompleteness",
    "geoVerification",
    "distanceToSimilarProject"
]

SECTOR_MAPPING = {
    "drinking water": 0,
    "education": 1,
    "health": 2,
    "sanitation": 3,
    "roads, pathways and bridges": 4,
    "roads & infrastructure": 4,
    "community halls": 5,
    "electricity & renewable energy": 6,
    "sports infrastructure": 7,
    "other": 8
}

def extract_features(project: Dict[str, Any], context: Dict[str, Any] = None) -> np.ndarray:
    """Extracts a 1D vector of numerical features for a single project dictionary."""
    sanction = float(project.get("sanctionedAmountLakhs") or project.get("sanctionedAmount") or project.get("estimatedCost") or 10.0)
    expenditure = float(project.get("expenditureAmountLakhs") or project.get("expenditure") or 0.0)
    expenditure_ratio = float(expenditure / max(sanction, 0.1))
    financial_progress = min(100.0, expenditure_ratio * 100.0)
    
    physical_progress = float(project.get("completionPercentage") or project.get("physicalProgress") or 0.0)
    progress_gap = float(financial_progress - physical_progress)
    
    # Project age and expected duration in months
    project_age = float(project.get("projectAgeMonths") or project.get("ageMonths") or 12.0)
    expected_duration = float(project.get("expectedDurationMonths") or 12.0)
    days_delayed = float(project.get("delayDays") or project.get("daysDelayed") or (max(0, project_age - expected_duration) * 30.0))
    
    payment_count = float(project.get("paymentCount") or project.get("trancheCount") or 3.0)
    payment_velocity = float(expenditure / max(1.0, project_age))
    
    contractor_count = float(project.get("contractorProjectCount") or project.get("contractorProjects") or 4.0)
    contractor_val = float(project.get("contractorTotalValueLakhs") or (contractor_count * sanction * 0.8))
    
    citizen_reports = float(project.get("citizenReportCount") or (1.0 if project.get("citizenFlags") else 0.0))
    doc_completeness = float(project.get("documentationCompleteness") or 0.85)
    geo_verified = 1.0 if project.get("satelliteVerified") or (project.get("latitude") and project.get("longitude")) else 0.0
    distance_similar = float(project.get("distanceToSimilarKm") or 25.0)
    
    feature_vector = [
        sanction,
        expenditure,
        expenditure_ratio,
        financial_progress,
        physical_progress,
        progress_gap,
        project_age,
        expected_duration,
        days_delayed,
        payment_count,
        payment_velocity,
        contractor_count,
        contractor_val,
        citizen_reports,
        doc_completeness,
        geo_verified,
        distance_similar
    ]
    return np.array(feature_vector, dtype=np.float64)

def extract_features_df(projects: List[Dict[str, Any]]) -> pd.DataFrame:
    """Converts list of projects to DataFrame with standardized columns."""
    rows = [extract_features(p) for p in projects]
    return pd.DataFrame(rows, columns=FEATURE_NAMES)
