import { expect, test, type Locator, type Page } from "@playwright/test";
import axeCore from "axe-core";
import type { AxeResults } from "axe-core";

const axeSource = axeCore.source;

async function expectNoAxeViolations(page: Page, selector?: string) {
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async contextSelector => {
    const axe = (
      window as unknown as {
        axe: { run: (context: Document | Element) => Promise<AxeResults> };
      }
    ).axe;
    const context = contextSelector ? document.querySelector(contextSelector) : document;
    if (!context) throw new Error(`Missing axe context: ${contextSelector}`);
    return axe.run(context);
  }, selector);

  expect(
    results.violations,
    results.violations
      .map(violation => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
      .join("\n"),
  ).toEqual([]);
}

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Username").fill("demo");
  await page.getByLabel("Password").fill("demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveTitle("Home · RGO application");
}

async function expectScrollNear(page: Page, expected: number) {
  await expect
    .poll(() => page.evaluate(expectedPosition => Math.abs(window.scrollY - expectedPosition), expected))
    .toBeLessThanOrEqual(3);
}

async function scrollToPosition(page: Page, top: number) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight))
    .toBeGreaterThanOrEqual(top);
  await page.evaluate(
    position =>
      new Promise<void>(resolve => {
        window.addEventListener("scroll", () => resolve(), { once: true });
        window.scrollTo(0, position);
      }),
    top,
  );
  await expectScrollNear(page, top);
  return page.evaluate(() => window.scrollY);
}

async function expectFragmentTargetNearTop(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        return target?.getBoundingClientRect().top ?? Number.NEGATIVE_INFINITY;
      }),
    )
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        const appBar = document.querySelector("header.MuiAppBar-root");
        if (!target || !appBar) return Number.POSITIVE_INFINITY;
        return target.getBoundingClientRect().top - appBar.getBoundingClientRect().bottom;
      }),
    )
    .toBeLessThan(64);
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("links from the replaceable Home starter to the development guide categories", async ({ page }) => {
  const home = page.locator("#main-content");
  const guide = home.getByRole("link", { name: "Development guide" });
  await expect(guide).toHaveAttribute("href", "/dev-guide");
  await guide.click();
  await expect(page).toHaveURL("/dev-guide");
  await expect(page).toHaveTitle("Development guide · RGO application");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText("Development guide");
  await expect(page.locator("[data-rgo-header-second-row]")).toHaveCount(0);
  const categories = page.getByRole("navigation", { name: "Development guide categories" });
  await expect(categories.getByRole("link")).toHaveCount(2);
  await expect(categories.getByRole("link", { name: "Frontend", exact: true })).toHaveAttribute(
    "href",
    "/dev-guide/frontend",
  );
  await expect(categories.getByRole("link", { name: "Backend", exact: true })).toHaveAttribute(
    "href",
    "/dev-guide/backend",
  );
  await expectNoAxeViolations(page);
});

test("opens the guide from the account menu and switches its Frontend sections", async ({ page }) => {
  await expect(page.locator("[data-rgo-navigation-panel]")).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  const drawer = page.locator('[data-rgo-navigation-presentation="drawer"]');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Settings" })).toHaveCount(0);
  await expect(drawer.getByRole("link", { name: "Development guide" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await page.getByRole("button", { name: "Account" }).click();
  const accountMenu = page.getByRole("menu", { name: "Account" });
  const settings = accountMenu.getByRole("menuitem", { name: "Settings" });
  const guide = accountMenu.getByRole("menuitem", { name: "Development guide" });
  await expect(settings).toHaveAttribute("href", "/settings/appearance");
  await expect(guide).toHaveAttribute("href", "/dev-guide");
  const settingsBox = await settings.boundingBox();
  const guideBox = await guide.boundingBox();
  if (!settingsBox || !guideBox) throw new Error("Account links have no bounding box");
  expect(settingsBox.y).toBeLessThan(guideBox.y);
  await guide.click();
  await expect(accountMenu).toHaveCount(0);
  await expect(page).toHaveURL("/dev-guide");
  await expect(page.locator("[data-rgo-header-second-row]")).toHaveCount(0);
  await page.getByRole("link", { name: "Frontend", exact: true }).click();
  await expect(page).toHaveURL("/dev-guide/frontend/example-pages");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Development guide.*Frontend/);
  const sections = page.locator("[data-rgo-section-navigation]");
  await expect(sections.getByRole("link")).toHaveText([
    "Example pages",
    "Patterns",
    "Workflow patterns",
    "Architecture",
  ]);
  await expect(sections.getByRole("link", { name: "Example pages" })).toHaveAttribute("aria-current", "page");
  await page.locator("#main-content").getByRole("link", { name: "Contacts CRUD", exact: true }).click();
  await expect(page).toHaveURL("/dev-guide/frontend/example-pages/contacts-crud");
  await sections.getByRole("link", { name: "Patterns" }).click();
  await expect(page).toHaveURL("/dev-guide/frontend/patterns");
  await expect(page.getByRole("navigation", { name: "Pattern categories" })).toBeVisible();
  await sections.getByRole("link", { name: "Architecture" }).click();
  await expect(page).toHaveURL(/\/dev-guide\/frontend\/architecture\/source-map-and-ownership$/);
});

test("opens Backend without tabs and returns through the category header breadcrumb", async ({ page }) => {
  await page.goto("/dev-guide");
  const backend = page.getByRole("link", { name: "Backend", exact: true });
  await backend.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/dev-guide/backend");
  await expect(page).toHaveTitle("Backend · RGO application");
  await expect(page.locator("#main-content").getByRole("heading", { name: "Backend", exact: true })).toBeVisible();
  await expect(page.locator("#main-content").getByRole("link", { name: "Security", exact: true })).toBeVisible();
  await expect(page.locator("[data-rgo-header-second-row]")).toHaveCount(0);
  const header = page.locator("[data-rgo-header-context]");
  await expect(header).toHaveText(/Development guide.*Backend/);
  const guide = header.getByRole("link", { name: "Development guide", exact: true });
  await expect(guide).toHaveAttribute("href", "/dev-guide");
  await expectNoAxeViolations(page);
  await guide.click();
  await expect(page).toHaveURL("/dev-guide");
  await expect(page.getByRole("navigation", { name: "Development guide categories" })).toBeVisible();
  await expect(page.locator("[data-rgo-header-second-row]")).toHaveCount(0);
});

test("keeps guide categories and breadcrumbs usable in Croatian on a narrow screen", async ({ page }) => {
  await page.goto("/settings/appearance");
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "HR" }).click();
  await page.setViewportSize({ height: 800, width: 320 });
  await page.goto("/dev-guide");
  await expect(page.getByRole("heading", { name: "Kategorije", exact: true })).toBeVisible();
  await expect(page.locator("[data-rgo-header-second-row]")).toHaveCount(0);
  await expectNoAxeViolations(page);
  await page.getByRole("link", { name: "Backend", exact: true }).click();
  await expect(page.locator("#main-content").getByRole("heading", { name: "Backend", exact: true })).toBeVisible();
  await expect(page.locator("#main-content").getByRole("link", { name: "Sigurnost", exact: true })).toBeVisible();
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Vodič za razvoj.*Backend/);
  await expectNoAxeViolations(page);
  await page.locator("[data-rgo-header-context]").getByRole("link", { name: "Vodič za razvoj", exact: true }).click();
  await page.getByRole("link", { name: "Frontend", exact: true }).click();
  await expect(page).toHaveURL("/dev-guide/frontend/example-pages");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Vodič za razvoj.*Frontend/);
  await expect(page.locator("[data-rgo-section-navigation]")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expectNoAxeViolations(page);
});

