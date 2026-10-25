import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { createIndexPlan, createPlan, renderTranslationIndex, translationDirectory } from "../core.mjs";
import { applyPlan, safePath } from "../filesystem.mjs";
import { naming, parseFields } from "../naming.mjs";
import { assessCompatibility } from "../policy.mjs";
import { generators } from "../registry.mjs";
import { parseArguments } from "../cli.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const cli = path.join(root, "tools/generators/cli.mjs");
const execute = promisify(execFile);

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "starter-generator-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const put = async (file, content) => {
    const destination = path.join(directory, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  };
  await put("frontend/package.json", '{"type":"module"}\n');
  await put("frontend/.prettierrc.json", await readFile(path.join(root, "frontend/.prettierrc.json"), "utf8"));
  await symlink(path.join(root, "frontend/node_modules"), path.join(directory, "frontend/node_modules"), "dir");
  const prettier = await import(path.join(root, "frontend/node_modules/prettier/index.mjs"));
  const config = await prettier.resolveConfig(path.join(root, "frontend/package.json"));
  await put(
    `${translationDirectory}/index.ts`,
    await prettier.format(renderTranslationIndex([]), {
      ...config,
      parser: "typescript",
    }),
  );
  await put(
    "backend/src/main/java/example/app/ExampleApplication.java",
    "package example.app;\n@SpringBootApplication\nclass ExampleApplication {}\n",
  );
  await put("backend/src/main/resources/db/migration/V1__initial.sql", "-- Existing migration\n");
  await put("generator-policy.json", '{"compatibilityThreshold":80}\n');
  return { directory, put };
}

test("naming normalizes acronyms and rejects paths/reserved identifiers", () => {
  assert.deepEqual(naming("HTTPUserCard"), {
    pascal: "HttpUserCard",
    camel: "httpUserCard",
    kebab: "http-user-card",
    java: "httpusercard",
    title: "Http User Card",
  });
  assert.equal(naming("user-profile").pascal, "UserProfile");
  assert.equal(naming("user_profile").pascal, "UserProfile");
  for (const value of [
    "../User",
    "a/b",
    "a\\b",
    "a:b",
    "a--b",
    "",
    "1Thing",
    "class",
    "id",
    "De Fault",
    "CON",
    "C On",
    "LPT1",
    "Table",
    "Button",
    "String",
  ])
    assert.throws(() => naming(value));
  assert.deepEqual(
    parseFields("title,quantity:integer?,active:boolean").map(field => [field.name, field.type, field.required]),
    [
      ["title", "string", true],
      ["quantity", "integer", false],
      ["active", "boolean", true],
    ],
  );
  for (const fields of [
    "id",
    "name,name",
    "order",
    "bad-name",
    "age:number",
    "fooBar,fooBAR",
    "",
    "constructor",
    "toString",
    "getClass",
    "notifyAll",
  ])
    assert.throws(() => parseFields(fields), fields);
});

test("arguments reject unknown, duplicated and missing options", () => {
  for (const args of [["--force"], ["--fields"], ["--json", "--json"], ["--root", "--list"]])
    assert.throws(() => parseArguments(args));
  assert.equal(parseArguments(["frontend", "form", "User", "--dry-run"]).options["dry-run"], true);
});

test("compatibility uses weighted evidence and disqualifiers regardless of numeric score", () => {
  const assessment = Object.fromEntries(
    ["architecture", "conventions", "coverage", "workflow"].map(key => [
      key,
      { score: 80, evidence: `Inspected ${key} contract` },
    ]),
  );
  assessment.disqualifiers = [];
  assert.equal(assessCompatibility(assessment).mandatory, true);
  assert.equal(assessCompatibility(assessment, 81).mandatory, false);
  assert.equal(
    assessCompatibility({
      ...assessment,
      disqualifiers: ["Violates approved architecture"],
    }).mandatory,
    false,
  );
  assert.throws(() =>
    assessCompatibility({
      ...assessment,
      coverage: { score: 100, evidence: "" },
    }),
  );
  assert.throws(() => assessCompatibility(assessment, 101));
});

