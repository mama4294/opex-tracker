"use client";

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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import type { UtilityType } from "@/types/utility";
import { Trash2, Pencil } from "lucide-react";
import ExpenseDrawer from "./expense-drawer";

const badgeVariants: Record<
  UtilityType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  electricity: "default",
  water: "secondary",
  natural_gas: "outline",
  trash: "destructive",
};

export function ExpensesTable() {
  const utilityEntries = useStore((state) => state.utilityEntries);
  const requestExpenseDrawerEdit = useStore(
    (state) => state.requestExpenseDrawerEdit,
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDateRange = (start: string, end: string) =>
    `${formatDate(start)} - ${formatDate(end)}`;

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
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right"># Items</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {utilityEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No expenses recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                utilityEntries.map((entry) => {
                  const totalCost = entry.costItems.reduce(
                    (sum, item) => sum + item.totalCost,
                    0,
                  );

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {formatDateRange(entry.dateStart, entry.dateEnd)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={badgeVariants[entry.utility]}>
                          {entry.utility}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {entry.usage} {entry.usageUnit}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        ${totalCost.toFixed(2)}
                      </TableCell>

                      <TableCell className="text-right">
                        {entry.costItems.length}
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              requestExpenseDrawerEdit(entry.id);
                            }}
                            aria-label={`Edit entry ${entry.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => console.log("remove entry")}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
