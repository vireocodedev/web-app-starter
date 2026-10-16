export const steps = [
  {
    id: "mode",
    title: "Choose the outcome",
    text: "Prepare a read-only plan, or authorize initialization only after the agent verifies live readiness. This wizard never executes either workflow.",
    fields: ["execution_mode"],
  },
  {
    id: "repository",
    title: "Connect your repository",
    text: "Create a private consumer from the template, clone it, and sign in to the intended GitHub CLI account. Browser login and CLI login are separate.",
    fields: ["repository", "github_account", "allow_global_cli_switch"],
    prerequisites: [1],
    links: [
      ["Create a consumer", "https://github.com/vireocodedev/web-app-starter"],
      ["GitHub CLI login", "https://cli.github.com/manual/gh_auth_login"],
    ],
    command: "gh auth status",
  },
  {
    id: "operator",
    title: "Reuse the existing operator",
    text: "Ask the authorized operator for its existing protected profile reference. Do not create another server, pool or App. Enter only a path/reference, never the profile's credentials.",
    fields: [
      "operator_profile",
      "reuse_existing_operator",
      "authorized_maintainers",
    ],
    prerequisites: [4],
  },
  {
    id: "identity",
    title: "Name your application",
    text: "Choose the consumer identity deliberately. The slug scopes new resources; the display name is what people see.",
    fields: ["project_slug", "display_name"],
  },
  {
    id: "namespace",
    title: "Set code and installed-app names",
    text: "Use an explicit Java application namespace. The short installed-app name has a 12-character limit; keep names consistent across locales unless you supply exact localized names.",
    fields: ["java_base_package", "pwa_short_name", "localization_policy"],
  },
  {
    id: "boundary",
    title: "Keep artwork and existing data safe",
    text: "Retain the current theme. Supply an image directory or deliberately retain template artwork. A fresh isolated app preserves every older app and database; a rename or migration is separate work.",
    fields: [
      "artwork_source",
      "theme_policy",
      "data_boundary",
      "preserve_resources",
    ],
    prerequisites: [0],
  },
  {
    id: "actions",
    title: "Check GitHub repository access",
    text: "Open repository Settings → Actions → General. The pinned template Actions must be permitted, and the operator needs repository administration and private required-check support. The agent binds main protection only after genuine CI exists.",
    fields: [],
    prerequisites: [2],
    service: "actions",
  },
  {
    id: "app",
    title: "Save the App's repository selection",
    text: "In organization Settings → GitHub Apps, configure the existing shared App. Add only this repository under selected repositories, preserve existing selections and save. Obtain owner consent now if your account cannot do this.",
    fields: [],
    prerequisites: [3],
    service: "app",
    links: [
      [
        "Why installation and authorization differ",
        "https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party",
      ],
    ],
  },
  {
    id: "registry",
    title: "Resolve package ownership",
    text: "Inspect the repository-derived frontend/backend packages before approving writes. Preserve unrelated packages by default. Replacement needs exact IDs, owners, all-version counts and explicit old-image-loss consent.",
    fields: [
      "registry_policy",
      "registry_delete_auth",
      "old_image_loss_acknowledged",
    ],
    prerequisites: [6, 7],
    replacements: true,
    service: "packages",
    command: "gh auth refresh --hostname github.com --scopes delete:packages",
  },
  {
    id: "dns",
    title: "Prepare the two DNS names",
    text: "Select the existing project that owns the DNS zone. Check A/AAAA/CNAME and wildcard conflicts. Preserve matching records. Either prepare the two records yourself or authorize only missing-record creation using the operator's protected reference.",
    fields: ["production_hostname", "staging_hostname", "dns_mode"],
    prerequisites: [5],
    links: [["Open Hetzner Console", "https://console.hetzner.com/"]],
  },
  {
    id: "account",
    title: "Choose the initial account",
    text: "Supply identity only. The agent generates distinct local/staging/production passwords into protected files later. An account named admin still has the standard USER authority.",
    fields: ["initial_username", "initial_display_name", "initial_email"],
  },
  {
    id: "destination",
    title: "Choose the backup destination",
    text: "Same-server storage cannot survive loss of that server. Accept that risk explicitly or supply an already supported operator destination. A downloaded rehearsal copy is not an automatic off-server backup service.",
    fields: ["backup_destination", "same_server_loss_acknowledged"],
  },
  {
    id: "schedule",
    title: "Set the recovery schedule",
    text: "Choose an operator-supported daily time and IANA timezone. Retention stays 30 days, staging stays unscheduled, and the production timer is enabled only after real initialized retrieval and isolated restoration pass.",
    fields: ["backup_time", "backup_timezone", "backup_retention_days"],
  },
  {
    id: "ports",
    title: "Bound mechanical allocation",
    text: "The agent may choose only genuinely unused ports within these bounds, preserving existing workloads. Changing a local port also updates every related launch/proxy/configuration reference.",
    fields: ["deployment_port_range", "local_port_policy"],
  },
  {
    id: "tools",
    title: "Prepare your trusted workspace",
    text: "Prepare JDK 21, Node 24/npm 12, Docker/Compose and trusted VS Code Java/Gradle/debugger extensions. Allow import to finish, but do not start an old-identity database. Actual personalized IDE launches still need a verified unattended tool path.",
    fields: [
      "prerequisite_policy",
      "new_paid_resource_ceiling",
      "form_version",
    ],
    prerequisites: [8],
    links: [
      [
        "VS Code Java debugging",
        "https://code.visualstudio.com/docs/java/java-debugging",
      ],
    ],
  },
  {
    id: "review",
    title: "Review the exact preparation",
    text: "Review the names, boundaries and references before authorizing actions. These attestations do not prove provider access or runtime success; the agent independently verifies them.",
    fields: [],
    prerequisites: [9],
    review: true,
  },
  {
    id: "scope-app",
    title: "Authorize application and CI work",
    text: "Check only actions you actually authorize for this exact consumer. No checkbox authorizes an upstream publication, new host, privileged-source upgrade or database reset.",
    fields: [],
    approvals: [0, 1, 2, 3],
    executionOnly: true,
  },
  {
    id: "scope-release",
    title: "Authorize isolated release preparation",
    text: "Limit changes to the declared DNS names, approved namespace and available capacity. Production must promote the exact successful staging pair without rebuilding.",
    fields: [],
    approvals: [4, 5, 6],
    executionOnly: true,
  },
  {
    id: "scope-recovery",
    title: "Authorize recovery and exact cleanup",
    text: "Live database restoration and password resets remain excluded. Optional package deletion applies only to the exact listed packages/versions; no list means no deletion authority.",
    fields: [],
    approvals: [7, 8, 9],
    executionOnly: true,
  },
  {
    id: "signature",
    title: "Sign the bounded request",
    text: "Enter your authorized GitHub account and an explicit UTC validity window. Time buttons are optional human actions, not automatic approval or renewal. Any later edit requires another final review.",
    fields: [
      "approval_signer",
      "approval_signed_at",
      "approval_expires_at",
      "stable_learning_proposals",
    ],
    executionOnly: true,
  },
  {
    id: "save",
    title: "Save the workbook, not a deployment",
    text: "Review once more and save the private Markdown workbook. Then invoke /initialize-project in a fresh agent chat. Missing live prerequisites produce a readiness report; the wizard never runs provider commands.",
    fields: [],
    save: true,
  },
];

