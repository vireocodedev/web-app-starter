import {
  activeSteps,
  assertDraft,
  fixed,
  options,
  steps,
  validatePreparation,
} from "./model.mjs";

const byId = (id) => document.getElementById(id);
const title = (id) =>
  ({
    pwa_short_name: "Installed-app short name",
    java_base_package: "Java application package",
    operator_profile: "Protected operator profile reference",
    approval_signed_at: "Signed at (UTC)",
    approval_expires_at: "Authorization expires at (UTC)",
  })[id] ??
  id.replaceAll("_", " ").replace(/^./, (value) => value.toUpperCase());
const cleanText = (value) => value.replace(/`|\*\*/g, "");
const placeholders = {
  project_slug: "inventory-portal",
  display_name: "Inventory Portal",
  java_base_package: "com.acme.inventory",
  pwa_short_name: "Inventory",
  operator_profile: "~/protected/operator-profile.json",
  production_hostname: "portal.example.com",
  staging_hostname: "portal-staging.example.com",
  initial_username: "admin",
  initial_display_name: "Your display name",
  initial_email: "you@example.com",
  backup_destination: "same-server or a supported operator reference",
  backup_time: "03:00",
  backup_timezone: "Europe/Zagreb",
  deployment_port_range: "use-profile or 18000-18999",
};
const choiceLabels = {
  "plan-only": "Read-only readiness plan",
  "execute-listed-scope": "Full initialization within my written bounds",
  "fresh-isolated": "New isolated application; preserve existing data",
  "resume-same-identity": "Resume this same approved application identity",
  "user-prepared": "I prepared the DNS records",
  "agent-create-missing": "The agent may create only missing matching records",
  "require-absent": "Fresh package names; block if already owned",
  "same-repository-resume": "Existing packages belong to this same repository",
  "replace-listed-only": "Replace only the exact packages I list",
  "not-required": "Not required for this scope",
  "locked-project-dependencies-only":
    "Restore only declared locked project dependencies",
  "allocate-free-loopback": "Allocate unused local loopback ports consistently",
  "preserve-defaults-and-block": "Keep defaults; block if a port is occupied",
};
function element(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "className") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key in node && !key.startsWith("aria-")) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children.flat())
    if (child !== undefined && child !== null)
      node.append(
        child instanceof Node ? child : document.createTextNode(String(child)),
      );
  return node;
}

let schema, context, draft, revision, workbookHash, workbookExists;
let edited = 0,
  saved = 0,
  saving = null,
  timer,
  reviewed = false,
  replaceExisting = false,
  visibleErrors = {};
const status = (message) => {
  byId("save-status").textContent = message;
};
const showError = (error) => {
  byId("global-error").hidden = false;
  byId("global-error").textContent = error.message;
  status("Not saved — resolve the error or retry");
};
const clearError = () => {
  byId("global-error").hidden = true;
};
async function api(route, method = "GET", input) {
  const response = await fetch(new URL(`api/${route}`, location.href), {
    method,
    headers: input ? { "Content-Type": "application/json" } : undefined,
    body: input ? JSON.stringify(input) : undefined,
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(
      result.error ?? "Local preparation request failed.",
    );
    error.issues = result.issues;
    throw error;
  }
  return result;
}
function changed(material = true) {
  edited++;
  if (material) {
    reviewed = false;
    const review = byId("reviewed");
    if (review) review.checked = false;
  }
  status("Unsaved changes");
  clearTimeout(timer);
  timer = setTimeout(() => flush().catch(showError), 450);
}
async function flush() {
  clearTimeout(timer);
  if (saving) {
    await saving;
    if (edited !== saved) return flush();
    return;
  }
  if (edited === saved) return;
  const captured = edited;
  const snapshot = structuredClone(draft);
  assertDraft(schema, snapshot);
  status("Saving private draft…");
  saving = api("draft", "PUT", { draft: snapshot, revision });
  try {
    const result = await saving;
    revision = result.revision;
    saved = captured;
    status("Draft saved on this machine");
    clearError();
  } finally {
    saving = null;
  }
  if (edited !== saved) return flush();
}
function updateAnswer(id, value, rerender = false) {
  draft.answers[id] = value;
  if (id === "registry_policy" && value !== "replace-listed-only") {
    draft.answers.registry_delete_auth =
      draft.answers.old_image_loss_acknowledged = "not-required";
    draft.approvals[9] = draft.prerequisites[7] = false;
  }
  changed();
  renderNavigation();
  if (rerender) {
    render();
    byId(`field-${id}`)?.focus();
  }
}
function issues() {
  return validatePreparation(schema, draft, context);
}
function currentStep() {
  return steps[draft.step];
}
function relevant(step, errors) {
  const ids = [
    ...step.fields,
    ...(step.prerequisites ?? []).map((index) => `prerequisite-${index}`),
    ...(step.approvals ?? []).map((index) => `approval-${index}`),
  ];
  if (step.replacements) ids.push("replacements");
  return Object.fromEntries(
    ids.filter((id) => errors[id]).map((id) => [id, errors[id]]),
  );
}
function renderNavigation() {
  const available = activeSteps(draft);
  const errors = issues();
  const position = available.findIndex((step) => step.id === currentStep().id);
  const navigation = byId("navigation");
  navigation.replaceChildren(
    ...available.map((step, index) => {
      const done =
        !step.save &&
        Object.keys(relevant(step, errors)).length === 0 &&
        step.fields.every((id) => draft.answers[id].trim()) &&
        (step.prerequisites ?? []).every(
          (index) =>
            draft.prerequisites[index] ||
            (index === 7 &&
              draft.answers.registry_policy !== "replace-listed-only"),
        ) &&
        (step.approvals ?? []).every(
          (index) =>
            draft.approvals[index] ||
            (index === 9 &&
              draft.answers.registry_policy !== "replace-listed-only"),
        );
      return element(
        "li",
        {},
        element(
          "button",
          {
            type: "button",
            ...(step.id === currentStep().id ? { "aria-current": "step" } : {}),
            onclick: () => jump(step),
          },
          element(
            "span",
            {
              className: `step-dot${done ? " complete" : ""}`,
              "aria-hidden": "true",
            },
            done ? "✓" : index + 1,
          ),
          step.title,
        ),
      );
    }),
  );
  byId("progress").max = available.length;
  byId("progress").value = position + 1;
  byId("progress-label").textContent =
    `Step ${position + 1} of ${available.length}`;
  byId("step-number").textContent =
    `Step ${position + 1} / ${available.length}`;
}
function jump(step) {
  draft.step = steps.findIndex((item) => item.id === step.id);
  visibleErrors = {};
  changed(false);
  render();
  byId("step-title").focus({ preventScroll: true });
  byId("panel").scrollIntoView({ block: "start", behavior: "instant" });
}
function field(field) {
  const id = field.id;
  const value = draft.answers[id];
  const inputId = `field-${id}`;
  const attributes = {
    id: inputId,
    name: id,
    "aria-describedby": `${inputId}-help ${inputId}-error`,
  };
  if (visibleErrors[id]) attributes["aria-invalid"] = "true";
  let input;
  if (options[id]) {
    input = element(
      "select",
      attributes,
      element("option", { value: "" }, "Choose…"),
      ...options[id].map((option) =>
        element(
          "option",
          { value: option },
          choiceLabels[option] ?? option.replaceAll("-", " "),
        ),
      ),
    );
    input.value = value;
    input.addEventListener("change", () =>
      updateAnswer(
        id,
        input.value,
        ["execution_mode", "registry_policy"].includes(id),
      ),
    );
  } else {
    const type =
      id === "initial_email"
        ? "email"
        : id === "backup_time"
          ? "time"
          : id.startsWith("approval_") && id !== "approval_signer"
            ? "datetime-local"
            : "text";
    input = element("input", {
      ...attributes,
      type,
      readOnly: fixed[id] !== undefined,
      placeholder: placeholders[id] ?? "",
      autocomplete: "off",
    });
    if (type === "datetime-local") {
      input.step = "1";
      input.value =
        value && Number.isFinite(Date.parse(value))
          ? new Date(value).toISOString().slice(0, 19)
          : "";
    } else input.value = value;
    input.addEventListener("input", () => {
      const next =
        type === "datetime-local" && input.value
          ? new Date(`${input.value}Z`).toISOString()
          : input.value;
      updateAnswer(id, next);
    });
  }
  const wrapper = element(
    "div",
    { className: "field" },
    element("label", { htmlFor: inputId }, title(id)),
    input,
    element(
      "p",
      { id: `${inputId}-help`, className: "help" },
      cleanText(field.description),
    ),
    element(
      "p",
      { id: `${inputId}-error`, className: "field-error" },
      visibleErrors[id] ?? "",
    ),
  );
  if (id === "approval_signed_at")
    wrapper.append(
      element(
        "div",
        { className: "inline-buttons" },
        element(
          "button",
          {
            type: "button",
            onclick: () => {
              updateAnswer(id, new Date().toISOString(), true);
            },
          },
          "Use current UTC time",
        ),
      ),
    );
  if (id === "approval_expires_at")
    wrapper.append(
      element(
        "div",
        { className: "inline-buttons" },
        element(
          "button",
          {
            type: "button",
            onclick: () => {
              updateAnswer(
                id,
                new Date(Date.now() + 86400000).toISOString(),
                true,
              );
            },
          },
          "Choose 24 hours from now",
        ),
      ),
    );
  return wrapper;
}
function check(key, index) {
  const id = `${key === "prerequisites" ? "prerequisite" : "approval"}-${index}`;
  const checkbox = element("input", {
    id,
    type: "checkbox",
    checked: draft[key][index],
    ...(visibleErrors[id]
      ? { "aria-invalid": "true", "aria-describedby": `${id}-error` }
      : {}),
  });
  checkbox.addEventListener("change", () => {
    draft[key][index] = checkbox.checked;
    changed();
    renderNavigation();
  });
  return element(
    "div",
    {},
    element(
      "label",
      { className: "check", htmlFor: id },
      checkbox,
      element("span", {}, cleanText(schema[key][index])),
    ),
    visibleErrors[id]
      ? element(
          "p",
          { id: `${id}-error`, className: "field-error error", tabIndex: -1 },
          visibleErrors[id],
        )
      : undefined,
  );
}
function replacementRows() {
  const content = element(
    "div",
    {},
    element(
      "p",
      { className: "notice" },
      "Delete only these exact packages/all listed versions. Old repositories, databases and unrelated packages are preserved. IDs/counts are rechecked by the agent.",
    ),
  );
  draft.replacements.forEach((row, index) => {
    const group = element(
      "fieldset",
      { className: "replacement" },
      element("legend", {}, `Replacement ${index + 1}`),
    );
    for (const [key, name] of [
      ["name", "Exact package name"],
      ["id", "Numeric package ID"],
      ["repository", "Current owner/repository"],
      ["versions", "All versions to delete"],
    ]) {
      const id = `replacement-${index}-${key}`;
      const input = element("input", {
        id,
        value: row[key],
        type: key === "id" || key === "versions" ? "number" : "text",
        min: key === "id" ? "1" : "0",
        autocomplete: "off",
      });
      input.addEventListener("input", () => {
        row[key] = input.value;
        changed();
        renderNavigation();
      });
      group.append(
        element(
          "div",
          { className: "field" },
          element("label", { htmlFor: id }, name),
          input,
        ),
      );
    }
    group.append(
      element(
        "button",
        {
          type: "button",
          onclick: () => {
            draft.replacements.splice(index, 1);
            changed();
            render();
          },
        },
        "Remove this row",
      ),
    );
    content.append(group);
  });
  if (draft.replacements.length < 2)
    content.append(
      element(
        "button",
        {
          type: "button",
          onclick: () => {
            draft.replacements.push({
              name: "",
              id: "",
              repository: "",
              versions: "",
            });
            changed();
            render();
          },
        },
        "Add exact replacement",
      ),
    );
  if (visibleErrors.replacements)
    content.append(
      element("p", { className: "error" }, visibleErrors.replacements),
    );
  return content;
}
function review() {
  const overview = element("dl");
  for (const id of [
    "execution_mode",
    "repository",
    "project_slug",
    "production_hostname",
    "staging_hostname",
    "backup_destination",
    "backup_time",
    "backup_timezone",
  ]) {
    overview.append(
      element(
        "div",
        {},
        element("dt", {}, title(id)),
        element("dd", {}, draft.answers[id] || "Unanswered"),
      ),
    );
  }
  const list = element("dl");
  for (const item of schema.fields)
    list.append(
      element(
        "div",
        {},
        element("dt", {}, title(item.id)),
        element(
          "dd",
          {},
          draft.answers[item.id] || "Unanswered — not authorized",
        ),
      ),
    );
  const checks = element("dl");
  for (const key of ["prerequisites", "approvals"]) {
    schema[key].forEach((item, index) =>
      checks.append(
        element(
          "div",
          {},
          element("dt", {}, cleanText(item)),
          element(
            "dd",
            {},
            draft[key][index] ? "Explicitly checked" : "Not checked",
          ),
        ),
      ),
    );
  }
  const replacements = element(
    "div",
    {},
    draft.replacements.length
      ? element(
          "pre",
          { className: "command", tabIndex: 0 },
          JSON.stringify(draft.replacements, null, 2),
        )
      : element(
          "p",
          {},
          "No package replacement rows. No old package deletion is authorized.",
        ),
  );
  return element(
    "div",
    {},
    overview,
    element(
      "details",
      {},
      element("summary", {}, "All answers and protected references"),
      list,
    ),
    element(
      "details",
      {},
      element("summary", {}, "Every attestation and action scope"),
      checks,
    ),
    element(
      "details",
      {},
      element("summary", {}, "Exact optional package replacements"),
      replacements,
    ),
  );
}
function services(step) {
  const links = [...(step.links ?? [])];
  const match = /^([a-z\d-]+)\/([a-z\d_.-]+)$/i.exec(draft.answers.repository);
  if (match && step.service) {
    const [, owner, repo] = match;
    const url =
      step.service === "actions"
        ? `https://github.com/${owner}/${repo}/settings/actions`
        : step.service === "app"
          ? `https://github.com/organizations/${owner}/settings/installations`
          : `https://github.com/orgs/${owner}/packages`;
    links.unshift([
      step.service === "app"
        ? "Configure the existing App"
        : step.service === "packages"
          ? "Inspect organization packages"
          : "Open repository Actions settings",
      url,
    ]);
  }
  const content = element(
    "div",
    { className: "links" },
    ...links.map(([name, href]) =>
      element(
        "a",
        { href, target: "_blank", rel: "noreferrer noopener" },
        `${name} ↗`,
      ),
    ),
  );
  if (
    step.command &&
    (step.id !== "registry" ||
      draft.answers.registry_policy === "replace-listed-only")
  )
    content.append(
      element("pre", { className: "command", tabIndex: 0 }, step.command),
    );
  return content;
}
function savePanel() {
  const errors = issues();
  const content = element("div", {}, review());
  if (Object.keys(errors).length) {
    const list = element("ul");
    for (const [id, message] of Object.entries(errors)) {
      const owner = steps.find(
        (step) =>
          step.fields.includes(id) ||
          (id === "replacements" && step.replacements) ||
          (step.prerequisites ?? []).some(
            (index) => id === `prerequisite-${index}`,
          ) ||
          (step.approvals ?? []).some((index) => id === `approval-${index}`),
      );
      list.append(
        element(
          "li",
          {},
          owner
            ? element(
                "a",
                {
                  href: "#panel",
                  onclick: (event) => {
                    event.preventDefault();
                    jump(owner);
                  },
                },
                `${owner.title}: ${message}`,
              )
            : message,
        ),
      );
    }
    content.append(
      element(
        "div",
        { className: "error" },
        "Resolve these items before saving:",
        list,
      ),
    );
  } else if (draft.answers.execution_mode === "plan-only")
    content.append(
      element(
        "p",
        { className: "notice" },
        "This is a read-only planning request. Unanswered inputs remain unresolved, not approved. No application/provider changes are authorized.",
      ),
    );
  if (workbookExists) {
    const checkbox = element("input", {
      id: "replace-existing",
      type: "checkbox",
      checked: replaceExisting,
    });
    checkbox.addEventListener("change", () => {
      replaceExisting = checkbox.checked;
    });
    content.append(
      element(
        "label",
        { className: "check", htmlFor: "replace-existing" },
        checkbox,
        element(
          "span",
          {},
          "I explicitly authorize replacing the existing private preparation.md with this reviewed workbook. Its contents are otherwise preserved.",
        ),
      ),
    );
  }
  const consent = element("input", {
    id: "reviewed",
    type: "checkbox",
    checked: reviewed,
  });
  consent.addEventListener("change", () => {
    reviewed = consent.checked;
  });
  content.append(
    element(
      "label",
      { className: "check", htmlFor: "reviewed" },
      consent,
      element(
        "span",
        {},
        "I reviewed these exact answers, attestations, listed replacement rows and action scope. This saves paperwork only; the skill must verify live readiness and current authority.",
      ),
    ),
  );
  const button = element(
    "button",
    {
      id: "save-workbook",
      type: "button",
      className: "primary",
      disabled: Object.keys(errors).length > 0,
    },
    "Save private workbook",
  );
  button.addEventListener("click", async () => {
    if (!reviewed || (workbookExists && !replaceExisting)) {
      showError(
        new Error(
          "Review the exact workbook and confirm any existing-file replacement first.",
        ),
      );
      return;
    }
    button.disabled = true;
    try {
      await flush();
      const result = await api("workbook", "POST", {
        revision,
        reviewed,
        replaceExisting,
        expectedWorkbookHash: workbookHash,
      });
      workbookHash = result.workbookHash;
      workbookExists = true;
      content.replaceChildren(
        element(
          "div",
          { className: "success", role: "status" },
          element("h2", {}, "Your private workbook is saved"),
          element("p", {}, result.path),
          element(
            "p",
            {},
            "Open a fresh agent chat in this workspace and invoke:",
          ),
          element(
            "pre",
            { className: "command", tabIndex: 0 },
            "/initialize-project",
          ),
          element(
            "p",
            {},
            "The wizard has not initialized anything. The skill verifies the file, scope, access and all real execution gates. Keep this workbook and the local launcher private.",
          ),
        ),
      );
      clearError();
      status("Workbook saved — ready for the skill's checks");
    } catch (error) {
      showError(error);
      button.disabled = false;
    }
  });
  content.append(button);
  return content;
}
function render() {
  const available = activeSteps(draft);
  if (!available.some((step) => step.id === currentStep().id))
    draft.step = steps.findIndex((step) => step.id === available[0].id);
  const step = currentStep();
  renderNavigation();
  byId("step-title").textContent = step.title;
  byId("intro").textContent = step.text;
  const content = byId("content");
  content.replaceChildren(services(step));
  if (
    step.id === "registry" &&
    draft.answers.registry_policy !== "replace-listed-only"
  ) {
    content.append(
      element(
        "p",
        { className: "notice" },
        "No deletion is requested. Do not expand CLI scopes or acknowledge old-image loss for a fresh namespace.",
      ),
    );
    if (draft.replacements.length)
      content.append(
        element(
          "button",
          {
            type: "button",
            onclick: () => {
              draft.replacements = [];
              changed();
              render();
            },
          },
          "Discard the retained draft replacement rows",
        ),
      );
  }
  for (const id of step.fields) {
    if (
      step.id === "registry" &&
      draft.answers.registry_policy !== "replace-listed-only" &&
      id !== "registry_policy"
    )
      continue;
    const control = field(schema.fields.find((item) => item.id === id));
    content.append(
      id === "stable_learning_proposals"
        ? element(
            "details",
            {},
            element(
              "summary",
              {},
              "Optional: previously reviewed documentation proposals",
            ),
            control,
          )
        : control,
    );
  }
  for (const index of step.prerequisites ?? []) {
    if (
      step.id === "registry" &&
      index === 7 &&
      draft.answers.registry_policy !== "replace-listed-only"
    )
      continue;
    content.append(check("prerequisites", index));
  }
  for (const index of step.approvals ?? []) {
    if (index === 9 && draft.answers.registry_policy !== "replace-listed-only")
      continue;
    content.append(check("approvals", index));
  }
  if (
    step.replacements &&
    draft.answers.registry_policy === "replace-listed-only"
  )
    content.append(replacementRows());
  if (step.review) content.append(review());
  if (step.save) content.append(savePanel());
  const position = available.findIndex((item) => item.id === step.id);
  byId("controls").hidden = false;
  byId("back").disabled = position === 0;
  byId("next").hidden = step.save;
  byId("skip").hidden = step.save || step.id === "mode";
}
byId("back").addEventListener("click", () => {
  const available = activeSteps(draft);
  const index = available.findIndex((step) => step.id === currentStep().id);
  if (index > 0) jump(available[index - 1]);
});
byId("next").addEventListener("click", () => {
  visibleErrors = relevant(currentStep(), issues());
  if (Object.keys(visibleErrors).length) {
    render();
    byId("content").querySelector('[aria-invalid="true"],.error')?.focus();
    return;
  }
  const available = activeSteps(draft);
  const index = available.findIndex((step) => step.id === currentStep().id);
  if (available[index + 1]) jump(available[index + 1]);
});
byId("skip").addEventListener("click", () => {
  const available = activeSteps(draft);
  const index = available.findIndex((step) => step.id === currentStep().id);
  if (available[index + 1]) jump(available[index + 1]);
});
window.addEventListener("beforeunload", (event) => {
  if (edited !== saved) {
    event.preventDefault();
    event.returnValue = "";
  }
});
try {
  const state = await api("state");
  ({ schema, context, draft, revision, workbookHash, workbookExists } = state);
  assertDraft(schema, draft);
  byId("repository").textContent =
    context.repository ??
    "No GitHub origin detected — execution save is blocked";
  byId("existing").hidden = !context.completed;
  status(
    revision
      ? "Private draft restored"
      : workbookExists
        ? "Existing workbook imported — review before replacing"
        : "New private draft",
  );
  render();
} catch (error) {
  showError(error);
}
