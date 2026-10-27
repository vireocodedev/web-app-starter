import { expect, test, type Frame, type Page } from "@playwright/test";

const tutorials = [
  { slug: "pages-with-header-tabs", story: "default-child" },
  { slug: "pages-with-left-navigation", story: "default-child" },
  { slug: "standalone-pages", story: "reports" },
  { slug: "navigation-chooser-pages", story: "chooser" },
] as const;

async function previewFrame(page: Page) {
  const iframe = await page.locator("#storybook-preview-iframe").elementHandle();
  const frame = await iframe?.contentFrame();
  if (!frame) throw new Error("The Storybook preview iframe did not load.");
  return frame;
}

async function ready(frame: Frame) {
  await expect(frame.getByRole("banner")).toBeVisible();
  await frame.evaluate(() => document.fonts.ready);
}

async function documentOverflow(frame: Frame) {
  return frame.evaluate(() => ({
    horizontal: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    vertical: document.documentElement.scrollHeight - innerHeight,
    nested: [...document.querySelectorAll<HTMLElement>("body *")]
      .filter(element => {
        const overflow = getComputedStyle(element).overflowY;
        return (
          element.clientHeight > 0 &&
          element.scrollHeight > element.clientHeight + 1 &&
          (overflow === "auto" || overflow === "scroll")
        );
      })
      .map(element => element.tagName + (element.id ? `#${element.id}` : "")),
  }));
}

async function docsExample(page: Page, slug: string) {
  await page.goto(`/?path=/docs/development-guide-routing-${slug}--docs`);
  const docs = await previewFrame(page);
  await expect(docs.locator(".sbdocs-wrapper")).toBeVisible();
  await expect(
    docs.locator(".docblock-source").last().getByRole("button", { name: "Copy", exact: true }),
  ).toBeVisible();
  await docs.evaluate(() => document.fonts.ready);
  const iframe = docs.locator("iframe");
  const element = await iframe.elementHandle();
  const frame = await element?.contentFrame();
  if (!frame) throw new Error("The Docs example iframe did not load.");
  await ready(frame);
  return { frame, canvas: docs.locator(".docs-story").filter({ has: iframe }) };
}

for (const tutorial of tutorials) {
  test(`${tutorial.slug}: short story fits its viewport`, async ({ page }) => {
    await page.goto(`/?path=/story/development-guide-routing-${tutorial.slug}--${tutorial.story}`);
    const frame = await previewFrame(page);
    await ready(frame);
    await expect.poll(() => documentOverflow(frame)).toEqual({ horizontal: 0, vertical: 0, nested: [] });
  });

  test(`${tutorial.slug}: Docs example has no inner or outer scrollbar`, async ({ page }) => {
    const { frame, canvas } = await docsExample(page, tutorial.slug);
    await expect.poll(() => documentOverflow(frame)).toEqual({ horizontal: 0, vertical: 0, nested: [] });
    await expect.poll(() => canvas.evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
  });
}

test("long content remains reachable with one story-window scroller", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { frame, canvas } = await docsExample(page, "navigation-chooser-pages");
  await frame.locator("#main-content").evaluate(element => {
    const content = document.createElement("section");
    content.style.minHeight = "1400px";
    content.textContent = "Additional page content";
    const end = document.createElement("p");
    end.id = "preview-content-end";
    end.textContent = "End of page content";
    element.append(content, end);
  });
  await expect.poll(async () => (await documentOverflow(frame)).vertical).toBeGreaterThan(0);
  expect((await documentOverflow(frame)).nested).toEqual([]);
  expect((await documentOverflow(frame)).horizontal).toBe(0);
  await expect.poll(() => canvas.evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
  await frame.locator("#main-content").focus();
  await page.keyboard.press("Control+End");
  await expect(frame.locator("#preview-content-end")).toBeInViewport();
  expect(await frame.evaluate(() => document.scrollingElement?.scrollTop)).toBeGreaterThan(0);
});
