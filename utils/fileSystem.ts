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

export const openFile = async (): Promise<unknown> => {
  try {
    const blob = await fileOpen({
      mimeTypes: ["application/json"],
    });

    if (blob.handle) {
      window.handle = blob.handle;
      const file = await blob.handle.getFile();
      const contents = await file.text();
      return JSON.parse(contents);
    }

    return undefined;
  } catch (error) {
    console.error("Error opening file:", error);
    throw error;
  }
};
