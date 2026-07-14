from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class ColumnMetadata(BaseModel):
    name: str
    type: str
    raw_type: str
    null_count: int
    unique_count: int
    sample_values: List[Any]

class DatasetBase(BaseModel):
    name: str

class DatasetCreate(DatasetBase):
    file_path: str
    row_count: int
    col_count: int
    columns: List[Dict[str, Any]]
    target_column: str
    user_id: str

class DatasetResponse(DatasetBase):
    id: UUID
    row_count: int
    col_count: int
    columns: List[Dict[str, Any]]
    target_column: str
    created_at: datetime

    class Config:
        from_attributes = True
