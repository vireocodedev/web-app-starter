import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const envFile = new URL("../.env", import.meta.url);
const template = await readFile(
  new URL("../.env.example", import.meta.url),
  "utf8",
);
const contents = template
  .replace(
    /^POSTGRES_PASSWORD=$/m,
    `POSTGRES_PASSWORD=${randomBytes(24).toString("hex")}`,
  )
  .replace(
    /^INITIAL_USER_PASSWORD=$/m,
    `INITIAL_USER_PASSWORD=${randomBytes(18).toString("hex")}`,
  );

try {
  await writeFile(envFile, contents, { flag: "wx", mode: 0o600 });
  console.log(
    "Created backend/.env with random local credentials. Read that file for the initial login password.",
  );
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Keeping the existing backend/.env unchanged.");
}