for (const generator of generators) {
  test(`${generator.id}: deterministic complete output, safe rerun, and preview contract`, async t => {
    const { directory } = await fixture(t);
    const options = {
      target: generator.target,
      kind: generator.kind,
      name: "InventoryItem",
      feature: "Inventory",
      fields: generator.acceptsFields === false ? undefined : "title,notes?",
      migration: ["domain", "feature"].includes(generator.kind) && generator.target === "backend" ? "2" : undefined,
    };
    if (generator.target === "backend" && ["repository", "service", "controller"].includes(generator.kind)) {
      const prerequisiteKinds = {
        repository: ["domain"],
        service: ["domain", "repository"],
        controller: ["domain", "repository", "service"],
      }[generator.kind];
      for (const kind of prerequisiteKinds) {
        const plan = await createPlan(directory, {
          ...options,
          kind,
          migration: kind === "domain" ? "2" : undefined,
        });
        await applyPlan(directory, plan.files);
      }
    }
    const first = await createPlan(directory, options),
      second = await createPlan(directory, options);
    assert.deepEqual(first, second);
    assert.equal(new Set(first.files.map(file => file.path)).size, first.files.length);
    assert.ok(first.files.every(file => file.content.endsWith("\n")));
    if (generator.visual) {
      const example = first.files.find(file =>
        file.path.endsWith(generator.kind === "navigation" ? ".routes.tsx" : ".example.tsx"),
      );
      assert.ok(example);
      assert.match(
        example.content,
        generator.kind === "navigation" ? /export function createRoutes/ : /export function Component/,
      );
      assert.match(example.content, /@\/features\/inventory|@\/pages\/inventory/);
      assert.ok(first.files.some(file => file.path.endsWith(`${first.context.translationId}.hr.ts`)));
    } else assert.ok(first.files.every(file => !file.path.endsWith(".example.tsx")));
    await applyPlan(directory, first.files);
    for (const file of first.files) assert.equal(await readFile(path.join(directory, file.path), "utf8"), file.content);
    await assert.rejects(
      () => createPlan(directory, options),
      /conflict|Existing frontend feature owner|newer than every/,
    );
  });
}

test("backend scalars and request/response variations preserve validation/nullability", async t => {
  const { directory } = await fixture(t);
  const request = await createPlan(directory, {
    target: "backend",
    kind: "dto",
    name: "Quote",
    fields: "title,amount:integer,accepted:boolean?,notes?",
  });
  assert.match(request.files[0].content, /@NotBlank @Size\(max = 120\) String title/);
  assert.match(request.files[0].content, /@NotNull Integer amount/);
  assert.match(request.files[0].content, /Boolean accepted/);
  const response = await createPlan(directory, {
    target: "backend",
    kind: "dto",
    name: "Quote",
    variant: "response",
  });
  assert.match(response.files[0].content, /UUID id/);
  assert.doesNotMatch(response.files[0].content, /@NotBlank/);
  const domain = await createPlan(directory, {
    target: "backend",
    kind: "domain",
    name: "Quote",
    fields: "amount:integer?,active:boolean",
    migration: "2",
  });
  assert.match(
    domain.files.find(file => file.path.endsWith(".sql")).content,
    /amount INTEGER,\n    active BOOLEAN NOT NULL/,
  );
});

test("layout recipes preserve defaults and validate variants before mutation", async t => {
  const { directory } = await fixture(t);
  for (const kind of ["component", "shell", "page", "form", "feature"]) {
    const base = { target: "frontend", kind, name: "WorkspaceLayout" };
    assert.deepEqual(
      (await createPlan(directory, base)).files,
      (await createPlan(directory, { ...base, variant: "simple" })).files,
    );
  }
  for (const [kind, variant] of [
    ["shell", "workspace"],
    ["page", "dashboard"],
    ["page", "detail"],
  ]) {
    const options = {
      target: "frontend",
      kind,
      variant,
      name: "WorkspaceLayout",
    };
    const plan = await createPlan(directory, options);
    assert.deepEqual(plan, await createPlan(directory, options));
    assert.ok(plan.files.some(file => file.path.endsWith(".example.tsx")));
    assert.ok(plan.files.some(file => file.path.endsWith(".en.ts")));
    await assert.rejects(createPlan(directory, { ...options, fields: "title" }), /composition props/);
    assert.equal((await readdir(path.join(directory, translationDirectory))).length, 1);
  }
  for (const [kind, variant] of [
    ["form", "workspace"],
    ["shell", "detail"],
    ["page", "workspace"],
  ])
    await assert.rejects(
      createPlan(directory, {
        target: "frontend",
        kind,
        variant,
        name: "WorkspaceLayout",
      }),
      /Unsupported --variant/,
    );
});