export const options = {
  execution_mode: ["plan-only", "execute-listed-scope"],
  reuse_existing_operator: ["yes"],
  allow_global_cli_switch: ["no", "yes"],
  theme_policy: ["retain"],
  data_boundary: ["fresh-isolated", "resume-same-identity"],
  dns_mode: ["user-prepared", "agent-create-missing"],
  same_server_loss_acknowledged: ["yes", "not-required"],
  local_port_policy: ["allocate-free-loopback", "preserve-defaults-and-block"],
  prerequisite_policy: ["locked-project-dependencies-only", "none"],
  registry_policy: [
    "require-absent",
    "same-repository-resume",
    "replace-listed-only",
  ],
  registry_delete_auth: ["not-required", "completed"],
  old_image_loss_acknowledged: ["not-required", "yes"],
};
export const fixed = {
  form_version: "1",
  backup_retention_days: "30",
  new_paid_resource_ceiling: "0",
};
const login = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const repository = /^[a-z\d-]+\/[a-z\d_.-]+$/i;
const keywords = new Set(
  "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null".split(
    " ",
  ),
);
const secret =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:github_pat_|gh[pousr]_)[a-z\d_]{12,}|\b(?:HCLOUD_TOKEN|PASSWORD|PRIVATE_KEY)\s*=/i;

