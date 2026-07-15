import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Model, Prediction
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.ml_engine import MLEngine
from app.services.report_gen import ReportGen
from app.auth import verify_token
from app.config import settings

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def make_prediction(
    payload: PredictionRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    Run prediction inference using a trained model.
    Computes local SHAP values and logs the predictions history in the database.
    """
    model = db.query(Model).filter(Model.id == payload.model_id, Model.user_id == user_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or does not belong to you."
        )
        
    try:
        # Perform single instance prediction
        predict_res = MLEngine.predict_instance(
            model_path=model.model_path,
            input_data=payload.input_data
        )
        
        output_result = {
            "prediction": int(predict_res["prediction"]),
            "probability": predict_res["probability"]
        }
        
        # Save prediction entry
        prediction_id = uuid.uuid4()
        db_prediction = Prediction(
            id=prediction_id,
            model_id=model.id,
            user_id=user_id,
            input_data=payload.input_data,
            output_result=output_result,
            shap_values=predict_res["shap_forces"] # Log local SHAP values
        )
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        
        return db_prediction
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.get("/", response_model=List[PredictionResponse])
def list_predictions(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    List all prediction history log for the user.
    """
    return db.query(Prediction).filter(Prediction.user_id == user_id).order_by(Prediction.created_at.desc()).all()

@router.get("/{prediction_id}/report")
def download_prediction_report(
    prediction_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    Generates a ReportLab PDF prediction details sheet containing input metrics,
    trained model parameters, prediction outputs, and feature SHAP values.
    Returns the file as an attachment.
    """
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id, 
        Prediction.user_id == user_id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction details not found."
        )
        
    model = db.query(Model).filter(Model.id == prediction.model_id).first()
    if not model:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated model not found."
        )
         
    # Fetch dataset name for metadata display
    dataset_name = "Unknown Dataset"
    if model.dataset:
        dataset_name = model.dataset.name

    report_filename = f"report_{prediction_id}.pdf"
    report_path = os.path.join(settings.STORAGE_DIR, "reports", report_filename)
    
    try:
        # Generate the PDF
        ReportGen.generate_prediction_pdf(
            output_path=report_path,
            dataset_name=dataset_name,
            model_name=model.name,
            model_metrics=model.metrics,
            input_data=prediction.input_data,
            prediction_result=prediction.output_result,
            shap_forces=prediction.shap_values
        )
        
        return FileResponse(
            report_path, 
            media_type="application/pdf", 
            filename=f"software_quality_report_{prediction_id}.pdf"
        )
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(e)}"
        )
