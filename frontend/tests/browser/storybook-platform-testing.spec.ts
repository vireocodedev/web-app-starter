import { expect, test, type Frame, type Page } from "@playwright/test";
import axe from "axe-core";

const urlPrefix = "development-guide-routing-url-backed-state--";
const signalPrefix = "development-guide-state-signals-and-persistence-in-practice--";
const settingsPrefix = "development-guide-settings-components-that-respect-application-settings--";
const authPrefix = "development-guide-authentication-authentication-and-http-integration--";
const testingPrefix = "development-guide-testing-testing-a-feature--";

async function preview(page: Page) {
  const iframe = await page.locator("#storybook-preview-iframe").elementHandle();
  const frame = await iframe?.contentFrame();
  if (!frame) throw new Error("The tutorial preview iframe did not load.");
  return frame;
}

async function openStory(page: Page, id: string, title: string) {
  await page.goto(`/?path=/story/${id}`);
  const frame = await preview(page);
  await expect(frame.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
  return frame;
}

async function applicationStorage(frame: Frame) {
  return frame.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .filter(key => key.startsWith("rgo.app."))
        .sort()
        .map(key => [key, localStorage.getItem(key)]),
    ),
  );
}

async function noHorizontalOverflow(frame: Frame) {
  await expect.poll(() => frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function accessibility(frame: Frame) {
  await frame.evaluate(axe.source);
  const violations = await frame.evaluate(async () => {
    const engine = (window as typeof window & { axe: typeof axe }).axe;
    const result = await engine.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
    return result.violations.map(violation => `${violation.id}: ${violation.help}`);
  });
  expect(violations).toEqual([]);
}

test("URL changes are atomic, preserve unrelated fields and distinguish replace from pushed history", async ({
  page,
}) => {
  const frame = await openStory(page, urlPrefix + "overview", "URL-backed state");
  const address = frame.getByRole("textbox", { name: "Preview URL", exact: true });
  await expect(address).toHaveValue("/projects?status=active&page=3&campaign=guide");
  await frame.getByRole("textbox", { name: "Search projects", exact: true }).fill("Atlas");
  await expect(frame.getByTestId("url-state")).toHaveText("Search: Atlas; status: active; page: 1");
  await expect(address).toHaveValue("/projects?campaign=guide&q=Atlas&status=active");
  await frame.getByRole("button", { name: "Page 2", exact: true }).click();
  await frame.getByRole("button", { name: "Page 3", exact: true }).click();
  await frame.getByRole("button", { name: "Back", exact: true }).click();
  await expect(frame.getByTestId("url-state")).toContainText("page: 2");
  await frame.getByRole("button", { name: "Back", exact: true }).click();
  await expect(frame.getByTestId("url-state")).toHaveText("Search: Atlas; status: active; page: 1");
  await frame.getByRole("button", { name: "Forward", exact: true }).click();
  await expect(frame.getByTestId("url-state")).toContainText("page: 2");
  await frame.getByRole("button", { name: "Archived projects", exact: true }).click();
  await expect(frame.getByTestId("url-state")).toHaveText("Search: Atlas; status: archived; page: 1");
  await frame.getByRole("button", { name: "Reset URL fields", exact: true }).click();
  await expect(address).toHaveValue("/projects?campaign=guide");
});

test("malformed URL fields recover independently without rewriting until a deliberate update", async ({ page }) => {
  const frame = await openStory(page, urlPrefix + "invalid-parameters", "URL-backed state");
  const address = frame.getByRole("textbox", { name: "Preview URL", exact: true });
  await expect(address).toHaveValue("/projects?q=Atlas&status=broken&page=-4&campaign=guide");
  await expect(frame.getByTestId("url-state")).toHaveText("Search: Atlas; status: all; page: 1");
  await frame.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(address).toHaveValue("/projects?campaign=guide&q=Atlas&page=2");
});

test("Signals hydrate before the first write, derive totals and stop persisting after disposal", async ({ page }) => {
  const frame = await openStory(page, signalPrefix + "overview", "Signals and persistence in practice");
  const storage = await applicationStorage(frame);
  await expect(frame.getByTestId("signal-total")).toHaveText("Computed total: 360");
  await expect(frame.getByTestId("signal-stored")).toContainText('"hours":4');
  await frame.getByRole("button", { name: "Apply batched estimate", exact: true }).click();
  await expect(frame.getByTestId("signal-total")).toHaveText("Computed total: 1200");
  await expect(frame.getByTestId("signal-status")).toContainText("successful writes: 2");
  await frame.getByRole("button", { name: "Dispose persistence", exact: true }).click();
  await frame.getByRole("spinbutton", { name: "Estimate hours", exact: true }).fill("12");
  await expect(frame.getByTestId("signal-total")).toHaveText("Computed total: 1440");
  await expect(frame.getByTestId("signal-stored")).toContainText('"hours":10');
  await expect(frame.getByTestId("signal-status")).toContainText("successful writes: 2");
  await frame.getByRole("button", { name: "Restart from saved state", exact: true }).click();
  await expect(frame.getByRole("spinbutton", { name: "Estimate hours", exact: true })).toHaveValue("10");
  await frame.getByRole("button", { name: "Normalize negative hours", exact: true }).click();
  await expect(frame.getByTestId("signal-total")).toHaveText("Computed total: 0");
  await frame.getByRole("button", { name: "Load invalid stored data", exact: true }).click();
  await expect(frame.getByTestId("signal-total")).toHaveText("Computed total: 600");
  await expect(frame.getByTestId("signal-stored")).not.toContainText("total");
  expect(await applicationStorage(frame)).toEqual(storage);
});

test("unavailable Signal storage preserves live values and restart restores the last durable source", async ({
  page,
}) => {
  const frame = await openStory(page, signalPrefix + "storage-failure", "Signals and persistence in practice");
  await expect(frame.getByTestId("signal-status")).toContainText("Persistence: unavailable");
  await frame.getByRole("spinbutton", { name: "Estimate hours", exact: true }).fill("15");
  await expect(frame.getByTestId("signal-total")).toHaveText("Computed total: 1350");
  await expect(frame.getByTestId("signal-stored")).toContainText('"hours":4');
  await frame.getByRole("button", { name: "Restore storage and restart", exact: true }).click();
  await expect(frame.getByRole("spinbutton", { name: "Estimate hours", exact: true })).toHaveValue("4");
  await expect(frame.getByTestId("signal-status")).toContainText("Persistence: saved");
});

test("settings-aware comparison changes actual table density and preserves one controlled editor draft", async ({
  page,
}) => {
  const frame = await openStory(page, settingsPrefix + "overview", "Components that respect application settings");
  const storage = await applicationStorage(frame);
  const table = frame.getByRole("table", { name: "Settings-aware projects", exact: true });
  const cell = table.getByRole("rowheader", { name: "Atlas migration", exact: true });
  await expect(cell).toBeVisible();
  const before = await cell.evaluate(element => getComputedStyle(element).paddingTop);
  await frame.getByRole("combobox", { name: "Local table density", exact: true }).click();
  await frame.getByRole("option", { name: "Medium", exact: true }).click();
  await expect.poll(() => cell.evaluate(element => getComputedStyle(element).paddingTop)).not.toBe(before);
  const draft = frame.getByRole("textbox", { name: "Draft title", exact: true });
  await draft.fill("One controlled draft");
  for (const label of ["Dialog", "Docked panel", "Overlay panel"]) {
    await frame.getByRole("combobox", { name: "Local editor layout", exact: true }).click();
    await frame.getByRole("option", { name: label, exact: true }).click();
    await expect(draft).toHaveValue("One controlled draft");
  }
  await frame.getByRole("button", { name: "Toggle review status", exact: true }).click();
  await expect(frame.getByText("Review complete", { exact: true })).toBeVisible();
  expect(await applicationStorage(frame)).toEqual(storage);
});

test("an actual owning setter rejects a deployment-fixed false without writing preferences", async ({ page }) => {
  const frame = await openStory(
    page,
    settingsPrefix + "fixed-settings",
    "Components that respect application settings",
  );
  const storage = await applicationStorage(frame);
  await frame.getByRole("button", { name: "Attempt fixed contrast change", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Setter attempted. Effective contrast remains false.");
  await expect(frame.getByTestId("effective-contrast")).toHaveText("false");
  expect(await applicationStorage(frame)).toEqual(storage);
});

test("real auth client orders CSRF and session transitions and clears private cache on logout", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => {
    if (/\/auth\/|storybook\.example\.invalid/.test(request.url())) requests.push(request.url());
  });
  const frame = await openStory(page, authPrefix + "overview", "Authentication and HTTP integration");
  await expect(frame.getByRole("status")).toHaveText("Session: anonymous");
  const storage = await applicationStorage(frame);
  await frame.getByRole("button", { name: "Sign in example", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Session: authenticated · Alex Morgan");
  const sequence = frame.getByRole("list", { name: "Request sequence", exact: true });
  const log = await sequence.getByRole("listitem").allTextContents();
  expect(log.indexOf("GET /auth/csrf")).toBeLessThan(log.indexOf("POST /auth/login"));
  expect(log.lastIndexOf("GET /auth/session")).toBeGreaterThan(log.indexOf("POST /auth/login"));
  await frame.getByRole("button", { name: "Cache private sample", exact: true }).click();
  await expect(frame.getByTestId("private-cache-state")).toContainText("Private sample for Alex");
  await frame.getByRole("button", { name: "Save protected change", exact: true }).click();
  await expect(frame.getByText("Protected change acknowledged.", { exact: true })).toBeVisible();
  await expect(frame.getByTestId("auth-request-counts")).toHaveText("Login POSTs: 1. Protected writes: 1.");
  await frame.getByRole("button", { name: "Sign out example", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Session: anonymous");
  await expect(frame.getByTestId("private-cache-state")).toHaveText("Private sample: cleared.");
  await expect(sequence.getByText(/Fresh CSRF response/)).toHaveCount(3);
  expect(await applicationStorage(frame)).toEqual(storage);
  expect(requests).toEqual([]);
});

for (const [story, message] of [
  ["invalid-credentials", "Invalid username or password."],
  ["server-unavailable", "The service is temporarily unavailable. Try again."],
] as const) {
  test(`authentication distinguishes ${story} and recovers through explicit retry`, async ({ page }) => {
    const frame = await openStory(page, authPrefix + story, "Authentication and HTTP integration");
    await frame.getByRole("button", { name: "Sign in example", exact: true }).click();
    await expect(frame.getByRole("alert").filter({ hasText: message })).toBeVisible();
    await expect(frame.getByRole("status")).toHaveText("Session: anonymous");
    if (story === "invalid-credentials")
      await frame.getByRole("button", { name: "Use valid example credentials", exact: true }).click();
    else await frame.getByRole("button", { name: "Repair simulated server", exact: true }).click();
    await frame.getByRole("button", { name: "Sign in example", exact: true }).click();
    await expect(frame.getByRole("status")).toHaveText("Session: authenticated · Alex Morgan");
  });
}

test("CSRF failure sends zero login writes and unexpected protected 401 expires identity/cache", async ({ page }) => {
  let frame = await openStory(page, authPrefix + "csrf-failure", "Authentication and HTTP integration");
  await frame.getByRole("button", { name: "Sign in example", exact: true }).click();
  await expect(
    frame.getByRole("alert").filter({ hasText: "The service is temporarily unavailable. Try again." }),
  ).toBeVisible();
  await expect(frame.getByTestId("auth-request-counts")).toHaveText("Login POSTs: 0. Protected writes: 0.");
  await expect(frame.getByRole("list", { name: "Request sequence", exact: true })).not.toContainText(
    "POST /auth/login",
  );
  await frame.getByRole("button", { name: "Repair simulated server", exact: true }).click();
  await frame.getByRole("button", { name: "Sign in example", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Session: authenticated · Alex Morgan");
  frame = await openStory(page, authPrefix + "session-expiry", "Authentication and HTTP integration");
  await expect(frame.getByRole("status")).toHaveText("Session: authenticated · Alex Morgan");
  await expect(frame.getByTestId("private-cache-state")).toContainText("Private sample for Alex");
  await frame.getByRole("button", { name: "Read protected resource", exact: true }).click();
  await expect(frame.getByRole("status")).toHaveText("Session: anonymous");
  await expect(frame.getByTestId("private-cache-state")).toHaveText("Private sample: cleared.");
});

test("testing examples inspect actual schema/cache boundaries with a fresh cache per run", async ({ page }) => {
  const frame = await openStory(page, testingPrefix + "overview", "Testing a feature");
  await frame.getByRole("button", { name: "Run boundary example", exact: true }).click();
  const observations = frame.getByRole("region", { name: "Boundary observations", exact: true });
  await expect(observations).toContainText("Satisfied: Valid input is normalized");
  for (const [scenario, expected] of [
    ["accepted-write", "Satisfied: Contacts becomes stale"],
    ["rejected-write", "Satisfied: Rejected write leaves Contacts fresh"],
    ["accepted-write", "Satisfied: Contacts becomes stale"],
  ]) {
    await frame.getByRole("combobox", { name: "Testing scenario", exact: true }).selectOption(scenario!);
    await frame.getByRole("button", { name: "Run boundary example", exact: true }).click();
    await expect(observations).toContainText(expected!);
    await expect(observations).toContainText("Satisfied: The unrelated collection remains fresh");
    await expect(observations).not.toContainText("Mismatch");
  }
  await expect(frame.getByRole("status")).toHaveText("Completed examples: 4");
});

for (const tutorial of [
  { prefix: urlPrefix, title: "URL-backed state", control: "Search projects", role: "textbox" },
  { prefix: signalPrefix, title: "Signals and persistence in practice", control: "Estimate hours", role: "spinbutton" },
  {
    prefix: settingsPrefix,
    title: "Components that respect application settings",
    control: "Draft title",
    role: "textbox",
  },
  { prefix: authPrefix, title: "Authentication and HTTP integration", control: "Example username", role: "textbox" },
  { prefix: testingPrefix, title: "Testing a feature", control: "Testing scenario", role: "combobox" },
] as const) {
  test(`${tutorial.title}: source-readable narrow Docs, theme-preserved state and accessibility`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width: 520, height: 1000 });
    await page.goto(`/?path=/docs/${tutorial.prefix}docs`);
    const docs = await preview(page);
    await expect(docs.getByRole("heading", { level: 1 }).filter({ hasText: tutorial.title })).toBeVisible();
    for (const heading of [
      "Before you start",
      "Common mistakes",
      "Read this tutorial without Storybook",
      "Storybook fixture reference",
    ]) {
      await expect(docs.getByRole("heading").filter({ hasText: heading })).toBeVisible();
    }
    await expect(
      docs.locator(".docblock-source").last().getByRole("button", { name: "Copy", exact: true }),
    ).toBeVisible();
    const embedded = await docs.locator("iframe").first().elementHandle();
    const example = await embedded?.contentFrame();
    if (!example) throw new Error("The embedded tutorial did not load.");
    const control = example.getByRole(tutorial.role, { name: tutorial.control, exact: true });
    if (tutorial.role === "combobox") await control.selectOption("rejected-write");
    else await control.fill(tutorial.role === "spinbutton" ? "7" : "Theme-preserved draft");
    const expected = await control.inputValue();
    const storage = await applicationStorage(example);
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
      await expect(control).toHaveValue(expected);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await example.evaluate(() => document.fonts.ready);
    await noHorizontalOverflow(docs);
    const allEmbedded = await docs.locator("iframe").elementHandles();
    for (const embeddedFrame of allEmbedded) {
      // Docs defers off-screen examples; inspect their rendered document, not about:blank.
      await embeddedFrame.scrollIntoViewIfNeeded();
      const rendered = await embeddedFrame.contentFrame();
      if (!rendered) throw new Error("An embedded preview did not load.");
      await expect(rendered.getByRole("heading", { level: 1, name: tutorial.title, exact: true })).toBeVisible();
      await rendered.evaluate(() => document.fonts.ready);
      await noHorizontalOverflow(rendered);
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
      await accessibility(rendered);
    }
    expect(await applicationStorage(example)).toEqual(storage);
    expect(errors).toEqual([]);
  });
}
