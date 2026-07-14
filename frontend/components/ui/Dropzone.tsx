import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  accept = ".csv",
  maxSizeMB = 50,
  className
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith(accept)) {
      setError(`Only ${accept} files are allowed.`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds limit of ${maxSizeMB}MB.`);
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const triggerInput = () => {
    inputRef.current?.click();
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={triggerInput}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
        dragActive 
          ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5" 
          : "border-slate-700 bg-slate-900/30 hover:border-indigo-500/50 hover:bg-slate-900/40",
        selectedFile && "border-indigo-500/50 bg-indigo-500/5",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />
      
      {selectedFile ? (
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400 border border-indigo-500/20">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">{selectedFile.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={clearFile}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full border border-slate-700 mt-2 transition-all"
          >
            <X className="h-3.5 w-3.5" />
            Remove File
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-4 bg-slate-800/50 rounded-full text-slate-400 border border-slate-700">
            <UploadCloud className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop software dataset file here, or <span className="text-indigo-400">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Supports CSV metrics file up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <p className="absolute bottom-3 text-xs text-rose-400 font-medium animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
};
