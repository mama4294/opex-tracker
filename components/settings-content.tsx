"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";

export function SettingsContent() {
  const projectTitle = useStore((s) => s.projectTitle);
  const updateProjectTitle = useStore((s) => s.updateProjectTitle);

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
            <FieldLabel htmlFor="settings-project-title">Project title</FieldLabel>
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
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Toggle light or dark mode anytime.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">D</kbd>{" "}
          when not typing in a field to switch theme.
        </CardContent>
      </Card>
    </div>
  );
}
