"use client";

import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { formatMoney } from "@/lib/utils";

export function OverviewContent() {
  const utilityEntries = useStore((s) => s.utilityEntries);

  const totalSpend = utilityEntries.reduce(
    (sum, entry) =>
      sum +
      entry.costItems.reduce((line, item) => line + item.totalCost, 0),
    0,
  );

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Summary of your factory operating expense project.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense records</CardTitle>
            <CardDescription>Entries in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {utilityEntries.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total recorded cost</CardTitle>
            <CardDescription>Sum of all line items</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              ${formatMoney(totalSpend)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next steps</CardTitle>
          <CardDescription>
            Add or review utility bills and line-item costs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2">
            <Link href="/expenses">
              <Receipt className="size-4" aria-hidden />
              Go to expenses
              <ArrowRight className="size-4 opacity-70" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