export function cells(line) {
  const result = [];
  let value = "";
  for (let index = 0; index < line.length; index++) {
    if (line[index] === "\\" && ["\\", "|"].includes(line[index + 1]))
      value += line[++index];
    else if (line[index] === "|") {
      result.push(value.trim());
      value = "";
    } else value += line[index];
  }
  result.push(value.trim());
  return result.slice(1, -1);
}

function block(markdown, number) {
  const start = markdown.indexOf(`## ${number}. `);
  if (start < 0) throw new Error(`Missing preparation section ${number}`);
  const end = markdown.indexOf("\n## ", start + 1);
  return markdown.slice(start, end < 0 ? undefined : end);
}

function checkboxes(markdown, number) {
  return [...block(markdown, number).matchAll(/^- \[([ xX])\] (.+)$/gm)].map(
    (match) => ({
      text: match[2],
      checked: match[1] !== " ",
    }),
  );
}

export function parseTemplate(markdown) {
  const fields = markdown
    .split("\n")
    .filter((line) => /^\| `[a-z_]+` \|/.test(line))
    .map((line) => {
      const [key, value, description] = cells(line);
      return { id: key.slice(1, -1), value, description };
    });
  const ids = fields.map((field) => field.id);
  const grouped = steps.flatMap((step) => step.fields);
  if (
    ids.length !== new Set(ids).size ||
    grouped.length !== new Set(grouped).size ||
    [...ids].sort().join() !== [...grouped].sort().join()
  )
    throw new Error("Wizard steps and Markdown answer fields differ");
  const prerequisites = checkboxes(markdown, 7);
  const approvals = checkboxes(markdown, 8);
  if (
    prerequisites.length !== 10 ||
    approvals.length !== 10 ||
    [...prerequisites, ...approvals].some((item) => item.checked)
  ) {
    throw new Error(
      "The preparation template must contain ten unchecked prerequisites and ten unchecked action scopes",
    );
  }
  return {
    markdown,
    fields,
    prerequisites: prerequisites.map((item) => item.text),
    approvals: approvals.map((item) => item.text),
    steps,
  };
}

export function emptyDraft(schema, detectedRepository = "") {
  const answers = Object.fromEntries(
    schema.fields.map((field) => [
      field.id,
      field.value === "REQUIRED" ? "" : field.value,
    ]),
  );
  if (detectedRepository) answers.repository = detectedRepository;
  return {
    version: 1,
    answers,
    prerequisites: schema.prerequisites.map(() => false),
    approvals: schema.approvals.map(() => false),
    replacements: [],
    step: 0,
  };
}

export function assertDraft(schema, draft) {
  const keys = [
    "version",
    "answers",
    "prerequisites",
    "approvals",
    "replacements",
    "step",
  ];
  if (
    !draft ||
    typeof draft !== "object" ||
    Object.keys(draft).sort().join() !== keys.sort().join() ||
    draft.version !== 1 ||
    !Number.isInteger(draft.step) ||
    draft.step < 0 ||
    draft.step >= steps.length
  )
    throw new Error("Invalid preparation draft");
  if (
    !draft.answers ||
    Object.keys(draft.answers).sort().join() !==
      schema.fields
        .map((field) => field.id)
        .sort()
        .join()
  )
    throw new Error("Draft answer fields do not match the workbook");
  for (const [id, value] of Object.entries(draft.answers)) {
    if (
      typeof value !== "string" ||
      value.length > 2048 ||
      /[\r\n\0]/.test(value)
    )
      throw new Error(`Invalid value format for ${id}`);
    if (secret.test(value))
      throw new Error(
        `Use a protected reference, not credential contents, in ${id}`,
      );
  }
  for (const [key, count] of [
    ["prerequisites", 10],
    ["approvals", 10],
  ]) {
    if (
      !Array.isArray(draft[key]) ||
      draft[key].length !== count ||
      draft[key].some((value) => typeof value !== "boolean")
    )
      throw new Error(`Invalid ${key}`);
  }
  if (!Array.isArray(draft.replacements) || draft.replacements.length > 2)
    throw new Error("Only the two derived image packages can be listed");
  for (const row of draft.replacements) {
    if (
      !row ||
      Object.keys(row).sort().join() !==
        ["name", "id", "repository", "versions"].sort().join()
    )
      throw new Error("Invalid replacement row");
    for (const value of Object.values(row)) {
      if (
        typeof value !== "string" ||
        value.length > 200 ||
        /[\r\n\0]/.test(value) ||
        secret.test(value)
      )
        throw new Error("Invalid or sensitive replacement value");
    }
  }
}

