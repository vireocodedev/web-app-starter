import { expect, test, type Frame, type Page } from "@playwright/test";
import axe from "axe-core";

const dataPrefix = "development-guide-data-loading-and-saving-feature-data--";
const tablePrefix = "development-guide-collections-tables-and-collections--";
const localePrefix = "development-guide-localization-localization-and-formatting--";

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

test("feature data saves through real mutation options and a fresh preview has isolated data", async ({ page }) => {
  let frame = await openStory(page, dataPrefix + "overview", "Loading and saving feature data");
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).toContainText("Alex Morgan");
  await frame.getByRole("textbox", { name: "Contact name", exact: true }).fill("New tutorial contact");
  await frame.getByRole("button", { name: "Save contact", exact: true }).click();
  await expect(frame.getByRole("button", { name: "Saving contact…", exact: true })).toBeDisabled();
  await expect(frame.getByText(/Saved contact: New tutorial contact/)).toBeVisible();
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).toContainText("New tutorial contact");
  await expect(frame.getByText("2 contacts loaded.", { exact: true })).toBeVisible();
  await page.goto(`/?path=/story/${dataPrefix}empty`);
  frame = await openStory(page, dataPrefix + "overview", "Loading and saving feature data");
  await expect(frame.getByText("1 contacts loaded.", { exact: true })).toBeVisible();
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).not.toContainText("New tutorial contact");
});

test("feature data distinguishes failed reads from successful empty results and supports retry", async ({ page }) => {
  let frame = await openStory(page, dataPrefix + "read-failure", "Loading and saving feature data");
  await expect(frame.getByText("Contacts could not be loaded.", { exact: true })).toBeVisible();
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).toHaveCount(0);
  await frame.getByRole("button", { name: "Retry loading", exact: true }).click();
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).toContainText("Alex Morgan");
  frame = await openStory(page, dataPrefix + "empty", "Loading and saving feature data");
  await expect(frame.getByText("No contacts yet. Save a contact to populate this collection.")).toBeVisible();
  await expect(frame.getByRole("button", { name: "Retry loading", exact: true })).toHaveCount(0);
  await frame.getByRole("button", { name: "Save contact", exact: true }).click();
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).toContainText("Taylor Quinn");
});

test("a rejected write retains the draft and retry creates exactly one contact", async ({ page }) => {
  const frame = await openStory(page, dataPrefix + "save-failure", "Loading and saving feature data");
  const input = frame.getByRole("textbox", { name: "Contact name", exact: true });
  await input.fill("Retained draft");
  await frame.getByRole("button", { name: "Save contact", exact: true }).click();
  await expect(frame.getByText(/The simulated write was rejected before committing/)).toBeVisible();
  await expect(input).toHaveValue("Retained draft");
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).not.toContainText("Retained draft");
  await frame.getByRole("button", { name: "Save contact", exact: true }).click();
  await expect(frame.getByText("2 contacts loaded.", { exact: true })).toBeVisible();
  await expect(
    frame.getByRole("list", { name: "Loaded contacts" }).getByText("Retained draft", { exact: true }),
  ).toHaveCount(1);
});

test("removing the last collection observer cancels its obsolete read", async ({ page }) => {
  const frame = await openStory(page, dataPrefix + "cancellation", "Loading and saving feature data");
  await expect(frame.getByText("Collection read started.", { exact: true })).toBeVisible();
  await frame.getByRole("button", { name: "Hide collection", exact: true }).click();
  await expect(frame.getByText("Read canceled before completion.", { exact: true })).toBeVisible();
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).toHaveCount(0);
  await frame.getByRole("button", { name: "Show collection", exact: true }).click();
  await expect(frame.getByRole("list", { name: "Loaded contacts" })).toContainText("Alex Morgan");
});

