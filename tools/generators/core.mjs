import { readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { exists, safePath, validatePlan } from "./filesystem.mjs";
import { naming, parseFields } from "./naming.mjs";
import { findGenerator } from "./registry.mjs";

export const translationDirectory = "frontend/src/app/localization/translations/generated";

export function renderTranslationIndex(ids) {
  const sorted = [...ids].sort();
  return `// Mechanical index. Application-owned locale files are never overwritten.\n${sorted.map((id, i) => `import { translations as en${i} } from "./${id}.en";\nimport { translations as hr${i} } from "./${id}.hr";`).join("\n")}\nexport const generatedEnglishTranslations = {${sorted.map((id, i) => `${JSON.stringify(id)}: en${i}`).join(",")}} as const;\nexport const generatedCroatianTranslations = {${sorted.map((id, i) => `${JSON.stringify(id)}: hr${i}`).join(",")}} as const;\n`;
}

async function formatter(root) {
  const prettierPath = path.join(root, "frontend/node_modules/prettier/index.mjs");
  if (!(await exists(prettierPath)))
    throw new Error(
      "Install the existing frontend dependencies with npm ci before generation (Prettier formats deterministic TypeScript output).",
    );
  const prettier = await import(pathToFileURL(prettierPath).href);
  const options = await prettier.resolveConfig(path.join(root, "frontend/package.json"));
  return async file =>
    /\.(?:tsx?|json|md)$/.test(file.path)
      ? {
          ...file,
          content: await prettier.format(file.content, {
            ...options,
            filepath: path.join(root, file.path),
          }),
        }
      : file;
}

async function sourceFiles(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isSymbolicLink())
      throw new Error(`Refusing symlinked source inventory: ${path.join(directory, item.name)}`);
    if (item.isDirectory()) files.push(...(await sourceFiles(path.join(directory, item.name))));
    else if (item.isFile()) files.push(path.join(directory, item.name));
  }
  return files;
}

async function backendContext(root, context, options) {
  const javaFiles = await sourceFiles(path.join(root, "backend/src/main/java"));
  const applications = [];
  for (const file of javaFiles.filter(file => file.endsWith("Application.java"))) {
    const source = await readFile(file, "utf8");
    if (source.includes("@SpringBootApplication"))
      applications.push(source.match(/^package ([a-zA-Z][\w.]*)\s*;/m)?.[1]);
  }
  if (applications.length !== 1 || !applications[0])
    throw new Error("Expected exactly one SpringBootApplication base package.");
  context.javaPackage = applications[0];
  const javaBase = `backend/src/main/java/${context.javaPackage.replaceAll(".", "/")}/${context.feature.java}`;
  if (["auth", "user", "http"].includes(context.feature.java))
    throw new Error("Choose a new business feature; auth, user and http are reserved application owners.");
  const requires =
    {
      repository: [`${context.name.pascal}.java`],
      service: [`${context.name.pascal}.java`, `${context.name.pascal}Repository.java`],
      controller: [`${context.name.pascal}Service.java`, `${context.name.pascal}Response.java`],
    }[options.kind] ?? [];
  for (const file of requires) {
    if (!(await exists(await safePath(root, `${javaBase}/${file}`))))
      throw new Error(
        `Missing prerequisite: ${javaBase}/${file}. Generate the domain/repository/service first or use backend feature.`,
      );
  }
  if (["domain", "feature"].includes(options.kind)) {
    if (!/^[1-9][0-9]{0,8}$/.test(options.migration ?? ""))
      throw new Error("--migration requires an explicit new positive Flyway integer version (at most 9 digits).");
    context.migrationVersion = Number(options.migration);
    const migrationRoot = await safePath(root, "backend/src/main/resources/db/migration", { directory: true });
    const versions = (await readdir(migrationRoot))
      .filter(file => /^V/.test(file))
      .map(file => {
        const match = /^V([0-9]+)(?:[._][0-9]+)*__[^/]+\.sql$/.exec(file);
        if (!match)
          throw new Error(`Unsupported Flyway version inventory: ${file}. Review migration ordering manually.`);
        return Number(match[1]);
      });
    if (versions.some(version => version >= context.migrationVersion))
      throw new Error(
        "--migration must be newer than every existing Flyway version; applied history is never regenerated.",
      );
  } else if (options.migration !== undefined)
    throw new Error("--migration is supported only for backend domain/feature.");
  const table = `${context.feature.java}_${context.name.kebab.replaceAll("-", "_")}`;
  if (table.length > 63)
    throw new Error("Generated PostgreSQL table identifier exceeds 63 characters; shorten the name/feature.");
  return context;
}

