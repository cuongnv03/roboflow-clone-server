import fs from "fs";
import path from "path";

/**
 * Ensures a directory exists, creating it and any parent directories if needed
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generates a unique filename with timestamp and random string
 */
export function generateUniqueFilename(originalName: string = ""): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);

  // Strip extension from original name if exists
  const baseName = path
    .basename(originalName.replace(/\.[^/.]+$/, ""))
    .replace(/[^a-z0-9]/gi, "-")
    .substring(0, 20);

  return `${baseName}-${timestamp}-${randomStr}`;
}
