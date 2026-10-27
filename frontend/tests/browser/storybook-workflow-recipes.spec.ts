import { expect, test, type Frame, type Page } from "@playwright/test";
import axe from "axe-core";

const capability = "development-guide-authentication-capability-aware-pages-and-actions--";
const backend = "development-guide-data-building-a-backend-connected-feature--";
const draft = "development-guide-forms-draft-and-submit-forms--";
const workflow = "development-guide-workflows-workflow-commands-conflicts-and-coordinated-refresh--";
const inbox = "development-guide-notifications-persisted-inboxes-versus-feedback--";

async function preview(page: Page) {
  const handle = await page.locator("#storybook-preview-iframe").elementHandle();
  const frame = await handle?.contentFrame();
  if (!frame) throw new Error("The tutorial preview did not load.");
  return frame;
}

async function open(page: Page, id: string, title: string) {
  await page.goto(`/?path=/story/${id}`);
  const frame = await preview(page);
  await expect(frame.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
  return frame;
}

async function storage(frame: Frame) {
  return frame.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .filter(key => key.startsWith("rgo.app."))
        .sort()
        .map(key => [key, localStorage.getItem(key)]),
    ),
  );
}

async function approve(frame: Frame) {
  await frame.getByRole("button", { name: "Approve request", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Confirm approval", exact: true }).click();
}

test("capability navigation and direct routes fail closed while readable records can deny one action", async ({
  page,
}) => {
  let frame = await open(page, capability + "page-denied", "Capability-aware pages and actions");
  await expect(
    frame.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Reviews", exact: true }),
  ).toHaveCount(0);
  await expect(
    frame
      .getByRole("navigation", { name: "Command palette destinations" })
      .getByRole("link", { name: "Go to reviews", exact: true }),
  ).toHaveCount(0);
  await frame.getByRole("button", { name: "Open workspace", exact: true }).click();
  await frame.getByRole("button", { name: "Open review URL directly", exact: true }).click();
  await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toHaveValue("/reviews");
  await expect(frame.getByRole("heading", { name: "Page access denied", exact: true })).toBeVisible();
  await expect(frame.getByRole("heading", { name: "Workspace equipment request", exact: true })).toHaveCount(0);
  frame = await open(page, capability + "action-denied", "Capability-aware pages and actions");
  await expect(frame.getByRole("heading", { name: "Workspace equipment request", exact: true })).toBeVisible();
  await expect(frame.getByRole("button", { name: "Approve request", exact: true })).toBeDisabled();
  await frame.getByRole("button", { name: "Check backend rejection", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Acknowledged writes: 0. Backend rejections: 1.");
});

test("authority changing during confirmation sends no obsolete command and page revocation closes an open decision", async ({
  page,
}) => {
  let frame = await open(page, capability + "revocation", "Capability-aware pages and actions");
  await frame.getByRole("button", { name: "Approve request", exact: true }).click();
  await expect(
    frame.getByText("Approval permission was revoked while the decision was open. Confirming will send no command.", {
      exact: true,
    }),
  ).toBeVisible();
  await frame.getByRole("dialog").getByRole("button", { name: "Approve", exact: true }).click();
  await expect(
    frame.getByText("Decision expired: authority changed. No command was sent.", { exact: true }),
  ).toBeVisible();
  await expect(frame.getByRole("status")).toHaveText("Acknowledged writes: 0. Backend rejections: 0.");
  frame = await open(page, capability + "overview", "Capability-aware pages and actions");
  await frame.getByRole("button", { name: "Approve request", exact: true }).click();
  await frame
    .getByRole("button", { name: "Revoke page access", exact: true, includeHidden: true })
    .evaluate(button => (button as HTMLButtonElement).click());
  await expect(frame.getByRole("dialog")).toHaveCount(0);
  await expect(frame.getByRole("heading", { name: "Page access denied", exact: true })).toBeVisible();
  await expect(
    frame.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Reviews", exact: true }),
  ).toHaveCount(0);
});

test("HTTP feature uses configured CSRF, narrow write projection and refreshes detail and collection", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", request => {
    if (/\/tutorial\/|\/auth\/csrf|storybook\.example\.invalid/.test(request.url())) requests.push(request.url());
  });
  const frame = await open(page, backend + "overview", "Building a backend-connected feature");
  const before = await storage(frame);
  await frame.getByRole("textbox", { name: "Request title", exact: true }).fill("Updated office chairs");
  await frame.getByRole("button", { name: "Save request", exact: true }).dblclick();
  await expect(frame.getByRole("status")).toHaveText("Change acknowledged and affected reads refreshed.");
  await expect(frame.getByTestId("backend-write-count")).toHaveText("Write attempts: 1.");
  await expect(frame.getByTestId("backend-basis")).toHaveText("Accepted basis version: 8.");
  await expect(frame.getByText(/Latest listed title: Updated office chairs/)).toBeVisible();
  const sequence = await frame
    .getByRole("list", { name: "Backend request sequence", exact: true })
    .getByRole("listitem")
    .allTextContents();
  expect(sequence.findIndex(item => item === "GET /auth/csrf")).toBeLessThan(
    sequence.findIndex(item => item.startsWith("PATCH ")),
  );
  expect(sequence).toContain("Editable projection: title, expectedVersion (7).");
  expect(await storage(frame)).toEqual(before);
  expect(requests).toEqual([]);
});

test("HTTP validation maps allowed fields and preserves draft before explicit retry", async ({ page }) => {
  const frame = await open(page, backend + "validation-failure", "Building a backend-connected feature");
  const title = frame.getByRole("textbox", { name: "Request title", exact: true });
  await title.fill("Keep this draft");
  await frame.getByRole("button", { name: "Save request", exact: true }).click();
  await expect(frame.getByText("The server rejected the title length.", { exact: true })).toBeVisible();
  await expect(title).toHaveValue("Keep this draft");
  await expect(frame.getByTestId("backend-basis")).toContainText("version: 7");
  await expect(frame.getByText("internalApproval", { exact: true })).toHaveCount(0);
  await frame.getByRole("button", { name: "Repair simulated endpoint", exact: true }).click();
  await frame.getByRole("button", { name: "Save request", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Change acknowledged and affected reads refreshed.");
  await expect(frame.getByTestId("backend-write-count")).toHaveText("Write attempts: 2.");
});

test("HTTP missing records and forbidden commands remain distinct from empty and accepted data", async ({ page }) => {
  let frame = await open(page, backend + "missing-record", "Building a backend-connected feature");
  await expect(frame.getByText("Request not found. This is not an empty collection.", { exact: false })).toBeVisible();
  await expect(frame.getByRole("textbox", { name: "Request title", exact: true })).toHaveCount(0);
  await frame.getByRole("button", { name: "Repair and retry read", exact: true }).click();
  await expect(frame.getByRole("textbox", { name: "Request title", exact: true })).toHaveValue("Office chairs");
  frame = await open(page, backend + "forbidden", "Building a backend-connected feature");
  await frame.getByRole("button", { name: "Save request", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText(
    "Permission denied. No write was committed by this simulated endpoint.",
  );
  await expect(frame.getByTestId("backend-basis")).toContainText("version: 7");
});

test("malformed success blocks HTTP resubmission until read-only reconciliation", async ({ page }) => {
  const frame = await open(page, backend + "malformed-response", "Building a backend-connected feature");
  await frame.getByRole("textbox", { name: "Request title", exact: true }).fill("Committed despite malformed receipt");
  await frame.getByRole("button", { name: "Save request", exact: true }).click();
  await expect(frame.getByRole("status")).toContainText("outcome is uncertain");
  await expect(frame.getByRole("button", { name: "Save request", exact: true })).toBeDisabled();
  await frame.getByRole("button", { name: "Reconcile uncertain result", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Authoritative record reloaded; no additional write was sent.");
  await expect(frame.getByTestId("backend-write-count")).toHaveText("Write attempts: 1.");
  await expect(frame.getByTestId("backend-basis")).toContainText("version: 8");
});

test("one form saves incomplete drafts, applies strict submit and prunes inactive category values", async ({
  page,
}) => {
  const frame = await open(page, draft + "overview", "Draft and submit forms");
  await frame.getByRole("button", { name: "Submit request", exact: true }).click();
  await expect(frame.getByText("Correct the marked fields. No command was sent.", { exact: true })).toBeVisible();
  await frame.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    frame.getByText("Draft accepted. The returned values are now the clean baseline.", { exact: true }),
  ).toBeVisible();
  await expect(frame.getByRole("status").filter({ hasText: "Commands sent:" })).toHaveText(
    "Commands sent: 1 · Accepted commands: 1",
  );
  await expect(frame.getByTestId("draft-command")).toContainText('"intent": "draft"');
  await frame.getByRole("textbox", { name: "Request title", exact: true }).fill("New software");
  await frame.getByRole("textbox", { name: "Quantity", exact: true }).fill("5");
  await frame.getByRole("combobox", { name: "Category", exact: true }).click();
  await frame.getByRole("option", { name: "Software", exact: true }).click();
  await frame.getByRole("textbox", { name: "Software purpose", exact: true }).fill("Team planning");
  await frame.getByRole("button", { name: "Submit request", exact: true }).dblclick();
  await expect(frame.getByText("Request submitted after complete validation.", { exact: true })).toBeVisible();
  const command = JSON.parse(await frame.getByTestId("draft-command").innerText());
  expect(command).toMatchObject({
    intent: "submit",
    expectedVersion: 8,
    values: { category: "software", softwarePurpose: "Team planning" },
  });
  expect(command.values.quantity).toBeNull();
  await expect(frame.getByRole("status").filter({ hasText: "Commands sent:" })).toHaveText(
    "Commands sent: 2 · Accepted commands: 2",
  );
});

for (const [scenario, message] of [
  ["save-failure", "The write was rejected. Your input is unchanged; retry when ready."],
  ["server-validation", "The server rejected these values. Correct the marked fields."],
] as const) {
  test(`draft ${scenario} preserves values and accepted baseline`, async ({ page }) => {
    const frame = await open(page, draft + scenario, "Draft and submit forms");
    const title = frame.getByRole("textbox", { name: "Request title", exact: true });
    await title.fill("Retained input");
    await frame.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(frame.getByText(message, { exact: true })).toBeVisible();
    await expect(title).toHaveValue("Retained input");
    await expect(frame.getByRole("status").filter({ hasText: "Accepted version:" })).toContainText(
      "Accepted version: 7",
    );
    await expect(frame.getByRole("status").filter({ hasText: "Commands sent:" })).toHaveText(
      "Commands sent: 1 · Accepted commands: 0",
    );
    if (scenario === "server-validation")
      await expect(
        frame.getByText("This value is no longer available. Choose another value.", { exact: true }),
      ).toBeVisible();
    await title.fill("Retried input");
    await frame.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(
      frame.getByText("Draft accepted. The returned values are now the clean baseline.", { exact: true }),
    ).toBeVisible();
  });
}

test("dirty form guards query changes, explicit logout and its beforeunload listener using the same live state", async ({
  page,
}) => {
  const frame = await open(page, draft + "navigation-guard", "Draft and submit forms");
  const address = frame.getByRole("textbox", { name: "Preview URL", exact: true });
  await frame.getByRole("textbox", { name: "Request title", exact: true }).fill("Dirty editor");
  expect(await frame.evaluate(() => !window.dispatchEvent(new Event("beforeunload", { cancelable: true })))).toBe(true);
  await frame.getByRole("link", { name: "Change query", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(address).toHaveValue("/requests/sample");
  await frame.getByRole("link", { name: "Change query", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(address).toHaveValue("/requests/sample?section=notes");
  expect(await frame.evaluate(() => window.dispatchEvent(new Event("beforeunload", { cancelable: true })))).toBe(true);
  await frame.getByRole("textbox", { name: "Request title", exact: true }).fill("Dirty before logout");
  await frame.getByRole("button", { name: "Preview logout", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(address).toHaveValue("/requests/sample?section=notes");
  await frame.getByRole("button", { name: "Preview logout", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(frame.getByText("Preview logout completed.", { exact: true })).toBeVisible();
});

test("background refresh observes a new version without rebasing an unsaved draft", async ({ page }) => {
  const frame = await open(page, draft + "overview", "Draft and submit forms");
  await frame.getByRole("textbox", { name: "Request title", exact: true }).fill("Pinned input");
  await frame.getByRole("button", { name: "Simulate background refresh", exact: true }).click();
  await expect(frame.getByRole("status").filter({ hasText: "Accepted version:" })).toHaveText(
    "Dirty · Accepted version: 7 · Latest observed version: 8",
  );
  await frame.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    frame.getByText(
      "The saved version changed. Your input and original version are preserved. Review fresh data before retrying.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(frame.getByTestId("draft-command")).toContainText('"expectedVersion": 7');
  await expect(frame.getByRole("button", { name: "Save draft", exact: true })).toBeDisabled();
});

test("a lost draft acknowledgement blocks writes and exits even from a previously clean form", async ({ page }) => {
  const frame = await open(page, draft + "uncertain-outcome", "Draft and submit forms");
  await frame.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    frame.getByText(
      "The write outcome is unknown. Further writes and editor exits are blocked. Reconcile the authoritative record before continuing.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(frame.getByRole("status").filter({ hasText: "Accepted version:" })).toHaveText(
    "Outcome unknown · Accepted version: 7 · Latest observed version: 8",
  );
  await expect(frame.getByRole("button", { name: "Save draft", exact: true })).toBeDisabled();
  await expect(frame.getByRole("button", { name: "Submit request", exact: true })).toBeDisabled();
  await frame.getByRole("link", { name: "Leave editor", exact: true }).click();
  await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toHaveValue("/requests/sample");
  await expect(frame.getByRole("dialog")).toHaveCount(0);
  expect(await frame.evaluate(() => !window.dispatchEvent(new Event("beforeunload", { cancelable: true })))).toBe(true);
  await expect(frame.getByRole("status").filter({ hasText: "Commands sent:" })).toHaveText(
    "Commands sent: 1 · Accepted commands: 1",
  );
});

test("workflow cancellation preserves its draft and accepted command refreshes all owners only once", async ({
  page,
}) => {
  const frame = await open(page, workflow + "overview", "Workflow commands, conflicts and coordinated refresh");
  await frame.getByRole("textbox", { name: "Approval comment", exact: true }).fill("Captured decision");
  await frame.getByRole("button", { name: "Approve request", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Keep reviewing", exact: true }).click();
  await expect(frame.getByTestId("workflow-counts")).toHaveText("Approval attempts: 0. Committed approvals: 0.");
  await approve(frame);
  await expect(frame.getByRole("region", { name: "Approval decision", exact: true }).getByRole("status")).toHaveText(
    "Approval completed. All affected reads refreshed; unrelated scopes are unchanged.",
  );
  await expect(frame.getByTestId("workflow-counts")).toHaveText("Approval attempts: 1. Committed approvals: 1.");
  for (const item of await frame
    .getByRole("list", { name: "Read model projections", exact: true })
    .getByRole("listitem")
    .allTextContents())
    expect(item).toMatch(/version 8, refreshes 1, fresh/);
  await expect(frame.getByTestId("workflow-sentinels")).toHaveText("Other viewer retained. Unrelated owner retained.");
});

test("workflow conflict requires explicit discard and a newly reviewed version", async ({ page }) => {
  const frame = await open(page, workflow + "conflict", "Workflow commands, conflicts and coordinated refresh");
  const comment = frame.getByRole("textbox", { name: "Approval comment", exact: true });
  await comment.fill("Original proposal");
  await approve(frame);
  await expect(frame.getByRole("region", { name: "Approval decision", exact: true }).getByRole("status")).toContainText(
    "Conflict. The original version and proposed comment are retained.",
  );
  await expect(comment).toHaveValue("Original proposal");
  await expect(frame.getByTestId("workflow-basis")).toContainText("Pinned version: 7");
  await frame.getByRole("button", { name: "Reload latest request", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Keep reviewing", exact: true }).click();
  await expect(comment).toHaveValue("Original proposal");
  await frame.getByRole("button", { name: "Fail next read-model refresh", exact: true }).click();
  await frame.getByRole("button", { name: "Reload latest request", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Discard and reload", exact: true }).click();
  await expect(frame.getByRole("region", { name: "Approval decision", exact: true }).getByRole("status")).toHaveText(
    "Fresh basis accepted; refreshing affected reads failed. Retry refresh sends no approval command.",
  );
  await expect(frame.getByRole("button", { name: "Approve request", exact: true })).toBeDisabled();
  await frame.getByRole("button", { name: "Retry refresh", exact: true }).click();
  await expect(frame.getByRole("region", { name: "Approval decision", exact: true }).getByRole("status")).toHaveText(
    "Fresh basis accepted with a cleared draft. Review it before a new decision.",
  );
  await expect(comment).toHaveValue("");
  await expect(frame.getByTestId("workflow-basis")).toContainText("Pinned version: 8");
  await comment.fill("Reviewed latest version");
  await approve(frame);
  await expect(frame.getByTestId("workflow-counts")).toHaveText("Approval attempts: 2. Committed approvals: 1.");
  await expect(frame.getByTestId("workflow-basis")).toContainText("Pinned version: 9");
});

for (const [scenario, message, recovery] of [
  [
    "refresh-failure",
    "Approval completed; refreshing affected reads failed. Retry refresh sends no approval command.",
    "Retry refresh",
  ],
  [
    "uncertain-outcome",
    "Outcome uncertain. Do not resubmit; reconcile the authoritative outcome first.",
    "Reconcile outcome",
  ],
] as const) {
  test(`workflow ${scenario} recovers without repeating the business command`, async ({ page }) => {
    const frame = await open(page, workflow + scenario, "Workflow commands, conflicts and coordinated refresh");
    await approve(frame);
    await expect(frame.getByRole("region", { name: "Approval decision", exact: true }).getByRole("status")).toHaveText(
      message,
    );
    await expect(frame.getByRole("button", { name: "Approve request", exact: true })).toBeDisabled();
    await frame.getByRole("button", { name: recovery, exact: true }).click();
    await expect(frame.getByRole("region", { name: "Approval decision", exact: true }).getByRole("status")).toHaveText(
      scenario === "refresh-failure"
        ? "Approval completed. All affected reads refreshed; unrelated scopes are unchanged."
        : "Authoritative outcome reconciled. No second approval was sent.",
    );
    await expect(frame.getByTestId("workflow-counts")).toHaveText("Approval attempts: 1. Committed approvals: 1.");
    await expect(frame.getByTestId("workflow-sentinels")).toHaveText(
      "Other viewer retained. Unrelated owner retained.",
    );
  });
}

test("workflow authority revocation aborts pending decisions and removes restricted projections", async ({ page }) => {
  const frame = await open(page, workflow + "overview", "Workflow commands, conflicts and coordinated refresh");
  // Start a decision then revoke through the actual underlying handler while its modal owns focus.
  await frame.getByRole("button", { name: "Approve request", exact: true }).click();
  await frame
    .getByRole("button", { name: "Revoke preview authority", exact: true, includeHidden: true })
    .evaluate(button => (button as HTMLButtonElement).click());
  await expect(frame.getByRole("dialog")).toHaveCount(0);
  await expect(frame.getByTestId("workflow-basis")).toHaveCount(0);
  await expect(frame.getByRole("region", { name: "Workflow activity", exact: true })).toHaveCount(0);
  await expect(frame.getByTestId("workflow-counts")).toHaveText("Approval attempts: 0. Committed approvals: 0.");
});

test("inbox read state survives cold client remount while feedback and another viewer remain independent", async ({
  page,
}) => {
  const frame = await open(page, inbox + "overview", "Persisted inboxes versus feedback");
  await expect(frame.getByRole("status").filter({ hasText: /^Unread messages:/ })).toHaveText("Unread messages: 1");
  const before = await storage(frame);
  await frame.getByRole("button", { name: "Show persistent toast", exact: true }).click();
  await expect(frame.getByText("This toast does not change inbox records.", { exact: true })).toBeVisible();
  await frame.getByRole("button", { name: "Dismiss example toast", exact: true }).click();
  await frame.getByRole("button", { name: "Mark Equipment request approved as read", exact: true }).click();
  await expect(frame.getByRole("status").filter({ hasText: /^Unread messages:/ })).toHaveText("Unread messages: 0");
  await frame.getByRole("button", { name: "Reload inbox client", exact: true }).click();
  await expect(frame.getByRole("status").filter({ hasText: /^Unread messages:/ })).toHaveText("Unread messages: 0");
  await expect(
    frame.getByRole("button", { name: "Mark Equipment request approved as read", exact: true }),
  ).toBeDisabled();
  await expect(frame.getByTestId("inbox-server-counts")).toHaveText(
    "Changed read markers: 1; hidden-item rejections: 0.",
  );
  await frame.getByRole("combobox", { name: "Preview account", exact: true }).selectOption("sam");
  await expect(frame.getByRole("status").filter({ hasText: /^Unread messages:/ })).toHaveText("Unread messages: 1");
  await expect(frame.getByRole("heading", { name: "Equipment request approved", exact: true })).toHaveCount(0);
  await frame.getByRole("combobox", { name: "Preview account", exact: true }).selectOption("alex");
  await expect(frame.getByRole("status").filter({ hasText: /^Unread messages:/ })).toHaveText("Unread messages: 0");
  await frame.getByRole("link", { name: "Open related request", exact: true }).first().click();
  await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toHaveValue("/requests/request-1");
  expect(await storage(frame)).toEqual(before);
});

test("inbox read failures retry independently and unconfirmed markers retain unread data", async ({ page }) => {
  let frame = await open(page, inbox + "read-failure", "Persisted inboxes versus feedback");
  await expect(frame.getByText("Inbox messages could not be loaded.", { exact: true })).toBeVisible();
  await frame.getByRole("button", { name: "Retry inbox read", exact: true }).click();
  await expect(frame.getByRole("heading", { name: "Equipment request approved", exact: true })).toBeVisible();
  frame = await open(page, inbox + "mark-read-failure", "Persisted inboxes versus feedback");
  const mark = frame.getByRole("button", { name: "Mark Equipment request approved as read", exact: true });
  await mark.click();
  await expect(
    frame.getByText("The read marker could not be confirmed. Refresh or retry this idempotent action.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(frame.getByRole("status").filter({ hasText: /^Unread messages:/ })).toHaveText("Unread messages: 1");
  await mark.click();
  await expect(frame.getByRole("status").filter({ hasText: /^Unread messages:/ })).toHaveText("Unread messages: 0");
  await expect(frame.getByTestId("inbox-server-counts")).toHaveText(
    "Changed read markers: 1; hidden-item rejections: 0.",
  );
});

test("inbox ownership is checked by the simulated server independently of navigation", async ({ page }) => {
  const frame = await open(page, inbox + "ownership", "Persisted inboxes versus feedback");
  await frame.getByRole("button", { name: "Attempt another account’s read marker", exact: true }).click();
  await expect(
    frame.getByText("This notification is unavailable to the current account.", { exact: true }),
  ).toBeVisible();
  await expect(frame.getByTestId("inbox-server-counts")).toHaveText(
    "Changed read markers: 0; hidden-item rejections: 1.",
  );
  await expect(frame.getByRole("status").filter({ hasText: /^Unread messages:/ })).toHaveText("Unread messages: 1");
});

for (const tutorial of [
  { prefix: capability, title: "Capability-aware pages and actions" },
  { prefix: backend, title: "Building a backend-connected feature", control: "Request title" },
  { prefix: draft, title: "Draft and submit forms", control: "Request title" },
  { prefix: workflow, title: "Workflow commands, conflicts and coordinated refresh", control: "Approval comment" },
  { prefix: inbox, title: "Persisted inboxes versus feedback", control: "Search messages" },
]) {
  test(`${tutorial.title}: copyable narrow Docs, live themes and accessible isolated previews`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width: 520, height: 1000 });
    await page.goto(`/?path=/docs/${tutorial.prefix}docs`);
    const docs = await preview(page);
    await expect(docs.getByRole("heading", { level: 1 }).filter({ hasText: tutorial.title })).toBeVisible();
    for (const name of [
      "Before you start",
      "Common mistakes",
      "Read this tutorial without Storybook",
      "Storybook fixture reference",
    ])
      await expect(docs.getByRole("heading").filter({ hasText: name })).toBeVisible();
    await expect(
      docs.locator(".docblock-source").last().getByRole("button", { name: "Copy", exact: true }),
    ).toBeVisible();
    const first = await docs.locator("iframe").first().elementHandle();
    const example = await first?.contentFrame();
    if (!example) throw new Error("The embedded preview did not load.");
    await expect(example.getByRole("heading", { level: 1, name: tutorial.title, exact: true })).toBeVisible();
    const before = await storage(example);
    const input = tutorial.control ? example.getByRole("textbox", { name: tutorial.control, exact: true }) : undefined;
    if (input) await input.fill("Theme-preserved input");
    for (const [label, background] of [
      ["Dark", "rgb(13, 17, 23)"],
      ["Soft dark", "rgb(34, 39, 46)"],
      ["Light", "rgb(255, 255, 255)"],
    ]) {
      await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption({ label: label! });
      await expect
        .poll(() => docs.locator(".sbdocs-wrapper").evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(background);
      await expect
        .poll(() => example.locator("body").evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(background);
      if (input) await expect(input).toHaveValue("Theme-preserved input");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => docs.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const handle of await docs.locator("iframe").elementHandles()) {
      await handle.scrollIntoViewIfNeeded();
      const rendered = await handle.contentFrame();
      if (!rendered) throw new Error("An embedded preview did not load.");
      await expect(rendered.getByRole("heading", { level: 1, name: tutorial.title, exact: true })).toBeVisible();
      await rendered.evaluate(() => document.fonts.ready);
      await expect.poll(() => rendered.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(
        await rendered.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("body *")].some(
            element =>
              /^(auto|scroll)$/.test(getComputedStyle(element).overflowY) &&
              element.scrollHeight > element.clientHeight + 1 &&
              element.clientHeight > 0,
          ),
        ),
      ).toBe(false);
      await rendered.evaluate(axe.source);
      const violations = await rendered.evaluate(async () => {
        const engine = (window as typeof window & { axe: typeof axe }).axe;
        const result = await engine.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
        return result.violations.map(violation => `${violation.id}: ${violation.help}`);
      });
      expect(violations).toEqual([]);
    }
    expect(await storage(example)).toEqual(before);
    expect(errors).toEqual([]);
  });
}
