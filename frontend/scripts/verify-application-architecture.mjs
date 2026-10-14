import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import { verifyApplicationArchitecture } from "./application-architecture-policy.mjs";

const applicationRoot = resolve(import.meta.dirname, "..");

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(path)));
    } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(await sourceFile(path));
    }
  }

  return files;
}

async function sourceFile(path) {
  return {
    destinationPath: relative(applicationRoot, path).replaceAll("\\", "/"),
    source: await readFile(path, "utf8"),
  };
}

const applicationFiles = [
  ...(await sourceFiles(resolve(applicationRoot, "src"))),
  ...(await sourceFiles(resolve(applicationRoot, "tests"))),
  ...(await sourceFiles(resolve(applicationRoot, "mocks"))),
  await sourceFile(resolve(applicationRoot, "vite.config.ts")),
];

verifyApplicationArchitecture(applicationFiles);
console.log("Verified application architecture policy");
