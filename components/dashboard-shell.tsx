"use client";

import type { ReactNode } from "react";

import Header from "@/components/Header";
import ExpenseDrawer from "@/components/expense-drawer";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <Header />
      <div className="flex min-h-0 flex-1">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
      <ExpenseDrawer showTrigger={false} />
    </div>
  );
}