export function validatePreparation(schema, draft, context = {}) {
  assertDraft(schema, draft);
  const errors = {};
  const put = (id, message) => {
    errors[id] ??= message;
  };
  const a = draft.answers;
  const execute = a.execution_mode === "execute-listed-scope";
  if (!options.execution_mode.includes(a.execution_mode))
    put("execution_mode", "Choose a read-only plan or bounded execution.");
  for (const field of schema.fields) {
    const value = a[field.id];
    if (value !== value.trim())
      put(field.id, "Remove leading or trailing whitespace.");
    if (execute && (!value.trim() || value === "REQUIRED"))
      put(field.id, "Answer this before authorizing execution.");
    if (value && options[field.id] && !options[field.id].includes(value))
      put(field.id, "Choose one of the supported options.");
    if (fixed[field.id] !== undefined && value !== fixed[field.id])
      put(field.id, `The supported fixed value is ${fixed[field.id]}.`);
  }
  if (a.repository && !repository.test(a.repository))
    put("repository", "Use owner/repository, not a URL.");
  if (execute && a.repository.toLowerCase() === "vireocodedev/web-app-starter")
    put(
      "repository",
      "Create a private consumer; the canonical template cannot be initialized.",
    );
  if (
    execute &&
    (!context.repository ||
      a.repository.toLowerCase() !== context.repository.toLowerCase())
  )
    put(
      "repository",
      "The declared repository must match this checkout's verified Git remote.",
    );
  for (const id of ["github_account", "approval_signer"]) {
    if (a[id] && a[id] !== "use-profile" && !login.test(a[id]))
      put(id, "Use an exact GitHub login.");
  }
  if (a.approval_signer === "use-profile")
    put("approval_signer", "Type the account signing this request explicitly.");
  if (
    a.authorized_maintainers !== "use-profile" &&
    a.authorized_maintainers &&
    a.authorized_maintainers
      .split(",")
      .some((value) => !login.test(value.trim()))
  )
    put(
      "authorized_maintainers",
      "Use comma-separated GitHub logins or use-profile.",
    );
  if (
    a.project_slug &&
    (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(a.project_slug) ||
      a.project_slug.length < 3 ||
      a.project_slug.length > 40)
  )
    put(
      "project_slug",
      "Use 3–40 lowercase letters/digits with single hyphens, starting with a letter.",
    );
  if (
    a.java_base_package &&
    (!/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/.test(a.java_base_package) ||
      a.java_base_package.split(".").some((value) => keywords.has(value)))
  )
    put(
      "java_base_package",
      "Use a dotted lowercase Java namespace without reserved words.",
    );
  if ([...a.pwa_short_name].length > 12)
    put("pwa_short_name", "Use at most 12 characters.");
  for (const id of ["production_hostname", "staging_hostname"]) {
    if (
      a[id] &&
      (a[id].length > 253 ||
        a[id].split(".").length < 2 ||
        a[id]
          .split(".")
          .some((part) => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/.test(part)))
    )
      put(id, "Use an owned lowercase FQDN without scheme, path or wildcard.");
  }
  if (a.production_hostname && a.production_hostname === a.staging_hostname)
    put("staging_hostname", "Staging and production need distinct names.");
  if (a.initial_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.initial_email))
    put("initial_email", "Use an explicit email address.");
  for (const [id, maximum] of [
    ["initial_username", 100],
    ["initial_email", 254],
    ["initial_display_name", 200],
  ]) {
    if (a[id].length > maximum)
      put(
        id,
        `Use at most ${maximum} characters, matching the backend contract.`,
      );
  }
  if (a.backup_time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(a.backup_time))
    put("backup_time", "Use a supported daily time in HH:MM format.");
  if (a.backup_timezone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: a.backup_timezone });
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      put("backup_timezone", "Use a valid IANA timezone.");
    }
  }
  if (
    a.backup_destination === "same-server" &&
    a.same_server_loss_acknowledged &&
    a.same_server_loss_acknowledged !== "yes"
  )
    put(
      "same_server_loss_acknowledged",
      "Same-server loss risk must be explicitly accepted.",
    );
  if (
    a.backup_destination &&
    a.backup_destination !== "same-server" &&
    a.same_server_loss_acknowledged &&
    a.same_server_loss_acknowledged !== "not-required"
  )
    put(
      "same_server_loss_acknowledged",
      "For another supported destination, select not-required.",
    );
  if (a.deployment_port_range && a.deployment_port_range !== "use-profile") {
    const range = /^(\d+)-(\d+)$/.exec(a.deployment_port_range);
    if (
      !range ||
      +range[1] < 1024 ||
      +range[2] > 65535 ||
      +range[2] - +range[1] < 3
    )
      put(
        "deployment_port_range",
        "Use use-profile or an approved four-or-more-port range such as 18000-18999.",
      );
  }
  const replacing = a.registry_policy === "replace-listed-only";
  if (!replacing && draft.replacements.length)
    put(
      "replacements",
      "Remove these rows or explicitly select listed-only replacement.",
    );
  if (replacing) {
    if (!draft.replacements.length)
      put(
        "replacements",
        "List the exact package IDs, owners and complete version counts.",
      );
    const derived = a.repository.split("/").at(-1).toLowerCase();
    const names = new Set();
    const ids = new Set();
    for (const row of draft.replacements) {
      if (
        ![`${derived}-frontend`, `${derived}-backend`].includes(row.name) ||
        names.has(row.name) ||
        !/^[1-9]\d*$/.test(row.id) ||
        !Number.isSafeInteger(+row.id) ||
        ids.has(row.id) ||
        !repository.test(row.repository) ||
        !/^(?:0|[1-9]\d*)$/.test(row.versions) ||
        !Number.isSafeInteger(+row.versions)
      )
        put(
          "replacements",
          "Each unique row must name a derived package, positive numeric ID, owner/repository and complete nonnegative version count.",
        );
      names.add(row.name);
      ids.add(row.id);
    }
    if (execute && a.registry_delete_auth !== "completed")
      put(
        "registry_delete_auth",
        "Complete the conditional native GitHub authorization first.",
      );
    if (execute && a.old_image_loss_acknowledged !== "yes")
      put(
        "old_image_loss_acknowledged",
        "Explicitly acknowledge that the old digests become unavailable.",
      );
  } else if (
    a.registry_delete_auth !== "not-required" ||
    a.old_image_loss_acknowledged !== "not-required"
  )
    put(
      "registry_delete_auth",
      "Without deletion, both deletion-specific answers must be not-required.",
    );
  const times = {};
  for (const id of ["approval_signed_at", "approval_expires_at"]) {
    if (a[id]) {
      times[id] = Date.parse(a[id]);
      const match =
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|\+00:00)$/.exec(
          a[id],
        );
      if (
        !match ||
        !Number.isFinite(times[id]) ||
        new Date(times[id]).toISOString().slice(0, 16) !== match[1] ||
        new Date(times[id]).toISOString().slice(17, 19) !== (match[2] ?? "00")
      )
        put(id, "Use a valid ISO-8601 UTC timestamp.");
    }
  }
  if (execute) {
    const now = context.now ?? Date.now();
    if (times.approval_signed_at > now)
      put("approval_signed_at", "A signature cannot be dated in the future.");
    if (
      times.approval_expires_at <= now ||
      times.approval_expires_at <= times.approval_signed_at
    )
      put(
        "approval_expires_at",
        "Choose a later, unexpired authorization window.",
      );
    if (
      a.github_account !== "use-profile" &&
      a.approval_signer !== a.github_account
    )
      put(
        "approval_signer",
        "The signer must match the selected GitHub account.",
      );
    draft.prerequisites.forEach((checked, index) => {
      if (!checked && !(index === 7 && !replacing))
        put(`prerequisite-${index}`, "Complete this human prerequisite.");
    });
    draft.approvals.forEach((checked, index) => {
      if (!checked && !(index === 9 && !replacing))
        put(`approval-${index}`, "This required action is not authorized.");
    });
  }
  return errors;
}

