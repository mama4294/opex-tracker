"use client";

import { Fragment, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { utilityBadgeClassForColorId, utilityLabelFor } from "@/types/utility";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Copy,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import {
  cn,
  formatDateRange,
  formatExpensePeriodLabel,
  formatMoney,
} from "@/lib/utils";

const COL_COUNT = 8;

type SortKey = "date" | "type";

function SortHeaderIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) {
    return <ArrowUpDown className="size-3 shrink-0 opacity-45" aria-hidden />;
  }
  return direction === "asc" ? (
    <ArrowUp className="size-3 shrink-0" aria-hidden />
  ) : (
    <ArrowDown className="size-3 shrink-0" aria-hidden />
  );
}

export function ExpensesTable() {
  const utilityEntries = useStore((state) => state.utilityEntries);
  const utilityTypeDefinitions = useStore((state) => state.utilityTypeDefinitions);
  const requestExpenseDrawerAdd = useStore(
    (state) => state.requestExpenseDrawerAdd,
  );
  const requestExpenseDrawerEdit = useStore(
    (state) => state.requestExpenseDrawerEdit,
  );
  const requestExpenseDrawerDuplicate = useStore(
    (state) => state.requestExpenseDrawerDuplicate,
  );

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const onSortClick = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = utilityEntries;
    if (q) {
      list = utilityEntries.filter((entry) => {
        const typeLabel = utilityLabelFor(
          utilityTypeDefinitions,
          entry.utility,
        ).toLowerCase();
        const desc = (entry.description?.trim() ?? "").toLowerCase();
        return typeLabel.includes(q) || desc.includes(q);
      });
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = a.dateStart.localeCompare(b.dateStart);
        if (cmp === 0) cmp = a.id.localeCompare(b.id);
      } else {
        const la = utilityLabelFor(
          utilityTypeDefinitions,
          a.utility,
        ).toLowerCase();
        const lb = utilityLabelFor(
          utilityTypeDefinitions,
          b.utility,
        ).toLowerCase();
        cmp = la.localeCompare(lb);
        if (cmp === 0) cmp = a.dateStart.localeCompare(b.dateStart);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [utilityEntries, utilityTypeDefinitions, searchQuery, sortKey, sortDir]);

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

      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search type or description…"
            className="ps-9"
            aria-label="Search expenses by type or description"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead
                  aria-sort={
                    sortKey === "type"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => onSortClick("type")}
                    className={cn(
                      "-ms-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-left text-xs font-medium hover:bg-muted/80",
                      sortKey === "type" ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    Type
                    <SortHeaderIcon
                      active={sortKey === "type"}
                      direction={sortDir}
                    />
                  </button>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead
                  className="min-w-[140px] max-w-[240px]"
                  aria-sort={
                    sortKey === "date"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => onSortClick("date")}
                    className={cn(
                      "-ms-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-left text-xs font-medium hover:bg-muted/80",
                      sortKey === "date" ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    Period
                    <SortHeaderIcon
                      active={sortKey === "date"}
                      direction={sortDir}
                    />
                  </button>
                </TableHead>

                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {utilityEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COL_COUNT}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No expenses recorded yet. Add your first expense to get
                    started.
                  </TableCell>
                </TableRow>
              ) : filteredAndSorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COL_COUNT}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No expenses match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSorted.map((entry) => {
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

                        <TableCell
                          className="whitespace-nowrap"
                          title={formatDateRange(
                            entry.dateStart,
                            entry.dateEnd,
                          )}
                        >
                          {formatExpensePeriodLabel(
                            entry.dateStart,
                            entry.dateEnd,
                          )}
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
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestExpenseDrawerDuplicate(entry.id);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Duplicate expense</span>
                            </Button>
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
                          </div>
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
