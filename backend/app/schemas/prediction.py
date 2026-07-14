from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class PredictionRequest(BaseModel):
    model_id: UUID
    input_data: Dict[str, float]

class PredictionResponse(BaseModel):
    id: UUID
    model_id: UUID
    input_data: Dict[str, float]
    output_result: Dict[str, Any] # {prediction, probability}
    shap_values: Dict[str, float] # local SHAP contributions
    created_at: datetime

    class Config:
        from_attributes = True
