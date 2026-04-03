"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "./ui/input";
import {
  CostItem,
  CostItemFormRow,
  DEFAULT_UTILITY_TYPE_DEFINITIONS,
  defaultUsageUnitFor,
  type UtilityEntry,
} from "@/types/utility";
import { cn, formatMoney } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Field, FieldLabel } from "./ui/field";

function parseLocalDateString(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d || Number.isNaN(y + m + d)) return undefined;
  return new Date(y, m - 1, d);
}

function toDateString(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

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

/** Strip currency/grouping; parse for storage. */
function parseCostInputToNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

/** Blurred display: currency + grouped amount (matches expenses table). */
function formatCostInputDisplay(stored: string): string {
  const t = stored.trim();
  if (t === "") return "";
  const n = parseCostInputToNumber(t);
  if (n === null) return stored;
  return `$${formatMoney(n)}`;
}

type ExpenseDrawerProps = {
  /** When false, only the drawer is rendered (mount trigger elsewhere, e.g. CardAction). */
  showTrigger?: boolean;
};

export default function ExpenseDrawer({ showTrigger = true }: ExpenseDrawerProps) {
  const utilityEntries = useStore((state) => state.utilityEntries);
  const utilityTypeDefinitions = useStore((state) => state.utilityTypeDefinitions);
  const addUtilityEntry = useStore((state) => state.addUtilityEntry);
  const updateUtilityEntry = useStore((state) => state.updateUtilityEntry);
  const removeUtilityEntry = useStore((state) => state.removeUtilityEntry);
  const expenseDrawerNonce = useStore((state) => state.expenseDrawerNonce);
  const clearExpenseDrawerIntent = useStore(
    (state) => state.clearExpenseDrawerIntent,
  );

  const sortedUtilityTypes = useMemo(
    () =>
      [...utilityTypeDefinitions].sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
      ),
    [utilityTypeDefinitions],
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  /** While set, that row's total cost shows raw text for editing; otherwise formatted. */
  const [focusedTotalCostRowId, setFocusedTotalCostRowId] = useState<
    string | null
  >(null);
  const [formData, setFormData] = useState(() => {
    const d = DEFAULT_UTILITY_TYPE_DEFINITIONS[0];
    return {
      dateStart: "",
      dateEnd: "",
      description: "",
      utility: d?.id ?? "",
      usage: "",
      usageUnit: d?.defaultUsageUnit ?? "units",
      costItems: [emptyCostRow()] as CostItemFormRow[],
    };
  });

  const resetForm = useCallback(() => {
    setFocusedTotalCostRowId(null);
    const defs = useStore.getState().utilityTypeDefinitions;
    const first = defs[0];
    setFormData({
      dateStart: "",
      dateEnd: "",
      description: "",
      utility: first?.id ?? "",
      usage: "",
      usageUnit: first
        ? defaultUsageUnitFor(defs, first.id)
        : "units",
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
        description: entry.description ?? "",
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
    setFocusedTotalCostRowId((id) => (id === rowId ? null : id));
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

  const handleDeleteRecord = () => {
    if (!editingEntryId) return;
    removeUtilityEntry(editingEntryId);
    resetForm();
    setIsDrawerOpen(false);
  };

  const dateRange: DateRange | undefined = useMemo(() => {
    const from = parseLocalDateString(formData.dateStart);
    const to = parseLocalDateString(formData.dateEnd);
    if (!from) return undefined;
    return { from, to: to ?? from };
  }, [formData.dateStart, formData.dateEnd]);

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      setFormData((prev) => ({ ...prev, dateStart: "", dateEnd: "" }));
      return;
    }
    const start = toDateString(range.from);
    const end = range.to ? toDateString(range.to) : start;
    setFormData((prev) => ({
      ...prev,
      dateStart: start,
      dateEnd: end,
    }));
  };

  const onSubmitEntry = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.dateStart.trim() || !formData.dateEnd.trim()) {
      return;
    }
    const defs = useStore.getState().utilityTypeDefinitions;
    if (defs.length === 0 || !formData.utility.trim()) {
      return;
    }
    const entryId = editingEntryId ?? String(utilityEntries.length + 1);

    const usage = Number(formData.usage);
    const costItems = rowsToCostItems(formData.costItems, entryId);

    const desc = formData.description.trim();

    if (editingEntryId) {
      const existing = utilityEntries.find((e) => e.id === editingEntryId);
      if (!existing) return;
      const next: UtilityEntry = {
        ...existing,
        id: entryId,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd,
        utility: formData.utility,
        usage: Number.isNaN(usage) ? 0 : usage,
        usageUnit: formData.usageUnit,
        costItems,
      };
      if (desc !== "") next.description = desc;
      else delete next.description;
      updateUtilityEntry(next);
    } else {
      const entry: UtilityEntry = {
        id: entryId,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd,
        utility: formData.utility,
        usage: Number.isNaN(usage) ? 0 : usage,
        usageUnit: formData.usageUnit,
        costItems,
      };
      if (desc !== "") entry.description = desc;
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
    <>
      {showTrigger ? (
        <Button type="button" variant="default" onClick={openAddDrawer}>
          Add expense
        </Button>
      ) : null}

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
                {editingEntryId ? "Edit Expense" : "Add Utility Entry"}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {editingEntryId
                  ? "Update description, dates, usage, and cost line items for this entry."
                  : "Enter description, dates, usage, and one or more cost line items."}
              </DrawerDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {editingEntryId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDeleteRecord}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              ) : null}
              <DrawerClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Close
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <form
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
            onSubmit={onSubmitEntry}
          >
            <Field className="w-full">
              <FieldLabel htmlFor="utility">Utility</FieldLabel>

              <select
                id="utility"
                value={formData.utility}
                disabled={sortedUtilityTypes.length === 0}
                onChange={(e) => {
                  const utilityId = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    utility: utilityId,
                    usageUnit: defaultUsageUnitFor(
                      useStore.getState().utilityTypeDefinitions,
                      utilityId,
                    ),
                  }));
                }}
                className={selectClassName}
              >
                {sortedUtilityTypes.length === 0 ? (
                  <option value="">Add a utility type in Settings</option>
                ) : null}
                {sortedUtilityTypes.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.label}
                  </option>
                ))}
                {formData.utility &&
                !sortedUtilityTypes.some((d) => d.id === formData.utility) ? (
                  <option value={formData.utility}>
                    {formData.utility} (removed type — pick a new one)
                  </option>
                ) : null}
              </select>
            </Field>
            <Field className="w-full">
              <FieldLabel htmlFor="date-picker-range">
                Billing period
              </FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    id="date-picker-range"
                    className="h-9 w-full justify-start gap-2 px-3 font-normal"
                  >
                    <CalendarIcon className="size-4 shrink-0" />
                    {dateRange?.from ? (
                      dateRange.to &&
                      dateRange.to.getTime() !== dateRange.from.getTime() ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} –{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        Select start and end date
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleRangeSelect}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <Field className="w-full">
              <FieldLabel htmlFor="entry-description">Description</FieldLabel>
              <textarea
                id="entry-description"
                rows={3}
                placeholder="Optional note (account, building, variance, etc.)"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className={cn(
                  "flex min-h-[4.5rem] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
            </Field>

            <Field className="w-full">
              <FieldLabel htmlFor="usage">Usage</FieldLabel>
              <div
                className={cn(
                  "flex h-9 w-full min-w-0 overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
                  "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
                )}
              >
                <Input
                  id="usage"
                  required
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.usage}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, usage: e.target.value }))
                  }
                  aria-describedby="usage-unit-suffix"
                  className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <span
                  id="usage-unit-suffix"
                  className="flex shrink-0 items-center border-l border-input bg-muted/40 px-3 text-sm tabular-nums text-muted-foreground"
                >
                  {formData.usageUnit}
                </span>
              </div>
            </Field>

            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Costs</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={addCostRow}
                >
                  <Plus className="size-3.5" />
                  Add
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
                      placeholder="Description"
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
                      <option value="variable">Variable</option>
                      <option value="fixed">Fixed</option>
                      <option value="taxes">Taxes</option>
                    </select>

                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="$0.00"
                      autoComplete="off"
                      className="tabular-nums"
                      value={
                        focusedTotalCostRowId === row.id
                          ? row.totalCost
                          : formatCostInputDisplay(row.totalCost)
                      }
                      onFocus={() => setFocusedTotalCostRowId(row.id)}
                      onBlur={(e) => {
                        setFocusedTotalCostRowId(null);
                        const n = parseCostInputToNumber(e.target.value);
                        if (e.target.value.trim() === "") {
                          updateCostRow(row.id, { totalCost: "" });
                          return;
                        }
                        if (n === null) {
                          updateCostRow(row.id, {
                            totalCost: e.target.value.replace(/[$,\s]/g, "").trim(),
                          });
                          return;
                        }
                        updateCostRow(row.id, { totalCost: String(n) });
                      }}
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
                {editingEntryId ? "Save Changes" : "Save"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
