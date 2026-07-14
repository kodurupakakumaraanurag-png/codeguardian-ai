import pandas as pd
import numpy as np
import os
from typing import Dict, List, Tuple, Any

class DataCleaner:
    @staticmethod
    def profile_csv(file_path: str) -> Dict[str, Any]:
        """
        Profiles a CSV to detect shape, headers, null counts, and candidate targets.
        """
        df = pd.read_csv(file_path)
        row_count, col_count = df.shape
        
        columns_meta = []
        for col in df.columns:
            null_count = int(df[col].isnull().sum())
            dtype = str(df[col].dtype)
            
            # Simple heuristic for type
            inferred_type = "numeric"
            if df[col].dtype == "object":
                # Check if it could be a date
                try:
                    pd.to_datetime(df[col].head(10), errors="raise")
                    inferred_type = "datetime"
                except (ValueError, TypeError):
                    inferred_type = "categorical"
            elif "int" in dtype or "float" in dtype:
                inferred_type = "numeric"
            elif "bool" in dtype:
                inferred_type = "boolean"
                
            unique_count = int(df[col].nunique())
            
            columns_meta.append({
                "name": col,
                "type": inferred_type,
                "raw_type": dtype,
                "null_count": null_count,
                "unique_count": unique_count,
                "sample_values": df[col].dropna().head(3).tolist()
            })
            
        return {
            "row_count": row_count,
            "col_count": col_count,
            "columns": columns_meta
        }

    @staticmethod
    def clean_dataset(
        input_path: str, 
        output_path: str, 
        target_column: str
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Automatically cleans dataset:
        1. Drops columns with 80%+ missing values
        2. Imputes numeric missing values with median
        3. Imputes categorical missing values with mode
        4. Encodes categorical variables (keeps mapping metadata)
        5. Saves cleaned dataset
        """
        df = pd.read_csv(input_path)
        initial_shape = df.shape
        
        # Ensure target column is present
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset.")
            
        # 1. Drop columns with too many nulls (except target)
        null_threshold = 0.8 * len(df)
        cols_to_drop = [
            col for col in df.columns 
            if df[col].isnull().sum() > null_threshold and col != target_column
        ]
        df = df.drop(columns=cols_to_drop)
        
        imputations = {}
        encoding_maps = {}
        
        # 2. Impute and Clean Features
        for col in df.columns:
            # Skip target handling for now to handle it separately
            if col == target_column:
                continue
                
            # If numeric:
            if np.issubdtype(df[col].dtype, np.number):
                null_count = int(df[col].isnull().sum())
                if null_count > 0:
                    median_val = float(df[col].median())
                    df[col] = df[col].fillna(median_val)
                    imputations[col] = {"method": "median", "value": median_val, "nulls_filled": null_count}
            else:
                # If object/categorical:
                null_count = int(df[col].isnull().sum())
                mode_series = df[col].mode()
                mode_val = str(mode_series[0]) if not mode_series.empty else "unknown"
                
                if null_count > 0:
                    df[col] = df[col].fillna(mode_val)
                    imputations[col] = {"method": "mode", "value": mode_val, "nulls_filled": null_count}
                
                # Perform encoding
                df[col] = df[col].astype(str)
                categories = sorted(df[col].unique())
                mapping = {category: idx for idx, category in enumerate(categories)}
                df[col] = df[col].map(mapping)
                encoding_maps[col] = mapping

        # 3. Clean Target Column
        # If target has nulls, drop those rows
        target_nulls = int(df[target_column].isnull().sum())
        if target_nulls > 0:
            df = df.dropna(subset=[target_column])
            
        # Target encoding if it's categorical
        target_mapping = None
        if not np.issubdtype(df[target_column].dtype, np.number):
            df[target_column] = df[target_column].astype(str)
            target_categories = sorted(df[target_column].unique())
            target_mapping = {cat: idx for idx, cat in enumerate(target_categories)}
            df[target_column] = df[target_column].map(target_mapping)
            encoding_maps[target_column] = target_mapping

        # Save to output path
        df.to_csv(output_path, index=False)
        
        clean_summary = {
            "initial_shape": list(initial_shape),
            "final_shape": list(df.shape),
            "dropped_columns": cols_to_drop,
            "imputations": imputations,
            "encoding_maps": encoding_maps,
            "target_nulls_dropped": target_nulls
        }
        
        return df, clean_summary