test("composable component recipes emit complete deterministic previews and reject fields before writing", async t => {
  const { directory } = await fixture(t);
  const component = generators.find(item => item.id === "frontend/component");
  for (const variant of component.variants.filter(item => item.value !== "simple")) {
    const options = {
      target: "frontend",
      kind: "component",
      variant: variant.value,
      name: `Reusable${naming(variant.value).pascal}`,
    };
    const plan = await createPlan(directory, options);
    assert.deepEqual(plan, await createPlan(directory, options));
    assert.ok(plan.files.some(file => file.path.endsWith(".example.tsx")));
    assert.ok(plan.files.some(file => file.path.includes("/tests/features/")));
    assert.ok(plan.files.some(file => file.path.endsWith(".hr.ts")));
    assert.ok(variant.guide && variant.reference);
    await assert.rejects(createPlan(directory, { ...options, fields: "title" }), /composition props/);
    await applyPlan(directory, plan.files);
    await assert.rejects(createPlan(directory, options), /Existing frontend feature owner/);
  }
});

test("rich field types are deliberate wizard/workspace inputs and leave backend/API parsing strict", async t => {
  const { directory } = await fixture(t);
  const fields =
    "title,notes:multiline?,quantity:integer?,budget:number?,active:boolean,dueOn:date?,status:select,owner:autocomplete?";
  assert.deepEqual(
    parseFields(fields, { rich: true }).map(field => field.type),
    ["string", "multiline", "integer", "number", "boolean", "date", "select", "autocomplete"],
  );
  assert.throws(() => parseFields("budget:number"));
  assert.throws(() => parseFields("title:unknown", { rich: true }));
  assert.throws(() => parseFields("status:select(active|paused)", { rich: true }));
  for (const [kind, variant] of [
    ["form", "wizard"],
    ["feature", "workspace"],
  ]) {
    const plan = await createPlan(directory, {
      target: "frontend",
      kind,
      variant,
      name: `Rich${kind}`,
      fields,
    });
    assert.equal(plan.context.fields.length, 8);
    assert.match(
      plan.files.find(file => file.path.includes("/models/") && file.path.endsWith(".ts")).content,
      /number \| null/,
    );
    for (const primary of [
      "active:boolean",
      "amount:number",
      "startDate:date",
      "category:select",
      "person:autocomplete?",
    ]) {
      const edge = await createPlan(directory, {
        target: "frontend",
        kind,
        variant,
        name: `Edge${kind}`,
        fields: primary,
      });
      assert.ok(edge.files.some(file => file.path.endsWith(".example.tsx")));
    }
  }
  for (const options of [
    { target: "backend", kind: "dto" },
    { target: "frontend", kind: "api" },
    { target: "frontend", kind: "form", variant: "simple" },
    { target: "frontend", kind: "form", variant: "collection" },
    { target: "frontend", kind: "page", variant: "report" },
  ])
    await assert.rejects(
      createPlan(directory, {
        ...options,
        name: "UnsupportedRich",
        fields: "budget:number",
      }),
      /Invalid field/,
    );
});

test("workflow recipes support custom and single-field inputs with deterministic, collision-safe plans", async t => {
  const { directory } = await fixture(t);
  for (const [kind, variant] of [
    ["feature", "workspace"],
    ["page", "report"],
    ["form", "wizard"],
    ["form", "collection"],
  ]) {
    for (const fields of ["subject", "subject?", "subject,description?,owner"]) {
      const options = {
        target: "frontend",
        kind,
        variant,
        fields,
        name: `Case${variant}${fields.includes(",") ? "Many" : fields.endsWith("?") ? "Optional" : "One"}`,
      };
      const plan = await createPlan(directory, options);
      assert.deepEqual(plan, await createPlan(directory, options));
      assert.equal(new Set(plan.files.map(file => file.path)).size, plan.files.length);
      const preview = plan.files.find(file => file.path.endsWith(".example.tsx"));
      assert.ok(preview);
      assert.match(preview.path, new RegExp(`/generated/${kind}/`));
      assert.ok(plan.files.some(file => file.path.endsWith(".hr.ts")));
      assert.ok(plan.files.some(file => file.path.includes("/tests/features/")));
      await applyPlan(directory, plan.files);
      await assert.rejects(createPlan(directory, options), /Existing frontend feature owner/);
    }
  }
});