for (const mode of ["client-collection", "server-collection"]) {
  test(`${mode}: filters and sorts the collection before paging and archives explicit selected IDs`, async ({
    page,
  }) => {
    const frame = await openStory(page, tablePrefix + mode, "Tables and collections");
    const table = frame.getByRole("table", { name: "Projects collection", exact: true });
    await expect(table).toContainText("Atlas migration");
    await expect(table).toContainText("Beacon rollout");
    await frame.getByRole("button", { name: /Go to next page/ }).click();
    await expect(table).toContainText("Canal inspection");
    await frame.getByRole("combobox", { name: "Rows per page", exact: true }).click();
    await frame.getByRole("option", { name: "4", exact: true }).click();
    await expect(table).toContainText("Atlas migration");
    await expect(table).toContainText("Delta renewal");
    await expect(frame.getByRole("button", { name: /Go to previous page/ })).toBeDisabled();
    await frame.getByRole("textbox", { name: "Filter projects", exact: true }).fill("Fjord");
    await expect(table).toContainText("Fjord survey");
    await expect(table).not.toContainText("Canal inspection");
    await frame.getByRole("button", { name: "Reset collection", exact: true }).click();
    const sort = table.getByRole("button", { name: /Project/ }).first();
    await sort.click();
    await sort.click();
    await expect(table).toContainText("Fjord survey");
    await expect(table).toContainText("Ember retrofit");
    await expect(table).not.toContainText("Atlas migration");
    await frame.getByRole("button", { name: "Reset collection", exact: true }).click();
    await frame.getByRole("checkbox", { name: "Select current page", exact: true }).check();
    await frame.getByRole("button", { name: /Go to next page/ }).click();
    await frame.getByRole("checkbox", { name: "Select Canal inspection", exact: true }).check();
    await expect(frame.getByRole("button", { name: "Archive selected (3)", exact: true })).toBeEnabled();
    await frame.getByRole("button", { name: "Archive selected (3)", exact: true }).click();
    await expect(frame.getByRole("status")).toContainText("Archived 3 projects locally.");
    await expect(table).toContainText("Fjord survey");
    await frame.getByRole("checkbox", { name: "Select Fjord survey", exact: true }).check();
    await frame.getByRole("button", { name: "Archive selected (1)", exact: true }).click();
    await expect(table).toContainText("Delta renewal");
    await expect(table).toContainText("Ember retrofit");
    await expect(table).not.toContainText("Fjord survey");
    await expect(frame.getByRole("button", { name: /Go to next page/ })).toBeDisabled();
    await frame.getByRole("textbox", { name: "Filter projects", exact: true }).fill("Atlas");
    await expect(frame.getByText("No projects match this filter.", { exact: true })).toBeVisible();
    await expect(frame.getByRole("button", { name: "Archive selected (0)", exact: true })).toBeDisabled();
    await frame.getByRole("textbox", { name: "Filter projects", exact: true }).fill("Delta");
    await expect(table).toContainText("Delta renewal");
  });
}

test("table loading, empty success and failed refresh have deliberate recovery", async ({ page }) => {
  let frame = await openStory(page, tablePrefix + "initial-loading", "Tables and collections");
  await expect(frame.getByText("Loading projects…", { exact: true })).toBeVisible();
  await expect(frame.getByRole("checkbox", { name: "Select Atlas migration", exact: true })).toHaveCount(0);
  await frame.getByRole("button", { name: "Finish loading", exact: true }).click();
  await expect(frame.getByRole("checkbox", { name: "Select Atlas migration", exact: true })).toBeEnabled();
  frame = await openStory(page, tablePrefix + "empty", "Tables and collections");
  await expect(frame.getByText("No projects in this collection.", { exact: true })).toBeVisible();
  await frame.getByRole("button", { name: "Restore sample projects", exact: true }).click();
  await expect(frame.getByRole("table", { name: "Projects collection", exact: true })).toContainText("Atlas migration");
  frame = await openStory(page, tablePrefix + "read-failure", "Tables and collections");
  await expect(frame.getByRole("alert")).toContainText("Refresh failed. Showing retained rows");
  await expect(frame.getByRole("checkbox", { name: "Select Atlas migration", exact: true })).toBeDisabled();
  await frame.getByRole("button", { name: "Retry read", exact: true }).click();
  await expect(frame.getByRole("checkbox", { name: "Select Atlas migration", exact: true })).toBeEnabled();
});

