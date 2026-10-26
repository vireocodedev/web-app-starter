import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { githubTransport, ProviderError } from "./transport.mjs";
import { withState } from "./state.mjs";

const exec = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const fail = (message) => {
  throw new Error(message);
};
const validNumber = (value) => Number.isSafeInteger(value) && value > 0;
const repoPattern = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;

async function localRepository(root) {
  const { stdout } = await exec(
    "git",
    ["-C", root, "config", "--get", "remote.origin.url"],
    { timeout: 5000, maxBuffer: 8192 },
  );
  const remote = stdout.trim();
  const match = remote.match(
    /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+\/[^/]+?)\/?$/,
  );
  if (!match)
    fail("Consumer origin must identify the intended github.com repository.");
  return match[1].replace(/\.git$/, "");
}

async function packageLoader(directory, options) {
  const { loadPackage } =
    await import("../../specification-to-issues/scripts/package.mjs");
  return loadPackage(directory, options);
}

function marker(manifest, item) {
  return `<!-- issue-package:${manifest.packageId}:${item.id} -->`;
}

export function publishedBody(manifest, item) {
  return `${item.bodyText}\n\n${marker(manifest, item)}\n<!-- issue-package-provenance -->\n### Approved specification source\n\nIteration: ${manifest.source.iteration}; revision: ${manifest.source.revision}.\nDigest: \`${manifest.source.digest}\`.\nReferences: ${item.sourceRefs.map((ref) => `${ref.document}#${ref.id}`).join(", ")}.\n`;
}

function relationshipsBody(pkg, item, mappings) {
  const { manifest, issues } = pkg;
  const lines = [
    "<!-- issue-package-relationships:start -->",
    "### Package relationships",
    "",
  ];
  if (item.parent) lines.push(`Parent: ${mappings[item.parent].url}`);
  const children = issues.filter((candidate) => candidate.parent === item.id);
  if (children.length)
    lines.push(
      `Children: ${children.map((candidate) => mappings[candidate.id].url).join(", ")}`,
    );
  if (item.dependsOn.length)
    lines.push(
      `Blocked by: ${item.dependsOn.map((id) => mappings[id].url).join(", ")}`,
    );
  lines.push("<!-- issue-package-relationships:end -->");
  return `${publishedBody(manifest, item)}\n${lines.join("\n")}\n`;
}

function creationOrder(issues) {
  const byId = new Map(issues.map((item) => [item.id, item]));
  const visited = new Set();
  const active = new Set();
  const result = [];
  const visit = (id) => {
    if (visited.has(id)) return;
    if (active.has(id) || !byId.has(id)) fail("Invalid dependency graph.");
    active.add(id);
    for (const predecessor of byId.get(id).dependsOn) visit(predecessor);
    active.delete(id);
    visited.add(id);
    result.push(byId.get(id));
  };
  for (const issue of issues) visit(issue.id);
  return result;
}

async function listAll(transport, endpoint) {
  const result = [];
  for (let page = 1; page <= 100; page++) {
    const separator = endpoint.includes("?") ? "&" : "?";
    const rows = await transport.request(
      "GET",
      `${endpoint}${separator}per_page=100&page=${page}`,
    );
    if (!Array.isArray(rows)) fail("GitHub returned an invalid list.");
    result.push(...rows);
    if (rows.length < 100) return result;
  }
  fail(
    "GitHub pagination exceeded 10,000 records; narrow or review the import manually.",
  );
}

function issueUrlMatches(value, repository, number) {
  if (typeof value !== "string") return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const match = url.pathname.match(/^\/([^/]+\/[^/]+)\/issues\/([1-9]\d*)$/);
  return (
    url.protocol === "https:" &&
    url.host === "github.com" &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash &&
    Boolean(match) &&
    match[1].toLowerCase() === repository.toLowerCase() &&
    match[2] === String(number)
  );
}

function issueIdentity(issue, repository) {
  if (
    !validNumber(issue.id) ||
    !validNumber(issue.number) ||
    !issueUrlMatches(issue.html_url, repository, issue.number) ||
    !["open", "closed"].includes(issue.state) ||
    issue.pull_request
  )
    fail("GitHub issue identity does not match the import target.");
  return { id: issue.id, number: issue.number, url: issue.html_url };
}

