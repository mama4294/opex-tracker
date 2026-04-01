"use client";

import type { ChangeEvent } from "react";
import { FilePlus, FolderOpen, Menu, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="">
            <Button variant={"outline"}>
              <Menu className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={resetState}>
              {" "}
              <FilePlus className="size-5 mr-2" />
              New Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={loadState}>
              <FolderOpen className="size-5 mr-2" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSave("save")}>
              <Save className="size-5 mr-2" />
              Save
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSave("saveAs")}>
              {" "}
              <Save className="size-5 mr-2" />
              Save As
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Input
        type="text"
        className="text-xl font-semibold border-none"
        value={projectTitle}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          updateProjectTitle(e.target.value)
        }
      />
      <Button
        variant="outline"
        size="sm"
        className="ml-auto gap-1.5 text-sm"
        onClick={() => handleSave("save")}
      >
        <Save className="size-3.5" />
        Save
      </Button>
    </header>
  );
}
