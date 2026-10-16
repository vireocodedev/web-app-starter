import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Children, cloneElement, createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  argumentsFor,
  defaultRoot,
  skillDirectory,
  verifyWorkspace,
} from "./workspace.mjs";

const workspace = defaultRoot;
const skillPath = ".github/skills/initialize-project";
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_ -]/gu, "")
    .trim()
    .replace(/ +/g, "-");
const label = (value) => value.replaceAll("_", " ").replaceAll("-", " ");
const escape = (value) =>
  renderToStaticMarkup(createElement("span", null, String(value))).slice(6, -7);
const idFor = (path) => `source-${slug(path)}`;

async function entries(directory) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function loadReferences() {
  const paths = (
    await readdir(resolve(skillDirectory, "references"), {
      withFileTypes: true,
    })
  )
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => `${skillPath}/references/${entry.name}`);
  return Promise.all(
    paths.sort(compare).map(async (path) => {
      const content = await readFile(
        resolve(skillDirectory, "references", path.split("/").at(-1)),
        "utf8",
      );
      return {
        path,
        content,
        digest: createHash("sha256").update(content).digest("hex"),
      };
    }),
  );
}

export async function loadSources(root = workspace) {
  const docs = resolve(root, "docs");
  const markdown = (await entries(docs))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => `docs/${entry.name}`);
  const records = (await entries(resolve(docs, "acceptance")))
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith("-acceptance.json"),
    )
    .map((entry) => `docs/acceptance/${entry.name}`);
  const project = await Promise.all(
    [...markdown, ...records].sort(compare).map(async (path) => {
      const content = await readFile(resolve(root, path), "utf8");
      return {
        path,
        content,
        digest: createHash("sha256").update(content).digest("hex"),
        data: path.endsWith(".json") ? JSON.parse(content) : undefined,
      };
    }),
  );
  return [...project, ...(await loadReferences())].sort((left, right) =>
    compare(left.path, right.path),
  );
}

function text(children) {
  if (Array.isArray(children)) return children.map(text).join("");
  if (isValidElement(children)) return text(children.props.children);
  return children == null ? "" : String(children);
}

function labelTaskInputs(children, name) {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if (child.type === "input" && child.props.type === "checkbox") {
      return cloneElement(child, { "aria-label": name });
    }
    if (child.props.children === undefined) return child;
    return cloneElement(
      child,
      null,
      labelTaskInputs(child.props.children, name),
    );
  });
}

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compare(left, right))
        .map(([key, item]) => [key, sorted(item)]),
    );
  }
  return value;
}

function evidence(value) {
  if (value === null)
    return createElement("span", { className: "muted" }, "Not recorded");
  if (Array.isArray(value)) {
    return value.length
      ? createElement(
          "ol",
          { className: "data-list" },
          ...value.map((item, key) =>
            createElement("li", { key }, evidence(item)),
          ),
        )
      : createElement("span", { className: "muted" }, "Empty list");
  }
  if (typeof value === "object") {
    return createElement(
      "dl",
      { className: "data-tree" },
      ...Object.entries(value)
        .sort(([left], [right]) => compare(left, right))
        .map(([key, item]) =>
          createElement(
            "div",
            { key, className: "data-row" },
            createElement("dt", null, label(key)),
            createElement("dd", null, evidence(item)),
          ),
        ),
    );
  }
  if (typeof value === "boolean") {
    return createElement(
      "span",
      { className: "boolean" },
      value ? "Yes" : "No",
    );
  }
  if (typeof value === "string" && /^https?:\/\/\S+$/.test(value)) {
    return createElement("a", { href: value, rel: "noreferrer" }, value);
  }
  return createElement(
    "span",
    { className: typeof value === "number" ? "number" : undefined },
    String(value),
  );
}

