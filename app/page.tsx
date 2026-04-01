"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import type { UtilityType } from "@/types/utility";

export default function Home() {
  const utilityEntries = useStore((state) => state.utilityEntries);
  const addUtilityEntry = useStore((state) => state.addUtilityEntry);
  const updateUtilityEntry = useStore((state) => state.updateUtilityEntry);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dateStart: "",
    dateEnd: "",
    utility: "electricity" as UtilityType,
    usage: "",
    usageUnit: "kWh",
    costItemName: "",
    costItemTotal: "",
  });

  const resetForm = () => {
    setFormData({
      dateStart: "",
      dateEnd: "",
      utility: "electricity",
      usage: "",
      usageUnit: "kWh",
      costItemName: "",
      costItemTotal: "",
    });
    setEditingEntryId(null);
  };

  const openAddDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (entryId: string) => {
    const entry = utilityEntries.find((item) => item.id === entryId);
    if (!entry) return;

    setEditingEntryId(entry.id);
    setFormData({
      dateStart: entry.dateStart,
      dateEnd: entry.dateEnd,
      utility: entry.utility,
      usage: String(entry.usage),
      usageUnit: entry.usageUnit,
      costItemName: entry.costItems[0]?.name ?? "",
      costItemTotal: String(entry.costItems[0]?.totalCost ?? ""),
    });
    setIsDrawerOpen(true);
  };

  const onSubmitEntry = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const entryId = editingEntryId ?? String(utilityEntries.length + 1);

    const usage = Number(formData.usage);
    const totalCost = Number(formData.costItemTotal);

    const entry = {
      id: entryId,
      dateStart: formData.dateStart,
      dateEnd: formData.dateEnd,
      utility: formData.utility,
      usage: Number.isNaN(usage) ? 0 : usage,
      usageUnit: formData.usageUnit,
      costItems:
        formData.costItemName.trim() && !Number.isNaN(totalCost)
          ? [
              {
                id: `${entryId}-1`,
                name: formData.costItemName,
                category: "fixed",
                totalCost,
              },
            ]
          : [],
    };

    if (editingEntryId) {
      updateUtilityEntry(entry);
    } else {
      addUtilityEntry(entry);
    }

    resetForm();
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto mt-6 w-full max-w-3xl rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Utility Entries</h1>
          <Button variant="default" onClick={openAddDrawer}>
            Add Entry
          </Button>
        </div>

        <div className="space-y-4">
          {utilityEntries.map((entry) => (
            <article
              key={entry.id}
              className="cursor-pointer rounded-lg border border-border bg-background p-4 hover:bg-muted/50"
              onClick={() => openEditDrawer(entry.id)}
            >
              <p className="font-medium">
                {entry.utility} ({entry.dateStart} - {entry.dateEnd})
              </p>
              <p className="text-sm text-muted-foreground">
                Usage: {entry.usage.toLocaleString()} {entry.usageUnit}
              </p>
              <p className="text-sm text-muted-foreground">
                Cost Items: {entry.costItems.length}
              </p>
            </article>
          ))}
        </div>
      </main>

      {isDrawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close drawer overlay"
            className="fixed inset-0 bg-black/30"
            onClick={() => {
              setIsDrawerOpen(false);
              resetForm();
            }}
          />
          <aside className="fixed top-0 right-0 z-20 h-full w-full max-w-md border-l bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingEntryId ? "Edit Utility Entry" : "Add Utility Entry"}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDrawerOpen(false);
                  resetForm();
                }}
              >
                Close
              </Button>
            </div>

            <form className="space-y-3" onSubmit={onSubmitEntry}>
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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
              <Input
                type="text"
                placeholder="Cost item name (optional)"
                value={formData.costItemName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    costItemName: e.target.value,
                  }))
                }
              />
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Cost total (optional)"
                value={formData.costItemTotal}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    costItemTotal: e.target.value,
                  }))
                }
              />
              <Button type="submit" className="w-full">
                {editingEntryId ? "Save Changes" : "Add Utility Entry"}
              </Button>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
