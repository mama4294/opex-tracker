"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Input } from "./ui/input";
import { CostItem, CostItemFormRow, UtilityType } from "@/types/utility";
import { useStore } from "@/store/useStore";
import { Plus, Trash2 } from "lucide-react";

function emptyCostRow(rowId = "row-0"): CostItemFormRow {
  return {
    id: rowId,
    name: "",
    category: "fixed",
    rate: "",
    quantity: "",
    totalCost: "",
  };
}

function newRowId() {
  return `row-${crypto.randomUUID()}`;
}

function costItemToRow(item: CostItem): CostItemFormRow {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    rate: item.rate != null ? String(item.rate) : "",
    quantity: item.quantity != null ? String(item.quantity) : "",
    totalCost: String(item.totalCost),
  };
}

export default function ExpenseDrawer() {
  const utilityEntries = useStore((state) => state.utilityEntries);
  const addUtilityEntry = useStore((state) => state.addUtilityEntry);
  const updateUtilityEntry = useStore((state) => state.updateUtilityEntry);
  const expenseDrawerNonce = useStore((state) => state.expenseDrawerNonce);
  const clearExpenseDrawerIntent = useStore(
    (state) => state.clearExpenseDrawerIntent,
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dateStart: "",
    dateEnd: "",
    utility: "electricity" as UtilityType,
    usage: "",
    usageUnit: "kWh",
    costItems: [emptyCostRow()] as CostItemFormRow[],
  });

  const resetForm = useCallback(() => {
    setFormData({
      dateStart: "",
      dateEnd: "",
      utility: "electricity",
      usage: "",
      usageUnit: "kWh",
      costItems: [emptyCostRow()],
    });
    setEditingEntryId(null);
  }, []);

  const openEditDrawer = useCallback(
    (entryId: string) => {
      const entry = utilityEntries.find((item) => item.id === entryId);
      if (!entry) return;

      setEditingEntryId(entry.id);
      setFormData({
        dateStart: entry.dateStart,
        dateEnd: entry.dateEnd,
        utility: entry.utility,
        usage: String(entry.usage),
        usageUnit: entry.usageUnit,
        costItems:
          entry.costItems.length > 0
            ? entry.costItems.map(costItemToRow)
            : [emptyCostRow("row-0")],
      });
      setIsDrawerOpen(true);
    },
    [utilityEntries],
  );

  const openAddDrawer = useCallback(() => {
    resetForm();
    setIsDrawerOpen(true);
  }, [resetForm]);

  useEffect(() => {
    if (expenseDrawerNonce === 0) return;
    const intent = useStore.getState().expenseDrawerIntent;
    if (!intent) return;
    const timeoutId = window.setTimeout(() => {
      if (intent.mode === "add") {
        resetForm();
        setIsDrawerOpen(true);
      } else {
        openEditDrawer(intent.entryId);
      }
      clearExpenseDrawerIntent();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [expenseDrawerNonce, resetForm, openEditDrawer, clearExpenseDrawerIntent]);

  const removeCostRow = (rowId: string) => {
    setFormData((prev) => {
      if (prev.costItems.length <= 1) {
        return { ...prev, costItems: [emptyCostRow()] };
      }
      return {
        ...prev,
        costItems: prev.costItems.filter((row) => row.id !== rowId),
      };
    });
  };

  const updateCostRow = (
    rowId: string,
    patch: Partial<Omit<CostItemFormRow, "id">>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      costItems: prev.costItems.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row,
      ),
    }));
  };

  const addCostRow = () => {
    setFormData((prev) => ({
      ...prev,
      costItems: [...prev.costItems, emptyCostRow(newRowId())],
    }));
  };

  const onSubmitEntry = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const entryId = editingEntryId ?? String(utilityEntries.length + 1);

    const usage = Number(formData.usage);
    const costItems = rowsToCostItems(formData.costItems, entryId);

    const entry = {
      id: entryId,
      dateStart: formData.dateStart,
      dateEnd: formData.dateEnd,
      utility: formData.utility,
      usage: Number.isNaN(usage) ? 0 : usage,
      usageUnit: formData.usageUnit,
      costItems,
    };

    if (editingEntryId) {
      updateUtilityEntry(entry);
    } else {
      addUtilityEntry(entry);
    }

    resetForm();
    setIsDrawerOpen(false);
  };

  function rowsToCostItems(
    rows: CostItemFormRow[],
    entryId: string,
  ): CostItem[] {
    return rows
      .filter(
        (row) =>
          row.name.trim() !== "" &&
          row.totalCost.trim() !== "" &&
          !Number.isNaN(Number(row.totalCost)),
      )
      .map((row, index) => {
        const rate = row.rate.trim() === "" ? undefined : Number(row.rate);
        const quantity =
          row.quantity.trim() === "" ? undefined : Number(row.quantity);
        return {
          id: row.id.startsWith("row-") ? `${entryId}-${index + 1}` : row.id,
          name: row.name.trim(),
          category: row.category || "fixed",
          ...(rate !== undefined && !Number.isNaN(rate) ? { rate } : {}),
          ...(quantity !== undefined && !Number.isNaN(quantity)
            ? { quantity }
            : {}),
          totalCost: Number(row.totalCost),
        };
      });
  }

  const selectClassName =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <div>
      <Button variant="default" onClick={openAddDrawer}>
        Add Expense
      </Button>

      <Drawer
        direction="right"
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) resetForm();
        }}
      >
        <DrawerContent className="h-full max-h-dvh max-w-md data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md">
          <DrawerHeader className="flex flex-row items-center justify-between gap-2 border-b border-border text-left">
            <div className="space-y-1">
              <DrawerTitle className="text-lg font-semibold">
                {editingEntryId ? "Edit Utility Entry" : "Add Utility Entry"}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {editingEntryId
                  ? "Update dates, usage, and cost line items for this entry."
                  : "Enter dates, usage, and one or more cost line items."}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button type="button" variant="outline" size="sm">
                Close
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <form
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
            onSubmit={onSubmitEntry}
          >
            <Input
              required
              type="date"
              value={formData.dateStart}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dateStart: e.target.value,
                }))
              }
            />
            <Input
              required
              type="date"
              value={formData.dateEnd}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dateEnd: e.target.value }))
              }
            />
            <select
              value={formData.utility}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  utility: e.target.value as UtilityType,
                }))
              }
              className={selectClassName}
            >
              <option value="electricity">electricity</option>
              <option value="water">water</option>
              <option value="natural_gas">natural_gas</option>
              <option value="trash">trash</option>
            </select>
            <Input
              required
              type="number"
              min="0"
              step="any"
              placeholder="Usage"
              value={formData.usage}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, usage: e.target.value }))
              }
            />
            <Input
              required
              type="text"
              placeholder="Usage unit (kWh, gal...)"
              value={formData.usageUnit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  usageUnit: e.target.value,
                }))
              }
            />

            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Cost items</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={addCostRow}
                >
                  <Plus className="size-3.5" />
                  Add line
                </Button>
              </div>

              <div className="space-y-4">
                {formData.costItems.map((row, rowIndex) => (
                  <div
                    key={row.id}
                    className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Line {rowIndex + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeCostRow(row.id)}
                        aria-label="Remove cost line"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Name"
                      value={row.name}
                      onChange={(e) =>
                        updateCostRow(row.id, { name: e.target.value })
                      }
                    />
                    <select
                      value={row.category}
                      onChange={(e) =>
                        updateCostRow(row.id, { category: e.target.value })
                      }
                      className={selectClassName}
                    >
                      <option value="usage">usage</option>
                      <option value="demand">demand</option>
                      <option value="fixed">fixed</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Rate (optional)"
                        value={row.rate}
                        onChange={(e) =>
                          updateCostRow(row.id, { rate: e.target.value })
                        }
                      />
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Quantity (optional)"
                        value={row.quantity}
                        onChange={(e) =>
                          updateCostRow(row.id, { quantity: e.target.value })
                        }
                      />
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Total cost"
                      value={row.totalCost}
                      onChange={(e) =>
                        updateCostRow(row.id, { totalCost: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <DrawerFooter className="mt-auto border-t border-border px-0 pt-4">
              <Button type="submit" className="w-full">
                {editingEntryId ? "Save Changes" : "Add Utility Entry"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
