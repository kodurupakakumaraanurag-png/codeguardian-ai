const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface Dataset {
  id: string;
  name: string;
  row_count: number;
  col_count: number;
  columns: Array<{
    name: string;
    type: string;
    raw_type: string;
    null_count: number;
    unique_count: number;
    sample_values: any[];
  }>;
  target_column: string;
  created_at: string;
}

export interface Model {
  id: string;
  dataset_id: string;
  name: string;
  algorithm: string;
  metrics: Record<string, number>;
  feature_importance: Record<string, number>;
  shap_summary: {
    feature_names: string[];
    shap_values: number[][];
    test_data: number[][];
  };
  created_at: string;
}

export interface Prediction {
  id: string;
  model_id: string;
  input_data: Record<string, number>;
  output_result: {
    prediction: number;
    probability?: number;
  };
  shap_values: Record<string, number>;
  created_at: string;
}

async function getHeaders(clerkTokenFetcher?: () => Promise<string | null>) {
  const headers: Record<string, string> = {};
  
  if (clerkTokenFetcher) {
    try {
      const token = await clerkTokenFetcher();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Failed to fetch Clerk JWT token:", e);
    }
  }
  
  return headers;
}

export const api = {
  // Datasets
  async uploadAndProfile(file: File, clerkTokenFetcher?: () => Promise<string | null>): Promise<any> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/datasets/upload-profile`, {
      method: "POST",
      headers: customHeaders,
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to profile CSV.");
    }
    return response.json();
  },

  async cleanAndSave(
    tempFilePath: string,
    name: string,
    targetColumn: string,
    clerkTokenFetcher?: () => Promise<string | null>
  ): Promise<Dataset> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const formData = new FormData();
    formData.append("temp_file_path", tempFilePath);
    formData.append("name", name);
    formData.append("target_column", targetColumn);

    const response = await fetch(`${API_BASE_URL}/datasets/clean-save`, {
      method: "POST",
      headers: customHeaders,
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to clean and save dataset.");
    }
    return response.json();
  },

  async listDatasets(clerkTokenFetcher?: () => Promise<string | null>): Promise<Dataset[]> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/datasets/`, {
      method: "GET",
      headers: { ...customHeaders, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch datasets.");
    return response.json();
  },

  async getDataset(id: string, clerkTokenFetcher?: () => Promise<string | null>): Promise<Dataset> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
      method: "GET",
      headers: { ...customHeaders, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Dataset not found.");
    return response.json();
  },

  async deleteDataset(id: string, clerkTokenFetcher?: () => Promise<string | null>): Promise<any> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
      method: "DELETE",
      headers: customHeaders,
    });
    if (!response.ok) throw new Error("Failed to delete dataset.");
    return response.json();
  },

  // Models
  async trainModel(
    datasetId: string,
    name: string,
    clerkTokenFetcher?: () => Promise<string | null>
  ): Promise<Model> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/models/train`, {
      method: "POST",
      headers: {
        ...customHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dataset_id: datasetId, name }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Model training failed.");
    }
    return response.json();
  },

  async listModels(clerkTokenFetcher?: () => Promise<string | null>): Promise<Model[]> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/models/`, {
      method: "GET",
      headers: { ...customHeaders, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to list models.");
    return response.json();
  },

  async getModel(id: string, clerkTokenFetcher?: () => Promise<string | null>): Promise<Model> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: "GET",
      headers: { ...customHeaders, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Model not found.");
    return response.json();
  },

  async deleteModel(id: string, clerkTokenFetcher?: () => Promise<string | null>): Promise<any> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: "DELETE",
      headers: customHeaders,
    });
    if (!response.ok) throw new Error("Failed to delete model.");
    return response.json();
  },

  // Predictions
  async predict(
    modelId: string,
    inputData: Record<string, number>,
    clerkTokenFetcher?: () => Promise<string | null>
  ): Promise<Prediction> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/predictions/predict`, {
      method: "POST",
      headers: {
        ...customHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model_id: modelId, input_data: inputData }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Prediction computation failed.");
    }
    return response.json();
  },

  async listPredictions(clerkTokenFetcher?: () => Promise<string | null>): Promise<Prediction[]> {
    const customHeaders = await getHeaders(clerkTokenFetcher);
    const response = await fetch(`${API_BASE_URL}/predictions/`, {
      method: "GET",
      headers: { ...customHeaders, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to list predictions.");
    return response.json();
  },

  // Download URL
  getReportUrl(predictionId: string): string {
    return `${API_BASE_URL}/predictions/${predictionId}/report`;
  }
};