async function translationIndexPlan(root, translationId, format) {
  const directory = await safePath(root, `${translationDirectory}/index.ts`);
  const names = await readdir(path.dirname(directory));
  const ids = names.filter(name => name.endsWith(".en.ts")).map(name => name.slice(0, -6));
  for (const id of ids) {
    if (!/^[a-z][a-zA-Z0-9_]*$/.test(id) || !names.includes(`${id}.hr.ts`))
      throw new Error(`Unpaired/invalid generated locale: ${id}`);
  }
  if (names.filter(name => name.endsWith(".hr.ts")).length !== ids.length)
    throw new Error("Unpaired generated Croatian locale.");
  const previous = (
    await format({
      path: `${translationDirectory}/index.ts`,
      content: renderTranslationIndex(ids),
    })
  ).content;
  const next = await format({
    path: `${translationDirectory}/index.ts`,
    content: renderTranslationIndex([...ids, translationId]),
  });
  return { ...next, previous };
}

async function canonicalTranslationIndex(root, format) {
  const relative = `${translationDirectory}/index.ts`;
  const indexPath = await safePath(root, relative);
  const previous = await readFile(indexPath, "utf8");
  const previousIds = [...previous.matchAll(/from "\.\/([a-z][a-zA-Z0-9_]*)\.en";/g)].map(match => match[1]);
  const canonical = await format({
    path: relative,
    content: renderTranslationIndex(previousIds),
  });
  if (previous !== canonical.content)
    throw new Error(
      "Managed index drift: preserve customizations and restore the canonical translation index before maintenance.",
    );
  return { relative, indexPath, previous };
}

/** Validate mechanical bytes even when a receipt-owned removal interrupted a locale pair. */
export async function verifyTranslationIndex(root) {
  await canonicalTranslationIndex(root, await formatter(root));
}

/** Rebuild only reproducible locale imports after deliberately removing locale pairs. */
export async function createIndexPlan(root) {
  const format = await formatter(root);
  const { relative, indexPath, previous } = await canonicalTranslationIndex(root, format);
  const names = await readdir(path.dirname(indexPath));
  const ids = names.filter(name => name.endsWith(".en.ts")).map(name => name.slice(0, -6));
  if (
    ids.some(id => !/^[a-z][a-zA-Z0-9_]*$/.test(id) || !names.includes(`${id}.hr.ts`)) ||
    names.filter(name => name.endsWith(".hr.ts")).length !== ids.length
  )
    throw new Error("Generated locales must have paired, valid English/Croatian filenames.");
  const next = await format({
    path: relative,
    content: renderTranslationIndex(ids),
  });
  return next.content === previous ? [] : [{ ...next, previous }];
}

export async function createPlan(root, options) {
  root = await realpath(root);
  const generator = findGenerator(options.target, options.kind);
  const name = naming(options.name),
    feature = naming(options.feature ?? options.name);
  const variant = options.variant ?? generator.variants?.[0].value ?? "request";
  const rich =
    generator.target === "frontend" &&
    ((generator.kind === "form" && variant === "wizard") || (generator.kind === "feature" && variant === "workspace"));
  const fields = parseFields(options.fields, { rich });
  const allowedVariants =
    generator.variants?.map(item => item.value) ?? (generator.id === "backend/dto" ? ["request", "response"] : []);
  if (options.variant !== undefined && !allowedVariants.includes(variant))
    throw new Error(`Unsupported --variant for ${generator.id}. Supported: ${allowedVariants.join(", ") || "none"}.`);
  const recipe = generator.variants?.find(item => item.value === variant) ?? generator;
  if (recipe.acceptsFields === false && options.fields !== undefined)
    throw new Error(`${generator.id}${options.variant ? ` (${variant})` : ""} uses composition props, not --fields.`);
  if (
    generator.id === "frontend/form" &&
    variant === "collection" &&
    fields.some(field => ["localId", "serverId"].includes(field.name))
  )
    throw new Error(
      "The collection recipe reserves localId and serverId for child identity. Choose other field names.",
    );
  const context = {
    name,
    feature,
    fields,
    translationId: `${feature.camel}_${options.kind}_${name.camel}`,
    variant,
  };
  let files;
  if (generator.target === "frontend") {
    if (generator.visual && !rich && fields.some(field => field.type !== "string"))
      throw new Error(
        "This visual recipe supports text fields only. Rich fields are supported by form/wizard and feature/workspace.",
      );
    if (options.migration !== undefined) throw new Error("--migration is supported only for backend domain/feature.");
    const ownerPath = `frontend/src/features/${feature.kebab}`;
    if (await exists(await safePath(root, `${ownerPath}/index.ts`)))
      throw new Error(
        `Existing frontend feature owner: ${ownerPath}. Generators create a new public interface; adapt existing owners through their interface.`,
      );
    if (options.kind === "api") {
      const { renderApi } = await import("./templates/api.mjs");
      files = renderApi(context);
    } else {
      const { renderFrontend } = await import("./templates/frontend.mjs");
      files = renderFrontend(options.kind, context);
    }
  } else {
    await backendContext(root, context, options);
    const { renderBackend } = await import("./templates/backend.mjs");
    files = renderBackend(options.kind, context);
  }
  const format = await formatter(root);
  const formatted = [];
  for (const file of files) formatted.push(await format(file));
  if (generator.visual) formatted.push(await translationIndexPlan(root, context.translationId, format));
  await validatePlan(root, formatted);
  return { generator: generator.id, context, files: formatted };
}
