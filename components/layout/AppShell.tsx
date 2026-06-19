"use client";

import { StoreProvider } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "./Toaster";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <Toaster />
    </StoreProvider>
  );
}