export function activeSteps(draft) {
  return steps.filter(
    (step) =>
      !step.executionOnly || draft.answers.execution_mode !== "plan-only",
  );
}

function escapeCell(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|");
}

export function workbookTemplate(markdown) {
  return markdown.replace(/\]\((\.{1,2}\/[^)\s]*)\)/g, (_, target) => {
    const url = new URL(
      target,
      "https://workspace/.agents/skills/initialize-project/references/preparation.md",
    );
    return `](..${url.pathname}${url.hash})`;
  });
}

export function renderWorkbook(schema, draft) {
  assertDraft(schema, draft);
  const fields = new Map(schema.fields.map((field) => [field.id, field]));
  let section = 0,
    prerequisite = 0,
    approval = 0;
  const lines = workbookTemplate(schema.markdown)
    .split("\n")
    .map((line) => {
      const heading = /^## (\d+)\. /.exec(line);
      if (heading) section = +heading[1];
      if (/^\| `[a-z_]+` \|/.test(line)) {
        const row = cells(line);
        const id = row[0].slice(1, -1);
        if (!fields.has(id)) throw new Error("Unknown workbook field");
        return `| \`${id}\` | ${escapeCell(draft.answers[id] || "REQUIRED")} | ${escapeCell(row[2])} |`;
      }
      if (/^- \[[ xX]\] /.test(line) && (section === 7 || section === 8)) {
        const checked =
          section === 7
            ? draft.prerequisites[prerequisite++]
            : draft.approvals[approval++];
        return line.replace(/^- \[[ xX]\]/, `- [${checked ? "x" : " "}]`);
      }
      return line;
    });
  const header = lines.findIndex((line) =>
    line.startsWith("| Exact package name |"),
  );
  if (header < 0) throw new Error("Missing replacement table");
  let end = header + 2;
  while (lines[end]?.startsWith("|")) end++;
  lines.splice(
    header + 2,
    end - header - 2,
    ...draft.replacements.map(
      (row) =>
        `| ${[row.name, row.id, row.repository, row.versions].map(escapeCell).join(" | ")} |`,
    ),
  );
  return lines.join("\n");
}

