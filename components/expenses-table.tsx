"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import type { UtilityType } from "@/types/utility";
import { Trash2, Pencil, ChevronRight } from "lucide-react";
import ExpenseDrawer from "./expense-drawer";
import { cn, formatDateRange, formatMoney } from "@/lib/utils";

const badgeVariants: Record<
  UtilityType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  electricity: "default",
  water: "secondary",
  natural_gas: "outline",
  trash: "destructive",
};

const COL_COUNT = 7;

export function ExpensesTable() {
  const utilityEntries = useStore((state) => state.utilityEntries);
  const requestExpenseDrawerEdit = useStore(
    (state) => state.requestExpenseDrawerEdit,
  );
  const removeUtilityEntry = useStore((state) => state.removeUtilityEntry);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const sortedEntries = [...utilityEntries].sort((a, b) =>
    b.dateStart.localeCompare(a.dateStart),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Records</CardTitle>
        <CardDescription>
          View and manage all recorded utility expenses
        </CardDescription>
        <ExpenseDrawer />
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COL_COUNT}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No expenses recorded yet. Add your first expense to get
                    started.
                  </TableCell>
                </TableRow>
              ) : (
                sortedEntries.map((entry) => {
                  const totalCost = entry.costItems.reduce(
                    (sum, item) => sum + item.totalCost,
                    0,
                  );
                  const unitCost =
                    entry.usage > 0 ? totalCost / entry.usage : null;
                  const isExpanded = expandedRows.has(entry.id);

                  return (
                    <Collapsible
                      key={entry.id}
                      className="contents"
                      open={isExpanded}
                      onOpenChange={(open) => {
                        setExpandedRows((prev) => {
                          const next = new Set(prev);
                          if (open) next.add(entry.id);
                          else next.delete(entry.id);
                          return next;
                        });
                      }}
                    >
                      <TableRow className="group">
                        <TableCell className="w-[40px]">
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isExpanded && "rotate-90",
                                )}
                              />
                              <span className="sr-only">Toggle line items</span>
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {formatDateRange(entry.dateStart, entry.dateEnd)}
                        </TableCell>

                        <TableCell>
                          <Badge variant={badgeVariants[entry.utility]}>
                            {entry.utility}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {entry.usage.toLocaleString()} {entry.usageUnit}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          ${formatMoney(totalCost)}
                        </TableCell>

                        <TableCell className="text-right text-muted-foreground">
                          {unitCost != null ? (
                            <>
                              ${formatMoney(unitCost)}/{entry.usageUnit}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestExpenseDrawerEdit(entry.id);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit expense</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUtilityEntry(entry.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete expense</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={COL_COUNT} className="py-3">
                            <div className="pl-10">
                              {/* <p className="text-xs font-medium text-muted-foreground mb-2">
                                Line items
                              </p> */}
                              <div className="space-y-1">
                                {entry.costItems.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-1 px-3">
                                    No cost line items for this entry.
                                  </p>
                                ) : (
                                  entry.costItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between gap-4 text-sm py-1 px-3 rounded"
                                    >
                                      <span className="min-w-0">
                                        <span className="font-medium">
                                          {item.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs ml-2">
                                          ({item.category})
                                        </span>
                                      </span>
                                      <span className="font-medium shrink-0">
                                        ${formatMoney(item.totalCost)}
                                      </span>
                                    </div>
                                  ))
                                )}
                                <div className="flex items-center justify-between text-sm py-1 px-3 font-medium border-t border-border mt-2 pt-2">
                                  <span>Total</span>
                                  <span>${formatMoney(totalCost)}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
