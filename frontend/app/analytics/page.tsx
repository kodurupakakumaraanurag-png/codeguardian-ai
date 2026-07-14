"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Play, 
  BarChart4, 
  Binary, 
  LineChart,
  HelpCircle,
  TrendingUp,
  Cpu,
  RefreshCw,
  Loader2
} from "lucide-react";
import { api, Dataset, Model } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FeatureImportanceChart } from "@/components/FeatureImportanceChart";

export default function AnalyticsPage() {
  const { getToken } = useAuth();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [modelName, setModelName] = useState("");
  const [activeModel, setActiveModel] = useState<Model | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenFetcher = async () => {
    try {
      return await getToken();
    } catch {
      return null;
    }
  };

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [datasetList, modelList] = await Promise.all([
        api.listDatasets(tokenFetcher),
        api.listModels(tokenFetcher)
      ]);
      setDatasets(datasetList);
      setModels(modelList);
      
      if (datasetList.length > 0) {
        setSelectedDatasetId(datasetList[0].id);
        setModelName(`${datasetList[0].name.replace(".csv", "")}_Predictor`);
      }
      if (modelList.length > 0) {
        setActiveModel(modelList[0]);
      }
    } catch (err) {
      console.error("Failed to load datasets/models, loading offline mock fallbacks", err);
      // Load fallbacks
      const mockDataset = { id: "1", name: "NASA_PC1_SoftwareMetrics.csv", row_count: 1109, col_count: 22, columns: [], target_column: "defects", created_at: "2026-07-14" };
      setDatasets([mockDataset]);
      setSelectedDatasetId("1");
      setModelName("NASA_PC1_SoftwareMetrics_Predictor");
      
      const mockModel = {
        id: "101",
        dataset_id: "1",
        name: "PC1_DefectPredictor_XGBoost",
        algorithm: "xgboost",
        metrics: { accuracy: 0.892, precision: 0.842, recall: 0.811, f1: 0.826, roc_auc: 0.912 },
        feature_importance: { loc: 0.35, v_g: 0.22, ev_g: 0.15, iv_g: 0.11, l: 0.08, d: 0.05, e: 0.04 },
        shap_summary: { feature_names: [], shap_values: [], test_data: [] },
        created_at: "2026-07-14T10:30:00Z"
      };
      setModels([mockModel]);
      setActiveModel(mockModel);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [getToken]);

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDatasetId(id);
    const ds = datasets.find(d => d.id === id);
    if (ds) {
      setModelName(`${ds.name.replace(".csv", "")}_Predictor`);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedDatasetId || !modelName) {
      setError("Please select a dataset and input a model name.");
      return;
    }
    
    setIsTraining(true);
    setError(null);
    try {
      const trainedModel = await api.trainModel(
        selectedDatasetId, 
        modelName, 
        tokenFetcher
      );
      
      setModels(prev => [trainedModel, ...prev]);
      setActiveModel(trainedModel);
      setModelName("");
    } catch (err: any) {
      setError(err.message || "Model training pipeline encountered an error.");
    } finally {
      setIsTraining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">Loading models and diagnostics analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">ML Analytics Studio</h1>
          <p className="text-sm text-slate-400 mt-1">
            Train XGBoost and Random Forest, compare metrics, check global feature significance, and inspect SHAP attributes.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData} className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Studio
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Training settings & model selector */}
        <div className="lg:col-span-1 space-y-6">
          {/* Model trainer card */}
          <Card className="space-y-5">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Play className="h-5 w-5 text-indigo-400" /> Train Quality Predictor
            </h2>

            {datasets.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No datasets available. Please upload a dataset first.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Select Target Dataset
                  </label>
                  <select
                    value={selectedDatasetId}
                    onChange={handleDatasetChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.row_count} rows)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Name this Model
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. XGBoost_Version_1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleTrainModel}
                    isLoading={isTraining}
                    className="w-full"
                    disabled={isTraining}
                  >
                    Start Training Job
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Active Model Selector */}
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Binary className="h-5 w-5 text-indigo-400" /> Trained Models
            </h2>
            
            {models.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No models trained yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setActiveModel(model)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all flex justify-between items-center ${
                      activeModel?.id === model.id
                        ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300 font-semibold"
                        : "border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold truncate">{model.name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5 capitalize">Alg: {model.algorithm}</p>
                    </div>
                    <span className="font-mono bg-slate-850 px-2 py-0.5 rounded border border-slate-750 text-[10px] shrink-0">
                      F1: {(model.metrics.f1 || 0).toFixed(3)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column (Col-span-2): Active Model Diagnostics, Metrics & Feature Importance */}
        <div className="lg:col-span-2 space-y-6">
          {activeModel ? (
            <div className="space-y-6">
              {/* Performance Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(activeModel.metrics).map(([metricKey, metricValue]) => (
                  <Card key={metricKey} className="py-4 px-5 text-center flex flex-col justify-center min-h-[90px]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {metricKey.replace("_", " ")}
                    </span>
                    <span className="text-xl font-extrabold text-indigo-400 font-mono mt-1">
                      {metricValue.toFixed(4)}
                    </span>
                  </Card>
                ))}
              </div>

              {/* Feature Importance Panel */}
              <Card className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <BarChart4 className="h-5 w-5 text-indigo-400" /> Relative Feature Importance
                  </h2>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" /> Showing top features impacting quality predictions
                  </div>
                </div>

                <FeatureImportanceChart importanceData={activeModel.feature_importance} />
              </Card>

              {/* Model attributes metadata summary */}
              <Card className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300">Model Credentials</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-400 bg-slate-950/40 p-4 rounded-lg border border-slate-850">
                  <div>
                    <span className="text-slate-500">Model UUID:</span> {activeModel.id}
                  </div>
                  <div>
                    <span className="text-slate-500">Trained On:</span> {new Date(activeModel.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-slate-500">Algorithm:</span> {activeModel.algorithm === "xgboost" ? "XGBoost Classifier (Grad Boosted)" : "Random Forest Classifier (Bagging)"}
                  </div>
                  <div>
                    <span className="text-slate-500">Total Features:</span> {Object.keys(activeModel.feature_importance).length} variables
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="h-96 flex flex-col items-center justify-center text-center gap-3 text-slate-500 py-12">
              <LineChart className="h-12 w-12 text-slate-600 animate-pulse" />
              <div>
                <p className="text-base font-bold text-slate-400">No Active Model Selected</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Please select an existing model from the trained models list on the left, or input options to train a new model.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
