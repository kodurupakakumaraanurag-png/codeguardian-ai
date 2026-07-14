import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, JSON, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    row_count = Column(Integer, nullable=False)
    col_count = Column(Integer, nullable=False)
    columns = Column(JSON, nullable=False) # JSON list of column metadata
    target_column = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    models = relationship("Model", back_populates="dataset", cascade="all, delete-orphan")

class Model(Base):
    __tablename__ = "models"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    dataset_id = Column(Uuid, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    algorithm = Column(String(100), nullable=False) # 'xgboost' or 'random_forest'
    metrics = Column(JSON, nullable=False) # accuracy, precision, recall, f1, etc.
    model_path = Column(String(512), nullable=False)
    feature_importance = Column(JSON, nullable=False)
    shap_summary = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    dataset = relationship("Dataset", back_populates="models")
    predictions = relationship("Prediction", back_populates="model", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    model_id = Column(Uuid, ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(255), nullable=False, index=True)
    input_data = Column(JSON, nullable=False) # Key-value parameters
    output_result = Column(JSON, nullable=False) # {prediction, probability}
    shap_values = Column(JSON, nullable=False) # Feature impact mapping
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    model = relationship("Model", back_populates="predictions")
