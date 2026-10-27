import { expect, test, type Frame, type Page } from "@playwright/test";

const topics = [
  {
    slug: "source-ownership",
    title: "Source ownership",
    alternate: "settings-owner",
    initial: "settings-presentation",
  },
  {
    slug: "dependency-direction",
    title: "Dependency direction",
    alternate: "shell-boundary",
    initial: "shell-presentation",
  },
  {
    slug: "public-module-apis",
    title: "Public module APIs",
    alternate: "private-implementation",
    initial: "private-implementation",
  },
  {
    slug: "runtime-and-state-ownership",
    title: "Runtime and state ownership",
    alternate: "state-ownership",
    initial: "state-ownership",
  },
] as const;

async function preview(page: Page) {
  const iframe = await page.locator("#storybook-preview-iframe").elementHandle();
  const frame = await iframe?.contentFrame();
  if (!frame) throw new Error("The architecture preview did not load.");
  return frame;
}

async function noHorizontalOverflow(frame: Frame) {
  await expect.poll(() => frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const topic of topics) {
  const prefix = `development-guide-architecture-${topic.slug}--`;

  test(`${topic.title}: all cases work, selection survives themes and narrow content stays reachable`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/?path=/story/${prefix}overview`);
    const frame = await preview(page);
    await expect(frame.getByRole("heading", { level: 1, name: topic.title, exact: true })).toBeVisible();
    const selector = frame.getByRole("combobox", { name: "Architecture case", exact: true });
    const options = await selector
      .locator("option")
      .evaluateAll(elements => elements.map(element => (element as HTMLOptionElement).value));
    expect(options).toHaveLength(3);
    const decisions = new Set<string>();
    for (const value of options) {
      await selector.selectOption(value);
      await expect(selector).toHaveValue(value);
      decisions.add(await frame.getByRole("heading", { level: 2 }).innerText());
      await expect(frame.getByRole("main").locator("pre code")).not.toBeEmpty();
      await frame.getByRole("heading", { name: "Review checkpoints", exact: true }).scrollIntoViewIfNeeded();
    }
    expect(decisions.size).toBe(3);
    await selector.focus();
    await selector.press("Home");
    await expect(selector).toHaveValue(options[0]!);
    await selector.press("End");
    await expect(selector).toHaveValue(options.at(-1)!);

    await page.setViewportSize({ width: 520, height: 1100 });
    for (const [label, background] of [
      ["Dark", "rgb(13, 17, 23)"],
      ["Soft dark", "rgb(34, 39, 46)"],
      ["Light", "rgb(255, 255, 255)"],
    ]) {
      await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption({ label });
      await expect
        .poll(() => frame.locator("body").evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(background);
      await expect(selector).toHaveValue(options.at(-1)!);
      await noHorizontalOverflow(frame);
    }
    await page.goto(`/?path=/story/${prefix}${topic.alternate}`);
    const alternate = await preview(page);
    await expect(alternate.getByRole("combobox", { name: "Architecture case", exact: true })).toHaveValue(
      topic.initial,
    );
    await noHorizontalOverflow(alternate);
    expect(errors).toEqual([]);
  });

  test(`${topic.title}: complete narrow Docs renders its walkthrough and copyable examples`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width: 520, height: 1100 });
    await page.goto(`/?path=/docs/${prefix}docs`);
    const docs = await preview(page);
    await expect(docs.getByRole("heading", { level: 1 }).filter({ hasText: topic.title })).toBeVisible();
    for (const heading of [
      "Before you start",
      "Common mistakes",
      "5. Verify your implementation",
      "Read this tutorial without Storybook",
      "Storybook fixture reference",
    ]) {
      await expect(docs.getByRole("heading").filter({ hasText: heading })).toBeVisible();
    }
    if (topic.slug !== "dependency-direction") {
      const comparison = docs.getByRole("table");
      await expect(comparison).toBeVisible();
      await expect(comparison.getByRole("columnheader").first()).toBeVisible();
      await expect(comparison.getByRole("rowheader").first()).toBeVisible();
      await expect(comparison.getByRole("cell").first()).not.toBeEmpty();
    }
    await expect(
      docs.locator(".docblock-source").last().getByRole("button", { name: "Copy", exact: true }),
    ).toBeVisible();
    const embedded = await docs.locator("iframe").elementHandle();
    const example = await embedded?.contentFrame();
    if (!example) throw new Error("The embedded architecture walkthrough did not load.");
    const selector = example.getByRole("combobox", { name: "Architecture case", exact: true });
    await selector.selectOption(topic.initial);
    for (const [label, background] of [
      ["Dark", "rgb(13, 17, 23)"],
      ["Light", "rgb(255, 255, 255)"],
    ]) {
      await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption({ label });
      await expect
        .poll(() => docs.locator(".sbdocs-wrapper").evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(background);
      await expect
        .poll(() => example.locator("body").evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(background);
      await expect(selector).toHaveValue(topic.initial);
    }
    await example.getByRole("heading", { name: "Review checkpoints", exact: true }).scrollIntoViewIfNeeded();
    await noHorizontalOverflow(example);
    await noHorizontalOverflow(docs);
    expect(errors).toEqual([]);
  });
}
