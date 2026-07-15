"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Use user's publishable key, or fallback to a valid dummy key format to prevent useAuth() context crash
  const publishableKey = 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
    "pk_test_dGVzdC1jbGVyay1tdW5nby0xMi5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}
