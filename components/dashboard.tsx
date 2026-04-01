"use client";

// import { ExpensesProvider } from "@/lib/expenses-context";
// import { SummaryCards } from "@/components/summary-cards";
// import { CostChart } from "@/components/cost-chart";
// import { ConsumptionChart } from "@/components/consumption-chart";
// import { UnitCostChart } from "@/components/unit-cost-chart";
// import { ExpensesTable } from "@/components/expenses-table";
// import { AddExpenseForm } from "@/components/add-expense-form";
import {
  Factory,
  ChevronDown,
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ExpensesTable } from "./expenses-table";
import ExpenseDrawer from "./expense-drawer";

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Factory Operations</h1>
                <p className="text-sm text-muted-foreground">
                  Expense Dashboard
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  File
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <FilePlus className="mr-2 h-4 w-4" />
                  New
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SaveAll className="mr-2 h-4 w-4" />
                  Save As
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ExpenseDrawer />
        </div>
      </header>
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