export function importWorkbook(schema, markdown) {
  if (secret.test(markdown))
    throw new Error(
      "The existing workbook contains credential-like material; keep secrets in protected stores",
    );
  const parsed = parseTemplate(markdown.replace(/^- \[[xX]\]/gm, "- [ ]"));
  const draft = emptyDraft(schema);
  if (
    parsed.fields
      .map((field) => field.id)
      .sort()
      .join() !==
    schema.fields
      .map((field) => field.id)
      .sort()
      .join()
  )
    throw new Error("Existing workbook fields need reconciliation");
  for (const field of parsed.fields)
    draft.answers[field.id] = field.value === "REQUIRED" ? "" : field.value;
  for (const [number, key] of [
    [7, "prerequisites"],
    [8, "approvals"],
  ]) {
    const values = checkboxes(markdown, number);
    if (
      values.length !== schema[key].length ||
      values.some((item, index) => item.text !== schema[key][index])
    )
      throw new Error(
        "Existing consent wording differs; preserve it and reconcile before using the wizard",
      );
    draft[key] = values.map((value) => value.checked);
  }
  const lines = markdown.split("\n");
  const header = lines.findIndex((line) =>
    line.startsWith("| Exact package name |"),
  );
  for (let index = header + 2; lines[index]?.startsWith("|"); index++) {
    const values = cells(lines[index]);
    if (values.length !== 4)
      throw new Error("Invalid existing replacement row");
    draft.replacements.push(
      Object.fromEntries(
        ["name", "id", "repository", "versions"].map((key, i) => [
          key,
          values[i],
        ]),
      ),
    );
  }
  assertDraft(schema, draft);
  return draft;
}
