"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { 
  Database, 
  HelpCircle, 
  Table, 
  CheckCircle, 
  ChevronRight, 
  Loader2 
} from "lucide-react";
import { api, Dataset } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";

export default function UploadPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  // Step state: 'uploading' | 'configuring' | 'success'
  const [step, setStep] = useState<"uploading" | "configuring" | "success">("uploading");
  const [isProfiling, setIsProfiling] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  
  // File profiling metrics
  const [tempPath, setTempPath] = useState("");
  const [fileName, setFileName] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [colCount, setColCount] = useState(0);
  const [columns, setColumns] = useState<any[]>([]);

  // Configure params
  const [datasetName, setDatasetName] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [savedDataset, setSavedDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProfiling(true);
    setError(null);
    try {
      const tokenFetcher = async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      };

      const result = await api.uploadAndProfile(file, tokenFetcher);
      setTempPath(result.temp_file_path);
      setFileName(result.filename);
      setDatasetName(result.filename.replace(".csv", ""));
      setRowCount(result.row_count);
      setColCount(result.col_count);
      setColumns(result.columns);
      
      // Auto-suggest a target if it matches typical defect/bug naming rules
      const suggestedTarget = result.columns.find((col: any) => {
        const name = col.name.toLowerCase();
        return name === "defect" || name === "defects" || name === "bug" || name === "bugs" || name === "quality" || name === "class";
      })?.name || result.columns[result.columns.length - 1]?.name || "";
      
      setTargetColumn(suggestedTarget);
      setStep("configuring");
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV layout.");
    } finally {
      setIsProfiling(false);
    }
  };

  const handleCleanAndSave = async () => {
    if (!targetColumn) {
      setError("Please designate a target column for predictions.");
      return;
    }
    
    setIsCleaning(true);
    setError(null);
    
    try {
      const tokenFetcher = async () => {
        try {
          return await getToken();
        } catch {
          return null;
        }
      };

      const result = await api.cleanAndSave(
        tempPath,
        datasetName,
        targetColumn,
        tokenFetcher
      );
      setSavedDataset(result);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Cleaning pipeline operation failed.");
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-[1200px]">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Dataset Importer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload raw software quality telemetry files. The engine automatically handles missing values, categorical encoding, and prepares attributes for machine learning.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span className={step === "uploading" ? "text-indigo-400 font-bold" : ""}>1. Upload File</span>
        <ChevronRight className="h-4 w-4" />
        <span className={step === "configuring" ? "text-indigo-400 font-bold" : ""}>2. Profile & Target</span>
        <ChevronRight className="h-4 w-4" />
        <span className={step === "success" ? "text-indigo-400 font-bold" : ""}>3. Ready</span>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {step === "uploading" && (
        <Card className="flex flex-col items-center justify-center py-12">
          {isProfiling ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
              <p className="text-sm font-medium animate-pulse">Analyzing CSV data types and distributions...</p>
            </div>
          ) : (
            <div className="w-full max-w-xl space-y-4">
              <Dropzone onFileSelect={handleFileSelect} />
              <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                Upload files containing code complexity metrics (e.g. LOC, Cyclomatic Complexity, Halstead Difficulty).
              </div>
            </div>
          )}
        </Card>
      )}

      {step === "configuring" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form setup */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="space-y-5">
              <h2 className="text-lg font-bold text-slate-200">Profiling Settings</h2>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  Target / Label Column
                  <span className="text-[10px] text-indigo-400 normal-case font-medium">Predicted Field</span>
                </label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select Target...</option>
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleCleanAndSave} 
                  isLoading={isCleaning}
                  className="w-full"
                >
                  Run Cleaning Pipeline
                </Button>
              </div>
            </Card>
            
            <Card className="bg-slate-900/30 text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-400">Automatic Cleaning Rules:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Numeric columns with missing data are filled with the median.</li>
                <li>Categorical rows with missing data are filled with the mode.</li>
                <li>Non-numerical metrics are converted using ordinal mapping values.</li>
                <li>Target column missing values cause the row to be discarded.</li>
              </ul>
            </Card>
          </div>

          {/* Dataset structure review */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Table className="h-5 w-5 text-indigo-400" /> Structure Summary
                </h2>
                <div className="flex gap-4 font-mono text-xs text-slate-400">
                  <span>Rows: <b className="text-slate-200">{rowCount}</b></span>
                  <span>Features: <b className="text-slate-200">{colCount}</b></span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[450px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-800">
                      <th className="pb-3">Column Metric</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Unique Vals</th>
                      <th className="pb-3">Nulls</th>
                      <th className="pb-3">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {columns.map((col) => (
                      <tr 
                        key={col.name} 
                        className={`hover:bg-slate-850/50 transition-colors ${
                          col.name === targetColumn ? "bg-indigo-500/5 text-indigo-300" : ""
                        }`}
                      >
                        <td className="py-2.5 font-semibold font-mono">
                          {col.name} {col.name === targetColumn && "★"}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase font-mono ${
                            col.type === "numeric" 
                              ? "bg-blue-500/10 text-blue-400" 
                              : "bg-purple-500/10 text-purple-400"
                          }`}>
                            {col.type}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono">{col.unique_count}</td>
                        <td className={`py-2.5 font-mono ${col.null_count > 0 ? "text-amber-400" : "text-slate-500"}`}>
                          {col.null_count}
                        </td>
                        <td className="py-2.5 font-mono text-slate-400 truncate max-w-[200px]">
                          {JSON.stringify(col.sample_values)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === "success" && (
        <Card className="flex flex-col items-center justify-center text-center py-12 space-y-6">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full animate-bounce">
            <CheckCircle className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-200">Dataset Cleaned & Saved!</h2>
            <p className="text-sm text-slate-400 max-w-md">
              The dataset <b>{savedDataset?.name}</b> was cleaned successfully. Empty fields were resolved and label encoders are stored.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setStep("uploading")}>
              Upload Another File
            </Button>
            <Button onClick={() => router.push("/analytics")}>
              Proceed to Model Training
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