test("formatting inputs preserve domain drafts, application storage and document language", async ({ page }) => {
  const frame = await openStory(page, localePrefix + "overview", "Localization and formatting");
  const baseline = await frame.evaluate(() => ({
    language: document.documentElement.lang,
    direction: document.documentElement.dir,
    storage: Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith("rgo.app."))),
  }));
  await frame.getByRole("textbox", { name: "Draft name", exact: true }).fill("Preserved domain value");
  await expect(frame.getByTestId("formatted-number")).toHaveText("12,345.67");
  await frame.getByRole("combobox", { name: "Formatting locale", exact: true }).selectOption("hr");
  await expect(frame.getByTestId("formatted-number")).toHaveText("12.345,67");
  await expect(frame.getByTestId("formatted-percentage")).toContainText("72,5");
  await frame.getByRole("combobox", { name: "Currency", exact: true }).selectOption("USD");
  await expect(frame.getByTestId("formatted-currency")).toContainText(/USD|\$/);
  await frame.getByRole("combobox", { name: "Time zone", exact: true }).selectOption("UTC");
  await expect(frame.getByTestId("formatted-time")).toHaveText("23:30");
  await expect(frame.getByRole("textbox", { name: "Draft name", exact: true })).toHaveValue("Preserved domain value");
  expect(
    await frame.evaluate(() => ({
      language: document.documentElement.lang,
      direction: document.documentElement.dir,
      storage: Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith("rgo.app."))),
    })),
  ).toEqual(baseline);
});

test("English interpolation and numeric plurals remain explicit beside locale-category comparisons", async ({
  page,
}) => {
  let frame = await openStory(page, localePrefix + "plurals-and-interpolation", "Localization and formatting");
  await frame.getByRole("textbox", { name: "Draft name", exact: true }).fill("Taylor");
  await expect(frame.getByTestId("interpolated-message")).toHaveText("Welcome, Taylor!");
  await expect(frame.getByTestId("plural-message")).toHaveText("1 item selected");
  await frame.getByRole("combobox", { name: "Formatting locale", exact: true }).selectOption("hr");
  await frame.getByRole("combobox", { name: "Item count", exact: true }).selectOption("2");
  await expect(frame.getByTestId("plural-message")).toHaveText("2 items selected");
  await expect(frame.getByTestId("plural-category")).toHaveText("few");
  await frame.getByRole("combobox", { name: "Item count", exact: true }).selectOption("5");
  await expect(frame.getByTestId("plural-category")).toHaveText("other");
  frame = await openStory(page, localePrefix + "time-zones", "Localization and formatting");
  const zagreb = await frame.getByTestId("formatted-date-time").innerText();
  await frame.getByRole("combobox", { name: "Time zone", exact: true }).selectOption("UTC");
  await expect(frame.getByTestId("formatted-date-time")).not.toHaveText(zagreb);
  await expect(frame.getByTestId("formatted-date-time")).toHaveText(
    await frame.getByTestId("formatted-utc").innerText(),
  );
});

const tutorials = [
  { prefix: dataPrefix, title: "Loading and saving feature data", control: "Contact name" },
  { prefix: tablePrefix, title: "Tables and collections", control: "Filter projects" },
  { prefix: localePrefix, title: "Localization and formatting", control: "Draft name" },
] as const;

for (const tutorial of tutorials) {
  test(`${tutorial.title}: narrow Docs, global themes and accessibility preserve the working example`, async ({
    page,
  }) => {
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
    for (const [caption, rowCount] of tutorial.prefix === dataPrefix
      ? ([["Feature data states and recovery", 7]] as const)
      : tutorial.prefix === tablePrefix
        ? ([
            ["Client and server collection ownership", 2],
            ["Collection result states and recovery", 6],
          ] as const)
        : []) {
      const comparison = docs.getByRole("table", { name: caption, exact: true });
      await expect(comparison).toBeVisible();
      await expect(comparison.getByRole("rowheader")).toHaveCount(rowCount);
      await expect(comparison.getByRole("columnheader").first()).toBeVisible();
    }
    const embedded = await docs.locator("iframe").elementHandle();
    const example = await embedded?.contentFrame();
    if (!example) throw new Error("The embedded tutorial did not load.");
    const control = example.getByRole("textbox", { name: tutorial.control, exact: true });
    await control.fill(tutorial.prefix === tablePrefix ? "Atlas" : "Theme-preserved draft");
    const expected = await control.inputValue();
    for (const [label, background] of [
      ["Dark", "rgb(13, 17, 23)"],
      ["Soft dark", "rgb(34, 39, 46)"],
      ["Light", "rgb(255, 255, 255)"],
    ]) {
      await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption({ label });
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
    await noHorizontalOverflow(example);
    expect(
      await example.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("body *")].some(
          element =>
            /^(auto|scroll)$/.test(getComputedStyle(element).overflowY) &&
            element.scrollHeight > element.clientHeight + 1 &&
            element.clientHeight > 0,
        ),
      ),
    ).toBe(false);
    await accessibility(example);
    expect(errors).toEqual([]);
  });
}
