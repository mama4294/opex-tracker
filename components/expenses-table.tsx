"use client";

import { Fragment, useState } from "react";
import {
  Card,
  CardAction,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { utilityBadgeClassForColorId, utilityLabelFor } from "@/types/utility";
import { ChevronRight, Pencil, Plus } from "lucide-react";
import { cn, formatDateRange, formatMoney } from "@/lib/utils";

const COL_COUNT = 8;

export function ExpensesTable() {
  const utilityEntries = useStore((state) => state.utilityEntries);
  const utilityTypeDefinitions = useStore((state) => state.utilityTypeDefinitions);
  const requestExpenseDrawerAdd = useStore(
    (state) => state.requestExpenseDrawerAdd,
  );
  const requestExpenseDrawerEdit = useStore(
    (state) => state.requestExpenseDrawerEdit,
  );

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const sortedEntries = [...utilityEntries].sort((a, b) =>
    b.dateStart.localeCompare(a.dateStart),
  );

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle>Expense records</CardTitle>
        <CardDescription>
          View and manage all recorded utility expenses
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            size="default"
            onClick={() => requestExpenseDrawerAdd()}
          >
            <Plus className="size-3.5" aria-hidden />
            Add expense
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="min-w-[140px] max-w-[240px]">
                  Period
                </TableHead>

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
                  const defIndex = utilityTypeDefinitions.findIndex(
                    (d) => d.id === entry.utility,
                  );
                  const def =
                    defIndex >= 0 ? utilityTypeDefinitions[defIndex] : undefined;
                  const badgeColorClass = utilityBadgeClassForColorId(
                    def?.badgeColor,
                    defIndex >= 0 ? defIndex : entry.utility.length,
                  );

                  const totalCost = entry.costItems.reduce(
                    (sum, item) => sum + item.totalCost,
                    0,
                  );
                  const unitCost =
                    entry.usage > 0 ? totalCost / entry.usage : null;
                  const isExpanded = expandedRows.has(entry.id);

                  const toggleExpanded = () => {
                    setExpandedRows((prev) => {
                      const next = new Set(prev);
                      if (next.has(entry.id)) next.delete(entry.id);
                      else next.add(entry.id);
                      return next;
                    });
                  };

                  return (
                    <Fragment key={entry.id}>
                      <TableRow className="group">
                        <TableCell className="w-[40px]">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            aria-expanded={isExpanded}
                            aria-controls={`line-items-${entry.id}`}
                            onClick={() => toggleExpanded()}
                          >
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isExpanded && "rotate-90",
                              )}
                            />
                            <span className="sr-only">Toggle line items</span>
                          </Button>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-transparent font-medium shadow-none",
                              badgeColorClass,
                            )}
                          >
                            {utilityLabelFor(
                              utilityTypeDefinitions,
                              entry.utility,
                            )}
                          </Badge>
                        </TableCell>

                        <TableCell className="min-w-[140px] max-w-[240px]">
                          {entry.description?.trim() ? (
                            <span
                              className="line-clamp-2 text-sm "
                              title={entry.description.trim()}
                            >
                              {entry.description.trim()}
                            </span>
                          ) : (
                            <span className="text-sm">—</span>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {formatDateRange(entry.dateStart, entry.dateEnd)}
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
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow
                          id={`line-items-${entry.id}`}
                          className="bg-muted/30 hover:bg-muted/30"
                        >
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
                      ) : null}
                    </Fragment>
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
