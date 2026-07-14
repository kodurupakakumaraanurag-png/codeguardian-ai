"use client";

import React from "react";
import { ShieldAlert, Bell, User } from "lucide-react";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export const Navbar: React.FC = () => {
  // Check if Clerk publishable key exists
  const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 glass-panel border-t-0 border-x-0">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/20 animate-pulse-slow">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-lg text-slate-100 tracking-wide">
            CodeGuardian <span className="text-indigo-400">AI</span>
          </span>
          <span className="ml-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
            v1.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Mock Notification bell */}
        <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-800 transition-all">
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-indigo-500 rounded-full" />
          <Bell className="h-4 w-4" />
        </button>

        {/* Clerk Auth / Mock Auth */}
        <div className="flex items-center border-l border-slate-800 pl-4 h-6">
          {isClerkConfigured ? (
            <>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-xs text-white rounded-md transition-all">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300">
              <div className="h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                D
              </div>
              <span className="text-xs font-medium">Developer Account</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
