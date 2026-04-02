"use client";

import {
  ChevronDown,
  Factory,
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Header() {
  const saveState = useStore((s) => s.saveState);
  const saveAsState = useStore((s) => s.saveAsState);
  const loadState = useStore((s) => s.loadState);
  const resetState = useStore((s) => s.resetState);

  const handleNew = () => {
    resetState();
    toast.success("New project");
  };

  const handleOpen = async () => {
    try {
      const loaded = await loadState();
      if (loaded) toast.success("Project opened");
    } catch {
      toast.error("Could not open file");
    }
  };

  const handleSave = async (kind: "save" | "saveAs") => {
    try {
      if (kind === "save") await saveState();
      else await saveAsState();
      toast.success(kind === "save" ? "Saved" : "Saved as");
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <header className="shrink-0 border-b border-border bg-card">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Factory Operations</h1>
              <p className="text-sm text-muted-foreground">Expense Dashboard</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                File
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onSelect={() => {
                  handleNew();
                }}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                New
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void handleOpen();
                }}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void handleSave("save");
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void handleSave("saveAs");
                }}
              >
                <SaveAll className="mr-2 h-4 w-4" />
                Save As
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
