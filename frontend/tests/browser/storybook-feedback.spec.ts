import { expect, test, type Frame, type Page } from "@playwright/test";

const notifications = "development-guide-feedback-notifications--";
const confirmations = "development-guide-feedback-confirmations--";
const toast = (frame: Frame) => frame.locator(".MuiSnackbar-root");

async function preview(page: Page) {
  const iframe = await page.locator("#storybook-preview-iframe").elementHandle();
  const frame = await iframe?.contentFrame();
  if (!frame) throw new Error("Storybook preview did not load.");
  return frame;
}

async function open(page: Page, id: string) {
  await page.goto(`/?path=/story/${id}`);
  const frame = await preview(page);
  await expect(frame.getByRole("heading", { level: 1 })).toBeVisible();
  return frame;
}

async function docsExample(page: Page, prefix: string, heading: string) {
  await page.goto(`/?path=/docs/${prefix}docs`);
  const docs = await preview(page);
  await expect(docs.getByRole("heading", { level: 1 }).filter({ hasText: heading })).toBeVisible();
  for (const title of [
    "Before you start",
    "Files and ownership",
    "Where the app uses this",
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
  const iframe = await docs.locator("iframe").elementHandle();
  const frame = await iframe?.contentFrame();
  if (!frame) throw new Error("The Docs feedback example did not load.");
  await expect(frame.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
  return { docs, frame };
}

async function setTheme(page: Page, label: string) {
  await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption({ label });
}

test("notifications follow acknowledged saves and failed commands never report success", async ({ page }) => {
  let frame = await open(page, notifications + "saved");
  await frame.getByRole("button", { name: "Save contact", exact: true }).click();
  await expect(frame.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
  await expect(frame.getByText("Acknowledged saves: 0", { exact: true })).toBeVisible();
  await expect(toast(frame)).toHaveCount(0);
  await expect(toast(frame).getByRole("status")).toHaveText("Contact saved.");
  await expect(frame.getByText("Acknowledged saves: 1", { exact: true })).toBeVisible();
  frame = await open(page, notifications + "save-failure");
  await frame.getByRole("button", { name: "Save contact", exact: true }).click();
  await expect(toast(frame).getByRole("alert")).toContainText("Could not save the contact. Try again.");
  await expect(frame.getByText("Acknowledged saves: 0", { exact: true })).toBeVisible();
  await expect(frame.getByRole("button", { name: "Save contact", exact: true })).toBeEnabled();
});

test("notification actions restore local state while close only dismisses", async ({ page }) => {
  const frame = await open(page, notifications + "action");
  const archive = frame.getByRole("button", { name: "Archive contact", exact: true });
  await archive.click();
  await expect(frame.getByText("Contact is archived.", { exact: true })).toBeVisible();
  await toast(frame).getByRole("button", { name: "Undo", exact: true }).click();
  await expect(frame.getByText("Contact is active.", { exact: true })).toBeVisible();
  await expect(toast(frame)).toHaveCount(1);
  await expect(toast(frame).getByRole("status")).toHaveText("Contact restored.");
  await archive.click();
  await toast(frame).getByRole("button", { name: "Close notification", exact: true }).click();
  await expect(toast(frame)).toHaveCount(0);
  await expect(frame.getByText("Contact is archived.", { exact: true })).toBeVisible();
});

test("persistent notifications queue and matching IDs replace in place", async ({ page }) => {
  const frame = await open(page, notifications + "lifecycle");
  await frame.getByRole("button", { name: "Show maintenance warning", exact: true }).click();
  await expect(toast(frame).getByRole("alert")).toContainText("Maintenance starts soon. Save your work.");
  await frame.getByRole("button", { name: "Start sync", exact: true }).click();
  await expect(toast(frame)).toHaveCount(1);
  await expect(toast(frame)).toContainText("Maintenance starts soon.");
  await frame.getByRole("button", { name: "Dismiss warning", exact: true }).click();
  await expect(toast(frame).getByRole("status")).toHaveText("Sync in progress…");
  await frame.getByRole("button", { name: "Complete sync", exact: true }).click();
  await expect(toast(frame)).toHaveCount(1);
  await expect(toast(frame).getByRole("status")).toHaveText("Sync completed.");
  await expect(frame.getByText("Sync in progress…", { exact: true })).toHaveCount(0);
});

test("cancel, Escape and backdrop send no command; confirmation awaits one command", async ({ page }) => {
  const frame = await open(page, confirmations + "standard");
  const publish = () => frame.getByRole("button", { name: "Publish changes", exact: true });
  const dialog = frame.getByRole("dialog", { name: "Publish these changes?", exact: true });
  await publish().click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(publish()).toBeFocused();
  await expect(frame.getByText("Completed commands: 0", { exact: true })).toBeVisible();
  await publish().click();
  await dialog.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(frame.getByText("Completed commands: 0", { exact: true })).toBeVisible();
  await publish().click();
  await frame.locator(".MuiDialog-container").click({ position: { x: 24, y: 24 } });
  await expect(dialog).toBeHidden();
  await expect(frame.getByText("Completed commands: 0", { exact: true })).toBeVisible();
  await publish().click();
  await dialog.getByRole("button", { name: "Publish changes", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(frame.getByRole("button", { name: "Waiting…", exact: true })).toBeDisabled();
  await expect(frame.getByText("Completed commands: 0", { exact: true })).toBeVisible();
  await expect(toast(frame)).toHaveCount(0);
  await expect(toast(frame).getByRole("status")).toHaveText("Changes published.");
  await expect(frame.getByText("Completed commands: 1", { exact: true })).toBeVisible();
});

test("destructive prompts focus Cancel, retain state through themes and preserve a rejected delete", async ({
  page,
}) => {
  let frame = await open(page, confirmations + "destructive");
  await setTheme(page, "Light");
  await frame.getByRole("button", { name: "Delete contact", exact: true }).click();
  const dialog = frame.getByRole("dialog", { name: "Delete Alex Morgan?", exact: true });
  await expect(dialog.getByRole("button", { name: "Keep contact", exact: true })).toBeFocused();
  const light = await dialog.evaluate(element => getComputedStyle(element).backgroundColor);
  await setTheme(page, "Dark");
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(light);
  await setTheme(page, "Light");
  await expect.poll(() => dialog.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(light);
  await dialog.getByRole("button", { name: "Keep contact", exact: true }).click();
  await expect(frame.getByText("Completed commands: 0", { exact: true })).toBeVisible();
  frame = await open(page, confirmations + "failed-action");
  await frame.getByRole("button", { name: "Delete contact", exact: true }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Delete contact", exact: true }).click();
  await expect(toast(frame).getByRole("alert")).toContainText("The command failed. Try again.");
  await expect(frame.getByText("Contact is present: Alex Morgan.", { exact: true })).toBeVisible();
  await expect(frame.getByText("Completed commands: 0", { exact: true })).toBeVisible();
});

test("dirty cancellation retains the draft and confirmed discard closes only the editor", async ({ page }) => {
  const frame = await open(page, confirmations + "dirty-editor");
  const name = frame.getByRole("textbox", { name: "Contact name", exact: true });
  await name.fill("Alex edited");
  await frame.getByRole("button", { name: "Close editor", exact: true }).click();
  const dialog = frame.getByRole("dialog", { name: "Discard unsaved changes?", exact: true });
  await dialog.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(name).toHaveValue("Alex edited");
  await expect(frame.getByText("Draft: dirty", { exact: true })).toBeVisible();
  await frame.getByRole("button", { name: "Close editor", exact: true }).click();
  await dialog.getByRole("button", { name: "Discard changes", exact: true }).click();
  await expect(name).toHaveCount(0);
  await expect(frame.getByText("Editor is closed.", { exact: true })).toBeVisible();
  await expect(frame.getByText("Completed commands: 0", { exact: true })).toBeVisible();
});

test("expired and story-ended requests cannot contaminate another preview", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  let frame = await open(page, confirmations + "abortable");
  await frame.getByRole("button", { name: "Request expiring confirmation", exact: true }).click();
  await expect(frame.getByRole("dialog", { name: "Continue this session?", exact: true })).toBeVisible();
  await expect(frame.getByRole("dialog")).toBeHidden();
  await expect(frame.getByText("Confirmation expired. No command was sent.", { exact: true })).toBeVisible();
  await expect(frame.getByText("Completed commands: 0", { exact: true })).toBeVisible();

  frame = await open(page, notifications + "lifecycle");
  await frame.getByRole("button", { name: "Show maintenance warning", exact: true }).click();
  await expect(toast(frame)).toBeVisible();
  const standardStory = page.getByRole("link", { name: "Confirm before a command", exact: true });
  if (!(await standardStory.isVisible())) await page.getByText("Confirmations", { exact: true }).first().click();
  await standardStory.click();
  frame = await preview(page);
  await expect(frame.getByRole("heading", { name: "Confirmations", level: 1, exact: true })).toBeVisible();
  await expect(toast(frame)).toHaveCount(0);
  await frame.getByRole("button", { name: "Publish changes", exact: true }).click();
  await expect(frame.getByRole("dialog")).toBeVisible();
  const lifecycleStory = page.getByRole("link", { name: "Persistence, dismissal and replacement", exact: true });
  if (!(await lifecycleStory.isVisible())) await page.getByText("Notifications", { exact: true }).first().click();
  await lifecycleStory.click();
  frame = await preview(page);
  await expect(frame.getByRole("heading", { name: "Notifications", level: 1, exact: true })).toBeVisible();
  await expect(frame.getByRole("dialog")).toHaveCount(0);
  await expect(toast(frame)).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const [prefix, heading] of [
  [notifications, "Notifications"],
  [confirmations, "Confirmations"],
]) {
  test(`${heading}: narrow Docs is complete and retains live feedback through theme changes`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { docs, frame } = await docsExample(page, prefix, heading);
    if (heading === "Notifications") {
      await frame.getByRole("button", { name: "Save contact", exact: true }).click();
      await expect(toast(frame).getByRole("status")).toHaveText("Contact saved.");
      // Hover pauses the real Snackbar timer while the theme controls are changed programmatically.
      await toast(frame).hover();
    } else {
      await frame.getByRole("button", { name: "Publish changes", exact: true }).click();
      await expect(frame.getByRole("dialog")).toBeVisible();
    }
    for (const [label, color] of [
      ["Light", "rgb(255, 255, 255)"],
      ["Dark", "rgb(13, 17, 23)"],
      ["Light", "rgb(255, 255, 255)"],
    ]) {
      await setTheme(page, label);
      await expect
        .poll(() => docs.locator(".sbdocs-wrapper").evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(color);
      await expect
        .poll(() => frame.locator("body").evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(color);
      if (heading === "Notifications") await expect(toast(frame).getByRole("status")).toHaveText("Contact saved.");
      else await expect(frame.getByRole("dialog")).toBeVisible();
    }
    expect(await docs.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("mobile notification close and destructive actions remain reachable", async ({ page }) => {
  let frame = await open(page, notifications + "mobile");
  expect(await frame.evaluate(() => innerWidth)).toBe(320);
  await frame.getByRole("button", { name: "Save contact", exact: true }).click();
  await expect(toast(frame)).toBeVisible();
  await toast(frame).getByRole("button", { name: "Close notification", exact: true }).click();
  await expect(toast(frame)).toHaveCount(0);
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  frame = await open(page, confirmations + "mobile");
  expect(await frame.evaluate(() => innerWidth)).toBe(320);
  await frame.getByRole("button", { name: "Delete contact", exact: true }).click();
  const dialog = frame.getByRole("dialog", { name: "Delete Alex Morgan?", exact: true });
  const bounds = await dialog.evaluate(element => {
    const { left, right } = element.getBoundingClientRect();
    return { left, right };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(320);
  await dialog.getByRole("button", { name: "Delete contact", exact: true }).click();
  await expect(frame.getByText("Completed commands: 1", { exact: true })).toBeVisible();
  await expect(frame.getByText("Contact is deleted.", { exact: true })).toBeVisible();
  expect(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
