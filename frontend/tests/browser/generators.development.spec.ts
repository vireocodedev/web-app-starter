import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.skip(!process.env.GENERATOR_REHEARSAL, "Requires the isolated generated-output rehearsal workspace.");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("demo");
  await page.getByLabel("Password").fill("demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveTitle("Home · RGO application");
});

test("discovers every generated visual example through normal guide navigation", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated");
  const navigation = page.getByRole("navigation", { name: "Generated examples" });
  await expect(navigation.getByRole("link")).toHaveCount(21);
  for (const label of [
    "Generator Card",
    "Generator Profile",
    "Generator Dashboard",
    "Generator Orders",
    "Generator Overview",
    "Generator Workspace",
    "Generator Shell Workspace",
    "Generator Page Dashboard",
    "Generator Page Detail",
    "Generator Navigation",
    "Generator Form Wizard",
    "Generator Form Collection",
    "Generator Feature Workspace",
    "Generator Page Report",
    "Generator Component Entity Picker",
    "Generator Component Quick Create",
    "Generator Component Filter Bar",
    "Generator Component Dependent Fields",
    "Generator Component Save Controls",
    "Generator Component Related Records",
    "Generator Component Bulk Actions",
  ])
    await expect(navigation.getByRole("link", { name: label })).toBeVisible();
  await navigation.getByRole("link", { name: "Generator Card" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Count: 1");
});

test("rich dashboard and detail pages expose data states and retry without stale content", async ({ page }) => {
  for (const [name, content] of [
    ["dashboard", "Recent activity"],
    ["detail", "Record summary"],
  ]) {
    await page.goto(`/dev-guide/frontend/generated/page/generator-page-${name}--generator-page-${name}`);
    await expect(page.getByRole("heading", { name: content, exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "State", exact: true }).click();
    await page.getByRole("option", { name: "Error", exact: true }).click();
    await expect(page.getByText("This workspace could not be loaded.")).toBeVisible();
    await expect(page.getByRole("heading", { name: content, exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByRole("heading", { name: content, exact: true })).toBeVisible();
    await page.setViewportSize({ width: 375, height: 800 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("navigation scaffold uses real header sections, nested sidebar state and browser history", async ({ page }) => {
  const base = "/dev-guide/frontend/generated/navigation/generator-navigation--generator-navigation";
  await page.goto(base);
  await expect(page).toHaveURL(new RegExp(`${base}/overview$`));
  const sections = page.locator("[data-rgo-section-navigation]");
  await sections.getByRole("link", { name: "Workspace", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/workspace/records$`));
  await expect(page.locator("[data-rgo-page-navigation]")).toBeVisible();
  await page.getByRole("link", { name: "Open record details", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/workspace/records/details$`));
  await expect(sections.getByRole("link", { name: "Workspace", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(
    page.locator("[data-rgo-page-navigation]").getByRole("link", { name: "Records", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${base}/workspace/records$`));
  await page.goForward();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Details", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("button", { name: "Choose page: Records", exact: true }).click();
  const pages = page.getByRole("dialog", { name: "Workspace pages", exact: true });
  await pages.getByRole("link", { name: "Activity", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/workspace/activity$`));
  await expect(pages).toHaveCount(0);
  await page.getByRole("button", { name: "More sections", exact: true }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/settings$`));
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("workspace shell uses the installed narrow page menu and restores keyboard focus", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/shell/generator-shell-workspace--generator-shell-workspace");
  await page.getByRole("button", { name: "Review workspace", exact: true }).click();
  await expect(page.getByText("Workspace reviewed.", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  const selector = page.getByRole("button", { name: "Choose page: Overview", exact: true });
  await selector.click();
  await expect(page.getByRole("dialog", { name: "Workspace pages", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Workspace pages", exact: true })).toHaveCount(0);
  await expect(selector).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("generated form validates, awaits acknowledgement, reports errors and disables fields", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/form/generator-profile--generator-profile");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("This field is required.")).toBeVisible();
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("A generated profile");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Complete submission" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByLabel("Simulate failure").check();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByRole("button", { name: "Complete submission" }).click();
  await expect(page.getByText("Changes could not be saved. Try again.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue("A generated profile");
  await page.getByLabel("Disabled", { exact: true }).check();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Populated", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeVisible();
});

test("generated table filters, pages and recovers empty/loading/error states", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/table/generator-orders--generator-orders");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText("1–5 / 12")).toBeVisible();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByText("6–10 / 12")).toBeVisible();
  await page.getByLabel("Filter", { exact: true }).fill("Title 12");
  await expect(page.getByRole("rowheader", { name: "Title 12", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("combobox", { name: "State", exact: true }).click();
  await page.getByRole("option", { name: "Empty", exact: true }).click();
  await expect(page.getByText("No records found.")).toBeVisible();
  await page.getByRole("combobox", { name: "State", exact: true }).click();
  await page.getByRole("option", { name: "Loading", exact: true }).click();
  await expect(page.getByRole("status", { name: "Loading records…" })).toBeVisible();
  await page.getByRole("combobox", { name: "State", exact: true }).click();
  await page.getByRole("option", { name: "Error", exact: true }).click();
  await expect(page.getByText("Records could not be loaded.")).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("generated layout toggles its sidebar and remains usable on mobile", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/shell/generator-dashboard--generator-dashboard");
  const toggle = page.getByRole("button", { name: "Sidebar", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(page.locator("#main-content aside")).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 800 });
  await toggle.click();
  await expect(page.locator("#main-content aside")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("generated page callback and composite feature render actual public components", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/page/generator-overview--generator-overview");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Count: 1");
  await page.goto("/dev-guide/frontend/generated/feature/generator-workspace--generator-workspace");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Added through the generated form");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Added through the generated form", exact: true })).toBeVisible();
});

test("generated translations follow live locale changes without losing a draft", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/form/generator-profile--generator-profile");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Preserved draft");
  await page.getByRole("button", { name: "Choose language EN" }).click();
  await page.getByRole("menuitem", { name: "HR", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Naslov", exact: true })).toHaveValue("Preserved draft");
  await expect(page.getByRole("button", { name: "Stvori", exact: true })).toBeVisible();
});

test("sectioned editor retains rich input, reveals invalid fields and awaits the final save", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/form/generator-form-wizard--generator-form-wizard");
  const title = page.getByRole("textbox", { name: "Title", exact: true });
  await title.fill("Retained section draft");
  await page.getByRole("textbox", { name: "Notes", exact: true }).fill("Additional context");
  await page.getByRole("textbox", { name: "Quantity", exact: true }).fill("0");
  await page.getByRole("textbox", { name: "Budget", exact: true }).fill("12.5");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("checkbox", { name: "Active", exact: true }).check();
  await page.getByLabel("Due On", { exact: true }).fill("2026-01-15");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Retained section draft", { exact: true })).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByRole("button", { name: "Status: Choose an available option.", exact: true }).click();
  const status = page.getByRole("combobox", { name: "Status", exact: true });
  await expect(status).toBeFocused();
  await status.click();
  await page.getByRole("option", { name: "Sample record", exact: true }).click();
  const owner = page.getByRole("combobox", { name: "Owner", exact: true });
  await owner.fill("Sample");
  await page.getByRole("option", { name: "Sample record", exact: true }).click();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(title).toHaveValue("Retained section draft");
  await expect(page.getByRole("textbox", { name: "Notes", exact: true })).toHaveValue("Additional context");
  await expect(page.getByRole("textbox", { name: "Quantity", exact: true })).toHaveValue("0");
  await title.clear();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByRole("button", { name: "Title: This field is required.", exact: true }).click();
  await expect(title).toBeFocused();
  await title.fill("Ready to submit");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Complete submission", exact: true }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText('"quantity": 0');
  await expect(page.locator("pre")).toContainText('"active": true');
  await page.setViewportSize({ width: 375, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("child editor stages Apply and Cancel and Enter cannot save the parent", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/form/generator-form-collection--generator-form-collection");
  await page.getByRole("textbox", { name: "Collection title", exact: true }).fill("Sample order");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  const item = page.getByRole("region", { name: "New item", exact: true });
  await item.getByRole("textbox", { name: "Title", exact: true }).fill("Staged line");
  await item.getByRole("textbox", { name: "Title", exact: true }).press("Enter");
  await expect(item).toHaveCount(0);
  await expect(page.getByText("Title: Staged line", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete submission", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit item 1", exact: true }).click();
  await page
    .getByRole("region", { name: "Edit item", exact: true })
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("Discard this edit");
  await page.getByRole("button", { name: "Cancel item edit", exact: true }).click();
  await expect(page.getByText("Title: Staged line", { exact: true })).toBeVisible();
  await expect(page.getByText("Discard this edit", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Collection title", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Complete submission", exact: true }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove item 1", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit item 1", exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("record workspace filters across pages and guards unsaved panel edits", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/feature/generator-feature-workspace--generator-feature-workspace");
  await expect(page.getByText("1–5 / 14", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByText("6–10 / 14", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search all fields", exact: true }).fill("14");
  await expect(page.getByText("1–1 / 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^View:/ }).click();
  await expect(page.getByRole("dialog", { name: "Record details", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit record", exact: true }).click();
  const title = page.getByRole("textbox", { name: "Title", exact: true });
  await title.fill("Unsubmitted record edit");
  await page.getByRole("button", { name: "Close workspace panel", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Discard changes?", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(title).toHaveValue("Unsubmitted record edit");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  await expect(title).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search all fields", exact: true }).clear();
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("button", { name: "Create record", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("report applies filters deliberately and downloads the labelled export scope", async ({ page }) => {
  await page.goto("/dev-guide/frontend/generated/page/generator-page-report--generator-page-report");
  await expect(page.getByText("Choose a valid start and end date, then apply the filters.")).toBeVisible();
  await page.getByRole("textbox", { name: "Period start (inclusive)", exact: true }).fill("2026-01-01");
  await page.getByRole("textbox", { name: "Period end (inclusive)", exact: true }).fill("2026-01-31");
  await page.getByRole("button", { name: "Apply report filters", exact: true }).click();
  await expect(page.getByText("1–5 / 14", { exact: true })).toBeVisible();
  const currentDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV", exact: true }).click();
  const current = await currentDownload;
  expect(current.suggestedFilename()).toContain("current-page.csv");
  expect((await readFile((await current.path())!, "utf8")).split("\r\n")).toHaveLength(6);
  await page.getByRole("combobox", { name: "Export scope", exact: true }).click();
  await page.getByRole("option", { name: "All matching records", exact: true }).click();
  const allDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV", exact: true }).click();
  const all = await allDownload;
  expect(all.suggestedFilename()).toContain("all-matches.csv");
  expect((await readFile((await all.path())!, "utf8")).split("\r\n")).toHaveLength(15);
  await page.getByRole("textbox", { name: "Search all fields", exact: true }).fill("14");
  await expect(page.getByText("1–5 / 14", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Apply report filters", exact: true }).click();
  await expect(page.getByText("1–1 / 1", { exact: true })).toBeVisible();
  await page.getByLabel("Fail the next save or export", { exact: true }).check();
  await page.getByRole("button", { name: "Download CSV", exact: true }).click();
  await expect(page.getByText("The export failed. Try again.", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("entity picker supports keyboard search, retained selection and failed-read recovery", async ({ page }) => {
  await page.goto(
    "/dev-guide/frontend/generated/component/generator-component-entity-picker--generator-component-entity-picker",
  );
  const picker = page.getByRole("combobox", { name: "Related record", exact: true });
  await expect(picker).toHaveValue("Ana Novak");
  await picker.fill("Marko");
  await expect(page.getByRole("option", { name: "Marko Horvat", exact: true })).toBeVisible();
  await picker.press("ArrowDown");
  await picker.press("Enter");
  await expect(page.getByText("Selected person: Marko Horvat", { exact: true })).toBeVisible();
  await page.getByLabel("Simulate failure", { exact: true }).check();
  await picker.fill("Sara");
  await expect(page.getByText("Options could not be loaded. Your selection is retained.")).toBeVisible();
  await expect(page.getByText("Selected person: Marko Horvat", { exact: true })).toBeVisible();
  await page.getByLabel("Simulate failure", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await picker.click();
  await expect(page.getByRole("option", { name: "Sara Babić", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Selected person: Marko Horvat", { exact: true })).toBeVisible();
});

test("quick create retains the parent draft and selects only an explicitly accepted acknowledged record", async ({
  page,
}) => {
  await page.goto(
    "/dev-guide/frontend/generated/component/generator-component-quick-create--generator-component-quick-create",
  );
  const parentDraft = page.getByRole("textbox", { name: "Sample record", exact: true });
  const picker = page.getByRole("combobox", { name: "Related record", exact: true });
  await parentDraft.fill("Keep this parent draft");
  await expect(picker).toHaveValue("Ana Novak");
  await page.getByRole("button", { name: "Create related record", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Create related record", exact: true });
  await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Unsaved relationship");
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  const discard = page.getByRole("dialog", { name: "Discard this draft?", exact: true });
  await discard.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(editor.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Unsaved relationship");
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await discard.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(parentDraft).toHaveValue("Keep this parent draft");
  await expect(picker).toHaveValue("Ana Novak");

  await page.getByRole("button", { name: "Create related record", exact: true }).click();
  await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Created but not chosen");
  await editor.getByRole("button", { name: "Create record", exact: true }).click();
  await expect(editor.getByRole("textbox", { name: "Name", exact: true })).toBeDisabled();
  await expect(editor.getByRole("button", { name: "Use this record", exact: true })).toBeVisible();
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(picker).toHaveValue("Ana Novak");

  await page.getByRole("button", { name: "Create related record", exact: true }).click();
  await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Accepted relationship");
  await editor.getByRole("button", { name: "Create record", exact: true }).click();
  await editor.getByRole("button", { name: "Use this record", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(picker).toHaveValue("Accepted relationship");
  await expect(parentDraft).toHaveValue("Keep this parent draft");
});

test("filter bar stages mobile edits, applies an atomic URL reset and restores browser history", async ({ page }) => {
  const base = "/dev-guide/frontend/generated/component/generator-component-filter-bar--generator-component-filter-bar";
  await page.goto(base + "?unrelated=keep");
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const filters = page.getByRole("dialog", { name: "Filters", exact: true });
  await filters.getByRole("textbox", { name: "Search records", exact: true }).fill("discarded draft");
  await filters.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(filters).toHaveCount(0);
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(page.getByText("Active filters: 0", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(filters.getByRole("textbox", { name: "Search records", exact: true })).toHaveValue("");
  await filters.getByRole("textbox", { name: "Search records", exact: true }).fill("Record 18");
  await filters.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(filters).toHaveCount(0);
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Active filters: 1", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Generator Component Filter Bar", exact: true }).getByRole("listitem"),
  ).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("unrelated")).toBe("keep");
  expect(new URL(page.url()).searchParams.has("generatorComponentFilterBarPage")).toBe(false);
  await page.goBack();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(page.getByText("Active filters: 0", { exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByText("Active filters: 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters", exact: true }).click();
  await expect(page.getByText("Active filters: 0", { exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("unrelated")).toBe("keep");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("dependent form section validates the complete assignment and clears incompatible or hidden values", async ({
  page,
}) => {
  await page.goto(
    "/dev-guide/frontend/generated/component/generator-component-dependent-fields--generator-component-dependent-fields",
  );
  await page.getByRole("button", { name: "Submit assignment", exact: true }).click();
  await expect(page.getByText("Choose an available department.", { exact: true })).toBeVisible();
  const department = page.getByRole("combobox", { name: "Department", exact: true });
  const assignee = page.getByRole("combobox", { name: "Assignee", exact: true });
  await department.fill("Engineering");
  await page.getByRole("option", { name: "Engineering", exact: true }).click();
  await assignee.fill("Ana");
  await page.getByRole("option", { name: "Ana Novak", exact: true }).click();
  await department.fill("Operations");
  await page.getByRole("option", { name: "Operations", exact: true }).click();
  await expect(assignee).toHaveValue("");
  await expect(
    page.getByText("Choose an assignee belonging to the selected department.", { exact: true }),
  ).toBeVisible();
  await assignee.fill("Sara");
  await page.getByRole("option", { name: "Sara Babić", exact: true }).click();
  await page.getByRole("checkbox", { name: "An exception needs explanation", exact: true }).check();
  await page.getByRole("button", { name: "Submit assignment", exact: true }).click();
  await expect(page.getByText("Explain the exception.", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Reason", exact: true }).fill("Retained explanation");
  await department.fill("Engineering");
  await page.getByRole("option", { name: "Engineering", exact: true }).click();
  await expect(assignee).toHaveValue("Sara Babić");
  await page.getByRole("checkbox", { name: "An exception needs explanation", exact: true }).uncheck();
  await expect(page.getByRole("textbox", { name: "Reason", exact: true })).toHaveCount(0);
  await page.getByRole("checkbox", { name: "An exception needs explanation", exact: true }).check();
  await expect(page.getByRole("textbox", { name: "Reason", exact: true })).toHaveValue("");
  await page.getByRole("textbox", { name: "Reason", exact: true }).fill("Accepted explanation");
  await page.getByRole("button", { name: "Submit assignment", exact: true }).click();
  await expect(page.getByText("Assignment submitted.", { exact: true })).toBeVisible();
});

test("save controls guard explicit close, pending saves and route departure while retaining rejected drafts", async ({
  page,
}) => {
  const base =
    "/dev-guide/frontend/generated/component/generator-component-save-controls--generator-component-save-controls";
  await page.goto(base);
  const title = page.getByRole("textbox", { name: "Title", exact: true });
  await title.fill("Retained save draft");
  await page.getByRole("button", { name: "Try closing the editor", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Discard changes?", exact: true });
  await confirmation.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(title).toHaveValue("Retained save draft");
  await page.getByLabel("Fail the next save or export", { exact: true }).check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(title).toBeDisabled();
  await expect(page.getByRole("button", { name: "Discard changes", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Try closing the editor", exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(page.getByText("Editor closed.", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Complete submission", exact: true }).click();
  await expect(page.getByText("Changes could not be saved. Your draft is retained.", { exact: true })).toBeVisible();
  await expect(title).toHaveValue("Retained save draft");
  await page.getByLabel("Fail the next save or export", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Complete submission", exact: true }).click();
  await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  await title.fill("Dirty route departure");
  const destination = page
    .getByRole("navigation", { name: "Sections", exact: true })
    .getByRole("link", { name: "Generated examples", exact: true });
  await destination.click();
  await confirmation.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(page).toHaveURL(base);
  await expect(title).toHaveValue("Dirty route departure");
  await destination.click();
  await confirmation.getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(page).toHaveURL(/\/dev-guide\/frontend\/generated$/);
});

test("related records keep parent-scoped paging and actions independent from the parent record", async ({ page }) => {
  await page.goto(
    "/dev-guide/frontend/generated/component/generator-component-related-records--generator-component-related-records",
  );
  await expect(page.getByText("1–5 / 12", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByText("6–10 / 12", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View: alpha 06", exact: true }).click();
  await expect(page.getByText("Selected record: alpha 06", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Parent record", exact: true }).click();
  await page.getByRole("option", { name: "Project Beta", exact: true }).click();
  await expect(page.getByText("1–5 / 7", { exact: true })).toBeVisible();
  await expect(page.getByText("Selected record: alpha 06", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("rowheader", { name: "beta 01", exact: true })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: /^alpha / })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit: beta 01", exact: true }).click();
  const editor = page.getByRole("dialog");
  await editor.getByRole("textbox", { name: "Record name", exact: true }).fill("Beta edited");
  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("rowheader", { name: "Beta edited", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create related record", exact: true }).click();
  await editor.getByRole("textbox", { name: "Record name", exact: true }).fill("Beta created");
  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Related records: 8", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Link existing record", exact: true }).click();
  await expect(page.getByText("Related records: 9", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search records", exact: true }).fill("Linked");
  await expect(page.getByRole("rowheader", { name: "Linked record", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Parent record", exact: true }).click();
  await page.getByRole("option", { name: "Project Alpha", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Search records", exact: true })).toHaveValue("");
  await expect(page.getByText("Related records: 12", { exact: true })).toBeVisible();
});

test("bulk actions confirm explicit cross-page IDs, lock pending selection and retain failed selections", async ({
  page,
}) => {
  await page.goto(
    "/dev-guide/frontend/generated/component/generator-component-bulk-actions--generator-component-bulk-actions",
  );
  await page.getByRole("button", { name: "Select page", exact: true }).click();
  await expect(page.getByRole("toolbar").getByText("Selected records: 5", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page.getByRole("checkbox", { name: "Select 06", exact: true }).check();
  const toolbar = page.getByRole("toolbar");
  await expect(toolbar.getByText("Selected records: 6", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Run action", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Apply action to selected records?", exact: true });
  await expect(confirmation).toContainText("exactly 6 selected records");
  await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(toolbar.getByText("Selected records: 6", { exact: true })).toBeVisible();
  await page.getByLabel("Fail next action", { exact: true }).check();
  await page.getByLabel("Hold pending action", { exact: true }).check();
  await page.getByRole("button", { name: "Run action", exact: true }).click();
  await confirmation.getByRole("button", { name: "Confirm action", exact: true }).click();
  await expect(page.getByRole("button", { name: "Action in progress…", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Clear selection", exact: true })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "Select 06", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Release pending action", exact: true }).click();
  await expect(page.getByText("The action failed. Your selection has been retained.", { exact: true })).toBeVisible();
  await expect(toolbar.getByText("Selected records: 6", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Run action", exact: true }).click();
  await confirmation.getByRole("button", { name: "Confirm action", exact: true }).click();
  await page.getByRole("button", { name: "Release pending action", exact: true }).click();
  await expect(page.getByText("Action completed for 6 records.", { exact: true })).toBeVisible();
  await expect(toolbar.getByText("Selected records: 0", { exact: true })).toBeVisible();
  await expect(page.getByText("1–5 / 7", { exact: true })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "Record 07", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
