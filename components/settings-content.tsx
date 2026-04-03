"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { UTILITY_BADGE_COLOR_PRESETS } from "@/types/utility";

export function SettingsContent() {
  const projectTitle = useStore((s) => s.projectTitle);
  const updateProjectTitle = useStore((s) => s.updateProjectTitle);
  const utilityTypeDefinitions = useStore((s) => s.utilityTypeDefinitions);
  const addUtilityTypeDefinition = useStore((s) => s.addUtilityTypeDefinition);
  const updateUtilityTypeDefinition = useStore(
    (s) => s.updateUtilityTypeDefinition,
  );
  const removeUtilityTypeDefinition = useStore(
    (s) => s.removeUtilityTypeDefinition,
  );
  const utilityTypeEntryCount = useStore((s) => s.utilityTypeEntryCount);

  const [newLabel, setNewLabel] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const handleAddType = () => {
    if (!newLabel.trim() || !newUnit.trim()) {
      toast.error("Enter a display name and default usage unit.");
      return;
    }
    addUtilityTypeDefinition({
      label: newLabel,
      defaultUsageUnit: newUnit,
    });
    setNewLabel("");
    setNewUnit("");
    toast.success("Utility type added");
  };

  const handleRemove = (id: string) => {
    const n = utilityTypeEntryCount(id);
    if (n > 0) {
      toast.error(
        `Cannot remove "${id}": ${n} expense record(s) still use this type.`,
      );
      return;
    }
    if (utilityTypeDefinitions.length <= 1) {
      toast.error("Keep at least one utility type.");
      return;
    }
    const ok = removeUtilityTypeDefinition(id);
    if (ok) toast.success("Utility type removed");
    else toast.error("Could not remove this type.");
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Project preferences and defaults.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project</CardTitle>
          <CardDescription>
            Used as the default file name when you save (e.g.{" "}
            <span className="font-mono text-xs">your-title.json</span>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="settings-project-title">
              Project title
            </FieldLabel>
            <Input
              id="settings-project-title"
              type="text"
              value={projectTitle}
              onChange={(e) => updateProjectTitle(e.target.value)}
              placeholder="opex-tracker"
              className="max-w-md"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense types</CardTitle>
          <CardDescription>
            Names, default usage units, and table badge colors. The internal ID
            is set when you add a type (from the name) and is stored in your
            project file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Current types
            </p>
            <ul className="space-y-3">
              {utilityTypeDefinitions.map((def) => {
                const inUse = utilityTypeEntryCount(def.id) > 0;
                const onlyOne = utilityTypeDefinitions.length <= 1;
                return (
                  <li
                    key={def.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                      <Field className="min-w-0 flex-1">
                        <FieldLabel htmlFor={`ut-label-${def.id}`}>
                          Name
                        </FieldLabel>
                        <Input
                          id={`ut-label-${def.id}`}
                          value={def.label}
                          onChange={(e) =>
                            updateUtilityTypeDefinition(def.id, {
                              label: e.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field className="w-full sm:w-36">
                        <FieldLabel htmlFor={`ut-unit-${def.id}`}>
                          Unit
                        </FieldLabel>
                        <Input
                          id={`ut-unit-${def.id}`}
                          value={def.defaultUsageUnit}
                          onChange={(e) =>
                            updateUtilityTypeDefinition(def.id, {
                              defaultUsageUnit: e.target.value,
                            })
                          }
                        />
                      </Field>
                      <div className="flex shrink-0 items-center gap-2 sm:pb-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={onlyOne || inUse}
                          title={
                            onlyOne
                              ? "Keep at least one type"
                              : inUse
                                ? "Remove expenses using this type first"
                                : "Remove type"
                          }
                          onClick={() => handleRemove(def.id)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Remove {def.label}</span>
                        </Button>
                      </div>
                    </div>
                    <Field>
                      <FieldLabel id={`ut-color-label-${def.id}`}>
                        Table badge color
                      </FieldLabel>
                      <div
                        className="mt-1.5 flex flex-wrap gap-2"
                        role="group"
                        aria-labelledby={`ut-color-label-${def.id}`}
                      >
                        {UTILITY_BADGE_COLOR_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            title={p.label}
                            aria-label={`${p.label} color`}
                            aria-pressed={def.badgeColor === p.id}
                            onClick={() =>
                              updateUtilityTypeDefinition(def.id, {
                                badgeColor: p.id,
                              })
                            }
                            className={cn(
                              "size-8 shrink-0 rounded-full border-2 border-transparent shadow-sm transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              p.swatchClass,
                              def.badgeColor === p.id &&
                                "ring-2 ring-ring ring-offset-2 ring-offset-background",
                            )}
                          />
                        ))}
                      </div>
                    </Field>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Add type
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field className="min-w-0 flex-1">
                <FieldLabel htmlFor="new-utility-label">
                  Display name
                </FieldLabel>
                <Input
                  id="new-utility-label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Steam"
                />
              </Field>
              <Field className="w-full sm:w-36">
                <FieldLabel htmlFor="new-utility-unit">Default unit</FieldLabel>
                <Input
                  id="new-utility-unit"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="e.g. Mlb"
                />
              </Field>
              <Button
                type="button"
                className="shrink-0 gap-1.5"
                onClick={handleAddType}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Toggle light or dark mode anytime.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Press{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
            D
          </kbd>{" "}
          when not typing in a field to switch theme.
        </CardContent>
      </Card>
    </div>
  );
}
