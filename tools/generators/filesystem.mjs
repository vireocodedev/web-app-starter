import { createHash, randomUUID } from "node:crypto";
import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  readdir,
  rename,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export async function exists(file) {
  try {
    return await lstat(file);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function safePath(root, relative, { directory = false } = {}) {
  if (typeof relative !== "string" || !relative || relative.includes("\\") || relative.includes(":"))
    throw new Error(`Unsafe output path: ${relative}`);
  const parts = relative.split("/");
  if (parts.some(part => !part || part === "." || part === "..") || path.isAbsolute(relative))
    throw new Error(`Unsafe output path: ${relative}`);
  const canonicalRoot = await realpath(root);
  let current = canonicalRoot;
  for (let i = 0; i < parts.length; i++) {
    if ((await exists(current))?.isDirectory()) {
      const alias = (await readdir(current)).find(
        name => name.toLowerCase() === parts[i].toLowerCase() && name !== parts[i],
      );
      if (alias) throw new Error(`Case-insensitive path conflict: ${relative}`);
    }
    current = path.join(current, parts[i]);
    const stat = await exists(current);
    if (stat?.isSymbolicLink()) throw new Error(`Refusing symlink in output path: ${relative}`);
    if (stat && i < parts.length - 1 && !stat.isDirectory())
      throw new Error(`Output ancestor is not a directory: ${relative}`);
    if (stat && i === parts.length - 1 && !(directory ? stat.isDirectory() : stat.isFile()))
      throw new Error(`Output path is not a ${directory ? "directory" : "regular file"}: ${relative}`);
  }
  return current;
}

export const digest = value => createHash("sha256").update(value).digest("hex");

export async function validatePlan(root, files) {
  const seen = new Set();
  for (const file of files) {
    const folded = file.path.toLowerCase();
    if (seen.has(folded)) throw new Error(`Duplicate output path (case-insensitive): ${file.path}`);
    seen.add(folded);
    const destination = await safePath(root, file.path);
    const stat = await exists(destination);
    if (file.previous !== undefined) {
      if (!stat || (await readFile(destination, "utf8")) !== file.previous)
        throw new Error(
          `Managed index drift: ${file.path}. Preserve customizations and restore the documented index before generating.`,
        );
    } else if (stat) {
      throw new Error(`Existing file conflict: ${file.path}. No files written; choose another name or owner.`);
    }
    // Also refuse differently-cased peers on case-sensitive hosts, matching Windows/macOS behavior.
    const parent = path.dirname(destination);
    if (await exists(parent)) {
      const conflict = (await readdir(parent)).find(
        name => name.toLowerCase() === path.basename(destination).toLowerCase() && name !== path.basename(destination),
      );
      if (conflict) throw new Error(`Case-insensitive path conflict: ${file.path}`);
    }
  }
}

/** Failure cleanup touches only matching bytes and directories created by this call. */
export async function applyPlan(root, files, { beforeWrite = async () => {} } = {}) {
  const lockPath = await safePath(root, ".generator.lock");
  let lock;
  try {
    lock = await open(lockPath, "wx");
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        "Another generation owns .generator.lock. After an interrupted run, inspect running processes before removing its stale lock.",
      );
    throw error;
  }
  const created = [],
    updated = [],
    directories = [],
    staging = new Set();
  try {
    await validatePlan(root, files);
    for (const [index, file] of files.entries()) {
      const destination = await safePath(root, file.path);
      let parent = path.dirname(destination);
      const missing = [];
      while (!(await exists(parent))) {
        missing.push(parent);
        parent = path.dirname(parent);
      }
      for (const directory of missing.reverse()) {
        await mkdir(directory);
        directories.push(directory);
      }
      await beforeWrite(file, index);
      // Revalidate after directory creation and immediately before mutation.
      await safePath(root, file.path);
      const staged = path.join(
        path.dirname(destination),
        `.${path.basename(destination)}.generator-${randomUUID()}.tmp`,
      );
      staging.add(staged);
      await writeFile(staged, file.content, { flag: "wx" });
      if (file.previous === undefined) {
        // Publish fully written bytes without replacing a concurrently-created destination.
        await link(staged, destination);
        created.push({ destination, content: file.content });
      } else {
        if ((await readFile(destination, "utf8")) !== file.previous)
          throw new Error(`Managed index changed during generation: ${file.path}`);
        await rename(staged, destination);
        updated.push({ destination, content: file.content, previous: file.previous });
      }
      if (await exists(staged)) await unlink(staged);
      staging.delete(staged);
    }
  } catch (error) {
    for (const staged of staging) if (await exists(staged)) await unlink(staged);
    staging.clear();
    for (const file of updated.reverse()) {
      if ((await exists(file.destination))?.isFile() && (await readFile(file.destination, "utf8")) === file.content)
        await writeFile(file.destination, file.previous);
    }
    for (const file of created.reverse()) {
      if ((await exists(file.destination))?.isFile() && (await readFile(file.destination, "utf8")) === file.content)
        await unlink(file.destination);
    }
    for (const directory of directories.reverse()) {
      try {
        await rmdir(directory);
      } catch (cleanupError) {
        if (!["ENOENT", "ENOTEMPTY"].includes(cleanupError.code)) throw cleanupError;
      }
    }
    throw error;
  } finally {
    for (const staged of staging) if (await exists(staged)) await unlink(staged);
    await lock.close();
    await unlink(lockPath);
  }
}