function validateState(state, pkg, repository, relationshipMode) {
  if (
    state.version !== 1 ||
    state.repository !== repository ||
    state.packageId !== pkg.manifest.packageId ||
    state.packageDigest !== pkg.packageDigest ||
    state.relationshipMode !== relationshipMode ||
    !state.issues ||
    !state.operations ||
    typeof state.issues !== "object" ||
    typeof state.operations !== "object"
  )
    fail(
      "Import checkpoint differs from this package, target or relationship mode. Preserve it and review the conflict.",
    );
  const allowed = new Set(pkg.issues.map((item) => item.id));
  for (const [id, record] of Object.entries(state.issues)) {
    if (
      !allowed.has(id) ||
      !validNumber(record.id) ||
      !validNumber(record.number) ||
      !issueUrlMatches(record.url, repository, record.number) ||
      typeof record.body !== "string"
    )
      fail("Invalid issue mapping in import checkpoint.");
  }
  for (const operation of Object.values(state.operations)) {
    if (
      !operation ||
      !["pending", "success", "recovered"].includes(operation.status)
    )
      fail("Invalid operation in import checkpoint.");
  }
}

export async function importPackage(options) {
  const {
    packageDir,
    root,
    repository: requestedRepository,
    mode = "plan",
    relationshipMode = "native",
    transport: selectedTransport,
    stateBase = path.join(here, "../state"),
    load = packageLoader,
  } = options;
  if (
    !["plan", "apply"].includes(mode) ||
    !["native", "body-links"].includes(relationshipMode)
  )
    fail("Select plan/apply and native/body-links.");
  if (!packageDir) fail("Provide the exact issue package directory.");
  const pkg = await load(path.resolve(packageDir), {
    root,
    requireCurrentSource: Boolean(root),
  });
  const { manifest } = pkg;
  const inferredRepository = root ? await localRepository(root) : undefined;
  const repository = requestedRepository ?? inferredRepository;
  if (
    !repository ||
    !repoPattern.test(repository) ||
    repository.toLowerCase() !== manifest.repository.toLowerCase() ||
    (inferredRepository &&
      inferredRepository.toLowerCase() !== repository.toLowerCase())
  )
    fail(
      "Explicit target, consumer origin and package repository must match; standalone imports require --repo OWNER/REPO.",
    );
  // Preserve canonical package spelling for stable URLs and state comparisons.
  const target = manifest.repository;
  for (const item of pkg.issues) {
    if (item.bodyText.includes("<!-- issue-package"))
      fail("Package body contains a reserved import marker.");
  }
  const ordered = creationOrder(pkg.issues);
  const plan = {
    mode,
    repository: target,
    packageId: manifest.packageId,
    packageDigest: pkg.packageDigest,
    source: manifest.source,
    relationshipMode,
    labels: manifest.labels.map((label) => label.name),
    issues: ordered.map((item) => ({
      id: item.id,
      title: item.title,
      labels: item.labels,
      parent: item.parent,
      dependsOn: item.dependsOn,
    })),
  };
  if (mode === "plan") return plan;
  if (!requestedRepository)
    fail(
      "Publication requires an explicit --repo OWNER/REPO matching the named package.",
    );
  const transport = selectedTransport ?? githubTransport();
  const endpoint = `repos/${target}`;

  return withState(
    stateBase,
    target,
    manifest.packageId,
    async ({ state: previous, write, statePath }) => {
      const state = previous ?? {
        version: 1,
        repository: target,
        packageId: manifest.packageId,
        packageDigest: pkg.packageDigest,
        relationshipMode,
        issues: {},
        operations: {},
        complete: false,
      };
      validateState(state, pkg, target, relationshipMode);
      const save = () => write(state);
      const recheck = async () => {
        const current = await load(path.resolve(packageDir), {
          root,
          requireCurrentSource: Boolean(root),
        });
        if (
          current.packageDigest !== pkg.packageDigest ||
          current.manifest.repository !== target ||
          current.manifest.packageId !== manifest.packageId
        )
          fail(
            "Package changed during import. Preserve the checkpoint and review it.",
          );
        if (
          root &&
          (await localRepository(root)).toLowerCase() !== target.toLowerCase()
        )
          fail("Consumer origin changed during import.");
      };
      const intent = async (key, payload) => {
        await recheck();
        state.operations[key] = { status: "pending", ...payload };
        state.complete = false;
        await save();
      };
      const success = async (key, recovered = false) => {
        state.operations[key] = {
          ...state.operations[key],
          status: recovered ? "recovered" : "success",
        };
        await save();
      };
      const freshIssue = async (item) => {
        const issue = await transport.request(
          "GET",
          `${endpoint}/issues/${state.issues[item.id].number}`,
        );
        const identity = issueIdentity(issue, target);
        if (
          identity.id !== state.issues[item.id].id ||
          issue.title !== item.title ||
          issue.body !== state.issues[item.id].body
        )
          fail(
            `Issue ${item.id} changed remotely. Preserve manual edits and resolve the conflict before resuming.`,
          );
        return issue;
      };
      const preflight = await transport.request("GET", endpoint);
      if (
        typeof preflight.full_name !== "string" ||
        preflight.full_name.toLowerCase() !== target.toLowerCase() ||
        preflight.has_issues !== true ||
        !validNumber(preflight.id)
      )
        fail(
          "GitHub target identity or issue availability differs from the package.",
        );
      if (
        state.repositoryId !== undefined &&
        state.repositoryId !== preflight.id
      )
        fail(
          "GitHub repository database identity changed; preserve the checkpoint and resolve it.",
        );
      state.repositoryId = preflight.id;
      let remoteIssues = (
        await listAll(transport, `${endpoint}/issues?state=all`)
      ).filter((issue) => !issue.pull_request);
      const find = (item) => {
        const expected = marker(manifest, item);
        const matches = remoteIssues.filter(
          (issue) =>
            typeof issue.body === "string" && issue.body.includes(expected),
        );
        if (
          matches.length > 1 ||
          (matches.length === 1 && matches[0].body.split(expected).length !== 2)
        )
          fail(
            `Duplicate marker for ${item.id}; resolve the duplicate remotely before resuming.`,
          );
        return matches[0];
      };
      // Validate every existing marker/mapping before making any remote changes.
      for (const item of pkg.issues) {
        const observed = find(item);
        const record = state.issues[item.id];
        const expected = publishedBody(manifest, item);
        const pendingBody = state.operations[`body:${item.id}`];
        if (observed) {
          const identity = issueIdentity(observed, target);
          const accepted = record ? [record.body] : [expected];
          if (pendingBody?.status === "pending")
            accepted.push(pendingBody.before, pendingBody.after);
          if (
            observed.title !== item.title ||
            !accepted.includes(observed.body) ||
            (record &&
              (identity.id !== record.id || identity.number !== record.number))
          )
            fail(
              `Issue ${item.id} has title/body or mapping drift. Preserve remote edits and resolve it explicitly.`,
            );
          state.issues[item.id] = { ...identity, body: observed.body };
          if (state.operations[`create:${item.id}`]?.status === "pending")
            await success(`create:${item.id}`, true);
          if (
            pendingBody?.status === "pending" &&
            observed.body === pendingBody.after
          )
            await success(`body:${item.id}`, true);
        } else if (record || state.operations[`create:${item.id}`]) {
          fail(
            `Issue ${item.id} is missing after recorded intent. Its outcome is uncertain; do not retry creation blindly.`,
          );
        }
      }
      await save();

      const skipped = [];
      const remoteLabels = await listAll(transport, `${endpoint}/labels`);
      for (const label of manifest.labels) {
        const existing = remoteLabels.find(
          (candidate) =>
            candidate.name.toLowerCase() === label.name.toLowerCase(),
        );
        const key = `label:${label.name}`;
        if (existing) {
          if (state.operations[key]?.status === "pending")
            await success(key, true);
          continue;
        }
        if (state.operations[key]?.status === "pending")
          fail(
            `Label ${label.name} has an uncertain prior creation; reconcile it before retrying.`,
          );
        await intent(key, { name: label.name });
        const created = await transport.request(
          "POST",
          `${endpoint}/labels`,
          label,
        );
        if (created?.name !== label.name)
          fail("Label creation was not confirmed; reconcile saved intent.");
        await success(key);
      }

      for (const item of ordered) {
        if (state.issues[item.id]) continue;
        const key = `create:${item.id}`;
        const body = publishedBody(manifest, item);
        await intent(key, { itemId: item.id });
        const created = await transport.request("POST", `${endpoint}/issues`, {
          title: item.title,
          body,
          labels: item.labels,
        });
        const identity = issueIdentity(created, target);
        if (created.title !== item.title || created.body !== body)
          fail(
            `Created issue ${item.id} has an unexpected response; reconcile its marker before retrying.`,
          );
        state.issues[item.id] = { ...identity, body };
        remoteIssues.push(created);
        await success(key);
      }

      for (const item of pkg.issues) {
        const current = await freshIssue(item);
        if (relationshipMode === "body-links") {
          const after = relationshipsBody(pkg, item, state.issues);
          const before = state.issues[item.id].body;
          if (before === after) continue;
          if (current.state === "closed") {
            skipped.push({
              id: item.id,
              relationship: "body-links",
              reason: "closed issue preserved",
            });
            continue;
          }
          const key = `body:${item.id}`;
          await intent(key, { itemId: item.id, before, after });
          await freshIssue(item);
          const updated = await transport.request(
            "PATCH",
            `${endpoint}/issues/${current.number}`,
            { body: after },
          );
          if (
            updated.body !== after ||
            updated.title !== item.title ||
            issueIdentity(updated, target).id !== current.id
          )
            fail(
              "Relationship body update is uncertain; reconcile before retrying.",
            );
          state.issues[item.id].body = after;
          await success(key);
          continue;
        }
        if (item.parent) {
          const parent = state.issues[item.parent];
          let observed;
          try {
            observed = await transport.request(
              "GET",
              `${endpoint}/issues/${current.number}/parent`,
            );
          } catch (error) {
            if (error.status !== 404) throw error;
          }
          const key = `parent:${item.id}`;
          if (observed) {
            if (issueIdentity(observed, target).id !== parent.id)
              fail(
                `Issue ${item.id} already belongs to another parent; preserve it.`,
              );
            if (state.operations[key]?.status === "pending")
              await success(key, true);
          } else {
            if (current.state === "closed") {
              skipped.push({
                id: item.id,
                relationship: "parent",
                reason: "closed issue preserved",
              });
            } else {
              if (state.operations[key]?.status === "pending")
                fail(
                  `Parent relationship for ${item.id} has an uncertain outcome; reconcile before retrying.`,
                );
              const parentItem = pkg.issues.find(
                (candidate) => candidate.id === item.parent,
              );
              if ((await freshIssue(parentItem)).state === "closed")
                fail(
                  `Parent ${item.parent} is closed; preserve it and resolve the missing relationship explicitly.`,
                );
              await freshIssue(item);
              await intent(key, { childId: current.id, parentId: parent.id });
              await transport.request(
                "POST",
                `${endpoint}/issues/${parent.number}/sub_issues`,
                { sub_issue_id: current.id },
              );
              const verified = await transport.request(
                "GET",
                `${endpoint}/issues/${current.number}/parent`,
              );
              if (issueIdentity(verified, target).id !== parent.id)
                fail("Parent relationship was not observed.");
              await success(key);
            }
          }
        }
        if (item.dependsOn.length) {
          const dependencies = await listAll(
            transport,
            `${endpoint}/issues/${current.number}/dependencies/blocked_by`,
          );
          for (const id of item.dependsOn) {
            const blocker = state.issues[id];
            const key = `blocker:${item.id}:${id}`;
            if (
              dependencies.some(
                (candidate) =>
                  issueIdentity(candidate, target).id === blocker.id,
              )
            ) {
              if (state.operations[key]?.status === "pending")
                await success(key, true);
              continue;
            }
            if (current.state === "closed") {
              skipped.push({
                id: item.id,
                relationship: `blocker:${id}`,
                reason: "closed issue preserved",
              });
              continue;
            }
            if (state.operations[key]?.status === "pending")
              fail(
                `Blocking relationship ${item.id}/${id} is uncertain; reconcile before retrying.`,
              );
            await freshIssue(item);
            await intent(key, { issueId: current.id, blockerId: blocker.id });
            await transport.request(
              "POST",
              `${endpoint}/issues/${current.number}/dependencies/blocked_by`,
              { issue_id: blocker.id },
            );
            const verified = await listAll(
              transport,
              `${endpoint}/issues/${current.number}/dependencies/blocked_by`,
            );
            if (
              !verified.some(
                (candidate) =>
                  issueIdentity(candidate, target).id === blocker.id,
              )
            )
              fail("Blocking relationship was not observed.");
            await success(key);
          }
        }
      }
      await recheck();
      state.complete = skipped.length === 0;
      await save();
      return {
        ...plan,
        complete: state.complete,
        skipped,
        statePath,
        imported: pkg.issues
          .map((item) => ({ id: item.id, ...state.issues[item.id] }))
          .map(({ body, ...item }) => item),
      };
    },
  );
}

