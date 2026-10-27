import { expect, test, type Frame, type Page } from "@playwright/test";

const prefix = "development-guide-forms-entity-forms--";
const themes = [
  ["Dark", "rgb(13, 17, 23)"],
  ["Soft dark", "rgb(34, 39, 46)"],
  ["Light", "rgb(255, 255, 255)"],
] as const;

async function preview(page: Page) {
  const iframe = await page.locator("#storybook-preview-iframe").elementHandle();
  const frame = await iframe?.contentFrame();
  if (!frame) throw new Error("The Storybook preview iframe did not load.");
  return frame;
}

async function openStory(page: Page, story = "create") {
  await page.goto(`/?path=/story/${prefix}${story}`);
  const frame = await preview(page);
  await expect(frame.getByRole("heading", { level: 1 })).toBeVisible();
  return frame;
}

async function fillContact(frame: Frame) {
  await frame.getByRole("textbox", { name: "Name", exact: true }).fill(" Alex Morgan ");
  await frame.getByRole("textbox", { name: "Email", exact: true }).fill("alex@example.com");
  await frame.getByRole("textbox", { name: "Organization", exact: true }).fill(" Example Studio ");
  await frame.getByRole("textbox", { name: "Role", exact: true }).fill(" Designer ");
}

async function savedPayload(frame: Frame) {
  const result = frame.getByRole("region", { name: "Saved payload", exact: true });
  await expect(result).toBeVisible();
  return JSON.parse(await result.locator("pre").innerText());
}

test("create validates first, revalidates changes, and submits parsed values", async ({ page }) => {
  const frame = await openStory(page);
  await expect(frame.getByText("Name is required.", { exact: true })).toHaveCount(0);
  await frame.getByRole("button", { name: "Create contact", exact: true }).click();
  for (const field of ["Name", "Email", "Organization", "Role"]) {
    await expect(frame.getByText(`${field} is required.`, { exact: true })).toBeVisible();
  }
  await expect(frame.getByRole("region", { name: "Saved payload" })).toHaveCount(0);
  await fillContact(frame);
  const email = frame.getByRole("textbox", { name: "Email", exact: true });
  await email.fill("invalid");
  await expect(frame.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  await email.fill("alex@example.com");
  await expect(frame.getByText("Enter a valid email address.", { exact: true })).toHaveCount(0);
  await frame.getByRole("button", { name: "Create contact", exact: true }).click();
  expect(await savedPayload(frame)).toEqual({
    email: "alex@example.com",
    name: "Alex Morgan",
    organization: "Example Studio",
    role: "Designer",
    status: "ACTIVE",
  });
  await frame.getByRole("button", { name: "Start a new create session", exact: true }).click();
  await expect(frame.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("");
  await expect(frame.getByText("Draft: clean", { exact: true })).toBeVisible();
  await expect(frame.getByRole("region", { name: "Saved payload" })).toHaveCount(0);
});

test("update retains the existing identity and persists the selected status value", async ({ page }) => {
  const frame = await openStory(page, "update");
  await expect(frame.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Alex Morgan");
  await frame.getByRole("textbox", { name: "Role", exact: true }).fill(" Lead designer ");
  await frame.getByRole("combobox", { name: "Status", exact: true }).click();
  await frame.getByRole("option", { name: "Inactive", exact: true }).click();
  await frame.getByRole("button", { name: "Save changes", exact: true }).click();
  expect(await savedPayload(frame)).toMatchObject({ id: "story-contact", role: "Lead designer", status: "INACTIVE" });
});

test("failed save preserves the draft and returns to idle for retry", async ({ page }) => {
  const frame = await openStory(page, "save-failure");
  await fillContact(frame);
  const submit = frame.getByRole("button", { name: "Create contact", exact: true });
  await submit.click();
  await expect(frame.getByText("The contact could not be saved.", { exact: true })).toBeVisible();
  await expect(frame.getByText("Submission: idle", { exact: true })).toBeVisible();
  await expect(frame.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(" Alex Morgan ");
  await expect(frame.getByRole("region", { name: "Saved payload" })).toHaveCount(0);
  await expect(submit).toBeEnabled();
  await submit.click();
  expect(await savedPayload(frame)).toMatchObject({ name: "Alex Morgan" });
  await expect(frame.getByText("The contact could not be saved.", { exact: true })).toHaveCount(0);
});

test("slow save prevents duplicate submission/reset and preserves the draft through themes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const frame = await openStory(page, "slow-save");
  await fillContact(frame);
  await frame.getByRole("button", { name: "Create contact", exact: true }).click();
  await expect(frame.getByText("Submission: saving", { exact: true })).toBeVisible();
  await expect(frame.getByRole("button", { name: "Create contact", exact: true })).toBeDisabled();
  await expect(frame.getByRole("button", { name: "Start a new create session", exact: true })).toBeDisabled();
  await expect(frame.getByRole("region", { name: "Saved payload" })).toHaveCount(0);
  for (const [label, background] of themes) {
    await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption({ label });
    await expect
      .poll(() => frame.locator("body").evaluate(element => getComputedStyle(element).backgroundColor))
      .toBe(background);
    await expect(frame.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(" Alex Morgan ");
  }
  expect(await savedPayload(frame)).toMatchObject({ name: "Alex Morgan" });
  await expect(frame.getByText("Submission: idle", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Docs renders the complete tutorial and a working mobile form without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?path=/docs/${prefix}docs`);
  const docs = await preview(page);
  await expect(docs.getByRole("heading", { name: /Entity forms$/, level: 1 })).toBeVisible();
  for (const title of [
    "Before you start",
    "Files and ownership",
    "1. Add labels and validation messages",
    "2. Define the model and a localized schema factory",
    "3. Build the form with the shared policy",
    "4. Keep saving, failure, and completion in the parent",
    "Common mistakes",
    "5. Verify your implementation",
    "Read this tutorial without Storybook",
    "Storybook fixture reference",
  ]) {
    await expect(docs.getByRole("heading").filter({ hasText: title })).toBeVisible();
  }
  await expect(
    docs.locator(".docblock-source").last().getByRole("button", { name: "Copy", exact: true }),
  ).toBeVisible();
  await docs.evaluate(() => document.fonts.ready);
  const iframe = await docs.locator("iframe").elementHandle();
  const form = await iframe?.contentFrame();
  if (!form) throw new Error("The Docs form iframe did not load.");
  await fillContact(form);
  for (const [label, background] of themes) {
    await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption({ label });
    await expect
      .poll(() => docs.locator(".sbdocs-wrapper").evaluate(element => getComputedStyle(element).backgroundColor))
      .toBe(background);
    await expect
      .poll(() => form.locator("body").evaluate(element => getComputedStyle(element).backgroundColor))
      .toBe(background);
    await expect(form.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(" Alex Morgan ");
  }
  await form.getByRole("button", { name: "Create contact", exact: true }).click();
  expect(await savedPayload(form)).toMatchObject({ name: "Alex Morgan" });
  expect(await docs.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await form.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
