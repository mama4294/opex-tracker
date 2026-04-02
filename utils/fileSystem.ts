import { fileOpen, fileSave } from "browser-fs-access";

declare global {
  interface Window {
    handle: FileSystemFileHandle | undefined;
  }
}

export const saveToFile = async (
  state: unknown,
  fileName: string,
  handle?: FileSystemFileHandle
) => {
  const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
  const result = await fileSave(blob, { fileName }, handle);
  window.handle = result ?? undefined;
};

export const openFile = async (): Promise<unknown | undefined> => {
  try {
    const file = await fileOpen({
      mimeTypes: ["application/json"],
      extensions: [".json"],
    });

    // File System Access API attaches `handle`; legacy <input type="file"> does not.
    if (file.handle) {
      window.handle = file.handle;
    } else {
      window.handle = undefined;
    }

    const contents = await file.text();
    return JSON.parse(contents);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return undefined;
    }
    console.error("Error opening file:", error);
    throw error;
  }
};
