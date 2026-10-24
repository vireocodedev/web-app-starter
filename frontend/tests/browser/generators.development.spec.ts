import { expect, test } from "@playwright/test";

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
  await expect(navigation.getByRole("link")).toHaveCount(10);
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