function markdownHtml(source, targets, reference) {
  const headingCounts = new Map();
  const components = {
    a({ href, children }) {
      if (!href) return createElement("span", null, children);
      const [path, fragment] = href.split("#");
      const target = path
        ? relative(workspace, resolve(workspace, dirname(source.path), path))
        : source.path;
      const destination = targets.has(target)
        ? `#${idFor(target)}${fragment ? `--${fragment}` : ""}`
        : /^(https?:|mailto:)/.test(href)
          ? href
          : reference
            ? `https://github.com/vireocodedev/web-app-starter/blob/main/${target}${fragment ? `#${fragment}` : ""}`
            : relative(
                resolve(workspace, "docs"),
                resolve(workspace, dirname(source.path), path),
              ) + (fragment ? `#${fragment}` : "");
      return createElement("a", { href: destination }, children);
    },
    table({ children }) {
      return createElement(
        "div",
        {
          className: "table-scroll",
          tabIndex: 0,
          role: "region",
          "aria-label": "Scrollable table",
        },
        createElement("table", null, children),
      );
    },
    pre({ children }) {
      return createElement("pre", { tabIndex: 0 }, children);
    },
    li({ children, className }) {
      const name = text(children).replace(/\s+/g, " ").trim();
      return createElement(
        "li",
        { className },
        labelTaskInputs(children, name),
      );
    },
  };
  for (let level = 1; level <= 6; level++) {
    components[`h${level}`] = ({ children }) => {
      const base = slug(text(children));
      const count = headingCounts.get(base) ?? 0;
      headingCounts.set(base, count + 1);
      return createElement(
        `h${Math.min(level + 2, 6)}`,
        { id: `${idFor(source.path)}--${base}${count ? `-${count}` : ""}` },
        children,
      );
    };
  }
  return renderToStaticMarkup(
    createElement(
      Markdown,
      { remarkPlugins: [remarkGfm], components, skipHtml: true },
      source.content,
    ),
  );
}