test("child-item identity fields cannot be replaced by caller fields", async t => {
  const { directory } = await fixture(t);
  for (const fields of ["localId", "serverId", "subject,localId?"])
    await assert.rejects(
      createPlan(directory, {
        target: "frontend",
        kind: "form",
        variant: "collection",
        name: "Order",
        fields,
      }),
      /reserves localId and serverId/,
    );
  assert.equal((await readdir(path.join(directory, translationDirectory))).length, 1);
});

test("CLI dry-run creates no files; help, discovery, failure and assessments work without a TTY", async t => {
  const { directory, put } = await fixture(t);
  const before = await readdir(path.join(directory, translationDirectory));
  const args = [cli, "frontend", "form", "Account", "--root", directory, "--dry-run", "--json"];
  const result = await execute(process.execPath, args);
  assert.equal(JSON.parse(result.stdout).dryRun, true);
  const api = await execute(process.execPath, [
    cli,
    "frontend",
    "api",
    "Product",
    "--root",
    directory,
    "--dry-run",
    "--json",
  ]);
  assert.equal("preview" in JSON.parse(api.stdout), false);
  assert.deepEqual(await readdir(path.join(directory, translationDirectory)), before);
  const applied = await execute(process.execPath, [
    cli,
    "frontend",
    "form",
    "CliProfile",
    "--root",
    directory,
    "--fields",
    "title,notes?",
    "--json",
  ]);
  const receipt = JSON.parse(applied.stdout);
  assert.equal(receipt.dryRun, false);
  assert.match(
    await readFile(path.join(directory, "frontend/src/features/cli-profile/components/CliProfileForm.tsx"), "utf8"),
    /buildAppEntityFormOptions/,
  );
  assert.equal(receipt.preview, "/dev-guide/frontend/generated/form/cli-profile--cli-profile");
  assert.equal((await execute(process.execPath, [cli, "--list", "--json"])).stdout.includes('"frontend/form"'), true);
  assert.match((await execute(process.execPath, [cli, "--help"])).stdout, /--dry-run/);
  assert.match((await execute(process.execPath, [cli, "backend", "dto", "--help"])).stdout, /backend\/dto/);
  await assert.rejects(() => execute(process.execPath, [cli]), /Non-interactive execution requires/);
  await assert.rejects(
    () => execute(process.execPath, [cli, "frontend", "form", "A", "--fields", "id", "--json"]),
    error => JSON.parse(error.stderr).error.includes("id"),
  );
  await put(
    "assessment.json",
    JSON.stringify({
      disqualifiers: [],
      ...Object.fromEntries(
        ["architecture", "conventions", "coverage", "workflow"].map(key => [
          key,
          { score: 90, evidence: `Actual ${key} fit` },
        ]),
      ),
    }),
  );
  assert.equal(
    JSON.parse(
      (
        await execute(process.execPath, [
          cli,
          "assess",
          "frontend/form",
          "--root",
          directory,
          "--assessment",
          path.join(directory, "assessment.json"),
        ])
      ).stdout,
    ).mandatory,
    true,
  );
});

test("validation rejects missing prerequisites, migration reuse and incompatible options before any write", async t => {
  const { directory } = await fixture(t);
  const base = { target: "backend", name: "Order" };
  for (const options of [
    { ...base, kind: "repository" },
    { ...base, kind: "domain" },
    { ...base, kind: "domain", migration: "1" },
    { ...base, kind: "dto", variant: "unknown" },
    { ...base, kind: "dto", feature: "Auth" },
    {
      target: "frontend",
      kind: "form",
      name: "Order",
      fields: "amount:integer",
    },
  ])
    await assert.rejects(() => createPlan(directory, options));
});

test("translation index merges multiple owners deterministically and refuses edited mechanical content", async t => {
  const { directory, put } = await fixture(t);
  const first = await createPlan(directory, {
    target: "frontend",
    kind: "form",
    name: "Zebra",
  });
  await applyPlan(directory, first.files);
  const next = await createPlan(directory, {
    target: "frontend",
    kind: "component",
    name: "Alpha",
  });
  await applyPlan(directory, next.files);
  const index = await readFile(path.join(directory, translationDirectory, "index.ts"), "utf8");
  assert.ok(index.indexOf("alpha_component_alpha") < index.indexOf("zebra_form_zebra"));
  await put(`${translationDirectory}/index.ts`, index + "// Hand customization\n");
  await assert.rejects(
    () => createPlan(directory, { target: "frontend", kind: "form", name: "Beta" }),
    /Managed index drift/,
  );
});