async function cli() {
  const [mode = "plan", ...args] = process.argv.slice(2);
  const options = { mode };
  const names = new Map([
    ["--package", "packageDir"],
    ["--repo", "repository"],
    ["--root", "root"],
    ["--relationship-mode", "relationshipMode"],
  ]);
  for (let index = 0; index < args.length; index += 2) {
    const name = names.get(args[index]);
    if (
      !name ||
      !args[index + 1] ||
      args[index + 1].startsWith("--") ||
      options[name] !== undefined
    )
      fail(
        "Usage: import.mjs plan|apply --package DIR [--root ROOT] [--repo OWNER/REPO] [--relationship-mode native|body-links]",
      );
    options[name] = args[index + 1];
  }
  if (!options.root) {
    try {
      options.root = (
        await exec("git", ["rev-parse", "--show-toplevel"], {
          timeout: 5000,
          maxBuffer: 8192,
        })
      ).stdout.trim();
    } catch {
      /* A standalone copied package instead requires an explicit target. */
    }
  }
  console.log(JSON.stringify(await importPackage(options), null, 2));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  cli().catch((error) => {
    // Only bounded helper errors are surfaced; transport never exposes raw stderr/provider bodies.
    console.error(
      error instanceof ProviderError
        ? error.message
        : `Import stopped: ${error.message}`,
    );
    process.exitCode = 1;
  });
}
