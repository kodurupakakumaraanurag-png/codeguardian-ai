from pydantic import BaseModel
from typing import Dict, List, Any
from datetime import datetime
from uuid import UUID

class ModelTrainRequest(BaseModel):
    dataset_id: UUID
    name: str

class ModelResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    name: str
    algorithm: str
    metrics: Dict[str, Any]
    feature_importance: Dict[str, float]
    shap_summary: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
