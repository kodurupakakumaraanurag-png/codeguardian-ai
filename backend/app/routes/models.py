import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Dataset, Model
from app.schemas.model import ModelTrainRequest, ModelResponse
from app.services.ml_engine import MLEngine
from app.auth import verify_token
from app.config import settings

router = APIRouter(prefix="/models", tags=["models"])

@router.post("/train", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
def train_model(
    payload: ModelTrainRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    Train machine learning models (XGBoost & Random Forest) on the specified dataset.
    Saves the best model and returns its metrics, feature importances, and SHAP summaries.
    """
    dataset = db.query(Dataset).filter(Dataset.id == payload.dataset_id, Dataset.user_id == user_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or does not belong to you."
        )

    model_id = uuid.uuid4()
    
    try:
        # Run ML training
        train_result = MLEngine.train_models(
            cleaned_csv_path=dataset.file_path,
            target_column=dataset.target_column,
            model_id=str(model_id),
            storage_dir=settings.STORAGE_DIR
        )
        
        # Save model record in the database
        db_model = Model(
            id=model_id,
            dataset_id=dataset.id,
            user_id=user_id,
            name=payload.name,
            algorithm=train_result["algorithm"],
            metrics=train_result["metrics"],
            model_path=train_result["model_path"],
            feature_importance=train_result["feature_importance"],
            shap_summary=train_result["shap_summary"]
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        
        return db_model

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}"
        )

@router.get("/", response_model=List[ModelResponse])
def list_models(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    List all models trained by the authenticated user.
    """
    return db.query(Model).filter(Model.user_id == user_id).order_by(Model.created_at.desc()).all()

@router.get("/{model_id}", response_model=ModelResponse)
def get_model(
    model_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    Retrieve details of a single trained model.
    """
    model = db.query(Model).filter(Model.id == model_id, Model.user_id == user_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    return model

@router.delete("/{model_id}")
def delete_model(
    model_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    Delete a model and its local joblib file.
    """
    model = db.query(Model).filter(Model.id == model_id, Model.user_id == user_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
        
    # Remove file
    if os.path.exists(model.model_path):
        os.remove(model.model_path)
        
    db.delete(model)
    db.commit()
    return {"message": f"Model {model_id} deleted successfully."}