test("redirects legacy guide links while preserving their query and fragment", async ({ page }) => {
  await page.goto("/dev-guide/architecture/source-map-and-ownership?example=legacy#source-roots");
  await expect(page).toHaveURL("/dev-guide/frontend/architecture/source-map-and-ownership?example=legacy#source-roots");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Development guide.*Frontend/);
  await page.goto(
    "/dev-guide/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas?example=legacy#routing-route-parameters-and-breadcrumbs",
  );
  await expect(page).toHaveURL(
    "/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas?example=legacy#routing-route-parameters-and-breadcrumbs",
  );
  const header = page.locator("[data-rgo-header-context]");
  await expect(header).toContainText("Frontend");
  await expect(header.getByRole("button", { name: "atlas" })).toBeVisible();
});

test("keeps top-level mobile context and the dashboard shortcut distinct", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 390 });
  await page.goto("/");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText("Home");
  const bottom = page.getByRole("navigation", { name: "Bottom navigation" });
  const dashboard = bottom.getByRole("link", { name: "Contacts dashboard" });
  await dashboard.click();
  await expect(page).toHaveURL("/dev-guide/frontend/example-pages/contacts-dashboard");
  await expect(page).toHaveTitle("Contacts dashboard · RGO application");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Development guide.*Frontend/);
  await expect(dashboard).toHaveAttribute("aria-current", "page");
  const sections = page.locator("[data-rgo-section-navigation]");
  await expect(sections.getByRole("link", { name: "Example pages" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("banner").getByRole("button", { name: "More navigation" })).toHaveCount(0);
  await page.goto("/dev-guide/frontend/architecture/tests-mocks-stories-and-architecture-checks");
  await expect(dashboard).not.toHaveAttribute("aria-current", "page");
  await bottom.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "HR" }).click();
  await page.setViewportSize({ height: 800, width: 320 });
  const localizedDashboard = page
    .getByRole("navigation", { name: "Donja navigacija" })
    .getByRole("link", { name: "Nadzorna ploča kontakata" });
  await localizedDashboard.click();
  await expect(page).toHaveTitle("Nadzorna ploča kontakata · RGO aplikacija");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Vodič za razvoj.*Frontend/);
  await expect(localizedDashboard).toHaveAttribute("aria-current", "page");
});

test("names the populated Contacts create action in both locales on a narrow view", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 390 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Development guide.*Frontend/);
  await expect(page.getByRole("button", { name: "Add contact" })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Settings" }).click();
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "HR" }).click();
  await page.goBack();

  await expect(page.getByRole("button", { name: "Dodaj kontakt" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("uses a flush Contacts workspace on mobile and restores its desktop frame", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 320 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  const main = page.locator("#main-content");
  const surface = page.locator('[data-rgo-page-surface="contacts"]');
  const bottom = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect(surface).toBeVisible();
  await expect(main).toHaveCSS("padding-left", "0px");
  await expect(main).toHaveCSS("padding-right", "0px");
  await expect(surface).toHaveCSS("border-top-left-radius", "0px");
  await expect(surface).toHaveCSS("box-shadow", "none");
  await expect(surface).toHaveCSS("border-top-width", "0px");
  await expect(bottom).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const contacts = document.querySelector('[data-rgo-page-surface="contacts"]');
        const navigation = document.querySelector("[data-rgo-bottom-navigation]");
        if (!contacts || !navigation) return false;
        return contacts.getBoundingClientRect().bottom <= navigation.getBoundingClientRect().top + 1;
      }),
    )
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true,
  );

  await page.setViewportSize({ height: 800, width: 1024 });
  await expect(main).toHaveCSS("padding-left", "12px");
  await expect(main).toHaveCSS("padding-right", "12px");
  await expect(surface).not.toHaveCSS("border-top-left-radius", "0px");
  await expect(surface).not.toHaveCSS("box-shadow", "none");
  await expect(bottom).toHaveCount(0);
});

test("gives the desktop Contacts workspace a contrast outline", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  const surface = page.locator('[data-rgo-page-surface="contacts"]');
  await expect(surface).toHaveCSS("border-top-width", "1px");
  const normalBorder = await surface.evaluate(element => getComputedStyle(element).borderTopColor);
  await page.goto("/settings/appearance");
  await page.getByRole("group", { name: "Increased contrast" }).getByRole("button", { name: "Yes" }).click();
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  await expect(surface).toBeVisible();
  await expect(surface).toHaveCSS("border-top-width", "1px");
  const colors = await surface.evaluate(element => {
    const border = getComputedStyle(element).borderTopColor;
    const probe = document.createElement("span");
    probe.style.color = "var(--mui-palette-rgo-borderSubtle)";
    document.body.append(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    return { border, token };
  });
  expect(colors.border).toBe(colors.token);
  expect(colors.border).not.toBe(normalBorder);
});

test("underlines content links on Patterns and Architecture when Always is selected", async ({ page }) => {
  await page.goto("/settings/accessibility");
  await page.getByRole("group", { name: "Link underlines" }).getByRole("button", { name: "Always" }).click();

  await page.goto("/dev-guide/frontend/architecture/dependency-boundaries-and-imports");
  const articleLink = page.locator("main article p a.MuiLink-root").first();
  await expect(articleLink).toBeVisible();
  await expect(articleLink).toHaveCSS("text-decoration-line", "underline");

  await page.goto("/dev-guide/frontend/architecture/runtime-providers-and-lifetimes");
  const relatedLink = page.locator("main article nav a.MuiLink-root").first();
  await expect(relatedLink).toBeVisible();
  await expect(relatedLink).toHaveCSS("text-decoration-line", "underline");
  const pageNavigation = page.locator("main nav a.MuiLink-underlineNone").first();
  await expect(pageNavigation).toBeVisible();
  await expect(pageNavigation).toHaveCSS("text-decoration-line", "none");

  await page.goto("/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas");
  const patternLink = page.locator('main a.MuiLink-root[href="/projects"]').first();
  await expect(patternLink).toBeVisible();
  await expect(patternLink).toHaveCSS("text-decoration-line", "underline");
});

test("keeps the active guide tab visible when other tabs enter More", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1024 });
  await page.goto("/dev-guide/frontend/architecture/source-map-and-ownership");
  const sections = page.locator("[data-rgo-section-navigation]");
  await sections.evaluate(element => {
    element.style.maxWidth = "280px";
  });
  const active = sections.getByRole("link", { name: "Architecture" });
  await expect(active).toBeVisible();
  await expect(active).toHaveAttribute("aria-current", "page");
  expect(
    await active.evaluate(element => ({
      bottom: getComputedStyle(element, "::after").bottom,
      height: getComputedStyle(element, "::after").height,
    })),
  ).toEqual({ bottom: "-1px", height: "2px" });
  const more = sections.getByRole("button", { name: "More navigation" });
  await expect(more).toBeVisible();
  await more.click();
  const overflow = page.getByRole("menu", { name: "Sections" });
  await expect(overflow.getByRole("menuitem", { name: "Example pages" })).toBeVisible();
  await page.setViewportSize({ height: 800, width: 390 });
  await expect(overflow).toHaveCount(0);
  await expect(more).toHaveCount(0);
  await expect(sections.getByRole("link", { name: "Architecture" })).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ height: 800, width: 1024 });
  await expect(more).toBeVisible();
  await expect(overflow).toHaveCount(0);
});

