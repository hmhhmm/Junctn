"use client";

import { StoreProvider } from "@/lib/store";
import { Topbar } from "./Topbar";
import { Toaster } from "./Toaster";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <Toaster />
    </StoreProvider>
  );
}
