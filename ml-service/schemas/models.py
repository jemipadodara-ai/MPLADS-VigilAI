from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ProjectFeatures(BaseModel):
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

class AnomalyPrediction(BaseModel):
    score: float
    decisionScore: float
    level: str
    isAnomaly: bool

class DelayPrediction(BaseModel):
    predictedDays: float
    risk: str

class CostPrediction(BaseModel):
    expectedCost: float
    expectedCostLakhs: float
    observedCost: float
    observedCostLakhs: float
    deviationPercent: float
    risk: str

class RiskFusionBreakdown(BaseModel):
    mlScore: float
    complianceScore: float
    delayScore: float
    costScore: float
    citizenScore: float
    weights: Dict[str, float]

class FullPredictionResult(BaseModel):
    projectId: str
    anomaly: AnomalyPrediction
    delay: DelayPrediction
    cost: CostPrediction
    riskFusion: Optional[Dict[str, Any]] = None

class BatchProjectsInput(BaseModel):
    projects: List[Dict[str, Any]]
