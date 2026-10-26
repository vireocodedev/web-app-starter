// One catalog drives questionnaire coverage, persistence and the execution gate.
const text = (v) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 2000;
const oneOf =
  (...values) =>
  (v) =>
    values.includes(v);
const match = (pattern) => (v) => text(v) && pattern.test(v);
const list = (v) => Array.isArray(v) && v.length > 0 && v.every(text);
const ref = (v) => text(v) && /^(?:\/|~\/|store:|profile:|tool:)/.test(v);
const host = match(
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/,
);
const timezone = (v) => {
  try {
    return text(v) && Boolean(new Intl.DateTimeFormat("en", { timeZone: v }));
  } catch {
    return false;
  }
};
const javaKeywords = new Set(
  "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null _".split(
    " ",
  ),
);
const javaPackage = (v) =>
  match(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/)(v) &&
  v.split(".").every((part) => !javaKeywords.has(part));
const field = (topic, question, validate, full = false) => ({
  topic,
  question,
  validate,
  full,
});
export const fields = {
  execution_scope: field(
    "scope",
    "Full setup, or explicitly local-only?",
    oneOf("full", "local-only"),
  ),
  repository: field(
    "repository",
    "Confirm the detected owner/repository.",
    match(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  ),
  project_slug: field(
    "identity",
    "Application slug (3–40 characters)?",
    (v) =>
      match(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/)(v) &&
      v.length >= 3 &&
      v.length <= 40,
  ),
  display_name: field("identity", "Application display name?", text),
  java_base_package: field(
    "identity",
    "Java application namespace?",
    javaPackage,
  ),
  pwa_short_name: field(
    "identity",
    "Installed application short name (at most 12 characters)?",
    (v) => text(v) && [...v].length <= 12,
  ),
  localization_policy: field(
    "identity",
    "Same name in both existing locales, or exact approved localized names?",
    text,
  ),
  artwork_source: field(
    "identity",
    "Retain template artwork or supply an image directory reference?",
    (v) => v === "retain-template" || ref(v),
  ),
  theme_policy: field(
    "identity",
    "Confirm retaining the installed theme.",
    oneOf("retain"),
  ),
  data_boundary: field(
    "local",
    "Fresh isolated setup or resume the same identity?",
    oneOf("fresh-isolated", "resume-same-identity"),
  ),
  preserve_resources: field(
    "local",
    "Which existing files, resources and data must be preserved?",
    list,
  ),
  local_port_policy: field(
    "local",
    "Allocate free loopback ports or preserve defaults and block on collisions?",
    oneOf("allocate-free-loopback", "preserve-defaults-and-block"),
  ),
  prerequisite_policy: field(
    "local",
    "Allow locked project dependency installation, or no installation?",
    oneOf("locked-project-dependencies-only", "none"),
  ),
  credential_store: field(
    "accounts",
    "Protected store/directory reference for generated per-environment credentials?",
    ref,
  ),
  initial_username: field(
    "accounts",
    "Initial account username (does not grant an administrator role)?",
    text,
  ),
  initial_display_name: field(
    "accounts",
    "Initial account display name?",
    text,
  ),
  initial_email: field(
    "accounts",
    "Initial account email?",
    match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  ),
  github_account: field(
    "github",
    "Confirm the intended authenticated GitHub login.",
    match(/^[A-Za-z0-9][A-Za-z0-9-]*$/),
    true,
  ),
  allow_global_cli_switch: field(
    "github",
    "Allow changing the global CLI account? Scoped authentication is preferred.",
    oneOf("yes", "no"),
    true,
  ),
  authorized_maintainers: field(
    "github",
    "Explicit GitHub maintainer login allowlist?",
    (v) => list(v) && v.every(match(/^[A-Za-z0-9][A-Za-z0-9-]*$/)),
    true,
  ),
  operator_profile: field(
    "operator",
    "Existing protected operator profile reference?",
    ref,
    true,
  ),
  reuse_existing_operator: field(
    "operator",
    "Confirm reuse of existing shared CI, App and deployment host.",
    oneOf("yes"),
    true,
  ),
  production_hostname: field("dns", "Owned production hostname?", host, true),
  staging_hostname: field(
    "dns",
    "Distinct owned staging hostname?",
    host,
    true,
  ),
  dns_mode: field(
    "dns",
    "Records already prepared, or authorize creating only missing records?",
    oneOf("user-prepared", "agent-create-missing"),
    true,
  ),
  deployment_port_range: field(
    "operator",
    "Approved loopback port range, or use the selected profile?",
    (v) =>
      v === "use-profile" ||
      (Array.isArray(v) &&
        v.length === 2 &&
        v.every(Number.isInteger) &&
        v[0] >= 1024 &&
        v[1] <= 65535 &&
        v[0] <= v[1]),
    true,
  ),
  registry_policy: field(
    "registry",
    "Require absent image packages, or resume packages bound to this same repository?",
    oneOf("require-absent", "same-repository-resume"),
    true,
  ),
  backup_destination: field(
    "backup",
    "Same-server or an existing supported operator destination reference?",
    (v) => v === "same-server" || ref(v),
    true,
  ),
  same_server_loss_acknowledged: field(
    "backup",
    "Accept total host loss for same-server backups; otherwise not-required?",
    oneOf("yes", "not-required"),
    true,
  ),
  backup_time: field(
    "backup",
    "Supported daily production backup time HH:mm?",
    match(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/),
    true,
  ),
  backup_timezone: field("backup", "IANA backup timezone?", timezone, true),
  backup_retention_days: field(
    "backup",
    "Confirm supported 30-day retention; staging remains unscheduled.",
    (v) => v === 30,
    true,
  ),
  new_paid_resource_ceiling: field(
    "bounds",
    "Confirm zero new paid hosts/subscriptions/resizes/rebuilds.",
    (v) => v === 0,
  ),
  action_scope: field(
    "scope",
    "Confirm exact permitted actions after reviewing resolved targets.",
    (v) =>
      list(v) &&
      new Set(v).size === v.length &&
      v.every((item) => actions.includes(item)),
  ),
};
export const actions = [
  "personalize",
  "install-locked-dependencies",
  "local-verification",
  "provision-initial-accounts",
  "commit-push",
  "configure-github-ci",
  "register-existing-operator",
  "create-missing-dns",
  "prepare-environments",
  "publish-images",
  "deploy-staging",
  "promote-production",
  "configure-backup",
  "isolated-restore",
];
export const prerequisites = {
  repository_identity: {
    full: false,
    question:
      "Exact origin/worktree, Git identity, existing changes and data ownership inspected.",
  },
  local_tools: {
    full: false,
    question:
      "Declared runtimes, Docker, browser automation and dependency-install policy are ready.",
  },
  ide_consent: {
    full: false,
    question:
      "Workspace trust, required IDE extensions and Java import consent are prepared.",
  },
  credential_storage: {
    full: false,
    question:
      "Protected credential destination is available; record references only.",
  },
  github_access: {
    full: true,
    question:
      "Selected CLI actor, private repository/admin/Actions access and main-protection plan verified.",
  },
  app_consent: {
    full: true,
    question:
      "Existing selected-repository App installation includes this consumer; owner consent saved.",
  },
  operator_access: {
    full: true,
    question:
      "Existing operator profile, strict SSH host trust, reviewed source/receipt, capacity and allocation verified.",
  },
  dns_access: {
    full: true,
    question:
      "Exact provider zone/project authority and hostname conflicts verified.",
  },
  registry_access: {
    full: true,
    question:
      "GHCR package ownership and push/pull access verified for the selected policy.",
  },
  backup_access: {
    full: true,
    question:
      "Supported destination, schedule and isolated restore target are prepared.",
  },
};
export const schemaVersion = 1;
export function assess(state) {
  const full =
    state.answers.execution_scope?.status === "answered" &&
    state.answers.execution_scope.value === "full";
  const missing = [];
  const invalid = [];
  for (const [id, f] of Object.entries(fields)) {
    const answer = state.answers[id];
    if (f.full && !full) continue;
    if (answer?.status !== "answered") missing.push(id);
    else if (!f.validate(answer.value)) invalid.push(id);
  }
  if (state.answers.repository?.value !== state.repository.name)
    invalid.push("repository");
  if (
    full &&
    state.answers.production_hostname?.value ===
      state.answers.staging_hostname?.value
  )
    invalid.push("staging_hostname");
  if (
    full &&
    state.answers.backup_destination?.value === "same-server" &&
    state.answers.same_server_loss_acknowledged?.value !== "yes"
  )
    invalid.push("same_server_loss_acknowledged");
  if (
    full &&
    state.answers.backup_destination?.value !== "same-server" &&
    state.answers.same_server_loss_acknowledged?.value !== "not-required"
  )
    invalid.push("same_server_loss_acknowledged");
  const requiredActions = [
    "personalize",
    "local-verification",
    "provision-initial-accounts",
  ];
  if (
    state.answers.prerequisite_policy?.value ===
    "locked-project-dependencies-only"
  )
    requiredActions.push("install-locked-dependencies");
  if (full)
    requiredActions.push(
      "commit-push",
      "configure-github-ci",
      "register-existing-operator",
      "prepare-environments",
      "publish-images",
      "deploy-staging",
      "promote-production",
      "configure-backup",
      "isolated-restore",
    );
  if (full && state.answers.dns_mode?.value === "agent-create-missing")
    requiredActions.push("create-missing-dns");
  const selected = state.answers.action_scope?.value;
  if (
    !Array.isArray(selected) ||
    requiredActions.some((id) => !selected.includes(id)) ||
    (!full && selected.some((id) => !requiredActions.includes(id)))
  )
    invalid.push("action_scope");
  const blocked = Object.entries(prerequisites)
    .filter(
      ([id, p]) =>
        (!p.full || full) &&
        (state.prerequisites[id]?.status !== "ready" ||
          !text(state.prerequisites[id]?.evidence)),
    )
    .map(([id]) => id);
  return {
    missing: [...new Set(missing)],
    invalid: [...new Set(invalid)],
    blocked,
  };
}