const style = `
:root{color-scheme:light;--paper:#f4f6f8;--card:#fff;--ink:#192738;--muted:#526478;--line:#dbe3ea;--accent:#086e68;--soft:#e6f3ef;--amber:#805008;--amber-bg:#fff3db}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--accent);text-underline-offset:3px;overflow-wrap:anywhere}a:hover{text-decoration-thickness:2px}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #448cff;outline-offset:4px}button,input,select{font:inherit}button,select,summary{cursor:pointer}button{border:1px solid var(--line);border-radius:9px;padding:8px 14px;background:var(--card);color:var(--ink)}[hidden]{display:none!important}
.skip{position:absolute;top:-100px;left:20px;background:#fff;padding:12px;z-index:3}.skip:focus{top:12px}.layout{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:100vh}.sidebar{background:#122536;color:#dce7ef;padding:32px 22px;position:sticky;top:0;height:100vh;overflow:auto}.brand{font-size:22px;font-weight:750;letter-spacing:-.6px;color:#fff}.eyebrow{font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:1.8px}.sidebar .eyebrow{color:#8ebbb8;margin-top:36px}.sidebar a{display:block;color:#dce7ef;text-decoration:none;font-size:13px;padding:8px 10px;border-radius:7px;margin:2px 0}.sidebar a:hover{background:#213b50;color:white}.sidebar .intro{font-size:13px;color:#a6bacb}.sidebar .home{margin-top:24px;background:#254455;color:#b9f3df}.main{max-width:1300px;width:100%;padding:44px 48px 72px;min-width:0}.topline{display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}.topline .eyebrow{color:var(--accent)}.pill{display:inline-flex;align-items:center;gap:6px;border-radius:30px;padding:4px 11px;font-size:12px;font-weight:700;background:#e9edf2;color:#405267}.pill.partial,.pill.blocked,.pill.pending,.pill.in_progress{background:var(--amber-bg);color:var(--amber)}.pill.passed{background:var(--soft);color:#075d48}h1{font-size:clamp(32px,4.5vw,48px);line-height:1.15;letter-spacing:-1.8px;margin:18px 0 12px}h2{font-size:24px;letter-spacing:-.6px;margin:0 0 12px}h3{font-size:20px}h4{font-size:17px}h5,h6{font-size:15px}h3,h4,h5,h6{line-height:1.4;scroll-margin-top:24px}.lede{max-width:780px;font-size:17px;color:var(--muted);margin:0}.hero{margin-bottom:28px}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:28px 0}.stat{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:18px 20px}.stat strong{display:block;font-size:27px;line-height:1.3;letter-spacing:-.8px}.stat span{color:var(--muted);font-size:12px}.panel{border:1px solid var(--line);border-radius:16px;background:var(--card);padding:26px 28px;margin-bottom:22px;box-shadow:0 4px 18px #132d4510;min-width:0;scroll-margin-top:24px}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px;flex-wrap:wrap}.source-path{font:11px/1.6 ui-monospace,monospace;color:var(--muted);overflow-wrap:anywhere}.notice{padding:15px 18px;border-left:3px solid #ce9a37;background:var(--amber-bg);border-radius:0 9px 9px 0;color:#67440d;margin:18px 0}.notice p{margin:0}.phase-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;list-style:none;padding:0}.phase{padding:14px;border:1px solid var(--line);border-radius:11px;display:flex;align-items:center;justify-content:space-between;gap:8px}.phase-name{font-size:13px;font-weight:650;text-transform:capitalize}.progress{height:6px;border-radius:8px;background:#e4eaf0;overflow:hidden;margin:20px 0}.progress span{display:block;background:#218b72;height:100%}.section-heading{margin:34px 0 16px}.toolbar{position:sticky;top:0;z-index:1;display:flex;gap:12px;flex-wrap:wrap;background:#f4f6f8f5;padding:16px 0;backdrop-filter:blur(10px)}.field{display:grid;gap:5px;font-size:12px;color:var(--muted);flex:1;min-width:200px}.field input,.field select{width:100%;padding:11px 13px;border-radius:10px;border:1px solid #bac8d4;background:white;color:var(--ink);min-height:46px}.filter{max-width:240px}.search-status{font-size:12px;color:var(--muted);margin:0 0 18px}.record h3:first-child{margin-top:0}.markdown p,.markdown li{overflow-wrap:anywhere}.markdown img{max-width:100%}.markdown blockquote{margin:18px 0;border-left:3px solid #7eaca7;padding:4px 18px;color:var(--muted)}.markdown pre,.raw pre{padding:17px;border-radius:10px;background:#122536;color:#deebf4;overflow:auto;max-width:100%;font-size:12px;line-height:1.7}code{font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;background:#edf2f5;border-radius:4px;padding:2px 4px;overflow-wrap:anywhere}pre code{background:none;padding:0;color:inherit}.table-scroll{overflow:auto;margin:20px 0;border:1px solid var(--line);border-radius:10px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:11px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{background:#eff4f6;font-weight:700}tr:last-child td{border-bottom:0}.data-tree{margin:0}.data-row{border-top:1px solid var(--line);padding:12px 0}.data-row:first-child{border-top:0}.data-row dt{font-size:12px;color:var(--muted);font-weight:700;text-transform:capitalize}.data-row dd{margin:5px 0 0;overflow-wrap:anywhere}.data-row .data-tree{border-left:2px solid #dce9e5;padding-left:16px;margin:10px 0}.data-list{padding-left:23px;margin:5px 0}.data-list>li{padding:4px 0}.boolean,.number{font-variant-numeric:tabular-nums;font-weight:650}.muted{color:var(--muted)}details{border-top:1px solid var(--line);padding:14px 0}summary{font-weight:650;text-transform:capitalize}details[open]>summary{margin-bottom:14px}.digest{font-size:10px;color:var(--muted);overflow-wrap:anywhere;margin-top:20px}.empty{text-align:center;padding:36px}.footer{font-size:12px;color:var(--muted);margin-top:36px}
.data-row{overflow-wrap:anywhere}
[tabindex="0"]:focus-visible{outline:3px solid #448cff;outline-offset:4px}
@media(max-width:1050px){.main{padding:30px 26px}.layout{grid-template-columns:225px minmax(0,1fr)}.sidebar{padding:26px 16px}.phase-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.layout{display:block}.sidebar{position:static;height:auto;padding:22px}.sidebar nav{display:flex;gap:5px;flex-wrap:wrap}.sidebar nav a{font-size:12px;padding:6px 9px;background:#213b50}.sidebar .eyebrow{margin:20px 0 8px}.sidebar .intro{margin:4px 0}.sidebar .home{display:inline-block;margin-top:12px}.main{padding:26px 16px 48px}.panel{padding:20px 18px}.phase-grid{grid-template-columns:1fr}.toolbar{position:static}.filter{max-width:none}.stat{padding:15px}.topline{gap:8px}h1{letter-spacing:-1px}.data-row .data-tree{padding-left:10px}.stats{gap:10px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media print{.sidebar,.toolbar,.search-status,.skip{display:none}.layout{display:block}.main{padding:0;max-width:none}.panel{box-shadow:none;break-inside:avoid}.record[hidden]{display:block!important}details>summary{list-style:none}details>*{display:block}.footer{border-top:1px solid #ccc;padding-top:15px}}
`;

