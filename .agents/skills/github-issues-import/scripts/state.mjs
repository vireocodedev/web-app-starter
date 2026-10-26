import * as fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

const fail = (message) => {
  throw new Error(message);
};
const hash = (value) => createHash("sha256").update(value).digest("hex");

async function directory(target, create) {
  const absolute = path.resolve(target);
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep)) {
    if (!part) continue;
    current = path.join(current, part);
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if (error.code !== "ENOENT" || !create) throw error;
      await fs.mkdir(current, { mode: 0o700 });
      stat = await fs.lstat(current);
    }
    if (!stat.isDirectory() || stat.isSymbolicLink())
      fail("Import state directory must use real directories.");
  }
  return absolute;
}

async function safeRead(file) {
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (
      !stat.isFile() ||
      stat.nlink !== 1 ||
      (stat.mode & 0o077) !== 0 ||
      stat.size > 16 * 1024 * 1024
    )
      fail("Import state must be a private, bounded regular file.");
    const contents = await handle.readFile("utf8");
    try {
      return JSON.parse(contents);
    } catch {
      fail(
        "Import checkpoint JSON is malformed; preserve the private file and reconcile it.",
      );
    }
  } finally {
    await handle.close();
  }
}

export function stateLocation(base, repository, packageId) {
  if (!/^[0-9a-f-]{36}$/i.test(packageId))
    fail("Invalid package identity for import state.");
  return path.join(
    base,
    hash(repository.toLowerCase()).slice(0, 24),
    `${packageId}.json`,
  );
}

export async function withState(base, repository, packageId, action) {
  const statePath = stateLocation(base, repository, packageId);
  await directory(path.dirname(statePath), true);
  await fs.chmod(base, 0o700);
  await fs.chmod(path.dirname(statePath), 0o700);
  const lockPath = `${statePath}.lock`;
  let lock;
  try {
    lock = await fs.open(
      lockPath,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        constants.O_NOFOLLOW,
      0o600,
    );
  } catch (error) {
    if (error.code === "EEXIST")
      fail(
        "Import is locked; inspect active writers before recovering a stale lock.",
      );
    throw error;
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid }));
    await lock.sync();
    let state;
    try {
      state = await safeRead(statePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const write = async (next) => {
      // Existing symbolic links/hardlinks are rejected even though rename itself is atomic.
      try {
        const stat = await fs.lstat(statePath);
        if (
          !stat.isFile() ||
          stat.isSymbolicLink() ||
          stat.nlink !== 1 ||
          (stat.mode & 0o077) !== 0
        )
          fail("Unsafe import state file.");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const temporary = `${statePath}.${randomUUID()}.tmp`;
      const handle = await fs.open(
        temporary,
        constants.O_CREAT |
          constants.O_EXCL |
          constants.O_WRONLY |
          constants.O_NOFOLLOW,
        0o600,
      );
      try {
        await handle.writeFile(`${JSON.stringify(next, null, 2)}\n`);
        await handle.sync();
      } finally {
        await handle.close();
      }
      try {
        await fs.rename(temporary, statePath);
      } finally {
        await fs.rm(temporary, { force: true });
      }
      const dir = await fs.open(path.dirname(statePath), constants.O_RDONLY);
      try {
        await dir.sync();
      } finally {
        await dir.close();
      }
    };
    return await action({ state, write, statePath });
  } finally {
    await lock.close();
    await fs.unlink(lockPath);
  }
}
