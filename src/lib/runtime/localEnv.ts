import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const WRITE_OPERATIONS_ENV_KEY = "ENABLE_WRITE_OPERATIONS";

export function canMutateLocalServerFlags(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function isEnvFlagEnabled(key: string): boolean {
  return process.env[key] === "true";
}

export async function setLocalEnvFlag(key: string, enabled: boolean): Promise<void> {
  if (!canMutateLocalServerFlags()) {
    throw new Error("Server flags can only be changed from local development.");
  }

  const envFilePath = path.join(process.cwd(), ".env.local");
  let content = "";

  try {
    content = await readFile(envFilePath, "utf-8");
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const nextContent = upsertEnvEntry(content, key, enabled ? "true" : "false", newline);

  if (nextContent !== content) {
    await writeFile(envFilePath, nextContent, "utf-8");
  }

  process.env[key] = enabled ? "true" : "false";
}

function upsertEnvEntry(content: string, key: string, value: string, newline: string): string {
  const entry = `${key}=${value}`;
  const pattern = new RegExp(`^${escapeRegExp(key)}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, entry);
  }

  if (content.length === 0) {
    return `${entry}${newline}`;
  }

  const separator = content.endsWith("\n") || content.endsWith("\r") ? "" : newline;
  return `${content}${separator}${entry}${newline}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}