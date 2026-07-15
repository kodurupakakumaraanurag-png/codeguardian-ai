import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Dataset
from app.schemas.dataset import DatasetResponse
from app.services.data_cleaner import DataCleaner
from app.auth import verify_token
from app.config import settings

router = APIRouter(prefix="/datasets", tags=["datasets"])

@router.post("/upload-profile", status_code=status.HTTP_200_OK)
def upload_and_profile_file(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token)
):
    """
    Step 1: Upload a CSV file and return its profile (headers, shapes, nulls)
    without committing it to the database yet.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported."
        )

    # Save to temporary path inside storage/datasets
    temp_id = uuid.uuid4()
    temp_filename = f"temp_{temp_id}.csv"
    temp_path = os.path.join(settings.STORAGE_DIR, "datasets", temp_filename)

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        profile_data = DataCleaner.profile_csv(temp_path)
        return {
            "temp_file_path": temp_path,
            "filename": file.filename,
            **profile_data
        }
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to profile dataset: {str(e)}"
        )

@router.post("/clean-save", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
def clean_and_save_dataset(
    temp_file_path: str = Form(...),
    name: str = Form(...),
    target_column: str = Form(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    Step 2: Clean the CSV file automatically, encode columns,
    and save the dataset record in the database.
    """
    if not os.path.exists(temp_file_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Temporary file not found. Please upload again."
        )

    dataset_id = uuid.uuid4()
    cleaned_filename = f"cleaned_{dataset_id}.csv"
    cleaned_path = os.path.join(settings.STORAGE_DIR, "datasets", cleaned_filename)

    try:
        # Run automatic cleaning
        _, clean_summary = DataCleaner.clean_dataset(
            temp_file_path, 
            cleaned_path, 
            target_column
        )
        
        # Profile cleaned dataset to get columns metadata
        profile_cleaned = DataCleaner.profile_csv(cleaned_path)
        
        # Create database record
        db_dataset = Dataset(
            id=dataset_id,
            user_id=user_id,
            name=name,
            file_path=cleaned_path,
            row_count=profile_cleaned["row_count"],
            col_count=profile_cleaned["col_count"],
            columns=profile_cleaned["columns"],
            target_column=target_column
        )
        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)
        
        # Remove temporary raw file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
        return db_dataset

    except Exception as e:
        if os.path.exists(cleaned_path):
            os.remove(cleaned_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data cleaning failed: {str(e)}"
        )

@router.get("/", response_model=List[DatasetResponse])
def list_datasets(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    List all datasets for the authenticated user.
    """
    return db.query(Dataset).filter(Dataset.user_id == user_id).order_by(Dataset.created_at.desc()).all()

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    Get a single dataset profile details.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_token)
):
    """
    Delete a dataset and its local cleaned file.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # Delete clean file
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
        
    db.delete(dataset)
    db.commit()
    return {"message": f"Dataset {dataset_id} deleted successfully."}
