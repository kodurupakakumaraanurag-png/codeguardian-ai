"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

interface FeatureImportanceChartProps {
  importanceData: Record<string, number>;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  importanceData
}) => {
  // Convert Record<string, number> to array and sort it
  const chartData = Object.entries(importanceData)
    .map(([name, score]) => ({
      name,
      score: parseFloat(score.toFixed(4))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Display top 10 features

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
        No feature importance data available.
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
          <Tooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-xs font-semibold text-slate-400">Feature</p>
                    <p className="text-sm font-bold text-slate-200">{payload[0].payload.name}</p>
                    <p className="text-xs font-semibold text-indigo-400 mt-1">
                      Importance: {payload[0].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#indigoGradient)`} 
              />
            ))}
          </Bar>
          {/* Define gradient fills */}
          <defs>
            <linearGradient id="indigoGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4338ca" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.9} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
