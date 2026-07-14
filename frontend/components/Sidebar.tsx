"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UploadCloud, 
  LineChart, 
  Cpu, 
  Database,
  FileCode2
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      desc: "Overview & stats"
    },
    {
      name: "Upload Dataset",
      path: "/upload",
      icon: UploadCloud,
      desc: "Auto clean & profile"
    },
    {
      name: "ML Analytics",
      path: "/analytics",
      icon: LineChart,
      desc: "Train & inspect metrics"
    },
    {
      name: "Run Prediction",
      path: "/predict",
      icon: Cpu,
      desc: "Local metrics evaluation"
    }
  ];

  return (
    <aside className="w-64 glass-panel border-y-0 border-l-0 min-h-[calc(100vh-73px)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="px-3">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Navigation Menu
          </p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 border border-transparent",
                  isActive
                    ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"
                )} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {item.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center gap-2.5">
        <FileCode2 className="h-5 w-5 text-indigo-400" />
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-slate-300 truncate">Software Metrics Engine</p>
          <p className="text-[9px] text-slate-500">FastAPI + Scikit-Learn</p>
        </div>
      </div>
    </aside>
  );
};