test("shows route-owned project context and switches projects", async ({ page }) => {
  await page.goto("/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas");
  const header = page.locator("[data-rgo-header-context]");
  await expect(header).toContainText("Development guide");
  const selector = header.getByRole("button", { name: "atlas" });
  await expect(selector).toHaveClass(/MuiButton-text/);
  await selector.click();
  await page.getByRole("menuitem", { name: "orion" }).click();
  await expect(page).toHaveURL(
    "/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/orion",
  );
  await expect(header.getByRole("button", { name: "orion" })).toBeVisible();
  await expect(
    page.locator("#main-content").getByRole("navigation", { name: "Breadcrumbs", exact: true }),
  ).toBeVisible();
});

test("applies desktop sticky preferences while keeping only mobile row one sticky", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await page.goto("/dev-guide/frontend/architecture/source-map-and-ownership");
  const first = page.getByRole("banner");
  const second = page.locator("[data-rgo-header-second-row]");
  await expect(first).toHaveCSS("position", "sticky");
  await expect(second).toHaveCSS("position", "static");
  const sameHeaderBackground = () =>
    page.evaluate(() => {
      const firstRow = document.querySelector("header.MuiAppBar-root");
      const secondRow = document.querySelector("[data-rgo-header-second-row]");
      return (
        firstRow &&
        secondRow &&
        getComputedStyle(firstRow).backgroundColor === getComputedStyle(secondRow).backgroundColor
      );
    });
  await expect.poll(sameHeaderBackground).toBe(true);
  await page.getByRole("button", { name: "Color theme" }).click();
  await page.getByRole("menu", { name: "Color theme" }).getByRole("menuitem", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-dark", "");
  await expect.poll(sameHeaderBackground).toBe(true);
  await page.evaluate(() => localStorage.setItem("rgo.app.header-stickiness", '"both-rows"'));
  await page.reload();
  await expect(first).toHaveCSS("position", "sticky");
  await expect(second).toHaveCSS("position", "sticky");
  await expect(page.locator("[data-rgo-header-divider]")).toHaveCount(0);
  await scrollToPosition(page, 300);
  await expect.poll(() => first.evaluate(element => element.getBoundingClientRect().top)).toBe(0);
  await expect.poll(() => second.evaluate(element => element.getBoundingClientRect().top)).toBe(64);
  await page.evaluate(() => localStorage.setItem("rgo.app.header-stickiness", '"none"'));
  await page.reload();
  await expect(first).toHaveCSS("position", "static");
  await expect(second).toHaveCSS("position", "static");
  await expect(page.locator("[data-rgo-header-divider]")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 300));
  await expectScrollNear(page, 300);
  await expect.poll(() => second.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0);
  await page.setViewportSize({ height: 800, width: 390 });
  await expect(first).toHaveCSS("position", "sticky");
  await expect(second).toHaveCSS("position", "static");
});

