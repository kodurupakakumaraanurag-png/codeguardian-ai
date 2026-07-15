import os
import sys
# Dynamic path resolution to support monorepos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import shutil
import pandas as pd
import numpy as np
import pytest
from app.services.data_cleaner import DataCleaner
from app.services.ml_engine import MLEngine
from pandas.api.types import is_numeric_dtype

TEST_DIR = "./test_storage"
RAW_CSV = os.path.join(TEST_DIR, "raw_test.csv")
CLEAN_CSV = os.path.join(TEST_DIR, "clean_test.csv")

@pytest.fixture(scope="module", autouse=True)
def setup_test_environment():
    # Setup test directory
    os.makedirs(TEST_DIR, exist_ok=True)
    os.makedirs(os.path.join(TEST_DIR, "models"), exist_ok=True)
    
    # Create dummy classification dataset
    np.random.seed(42)
    n_samples = 100
    
    data = {
        "loc": np.random.randint(10, 500, size=n_samples).astype(float),
        "v_g": np.random.randint(1, 50, size=n_samples).astype(float),
        "ev_g": np.random.randint(1, 30, size=n_samples).astype(float),
        "categorical_metric": np.random.choice(["high", "medium", "low", None], size=n_samples),
        "defects": np.random.choice([0, 1], size=n_samples)
    }
    
    # Introduce some NaN values in numeric loc column
    data["loc"][5] = np.nan
    data["loc"][12] = np.nan
    
    df = pd.DataFrame(data)
    df.to_csv(RAW_CSV, index=False)
    
    yield
    
    # Teardown
    if os.path.exists(TEST_DIR):
        shutil.rmtree(TEST_DIR)

def test_data_cleaning_and_profiling():
    # 1. Profile CSV
    profile = DataCleaner.profile_csv(RAW_CSV)
    assert profile["row_count"] == 100
    assert profile["col_count"] == 5
    
    # Check null count detection
    loc_meta = next(c for c in profile["columns"] if c["name"] == "loc")
    assert loc_meta["null_count"] == 2
    assert loc_meta["type"] == "numeric"
    
    # 2. Clean and Impute
    df_clean, summary = DataCleaner.clean_dataset(
        input_path=RAW_CSV,
        output_path=CLEAN_CSV,
        target_column="defects"
    )
    
    assert os.path.exists(CLEAN_CSV)
    assert df_clean["loc"].isnull().sum() == 0
    assert df_clean["categorical_metric"].isnull().sum() == 0
    # Categorical columns should have been mapped to numbers
    assert is_numeric_dtype(df_clean["categorical_metric"])

def test_model_training_and_prediction():
    # 1. Train model
    model_id = "test_model_123"
    train_results = MLEngine.train_models(
        cleaned_csv_path=CLEAN_CSV,
        target_column="defects",
        model_id=model_id,
        storage_dir=TEST_DIR
    )
    
    assert train_results["algorithm"] in ["xgboost", "random_forest"]
    assert "metrics" in train_results
    assert "f1" in train_results["metrics"]
    assert os.path.exists(train_results["model_path"])
    assert len(train_results["feature_importance"]) > 0
    
    # 2. Predict instance
    input_sample = {
        "loc": 150.0,
        "v_g": 12.0,
        "ev_g": 4.0,
        "categorical_metric": 1.0 # Encoded index
    }
    
    pred_res = MLEngine.predict_instance(
        model_path=train_results["model_path"],
        input_data=input_sample
    )
    
    assert "prediction" in pred_res
    assert pred_res["prediction"] in [0, 1]
    assert "probability" in pred_res
    assert 0.0 <= pred_res["probability"] <= 1.0
    assert "shap_forces" in pred_res
    assert len(pred_res["shap_forces"]) == len(input_sample)
