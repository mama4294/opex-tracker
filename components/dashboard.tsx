"use client";

import { ExpensesTable } from "./expenses-table";
import Header from "./Header";

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* <SummaryCards /> */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* <CostChart /> */}
            {/* <ConsumptionChart /> */}
          </div>
          {/* <UnitCostChart /> */}
          <ExpensesTable />
        </div>
      </main>
    </div>
  );
}