for (const width of [1280, 390]) {
  test(`keeps the header divider visible after row two scrolls away at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ height: 800, width });
    const first = page.getByRole("banner");
    const second = page.locator("[data-rgo-header-second-row]");
    const visibleDivider = () =>
      page.evaluate(() => {
        const header = document.querySelector("header.MuiAppBar-root");
        if (!header) throw new Error("Missing first header row");
        const headerRect = header.getBoundingClientRect();
        return Array.from(document.querySelectorAll("[data-rgo-shell-content-column] > *"))
          .filter(element => parseFloat(getComputedStyle(element).borderBottomWidth) === 1)
          .map(element => {
            const bottom = element.getBoundingClientRect().bottom;
            const painted = document.elementFromPoint(headerRect.right - 8, bottom - 1);
            return bottom >= headerRect.bottom && painted && element.contains(painted) ? bottom : null;
          })
          .filter(bottom => bottom !== null);
      });
    const expectDividerAt = async (row: Locator) => {
      await expect.poll(async () => (await visibleDivider()).length).toBe(1);
      await expect
        .poll(async () => {
          const rowBottom = await row.evaluate(element => element.getBoundingClientRect().bottom);
          return Math.abs((await visibleDivider())[0]! - rowBottom);
        })
        .toBeLessThanOrEqual(1);
    };

    for (const mode of ["light", "dark"]) {
      await page.evaluate(value => localStorage.setItem("rgo.app.color-mode", JSON.stringify(value)), mode);
      await page.goto("/dev-guide/frontend/architecture/source-map-and-ownership");
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute(`data-${mode}`, "");
      await expect(first).toHaveCSS("position", "sticky");
      await expect(second).toHaveCSS("position", "static");
      await expectDividerAt(second);
      await scrollToPosition(page, 24);
      await expectDividerAt(second);
      await scrollToPosition(page, 300);
      await expect.poll(() => second.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0);
      await expectDividerAt(first);
      await scrollToPosition(page, 0);
      await expectDividerAt(second);
    }
  });
}

test("opens Pattern categories and Architecture with independent deep links", async ({ page }) => {
  await page.goto("/dev-guide/frontend/patterns");
  await expect(page).toHaveURL("/dev-guide/frontend/patterns");
  const categories = page.getByRole("navigation", { name: "Pattern categories" });
  await expect(categories.getByRole("link")).toHaveText([
    "i18n",
    "Signals",
    "Server data",
    "Routing and URLs",
    "Overlays",
    "Tables and collections",
    "Forms",
    "Feedback",
  ]);
  await categories.getByRole("link", { name: "i18n", exact: true }).click();
  await expect(page).toHaveURL(/\/patterns\/localization-and-formatting\/.+$/);
  await expect(page.locator("[data-rgo-page-navigation]")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "i18n", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reload example" }).first()).toBeVisible();
  await expectNoAxeViolations(page, "[data-rgo-page-navigation]");

  await page.goto("/dev-guide/frontend/architecture/source-map-and-ownership");
  await expect(page.locator("[data-documentation-rail]")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Architecture", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Source map and ownership" }).last()).toBeVisible();
  await expect(page).toHaveTitle("Source map and ownership · RGO application");
  await expectNoAxeViolations(page);

  await page.goto("/dev-guide/frontend/architecture");
  await expect(page).toHaveURL(/\/dev-guide\/frontend\/architecture\/source-map-and-ownership$/);
});

test("restores query-entry positions while replace updates preserve focus and scroll", async ({ page }) => {
  await page.goto(
    "/dev-guide/frontend/patterns/routing-and-url-state/search-parameters#routing-search-parameters-filters",
  );
  const query = page.getByRole("textbox", { name: "Search projects" });
  await expect(query).toBeVisible();
  await query.focus();
  const fragmentPosition = await page.evaluate(() => window.scrollY);
  await query.fill("atlas");
  await expect(query).toBeFocused();
  await expect(page.getByText("?q=atlas", { exact: true })).toBeVisible();
  await expectScrollNear(page, fragmentPosition);

  const firstPosition = await scrollToPosition(page, 300);
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(page).toHaveURL(/(?:\?|&)page=2(?:&|#|$)/);
  await expect(page.getByText("Current page: 2")).toBeVisible();
  await expectScrollNear(page, firstPosition);

  const secondPosition = await scrollToPosition(page, 600);
  await page.goBack();
  await expect(page.getByText("Current page: 1")).toBeVisible();
  await expectScrollNear(page, firstPosition);
  await page.goForward();
  await expect(page.getByText("Current page: 2")).toBeVisible();
  await expectScrollNear(page, secondPosition);
});

test("restores distinct long-page visits and gives recorded positions priority over fragments", async ({ page }) => {
  await page.goto("/dev-guide/frontend/architecture/source-map-and-ownership#source-roots");
  const sourceRoots = page.locator("#source-roots");
  await expect(sourceRoots).toBeVisible();
  await expect
    .poll(() => sourceRoots.evaluate(element => element.getBoundingClientRect().top))
    .toBeGreaterThanOrEqual(0);
  const firstPosition = await scrollToPosition(page, 300);

  const architectureNavigation = page.getByRole("navigation", {
    exact: true,
    name: "Architecture",
  });
  await architectureNavigation
    .getByRole("link", {
      name: "From entry point to rendered application",
    })
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL("/dev-guide/frontend/architecture/entry-point-to-rendered-application");
  await expect(
    page
      .getByRole("heading", {
        name: "From entry point to rendered application",
      })
      .last(),
  ).toBeVisible();
  await expectScrollNear(page, 0);
  const secondPosition = await scrollToPosition(page, 450);

  await architectureNavigation
    .getByRole("link", { name: "Source map and ownership" })
    .evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page).toHaveURL("/dev-guide/frontend/architecture/source-map-and-ownership");
  await expect(page.getByRole("heading", { name: "Source map and ownership" }).last()).toBeVisible();
  await expectScrollNear(page, 0);
  const repeatedPathPosition = await scrollToPosition(page, 550);

  await page.goBack();
  await expect(
    page
      .getByRole("heading", {
        name: "From entry point to rendered application",
      })
      .last(),
  ).toBeVisible();
  await expectScrollNear(page, secondPosition);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Source map and ownership" }).last()).toBeVisible();
  await expectScrollNear(page, firstPosition);
  await page.goForward();
  await expect(
    page
      .getByRole("heading", {
        name: "From entry point to rendered application",
      })
      .last(),
  ).toBeVisible();
  await expectScrollNear(page, secondPosition);
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Source map and ownership" }).last()).toBeVisible();
  await expectScrollNear(page, repeatedPathPosition);
});

test("returns from login to a fragment after protected content is ready", async ({ page }) => {
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/dev-guide/frontend/architecture/router-and-shell-responsibilities#window-scroll-policy");
  await page.getByLabel("Username").fill("demo");
  await page.getByLabel("Password").fill("demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(
    "/dev-guide/frontend/architecture/router-and-shell-responsibilities#window-scroll-policy",
  );
  const target = page.locator("#window-scroll-policy");
  await expect(target).toBeVisible();
  await expectFragmentTargetNearTop(page);
});

test("navigates a router-managed same-page fragment after route commit", async ({ page }) => {
  await page.goto("/dev-guide/frontend/architecture/router-and-shell-responsibilities");
  const policyLink = page.getByRole("link", {
    exact: true,
    name: "window scroll policy",
  });
  await expect(policyLink).toBeVisible();
  await scrollToPosition(page, 300);
  await policyLink.click();
  await expect(page).toHaveURL(/#window-scroll-policy$/);
  await expectFragmentTargetNearTop(page);
});

test("keeps selected styling after navigating through truncated labels", async ({ page }) => {
  const cases = [
    {
      from: "/dev-guide/frontend/architecture/source-map-and-ownership",
      label: "From entry point to rendered application",
      navigation: "Architecture",
      to: "/dev-guide/frontend/architecture/entry-point-to-rendered-application",
    },
  ] as const;

  for (const scenario of cases) {
    await page.goto(scenario.from);
    const link = page
      .getByRole("navigation", {
        exact: true,
        name: scenario.navigation,
      })
      .getByRole("link", { exact: true, name: scenario.label });
    const label = link.locator("[data-examples-navigation-label]");
    await link.evaluate(element => {
      element.style.maxWidth = "140px";
    });
    await expect.poll(() => label.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    await link.hover();

    const reveal = page.locator("[data-examples-navigation-label-reveal]");
    await expect(reveal).toHaveText(scenario.label);
    await reveal.click();

    await expect(page).toHaveURL(scenario.to);
    await expect(reveal).toHaveCount(0);
    await expect(link).toHaveClass(/Mui-selected/);
    await expect(label).toHaveCSS("font-weight", "700");
    await expect.poll(() => link.evaluate(element => window.getComputedStyle(element, "::before").width)).toBe("2px");
  }
});

test("keeps mobile sections accessible through a sheet, separate from the page menu", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 390 });
  await page.goto("/dev-guide/frontend/architecture/tests-mocks-stories-and-architecture-checks");
  await expect(page).toHaveTitle("Tests, mocks, stories, and architecture checks · RGO application");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Development guide.*Frontend/);
  await expect(
    page.getByRole("navigation", { name: "Breadcrumbs" }).getByText("Tests, mocks, stories, and architecture checks"),
  ).toBeVisible();
  const sections = page.locator("[data-rgo-section-navigation]");
  await expect(sections.getByRole("link", { name: "Architecture" })).toHaveAttribute("aria-current", "page");
  await expect.poll(() => sections.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  const more = sections.getByRole("button", { name: "More sections" });
  await expect(more).toBeVisible();
  await more.click();
  const sheet = page.getByRole("dialog", { name: "Sections" });
  await expect(sheet.getByRole("link", { name: "Example pages" })).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Patterns" })).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Architecture" })).toHaveAttribute("aria-current", "page");
  await sheet.getByRole("link", { name: "Example pages" }).click();
  await expect(page).toHaveURL("/dev-guide/frontend/example-pages");
  await expect(sheet).toHaveCount(0);
  await expect(sections.getByRole("link", { name: "Example pages" })).toHaveAttribute("aria-current", "page");
  await page.goBack();
  await expect(sections.getByRole("link", { name: "Architecture" })).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ height: 800, width: 320 });
  await expect(sections.getByRole("link", { name: "Architecture" })).toBeVisible();
  await sections.evaluate(element => {
    element.style.maxWidth = "140px";
  });
  await expect
    .poll(() =>
      sections.evaluate(element => {
        const active = element.querySelector('[aria-current="page"]');
        const moreButton = element.querySelector('[aria-haspopup="dialog"]');
        if (!active || !moreButton) return false;
        const bounds = element.getBoundingClientRect();
        return (
          active.getBoundingClientRect().left >= bounds.left - 1 &&
          moreButton.getBoundingClientRect().right <= bounds.right + 1
        );
      }),
    )
    .toBe(true);
  await sections.evaluate(element => {
    element.style.maxWidth = "";
  });
  await page.getByRole("button", { name: "On this page" }).click();
  await expect(page.getByRole("navigation", { name: "Architecture", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Article contents" })).toBeVisible();
  await page.keyboard.press("Escape");
  const bottom = page.getByRole("navigation", { name: "Bottom navigation" });
  await bottom.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "HR" }).click();
  await page.getByRole("group", { name: "Tema boja" }).getByRole("button", { name: "Tamna", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-dark", "");
  await page.setViewportSize({ height: 800, width: 320 });
  await page.goBack();
  await expect(page).toHaveTitle("Testovi, mockovi, priče i arhitekturne provjere · RGO aplikacija");
  await expect(page.locator("[data-rgo-header-context]")).toHaveText(/Vodič za razvoj.*Frontend/);
  await expect(sections.getByRole("link", { name: "Arhitektura" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Više sekcija" }).click();
  await expect(page.getByRole("dialog", { name: "Odjeljci" }).getByRole("link", { name: "Obrasci" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Na ovoj stranici" }).click();
  await expect(page.getByRole("navigation", { name: "Arhitektura", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("font-size", "18px");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);
});

async function dragTouch(page: Page, target: Locator, deltaY: number, cancel = false) {
  // A visible handle can still be moving during Slide entrance. Sample coordinates only after it settles.
  await expect
    .poll(() => target.evaluate(element => getComputedStyle(element.closest(".MuiDrawer-paper") ?? element).transform))
    .toBe("none");
  const box = await target.boundingBox();
  if (!box) throw new Error("Swipe target has no bounding box");
  const client = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  try {
    await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let step = 1; step <= 6; step += 1) {
      await page.waitForTimeout(30);
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + (deltaY * step) / 6 }],
      });
    }
    await client.send("Input.dispatchTouchEvent", {
      type: cancel ? "touchCancel" : "touchEnd",
      touchPoints: [],
    });
  } finally {
    await client.detach();
  }
}

async function expectBottomOverlay(page: Page, name: string) {
  const drawer = page.locator('[data-rgo-overlay-presentation="bottom-drawer"][role="dialog"]').last();
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveAccessibleName(name);
  await expect
    .poll(async () => {
      const bounds = await drawer.boundingBox();
      const viewport = page.viewportSize();
      if (!bounds || !viewport) return Number.POSITIVE_INFINITY;
      return Math.max(
        Math.abs(bounds.x),
        Math.abs(bounds.width - viewport.width),
        Math.abs(bounds.y + bounds.height - viewport.height),
      );
    })
    .toBeLessThanOrEqual(1);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const viewport = window.visualViewport;
        const x = viewport ? viewport.width / 2 : window.innerWidth / 2;
        const y = viewport ? viewport.height - 8 : window.innerHeight - 8;
        return Boolean(document.elementFromPoint(x, y)?.closest('[data-rgo-overlay-presentation="bottom-drawer"]'));
      }),
    )
    .toBe(true);
  return drawer;
}

test("dismisses Settings and header section drawers from their grab handles", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/settings/appearance");
  const selector = page.locator("[data-rgo-settings-page-selector]");
  await selector.click();
  const settings = page.getByRole("dialog", { name: "Settings pages" });
  const settingsHandle = settings.locator("[data-rgo-bottom-drawer-handle]");
  await expect(settingsHandle).toBeVisible();
  await expect(settingsHandle).toHaveCSS("touch-action", "none");
  await dragTouch(page, settingsHandle, 10);
  await expect(settings).toBeVisible();
  await dragTouch(page, settingsHandle, 120, true);
  await expect(settings).toBeVisible();
  await dragTouch(page, settingsHandle, 120);
  await expect(settings).toHaveCount(0);
  await expect(selector).toBeFocused();
  await expect(page).toHaveURL("/settings/appearance");

  await page.goto("/dev-guide/frontend/example-pages/contacts-dashboard");
  const more = page.getByRole("button", { name: "More sections" });
  await more.click();
  const sections = page.getByRole("dialog", { name: "Sections" });
  await dragTouch(page, sections.locator("[data-rgo-bottom-drawer-handle]"), 120);
  await expect(sections).toHaveCount(0);
  await expect(more).toBeFocused();
  await expect(page).toHaveURL("/dev-guide/frontend/example-pages/contacts-dashboard");
});

test("keeps form scrolling native and guards swipe dismissal of a Contacts drawer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ height: 520, width: 390 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  const opener = page.getByRole("button", { name: "Add contact" });
  await opener.click();
  const drawer = await expectBottomOverlay(page, "New contact");
  const handle = drawer.locator("[data-rgo-bottom-drawer-handle]");
  await expect(handle).toBeVisible();
  await dragTouch(page, handle, 120, true);
  await expectBottomOverlay(page, "New contact");
  await dragTouch(page, handle, 10);
  await expectBottomOverlay(page, "New contact");

  const scrollingBody = await drawer.locator("div").evaluateAll(elements => {
    const element = elements.find(
      candidate => getComputedStyle(candidate).overflowY === "auto" && candidate.scrollHeight > candidate.clientHeight,
    );
    if (!element) throw new Error("Contact form has no scrollable body");
    element.setAttribute("data-test-contact-scroll-body", "");
    return true;
  });
  expect(scrollingBody).toBe(true);
  const nativeBody = drawer.locator("[data-test-contact-scroll-body]");
  await dragTouch(page, nativeBody, -100);
  await expect.poll(() => nativeBody.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expectBottomOverlay(page, "New contact");
  await nativeBody.evaluate(element => {
    element.scrollTop = 0;
  });
  const name = drawer.getByRole("textbox", { name: "Name", exact: false });
  await name.fill("Unsaved swipe draft");
  await dragTouch(page, handle, 120);
  const confirmation = page.getByRole("dialog", { name: "Discard unsaved contact changes?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Keep editing" }).click();
  await expectBottomOverlay(page, "New contact");
  await expect(name).toHaveValue("Unsaved swipe draft");
  await dragTouch(page, handle, 120);
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Discard changes" }).click();
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
});

for (const editorPresentation of ["dialog", "docked-panel", "overlay-panel"] as const) {
  test(`opens Contacts editor in a bottom drawer with saved ${editorPresentation} preference`, async ({ page }) => {
    await page.setViewportSize({ height: 760, width: 320 });
    await page.evaluate(presentation => {
      localStorage.setItem("rgo.app.editor-presentation", JSON.stringify(presentation));
    }, editorPresentation);
    await page.goto("/dev-guide/frontend/example-pages/contacts-crud");

    await page.getByRole("button", { name: "Add contact" }).click();
    const editor = await expectBottomOverlay(page, "New contact");
    await expect(page.getByRole("separator", { name: "Resize contact panel" })).toHaveCount(0);
    await expect(editor.getByRole("button", { name: "Create contact" })).toBeVisible();
    await editor.getByRole("button", { name: "Close contact panel" }).click();
    await expect(page.locator('[data-rgo-overlay-presentation="bottom-drawer"]')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("rgo.app.editor-presentation"))).toBe(
      JSON.stringify(editorPresentation),
    );

    await page.setViewportSize({ height: 760, width: 1024 });
    await page.getByRole("button", { name: "Add contact" }).click();
    const desktopEditor = page.getByRole(editorPresentation === "docked-panel" ? "complementary" : "dialog", {
      name: "New contact",
    });
    await expect(desktopEditor).toBeVisible();
    await expect(page.locator('[data-rgo-overlay-presentation="bottom-drawer"]')).toHaveCount(0);
    await desktopEditor.getByRole("button", { name: "Close contact panel" }).click();
  });
}

test("keeps an unsaved Contacts editor mounted across the mobile breakpoint", async ({ page }) => {
  await page.setViewportSize({ height: 760, width: 1023 });
  await page.evaluate(() => {
    localStorage.setItem("rgo.app.editor-presentation", '"docked-panel"');
  });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  await page.getByRole("button", { name: "Add contact" }).click();
  const editor = await expectBottomOverlay(page, "New contact");
  await editor.getByRole("textbox", { name: "Name", exact: false }).fill("Unsaved mobile draft");

  await page.setViewportSize({ height: 760, width: 1024 });
  await expect(editor).toBeVisible();
  await expect(editor.getByRole("textbox", { name: "Name", exact: false })).toHaveValue("Unsaved mobile draft");
  await editor.getByRole("button", { name: "Close contact panel" }).click();
  const confirmation = page.getByRole("dialog", { name: "Discard unsaved contact changes?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Keep editing" }).click();
  await expect(editor.getByRole("textbox", { name: "Name", exact: false })).toHaveValue("Unsaved mobile draft");
  await editor.getByRole("button", { name: "Close contact panel" }).click();
  await confirmation.getByRole("button", { name: "Discard changes" }).click();
  await expect(editor).toHaveCount(0);

  await page.getByRole("button", { name: "Add contact" }).click();
  await expect(page.getByRole("complementary", { name: "New contact" })).toBeVisible();
});

test("opens Contacts filters and details as bottom drawers at the mobile breakpoint", async ({ page }) => {
  await page.setViewportSize({ height: 760, width: 1023 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  await page.getByRole("button", { name: "Filters" }).click();
  const filters = await expectBottomOverlay(page, "Filters");
  await filters.getByRole("button", { name: "Close contact panel" }).click();

  await page.getByRole("button", { name: "Open details for Ana Horvat" }).click();
  const details = await expectBottomOverlay(page, "Contact details");
  await details.getByRole("button", { name: "Close contact panel" }).click();
});

test("opens each Development Guide overlay presentation as a mobile bottom drawer", async ({ page }) => {
  await page.setViewportSize({ height: 760, width: 390 });
  await page.goto("/dev-guide/frontend/patterns/overlays/presentations");

  for (const [action, title] of [
    ["Open dialog", "Review changes"],
    ["Open docked panel", "Project details"],
    ["Open modal panel", "Edit filters"],
  ] as const) {
    await page.getByRole("button", { name: action }).click();
    const drawer = await expectBottomOverlay(page, title);
    await expect(page.getByRole("navigation", { name: "Bottom navigation", includeHidden: true })).toHaveCount(1);
    await drawer.getByRole("button", { name: "Close overlay" }).click();
    await expect(page.locator('[data-rgo-overlay-presentation="bottom-drawer"]')).toHaveCount(0);
  }
});

test("stacks nested Development Guide bottom drawers and returns the child result", async ({ page }) => {
  await page.setViewportSize({ height: 760, width: 390 });
  await page.goto("/dev-guide/frontend/patterns/overlays/results-and-composition");
  await page.getByRole("button", { name: "Open project editor" }).click();
  const parent = await expectBottomOverlay(page, "Edit project");
  await parent.getByRole("button", { name: "Choose customer" }).click();
  const child = await expectBottomOverlay(page, "Choose customer");
  await expect(page.locator('[data-rgo-overlay-presentation="bottom-drawer"]')).toHaveCount(2);
  await dragTouch(page, child.locator("[data-rgo-bottom-drawer-handle]"), 120);
  await expect(page.locator('[data-rgo-overlay-presentation="bottom-drawer"]')).toHaveCount(1);
  await expect(parent.getByText("No customer selected.")).toBeVisible();
  await parent.getByRole("button", { name: "Choose customer" }).click();
  await expectBottomOverlay(page, "Choose customer");
  await child.getByRole("button", { name: "Select customer" }).click();
  await expect(page.locator('[data-rgo-overlay-presentation="bottom-drawer"]')).toHaveCount(1);
  await expect(parent.getByText("Selected customer: Northwind Shipping")).toBeVisible();
  await parent.getByRole("button", { name: "Done" }).click();
  await expect(page.locator('[data-rgo-overlay-presentation="bottom-drawer"]')).toHaveCount(0);
});

test("honors guarded Escape and backdrop dismissal for a mobile Contacts drawer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ height: 760, width: 390 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  const opener = page.getByRole("button", { name: "Add contact" });
  await opener.click();
  const drawer = await expectBottomOverlay(page, "New contact");
  const name = drawer.getByRole("textbox", { name: "Name", exact: false });
  await name.fill("Unsaved draft");

  await page.keyboard.press("Escape");
  const confirmation = page.getByRole("dialog", { name: "Discard unsaved contact changes?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Keep editing" }).click();
  await expect(name).toHaveValue("Unsaved draft");
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(document.activeElement?.closest('[data-rgo-overlay-presentation="bottom-drawer"]'))),
    )
    .toBe(true);

  await page.mouse.click(5, 5);
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Discard changes" }).click();
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("keeps the mobile Contacts drawer body and footer reachable at short viewport height", async ({ page }) => {
  await page.setViewportSize({ height: 400, width: 320 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  await page.getByRole("button", { name: "Add contact" }).click();
  const editor = await expectBottomOverlay(page, "New contact");
  const create = editor.getByRole("button", { name: "Create contact" });
  await create.scrollIntoViewIfNeeded();
  await expect(create).toBeVisible();
  const editorBox = await editor.boundingBox();
  const createBox = await create.boundingBox();
  expect(editorBox).not.toBeNull();
  expect(createBox).not.toBeNull();
  expect((createBox?.y ?? 0) + (createBox?.height ?? 0)).toBeLessThanOrEqual(
    (editorBox?.y ?? 0) + (editorBox?.height ?? 0),
  );
  await editor.getByRole("button", { name: "Close contact panel" }).click();

  await page.getByRole("button", { name: "Filters" }).click();
  const filters = await expectBottomOverlay(page, "Filters");
  const clear = filters.getByRole("button", { name: "Clear filters" });
  await expect(clear).toBeVisible();
  const filtersBox = await filters.boundingBox();
  const clearBox = await clear.boundingBox();
  expect(filtersBox).not.toBeNull();
  expect(clearBox).not.toBeNull();
  expect((clearBox?.y ?? 0) + (clearBox?.height ?? 0)).toBeLessThanOrEqual(
    (filtersBox?.y ?? 0) + (filtersBox?.height ?? 0),
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true,
  );
});

test("keeps audited architecture articles within phone viewports", async ({ page }) => {
  const articleIds = [
    "dependency-boundaries-and-imports",
    "http-query-and-browser-storage",
    "authentication-and-session",
    "router-and-shell-responsibilities",
    "localization-theme-and-preferences",
    "feature-inventory-and-responsibilities",
    "state-ownership-and-signal-lifecycle",
    "add-change-or-remove-a-feature",
  ];
  for (const width of [320, 390]) {
    await page.setViewportSize({ height: 844, width });
    for (const articleId of articleIds) {
      await page.goto(`/dev-guide/frontend/architecture/${articleId}`);
      await expect(page.locator("#main-content article")).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
        .toBe(0);
    }
  }
});

for (const locale of ["en", "hr"] as const) {
  test(`aligns bottom icons and fits shortcut labels in ${locale} at every font size`, async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 320 });
    await page.goto("/settings/appearance");
    if (locale === "hr") {
      await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "HR" }).click();
    }
    const fontGroup = locale === "en" ? "Font size" : "Veličina teksta";
    const fontChoices = locale === "en" ? ["Normal", "Medium", "Big"] : ["Uobičajena", "Srednja", "Velika"];
    for (const [index, name] of fontChoices.entries()) {
      await page.goto("/settings/appearance");
      await page.getByRole("group", { name: fontGroup }).getByRole("button", { name, exact: true }).click();
      const rootSize = [16, 18, 20][index];
      await expect(page.locator("html")).toHaveCSS("font-size", `${rootSize}px`);
      await page.goto("/dev-guide/frontend/example-pages/contacts-dashboard");
      const bottom = page.locator("[data-rgo-bottom-navigation]");
      await expect(bottom.getByRole("link").last()).toHaveAttribute("aria-current", "page");
      for (const width of [320, 390, 768, 1023, 320]) {
        await page.setViewportSize({ height: 844, width });
        await expect
          .poll(() =>
            bottom.evaluate((bar, baseline) => {
              const links = [...bar.querySelectorAll<HTMLAnchorElement>("a")];
              const iconTops = links.map(link => link.querySelector("svg")!.getBoundingClientRect().top);
              const barBounds = bar.getBoundingClientRect();
              const problems: string[] = [];
              if (Math.max(...iconTops) - Math.min(...iconTops) > 1) problems.push("icons are not aligned");
              if (Math.min(...iconTops) - barBounds.top < 9) problems.push("icons are too close to the top");
              if (Math.abs(barBounds.height - 72) > 1) problems.push("bar height changed");
              for (const link of links) {
                const label = link.querySelector<HTMLElement>("[data-rgo-bottom-navigation-label-text]")!;
                const bounds = label.getBoundingClientRect();
                const fontSize = Number.parseFloat(getComputedStyle(label).fontSize);
                if (getComputedStyle(label).textAlign !== "center") problems.push("label is not centered");
                const minimum = Math.max(11, baseline * 0.6);
                if (fontSize < minimum - 0.01 || fontSize > baseline * 0.7 + 0.01)
                  problems.push("font size outside fit range");
                if (window.innerWidth >= 768 && Math.abs(fontSize - baseline * 0.7) > 0.01)
                  problems.push("font did not recover");
                if (bounds.bottom > barBounds.bottom + 1) problems.push("label exceeds bar");
                if (label.scrollWidth > label.clientWidth + 1) problems.push("label overflows horizontally");
                if (link.getAttribute("aria-label") !== label.textContent)
                  problems.push("full accessible label missing");
              }
              return problems;
            }, rootSize),
          )
          .toEqual([]);
      }
      await bottom.getByRole("link").nth(1).click();
      await expect(page).toHaveURL(/\/settings\/appearance$/);
      await expect(bottom.getByRole("link").nth(1)).toHaveAttribute("aria-current", "page");
      await expect
        .poll(() =>
          bottom.locator("svg").evaluateAll(icons => {
            const tops = icons.map(icon => icon.getBoundingClientRect().top);
            return Math.max(...tops) - Math.min(...tops);
          }),
        )
        .toBeLessThanOrEqual(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      ).toBe(true);
    }
  });
}

test("keeps all Settings sections usable with mobile page spacing", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 320 });
  await page.goto("/settings/appearance");
  const settings = page.locator('[data-rgo-page-surface="settings"]');
  const appearanceHeading = settings.getByRole("heading", { name: "Appearance", exact: true });
  await expect(appearanceHeading).toBeVisible();
  expect((await appearanceHeading.boundingBox())?.x).toBeGreaterThanOrEqual(16);
  await expect(settings.locator("[data-rgo-settings-page-selector]")).toContainText("Appearance");
  await page.getByRole("group", { name: "Font size" }).getByRole("button", { name: "Big" }).click();
  await expect
    .poll(() =>
      settings.locator(".MuiToggleButtonGroup-root").evaluateAll(groups =>
        groups.every(group => {
          const bounds = group.getBoundingClientRect();
          return bounds.left >= 16 && bounds.right <= window.innerWidth - 16;
        }),
      ),
    )
    .toBe(true);

  await settings.locator("[data-rgo-settings-page-selector]").click();
  await page
    .getByRole("dialog", { name: "Settings pages" })
    .getByRole("link", { name: "Navigation", exact: true })
    .click();
  await expect(page).toHaveURL(/\/settings\/navigation$/);
  const navigationHeading = settings.getByRole("heading", { level: 1, name: "Navigation", exact: true });
  await expect(navigationHeading).toBeVisible();
  expect((await navigationHeading.boundingBox())?.x).toBeGreaterThanOrEqual(16);
  await expect(settings.locator("[data-rgo-settings-page-selector]")).toContainText("Navigation");
  const lastChoice = page.getByRole("group", { name: "Header while scrolling" }).getByRole("button", {
    name: "Neither row",
  });
  const choiceBox = await lastChoice.boundingBox();
  expect(choiceBox).not.toBeNull();
  expect(choiceBox!.x + choiceBox!.width).toBeLessThanOrEqual(304);
  await expect
    .poll(() =>
      settings.locator(".MuiToggleButtonGroup-root").evaluateAll(groups =>
        groups.every(group => {
          const bounds = group.getBoundingClientRect();
          return bounds.left >= 16 && bounds.right <= window.innerWidth - 16;
        }),
      ),
    )
    .toBe(true);

  await settings.locator("[data-rgo-settings-page-selector]").click();
  await page
    .getByRole("dialog", { name: "Settings pages" })
    .getByRole("link", { name: "Accessibility", exact: true })
    .click();
  await expect(page).toHaveURL(/\/settings\/accessibility$/);
  const accessibilityHeading = settings.getByRole("heading", { level: 1, name: "Accessibility" });
  await expect(accessibilityHeading).toBeVisible();
  expect((await accessibilityHeading.boundingBox())?.x).toBeGreaterThanOrEqual(16);
  await expect(settings.locator("[data-rgo-settings-page-selector]")).toContainText("Accessibility");
  await expect(settings.getByRole("group", { name: "Motion" })).toBeVisible();
  await expect(settings.getByRole("group", { name: "Link underlines" })).toBeVisible();
  for (const [groupName, labels] of [
    ["Motion", ["Follow system", "Reduce motion"]],
    ["Link underlines", ["Page default", "Always"]],
  ] as const) {
    const group = settings.getByRole("group", { name: groupName });
    for (const label of labels) {
      const button = group.getByRole("button", { name: label, exact: true });
      await expect(button).toBeVisible();
      await expect.poll(() => button.evaluate(element => (element as HTMLElement).innerText.trim())).toBe(label);
    }
  }
  await expect
    .poll(() =>
      settings.locator(".MuiToggleButtonGroup-root").evaluateAll(groups =>
        groups.every(group => {
          const bounds = group.getBoundingClientRect();
          return bounds.left >= 16 && bounds.right <= window.innerWidth - 16;
        }),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBe(0);
});

test("keeps deep mobile breadcrumbs together without orphan separators", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 320 });
  await page.goto("/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/alpha");
  const trail = page.locator('#main-content [aria-label="Breadcrumbs"]');
  await expect(trail).toBeVisible();
  const alignment = await trail.evaluate(element => {
    const items = [...element.querySelectorAll(".MuiBreadcrumbs-ol > li")];
    return items
      .filter(item => item.classList.contains("MuiBreadcrumbs-separator"))
      .map(separator => {
        const index = items.indexOf(separator);
        const center = (item: Element) => {
          const rect = item.getBoundingClientRect();
          return rect.y + rect.height / 2;
        };
        return Math.min(
          Math.abs(center(separator) - center(items[index - 1]!)),
          Math.abs(center(separator) - center(items[index + 1]!)),
        );
      });
  });
  expect(alignment.length).toBeGreaterThan(0);
  expect(Math.max(...alignment)).toBeLessThanOrEqual(8);
  const expandPath = trail.getByRole("button", { name: "Show path" });
  await expect(expandPath).toBeVisible();
  await expandPath.click();
  await expect(trail.getByRole("link", { name: "Patterns" })).toBeVisible();
});

test("keeps Contacts actions and paging reachable beside the mobile table", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 320 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  const table = page.getByRole("table", { name: "Contacts", exact: true });
  const actions = table.getByRole("button", { name: /^More actions for / }).first();
  await expect(actions).toBeVisible();
  const actionBox = await actions.boundingBox();
  expect(actionBox).not.toBeNull();
  expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(320);
  await actions.click();
  await page.getByRole("menuitem", { name: "Open details for Ana Horvat" }).click();
  const details = await expectBottomOverlay(page, "Contact details");
  await details.getByRole("button", { name: "Close contact panel" }).click();
  const next = page.getByRole("button", { name: "Go to next page" });
  await expect(next).toBeVisible();
  const nextBox = await next.boundingBox();
  expect(nextBox).not.toBeNull();
  expect(nextBox!.x + nextBox!.width).toBeLessThanOrEqual(320);
  await expect(page.getByText(/Swipe to see more columns|Scroll horizontally to see more columns/)).toBeVisible();
});

test("page search finds guide articles and concrete parameterized examples", async ({ page }) => {
  const launcher = page.getByRole("button", { name: "Search pages", exact: true });
  await launcher.click();
  const palette = page.getByRole("dialog", { name: "Search pages" });
  const search = palette.getByRole("combobox", { name: "Search pages" });
  await search.fill("development guide");
  await expect(palette.getByRole("option").first()).toBeVisible();
  await search.fill("route parameters");
  await expect(palette.getByRole("option")).toHaveCount(1);
  await palette.getByRole("option").click();
  await expect(page).toHaveURL(/\/route-parameters-and-breadcrumbs\/atlas$/);
  await expect(palette).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeFocused();

  await launcher.click();
  await search.fill("source map");
  await palette.getByRole("option", { name: /^Source map and ownership/ }).click();
  await expect(page).toHaveURL(/\/dev-guide\/frontend\/architecture\/source-map-and-ownership$/);
  await expect(palette).toHaveCount(0);
});

for (const theme of ["Light", "Dark", "Soft dark"]) {
  test(`page search avoids a full-width focus outline in ${theme}`, async ({ page }) => {
    await page.goto("/settings/appearance");
    await page.getByRole("group", { name: "Color theme" }).getByRole("button", { name: theme, exact: true }).click();
    await page.goto("/");
    const launcher = page.getByRole("button", { name: "Search pages", exact: true });
    const palette = page.getByRole("dialog", { name: "Search pages" });
    const search = palette.getByRole("combobox", { name: "Search pages" });
    const main = page.locator("#main-content");

    await launcher.click();
    await search.pressSequentially("source map");
    await palette.getByRole("option", { name: /^Source map and ownership/ }).click();
    await expect(page).toHaveURL(/\/dev-guide\/frontend\/architecture\/source-map-and-ownership$/);
    await expect(palette).toHaveCount(0);
    await expect(main).toBeFocused();
    await expect(main).toHaveCSS("outline-style", "none");

    await page.keyboard.press("Control+k");
    await search.fill("dependency boundaries");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/dev-guide\/frontend\/architecture\/dependency-boundaries-and-imports$/);
    await expect(palette).toHaveCount(0);
    await expect(main).toBeFocused();
    await expect(main).toHaveCSS("outline-style", "none");
  });
}

for (const viewport of [
  { height: 900, width: 1280 },
  { height: 844, width: 320 },
]) {
  test(`page search keeps wrapped keyboard results visible at ${viewport.width}px with large text`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/settings/appearance");
    await page.getByRole("group", { name: "Font size" }).getByRole("button", { name: "Big" }).click();
    await page.getByRole("button", { name: "Search pages", exact: true }).click();
    const palette = page.getByRole("dialog", { name: "Search pages" });
    const search = palette.getByRole("combobox", { name: "Search pages" });
    const list = palette.getByRole("listbox");
    const options = palette.getByRole("option");
    await expect(options.first()).toBeVisible();
    expect(await options.count()).toBeGreaterThan(30);

    const expectHighlightedResultVisible = async (option: Locator) => {
      await expect(search).toHaveAttribute("aria-activedescendant", (await option.getAttribute("id"))!);
      await expect(search).toBeFocused();
      await expect(option).toHaveCSS("outline-style", "solid");
      await expect
        .poll(() =>
          option.evaluate(element => {
            const listbox = element.closest('[role="listbox"]')!;
            const item = element.getBoundingClientRect();
            const top = listbox.getBoundingClientRect().top + listbox.clientTop;
            return Math.min(item.top - top, top + listbox.clientHeight - item.bottom);
          }),
        )
        .toBeGreaterThanOrEqual(-1);
    };

    for (const query of ["", "architecture"]) {
      await search.fill(query);
      await expect(options.first()).toBeVisible();
      await search.press("ArrowUp");
      await expectHighlightedResultVisible(options.last());
      await search.press("ArrowDown");
      await expectHighlightedResultVisible(options.first());
      await expect
        .poll(() => list.evaluate(element => element.scrollTop - parseFloat(getComputedStyle(element).paddingTop)))
        .toBeLessThanOrEqual(1);
      for (let index = 1; index < Math.min(await options.count(), 8); index++) {
        await search.press("ArrowDown");
        await expectHighlightedResultVisible(options.nth(index));
      }
    }
  });
}

test("page search hands navigation to the existing dirty-form confirmation", async ({ page }) => {
  await page.goto("/dev-guide/frontend/patterns/forms/dirty-state-reset-or-navigation-guard");
  const draft = page.locator("#forms-navigation-guard").getByLabel("Draft title");
  await draft.fill("Unsaved browser draft");
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Search pages" });
  const search = palette.getByRole("combobox", { name: "Search pages" });
  await expect(search).toBeFocused();
  await search.fill("accessibility");
  await palette.getByRole("option", { name: /^Accessibility/ }).click();
  const confirmation = page.getByRole("dialog", { name: "Discard unsaved changes?" });
  await expect(confirmation).toBeVisible();
  await expect(palette).toHaveCount(0);
  await expectNoAxeViolations(page);
  await confirmation.getByRole("button", { name: "Keep editing" }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(page).toHaveURL(/\/forms\/dirty-state-reset-or-navigation-guard$/);
  await expect(draft).toHaveValue("Unsaved browser draft");
  await expect(draft).toBeFocused();

  await page.keyboard.press("Control+k");
  await search.fill("accessibility");
  await palette.getByRole("option", { name: /^Accessibility/ }).click();
  await expect(confirmation).toBeVisible();
  await expect(palette).toHaveCount(0);
  await confirmation.getByRole("button", { name: "Discard and leave" }).click();
  await expect(page).toHaveURL(/\/settings\/accessibility$/);
  await expect(confirmation).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("keeps Email bounded and the docked resize gutter clear", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 2473 });
  await page.goto("/dev-guide/frontend/example-pages/contacts-crud");
  await page.getByRole("button", { name: "Edit Ana Horvat", exact: true }).click();
  const editor = page.getByRole("complementary", { name: "Edit contact" });
  await editor.getByRole("textbox", { name: "Organization" }).fill("RGO Communications");
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(editor).toHaveCount(0);
  await page.getByRole("button", { name: "Add contact" }).click();
  const dock = page.getByRole("complementary", { name: "New contact" });
  await expect(dock).toBeVisible();
  const surface = dock.locator(":scope > :first-child");
  await expect(surface).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const email = page.getByRole("columnheader", { name: "Email", exact: true });
  const organization = page.getByRole("columnheader", { name: "Organization", exact: true });
  const organizationCell = page.getByRole("cell", { name: "RGO Communications", exact: true });
  for (const viewportWidth of [2473, 1440, 1280]) {
    await page.setViewportSize({ height: 900, width: viewportWidth });
    await expect.poll(async () => Math.round((await email.boundingBox())?.width ?? 0)).toBe(260);
    expect((await organization.boundingBox())?.width).toBeGreaterThanOrEqual(220);
    expect(
      await organizationCell.evaluate(element => {
        const text = document.createRange();
        text.selectNodeContents(element);
        return text.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight);
      }),
    ).toBeLessThanOrEqual(1);
  }
  const handle = page.getByRole("separator", { name: "Resize contact panel" });
  const originalWidth = (await dock.boundingBox())?.width ?? 0;
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(async () => (await dock.boundingBox())?.width ?? 0).toBeGreaterThan(originalWidth);
  await expect(surface).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});
