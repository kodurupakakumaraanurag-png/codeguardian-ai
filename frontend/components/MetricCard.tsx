import React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className
}) => {
  return (
    <Card hoverable className={cn("flex flex-col justify-between min-h-[120px]", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100 tracking-tight">{value}</h3>
        </div>
        <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 text-indigo-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {(description || trend) && (
        <div className="flex items-center justify-between mt-3 text-xs">
          {description && <span className="text-slate-500 truncate mr-2">{description}</span>}
          {trend && (
            <span
              className={cn(
                "font-semibold px-2 py-0.5 rounded-full border text-[10px] ml-auto shrink-0",
                trend.isPositive
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
