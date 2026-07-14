"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ReferenceLine,
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

interface ShapWaterfallChartProps {
  shapForces: Record<string, number>;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({
  shapForces
}) => {
  // Convert SHAP forces to array and sort by absolute magnitude
  const chartData = Object.entries(shapForces)
    .map(([name, val]) => ({
      name,
      val: parseFloat(val.toFixed(5)),
      absVal: Math.abs(val)
    }))
    .sort((a, b) => b.absVal - a.absVal)
    .slice(0, 10); // Show top 10 contributing factors

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
        No explanation data available.
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            stroke="#64748b" 
            fontSize={11}
            tickLine={false}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#64748b" 
            fontSize={11}
            tickLine={false}
            width={80}
          />
          <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
          <Tooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const value = payload[0].value as number;
                return (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-xs font-semibold text-slate-400">Metric</p>
                    <p className="text-sm font-bold text-slate-200">{payload[0].payload.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">SHAP Impact:</span>
                      <span className={`text-xs font-bold ${value >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {value >= 0 ? "+" : ""}{value}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {value >= 0 
                        ? "Pushed code defect risk higher" 
                        : "Pushed code defect risk lower"}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="val">
            {chartData.map((entry, index) => {
              const isPositive = entry.val >= 0;
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isPositive ? "url(#roseShap)" : "url(#emeraldShap)"}
                />
              );
            })}
          </Bar>
          {/* Gradient profiles */}
          <defs>
            <linearGradient id="roseShap" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#fda4af" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="emeraldShap" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
