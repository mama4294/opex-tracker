"use client";

import type { ChangeEvent } from "react";
import { FilePlus, FolderOpen, Menu, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";

export default function Header() {
  const { saveState, saveAsState, loadState, resetState } = useStore();
  const projectTitle = useStore((state) => state.projectTitle);
  const updateProjectTitle = useStore((state) => state.updateProjectTitle);

  const handleSave = async (type: "save" | "saveAs") => {
    try {
      if (type === "save") {
        await saveState();
      } else {
        await saveAsState();
      }
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
      <details className="relative">
        <summary className="list-none">
          <Button type="button" variant="outline" size="icon">
            <Menu className="size-4" />
          </Button>
        </summary>
        <div className="absolute left-0 mt-2 w-44 rounded-md border bg-background p-1 shadow-md">
          <button
            type="button"
            onClick={resetState}
            className="flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-muted"
          >
            <FilePlus className="mr-2 size-4" />
            New Project
          </button>
          <button
            type="button"
            onClick={() => void loadState()}
            className="flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-muted"
          >
            <FolderOpen className="mr-2 size-4" />
            Open
          </button>
          <button
            type="button"
            onClick={() => void handleSave("save")}
            className="flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-muted"
          >
            <Save className="mr-2 size-4" />
            Save
          </button>
          <button
            type="button"
            onClick={() => void handleSave("saveAs")}
            className="flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-muted"
          >
            <Save className="mr-2 size-4" />
            Save As
          </button>
        </div>
      </details>

      <Input
        type="text"
        className="h-9 flex-1 text-lg font-semibold"
        value={projectTitle}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          updateProjectTitle(e.target.value)
        }
      />

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => void handleSave("save")}
      >
        <Save className="size-3.5" />
        Save
      </Button>
    </header>
  );
}
