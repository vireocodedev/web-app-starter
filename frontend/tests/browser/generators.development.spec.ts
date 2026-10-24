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
  await expect(navigation.getByRole("link")).toHaveCount(6);
  for (const label of [
    "Generator Card",
    "Generator Profile",
    "Generator Dashboard",
    "Generator Orders",
    "Generator Overview",
    "Generator Workspace",
  ])
    await expect(navigation.getByRole("link", { name: label })).toBeVisible();
  await navigation.getByRole("link", { name: "Generator Card" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Count: 1");
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