test("index maintenance reconciles removed locale pairs without overwriting customized mechanics", async t => {
  const { directory } = await fixture(t);
  const plan = await createPlan(directory, {
    target: "frontend",
    kind: "form",
    name: "Retired",
  });
  await applyPlan(directory, plan.files);
  const id = plan.context.translationId;
  for (const locale of ["en", "hr"]) await rm(path.join(directory, translationDirectory, `${id}.${locale}.ts`));
  const maintenance = await createIndexPlan(directory);
  assert.equal(maintenance.length, 1);
  assert.doesNotMatch(maintenance[0].content, /retired/);
  await applyPlan(directory, maintenance);
  assert.deepEqual(await createIndexPlan(directory), []);
});

test("filesystem refuses escapes, Windows paths, symlinks, duplicate/case aliases and late conflicts", async t => {
  const { directory, put } = await fixture(t);
  for (const name of ["../escape", "a/../../escape", "C:\\temp\\bad", "/tmp/bad", "a//b", "a/./b"])
    await assert.rejects(() => safePath(directory, name), /Unsafe/);
  await symlink(os.tmpdir(), path.join(directory, "linked"), "dir");
  await assert.rejects(() => applyPlan(directory, [{ path: "linked/escape.txt", content: "bad" }]), /symlink/);
  await assert.rejects(
    () =>
      applyPlan(directory, [
        { path: "a.txt", content: "a" },
        { path: "A.txt", content: "b" },
      ]),
    /Duplicate/,
  );
  await put("Upper/file.txt", "unchanged");
  await assert.rejects(() => applyPlan(directory, [{ path: "upper/other.txt", content: "bad" }]), /Case-insensitive/);
  await put("owned.txt", "existing");
  await assert.rejects(
    () =>
      applyPlan(directory, [
        { path: "first.txt", content: "new" },
        { path: "owned.txt", content: "bad" },
      ]),
    /conflict/,
  );
  await assert.rejects(() => readFile(path.join(directory, "first.txt")), /ENOENT/);
  assert.equal(await readFile(path.join(directory, "owned.txt"), "utf8"), "existing");
});

test("partial failure rolls back only owned files and restores mechanical indexes", async t => {
  const { directory, put } = await fixture(t);
  await put("mechanical.txt", "previous");
  const files = [
    { path: "mechanical.txt", previous: "previous", content: "updated" },
    { path: "new/first.txt", content: "new" },
    { path: "new/second.txt", content: "new" },
  ];
  await assert.rejects(
    () =>
      applyPlan(directory, files, {
        beforeWrite: async (_, index) => {
          if (index === 2) throw new Error("Injected failure");
        },
      }),
    /Injected/,
  );
  assert.equal(await readFile(path.join(directory, "mechanical.txt"), "utf8"), "previous");
  await assert.rejects(() => readFile(path.join(directory, "new/first.txt")), /ENOENT/);
  await assert.rejects(() => readFile(path.join(directory, ".generator.lock")), /ENOENT/);
  const plan = [
    { path: "customized.txt", content: "generated" },
    { path: "failure.txt", content: "next" },
  ];
  await assert.rejects(() =>
    applyPlan(directory, plan, {
      beforeWrite: async (_, index) => {
        if (index === 1) {
          await put("customized.txt", "human edit");
          throw new Error("Failure");
        }
      },
    }),
  );
  assert.equal(await readFile(path.join(directory, "customized.txt"), "utf8"), "human edit");
});

test("permanent agent instructions reach discovery, compatibility and visual preview policy", async () => {
  const policy = await readFile(path.join(root, "docs/generators.md"), "utf8");
  assert.match(policy, /80%/);
  assert.match(policy, /30%/);
  assert.match(policy, /disqualif/i);
  for (const owner of ["AGENTS.md", "frontend/AGENTS.md", "backend/AGENTS.md"])
    assert.match(await readFile(path.join(root, owner), "utf8"), /[Gg]enerator/);
});