const interaction = `
const records = [...document.querySelectorAll(".record")];
const search = document.querySelector("#search");
const filter = document.querySelector("#kind");
const cached = records.map(record => ({ record, text: record.textContent.toLowerCase() }));
function update() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  for (const item of cached) {
    const visible = (!query || item.text.includes(query)) && (filter.value === "all" || item.record.dataset.kind === filter.value);
    item.record.hidden = !visible;
    document.querySelectorAll("[data-for]").forEach(link => {
      if (link.dataset.for === item.record.id) link.hidden = !visible;
    });
    if (visible) count++;
  }
  document.querySelector("#results").textContent = "Showing " + count + " of " + records.length + " sources";
  document.querySelector("#empty").hidden = count !== 0;
}
search.addEventListener("input", update);
filter.addEventListener("change", update);
document.querySelector("#reset").addEventListener("click", () => { search.value = ""; filter.value = "all"; update(); search.focus(); });
function revealTarget() {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const record = target?.closest(".record");
  if (record?.hidden) { search.value = ""; filter.value = "all"; update(); }
  for (let parent = target?.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === "DETAILS") parent.open = true;
  }
}
addEventListener("hashchange", revealTarget);
revealTarget();
update();
`;

export function buildProjectHtml(sources, { reference = false } = {}) {
  const consumer = sources.find(
    (source) =>
      source.path === "docs/acceptance/initialization-acceptance.json",
  )?.data;
  const name = consumer?.identity?.display_name ?? "Project";
  const phases = [
    "intake",
    "identity",
    "local",
    "ci",
    "environments",
    "staging",
    "production",
    "recovery",
    "handoff",
  ].map((phase) => [phase, consumer?.phases?.[phase] ?? "unrecorded"]);
  const passed = phases.filter(([, status]) => status === "passed").length;
  const ready =
    consumer?.ready === true && phases.length > 0 && passed === phases.length;
  const documents = sources
    .filter((source) => source.path.endsWith(".md"))
    .map((source) => ({
      ...source,
      kind: "procedure",
      title: source.content.match(/^# (.+)$/m)?.[1] ?? source.path,
    }))
    .sort((left, right) => compare(left.title, right.title));
  const records = sources
    .filter((source) => source.path.endsWith(".json"))
    .map((source) => ({
      ...source,
      kind: source.data === consumer ? "consumer" : "reference",
      title:
        source.data === consumer
          ? "Consumer initialization"
          : label(source.path.split("/").at(-1).replace(".json", "")),
    }))
    .sort(
      (left, right) =>
        Number(right.kind === "consumer") - Number(left.kind === "consumer") ||
        compare(left.title, right.title),
    );
  const targets = new Set(sources.map((source) => source.path));
  const nav = (items) =>
    items
      .map(
        (source) =>
          `<a data-for="${idFor(source.path)}" href="#${idFor(source.path)}">${escape(source.title)}</a>`,
      )
      .join("");
  const phaseHtml = phases
    .map(
      ([phase, status]) =>
        `<li class="phase"><span class="phase-name">${escape(label(phase))}</span><span class="pill ${["passed", "pending", "blocked", "in_progress"].includes(status) ? status : ""}">${escape(label(status))}</span></li>`,
    )
    .join("");
  const evidenceHtml = records
    .map((source) => {
      const data = source.data;
      return `<section class="panel record" data-kind="${source.kind}" id="${idFor(source.path)}">
<div class="panel-heading"><div><div class="source-path">${escape(source.path)}</div><h2>${escape(source.title)}</h2></div><span class="pill ${source.kind === "consumer" ? "passed" : ""}">${source.kind === "consumer" ? "Consumer evidence" : "Upstream / reference"}</span></div>
${source.kind === "reference" ? '<p class="notice">Historical or operator reference. This record does not certify this consumer or its current deployment.</p>' : ""}
${Object.entries(data)
  .sort(([left], [right]) => compare(left, right))
  .map(([key, value]) =>
    value !== null && typeof value === "object"
      ? `<details${["phases", "remaining", "limitations"].includes(key) ? " open" : ""}><summary>${escape(label(key))}</summary>${renderToStaticMarkup(evidence(value))}</details>`
      : `<div class="data-row"><strong>${escape(label(key))}</strong><div>${renderToStaticMarkup(evidence(value))}</div></div>`,
  )
  .join("")}
<details class="raw"><summary>Inspect complete sorted JSON</summary><pre tabindex="0">${escape(JSON.stringify(sorted(data), null, 2))}</pre></details>
<div class="digest">Source SHA-256 · ${source.digest}</div></section>`;
    })
    .join("");
  const documentsHtml = documents
    .map(
      (
        source,
      ) => `<section class="panel record" data-kind="procedure" id="${idFor(source.path)}">
<div class="panel-heading"><div><div class="source-path">${escape(source.path)}</div><h2>${escape(source.title)}</h2></div><span class="pill">Procedure</span></div>
<div class="markdown">${markdownHtml(source, targets, reference)}</div><div class="digest">Source SHA-256 · ${source.digest}</div></section>`,
    )
    .join("");
  const remaining = consumer?.remaining ?? [
    "No consumer acceptance record exists. Readiness has not been established.",
  ];
  const manifest = sources
    .map((source) => `${source.path} ${source.digest}`)
    .sort(compare)
    .join("\n");
  const fingerprint = createHash("sha256").update(manifest).digest("hex");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light"><meta name="description" content="Offline project documentation and evidence-based initialization status.">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<title>${escape(name)} · Project status &amp; documentation</title><style>${style}</style></head>
<body><a class="skip" href="#main">Skip to project status</a><div class="layout">
<aside class="sidebar"><div class="brand">${escape(name)}<span aria-hidden="true"> /</span></div><p class="intro">Project field guide<br>Evidence, decisions &amp; next steps.</p><a class="home" href="#overview">Initialization overview</a>
<p class="eyebrow">Acceptance evidence</p><nav aria-label="Acceptance evidence">${nav(records)}</nav>
<p class="eyebrow">Guides &amp; procedures</p><nav aria-label="Documentation">${nav(documents)}</nav>
<p class="eyebrow">Operator-owned</p><a href="${reference ? "https://github.com/vireocodedev/web-app-starter/blob/main/infrastructure/ci/verification/host-acceptance.json" : "../infrastructure/ci/verification/host-acceptance.json"}">Shared host receipt ↗</a><p class="intro">Reference only. Infrastructure ownership and source-bound receipts stay separate.</p></aside>
<main class="main" id="main"><header class="hero" id="overview"><div class="topline"><span class="eyebrow">Initialization workspace</span><span class="pill ${ready ? "passed" : "partial"}">${ready ? "Verified ready" : "Not ready · acceptance incomplete"}</span></div><h1>Your project, at a glance.</h1>
<p class="lede">${reference ? "Bundled template reference only. This page contains no consumer acceptance or private preparation. Repository-file links open canonical template source, not this consumer." : "One place for the complete setup story. Current consumer evidence is separated from inherited receipts, and unfinished gates stay visible."}</p>
<p class="source-path">${escape(consumer?.repository ?? "Consumer repository not recorded")}</p></header>
<div class="stats"><div class="stat"><strong>${passed} / ${phases.length}</strong><span>Acceptance phases passed</span></div><div class="stat"><strong>${documents.length}</strong><span>Source documents</span></div><div class="stat"><strong>${records.length}</strong><span>Acceptance records</span></div><div class="stat"><strong>Offline</strong><span>One file · no external assets</span></div></div>
<section class="panel" aria-labelledby="phase-heading"><div class="panel-heading"><div><span class="eyebrow">Current consumer only</span><h2 id="phase-heading">The path to ready</h2></div><span class="pill ${ready ? "passed" : "partial"}">${escape(ready ? "Complete" : (consumer?.status ?? "Unrecorded"))}</span></div>
<div class="progress" role="progressbar" aria-label="Acceptance phases passed" aria-valuemin="0" aria-valuemax="${phases.length || 1}" aria-valuenow="${passed}"><span style="width:${phases.length ? (passed / phases.length) * 100 : 0}%"></span></div>
<ol class="phase-grid">${phaseHtml}</ol>${consumer?.phases ? "" : '<p class="notice">No consumer phases recorded. All acceptance gates remain unverified.</p>'}<div class="notice">A configured workflow, a historical receipt, or a successful image build is not deployment acceptance. This page is a snapshot of committed documentation, not a live monitor.</div>
<h3>What remains</h3>${renderToStaticMarkup(evidence(remaining))}
${consumer?.limitations?.length ? `<details open><summary>Known limitations</summary>${renderToStaticMarkup(evidence(consumer.limitations))}</details>` : ""}</section>
<h2 class="section-heading">Explore the evidence &amp; playbook</h2>
<div class="toolbar"><label class="field">Search all source content<input id="search" type="search" placeholder="Try backups, CI gate, credentials…" autocomplete="off"></label><label class="field filter">Source type<select id="kind"><option value="all">All sources</option><option value="consumer">Consumer evidence</option><option value="reference">Upstream / reference</option><option value="procedure">Guides &amp; procedures</option></select></label><button id="reset" type="button">Reset</button></div>
<p class="search-status" id="results" role="status" aria-live="polite">Showing all ${sources.length} sources</p><div class="panel empty" id="empty" hidden><h2>No matching sources</h2><p>Try a broader search or reset the source filter.</p></div>
${evidenceHtml}${documentsHtml}
<footer class="footer">Generated from ${reference ? "bundled skill references only" : "every docs/*.md, docs/acceptance/*-acceptance.json and bundled skill reference"}. Evidence keys and source lists are sorted; array order is preserved. Regenerate with <code>npm --prefix .github/skills/initialize-project run docs:build</code> after any documentation or skill-reference change.<p class="digest">Input fingerprint · ${fingerprint}</p></footer>
</main></div><script>${interaction}</script></body></html>
`;
}

export async function syncProjectPage(root = workspace, check = false) {
  const html = buildProjectHtml(await loadSources(root));
  const destination = resolve(root, "docs/project.html");
  if (check) {
    if ((await readFile(destination, "utf8")) !== html) {
      throw new Error(
        "docs/project.html is stale. Run npm --prefix .github/skills/initialize-project run docs:build and commit the updated page.",
      );
    }
  } else {
    await mkdir(resolve(root, "docs"), { recursive: true });
    await writeFile(destination, html);
  }
}

export async function syncReferencePage(check = false) {
  const html = buildProjectHtml(await loadReferences(), { reference: true });
  const destination = resolve(skillDirectory, "web/reference.html");
  if (check) {
    if ((await readFile(destination, "utf8")) !== html)
      throw new Error(
        "Bundled reference is stale. Run the skill's docs:build and commit web/reference.html.",
      );
  } else {
    await writeFile(destination, html);
  }
}

async function main() {
  const { root, selected } = argumentsFor(process.argv.slice(2), ["--check"]);
  const check = selected.has("--check");
  await verifyWorkspace(root);
  await syncReferencePage(check);
  await syncProjectPage(root, check);
  console.log(
    check
      ? "Verified docs/project.html matches all documentation and acceptance inputs."
      : "Generated self-contained docs/project.html.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
