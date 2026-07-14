"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center animate-fade-in-up">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Access CodeGuardian AI</h1>
            <p className="text-xs text-slate-500 mt-1">Authenticate to log repository audits and review models</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-center border border-slate-800">
          {isClerkConfigured ? (
            <SignIn 
              routing="hash"
              appearance={{
                elements: {
                  card: "bg-transparent shadow-none border-0",
                  headerTitle: "text-slate-200",
                  headerSubtitle: "text-slate-400",
                  socialButtonsBlockButton: "bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-850",
                  formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
                  formFieldLabel: "text-slate-350 text-xs uppercase",
                  formFieldInput: "bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500",
                  footerActionText: "text-slate-450",
                  footerActionLink: "text-indigo-400 hover:text-indigo-300"
                }
              }}
            />
          ) : (
            <div className="text-center py-6 space-y-4">
              <p className="text-sm text-slate-400">
                Clerk authentication is currently in developer-bypass mode. No login required.
              </p>
              <Link 
                href="/dashboard"
                className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white rounded-lg transition-all"
              >
                Go directly to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
