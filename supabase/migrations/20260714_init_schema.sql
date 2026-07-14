-- Database Migration: 20260714_init_schema.sql
-- Setup Tables for Software Quality Prediction Platform

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Datasets Table
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    row_count INTEGER NOT NULL,
    col_count INTEGER NOT NULL,
    columns JSONB NOT NULL,
    target_column VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Models Table
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    algorithm VARCHAR(100) NOT NULL, -- 'xgboost' or 'random_forest'
    metrics JSONB NOT NULL, -- {accuracy, precision, recall, f1, roc_auc}
    model_path VARCHAR(512) NOT NULL, -- local or supabase storage path
    feature_importance JSONB NOT NULL,
    shap_summary JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    input_data JSONB NOT NULL,
    output_result JSONB NOT NULL, -- {prediction, probability}
    shap_values JSONB NOT NULL, -- local explanation features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for user-based queries
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
