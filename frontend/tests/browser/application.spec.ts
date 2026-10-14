import { expect, test, type Locator, type Page } from "@playwright/test";
import axeCore from "axe-core";
import type { AxeResults } from "axe-core";

import {
  appAuthSpringSessionEndpoints,
  parseSpringSessionLogin,
  serializeSpringSessionUser,
} from "../../src/app/auth/api/appAuth.api.springSession";
import { mockAuthUser, mockCsrfToken, mockLoginCredentials } from "../../mocks/auth";
import { appShellConfig } from "../../src/app/shell/appShellConfig";
import { themeSetup } from "../../src/app/theme/themeSetup";

const axeSource = axeCore.source;

async function installAuthApi(page: Page) {
  let authenticated = false;
  await page.route("https://api.example.invalid/**", async route => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "GET" && url.pathname === appAuthSpringSessionEndpoints.csrf) {
      await route.fulfill({ json: mockCsrfToken });
      return;
    }
    if (request.method() === "POST" && url.pathname === appAuthSpringSessionEndpoints.login) {
      expect(request.headers()[mockCsrfToken.headerName.toLowerCase()]).toEqual(mockCsrfToken.token);
      const credentials = await parseSpringSessionLogin(
        new Request(request.url(), {
          body: request.postData() ?? undefined,
          headers: request.headers(),
          method: request.method(),
        }),
      );
      expect(credentials).toEqual(mockLoginCredentials);
      authenticated = true;
      await route.fulfill({ status: 204 });
      return;
    }
    if (request.method() === "POST" && url.pathname === appAuthSpringSessionEndpoints.logout) {
      expect(request.headers()[mockCsrfToken.headerName.toLowerCase()]).toEqual(mockCsrfToken.token);
      authenticated = false;
      await route.fulfill({ status: 204 });
      return;
    }
    if (request.method() === "GET" && url.pathname === appAuthSpringSessionEndpoints.session) {
      await route.fulfill(
        authenticated
          ? {
              body: JSON.stringify(serializeSpringSessionUser(mockAuthUser)),
              contentType: "application/json",
            }
          : { status: 401 },
      );
      return;
    }

    await route.fulfill({ status: 404 });
  });
}

async function expectNoAxeViolations(page: Page) {
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: { run: (context: Document) => Promise<AxeResults> };
      }
    ).axe;

    return axe.run(document);
  });

  expect(
    results.violations,
    results.violations
      .map(violation => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
      .join("\n"),
  ).toEqual([]);
}

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Username").fill(mockLoginCredentials.username);
  await page.getByLabel("Password").fill(mockLoginCredentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveTitle("Home · RGO application");
}

async function openPrimaryDestination(page: Page, name: string) {
  if (name === "Contacts") {
    await page.goto("/dev-guide/contacts");
    return;
  }
  if (name === "Settings") {
    await page.getByRole("button", { name: "Account" }).click();
    await page.getByRole("menu", { name: "Account" }).getByRole("menuitem", { name: "Settings" }).click();
    return;
  }
  const panel = page.locator("[data-rgo-navigation-panel]");
  if (await panel.isVisible()) {
    await panel.getByRole("link", { name, exact: true }).click();
    return;
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  await presentation(page, "drawer").getByRole("link", { name, exact: true }).click();
}

function presentation(page: Page, value: "drawer" | "panel") {
  return page.locator(`[data-rgo-navigation-presentation="${value}"]`);
}

async function openSettingsPage(page: Page, name: string) {
  const selector = page.locator("[data-rgo-settings-page-selector]");
  if (await selector.isVisible()) {
    await selector.click();
    await page
      .getByRole("dialog", { name: /Settings pages|Stranice postavki/ })
      .getByRole("link", { name, exact: true })
      .click();
    return;
  }
  await page.locator("[data-rgo-settings-navigation]").getByRole("link", { name, exact: true }).click();
}

async function expectCurrentSettingsPage(page: Page, name: string) {
  const selector = page.locator("[data-rgo-settings-page-selector]");
  if (await selector.isVisible()) {
    await expect(selector).toContainText(name);
    return;
  }
  await expect(page.locator("[data-rgo-settings-navigation]").getByRole("link", { name, exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
}

async function width(locator: Locator) {
  return Math.round((await locator.boundingBox())?.width ?? 0);
}

async function expectNoPageOverflow(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);
}

async function resolvedMuiColor(page: Page, variable: string) {
  return page.evaluate(cssVariable => {
    const probe = document.createElement("span");
    probe.style.color = `var(${cssVariable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, variable);
}

function rgbFromHex(hex: string) {
  const channels = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)?.slice(1);
  if (!channels) throw new Error(`Expected a six-digit color, received ${hex}`);
  return `rgb(${channels.map(channel => Number.parseInt(channel, 16)).join(", ")})`;
}

test.beforeEach(async ({ page }) => {
  await installAuthApi(page);
});

test("@fixed-settings enforces an all-fixed build without replacing saved preferences", async ({ page }) => {
  test.skip(
    process.env.RGO_FIXED_SETTINGS_BROWSER !== "true",
    "Runs through test:browser:fixed-settings with a dedicated fixed build.",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    localStorage.setItem("rgo.app.color-mode", '"light"');
    localStorage.setItem("rgo.app.increased-contrast", "false");
    localStorage.setItem("rgo.app.drawer-mode", '"temporary"');
    localStorage.setItem("rgo.app.header-stickiness", '"none"');
    localStorage.setItem("rgo.app.permanent-drawer-open", "true");
    localStorage.setItem("rgo.app.desktop-table-size", '"small"');
    localStorage.setItem("rgo.app.editor-presentation", '"docked-panel"');
    localStorage.setItem("rgo.app.font-size", '"normal"');
    localStorage.setItem("rgo.app.locale", '"hr"');
    localStorage.setItem("rgo.app.surface-border-radius", "6");
    localStorage.setItem("rgo.app.motion", '"system"');
    localStorage.setItem("rgo.app.link-underlines", '"page"');
    localStorage.setItem("rgo.app.navigation-placement", '"header"');
  });
  await page.setViewportSize({ height: 900, width: 1280 });
  await signIn(page);
  const panel = page.locator("[data-rgo-navigation-panel]");
  await expect(panel).toBeVisible();
  await expect.poll(() => width(panel)).toBe(appShellConfig.permanentDrawerWidth);
  await expect(page.locator("html")).toHaveAttribute("data-soft-dark", "");
  await expect
    .poll(() => resolvedMuiColor(page, "--mui-palette-rgo-shellSurface"))
    .toBe(rgbFromHex(themeSetup.palette["soft-dark"].rgo.shellSurface));
  expect(await page.evaluate(() => localStorage.getItem("rgo.app.color-mode"))).toBe('"light"');
  expect(await page.evaluate(() => localStorage.getItem("rgo.app.increased-contrast"))).toBe("false");
  expect(await resolvedMuiColor(page, "--mui-palette-rgo-borderSubtle")).not.toBe(
    rgbFromHex(themeSetup.palette["soft-dark"].rgo.borderSubtle),
  );
  await expect(page.getByRole("button", { name: "Choose language" })).toHaveCount(0);
  await expect(page.locator("[data-rgo-local-color-mode-control]")).toHaveCount(0);
  await openPrimaryDestination(page, "Settings");
  await expect(page.getByRole("alert")).toContainText("No configurable options available");
  await expect(page.getByRole("group", { name: "Increased contrast" })).toHaveCount(0);
  await expect(page.locator("html")).toHaveCSS("font-size", "20px");
  await openSettingsPage(page, "Accessibility");
  await expect(page.getByRole("alert")).toContainText("Accessibility preferences are managed");
  await expect(page.getByRole("group", { name: "Motion" })).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      drawerMode: localStorage.getItem("rgo.app.drawer-mode"),
      headerStickiness: localStorage.getItem("rgo.app.header-stickiness"),
      motion: localStorage.getItem("rgo.app.motion"),
      linkUnderlines: localStorage.getItem("rgo.app.link-underlines"),
      permanentDrawerOpen: localStorage.getItem("rgo.app.permanent-drawer-open"),
      oldPlacement: localStorage.getItem("rgo.app.navigation-placement"),
    })),
  ).toEqual({
    drawerMode: '"temporary"',
    headerStickiness: '"none"',
    motion: '"system"',
    linkUnderlines: '"page"',
    permanentDrawerOpen: "true",
    oldPlacement: null,
  });
});

test("routes Settings to responsive Appearance groups and retains the account identity", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1600 });
  await signIn(page);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings\/appearance$/);
  await expect(page.locator("[data-rgo-header-context]")).toHaveText("Settings");
  const settings = page.locator('[data-rgo-page-surface="settings"]');
  await expect(settings.getByRole("heading", { name: "Appearance", exact: true })).toBeVisible();
  await expect(settings.getByText("RGO Demo User")).toBeVisible();
  await expect(settings.getByText("demo@rgo.hr")).toBeVisible();
  const appearanceLink = settings
    .getByRole("navigation", { name: "Settings" })
    .getByRole("link", { name: "Appearance" });
  await expect(appearanceLink).toHaveAttribute("href", "/settings/appearance");
  await expect(appearanceLink).toHaveAttribute("aria-current", "page");
  for (const heading of ["Theme & language", "Contrast", "Density & shape", "Editors"]) {
    await expect(settings.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("group", { name: "Main navigation drawer" })).toHaveCount(0);
  const navigationLink = settings
    .getByRole("navigation", { name: "Settings" })
    .getByRole("link", { name: "Navigation" });
  await expect(navigationLink).toHaveAttribute("href", "/settings/navigation");
  await navigationLink.click();
  await expect(page).toHaveURL(/\/settings\/navigation$/);
  await expect(navigationLink).toHaveAttribute("aria-current", "page");
  await expect(settings.getByRole("heading", { level: 1, name: "Navigation", exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Main navigation drawer" })).toBeVisible();
  await expect(settings.locator("[data-rgo-settings-active-line]")).toBeVisible();
  await expect(settings.locator("[data-rgo-settings-navigation]")).toHaveCSS("position", "sticky");
  await page.setViewportSize({ height: 800, width: 320 });
  await expect(navigationLink).toBeHidden();
  await expect(settings.locator("[data-rgo-settings-page-selector]")).toContainText("Navigation");
  await expect(settings.locator("[data-rgo-settings-active-line]")).toBeHidden();
  await expectNoPageOverflow(page);
});

test("opens every Settings page from the compact selector and releases modal focus", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 320 });
  await signIn(page);
  await page.goto("/settings/appearance?preview=1#theme");
  const selector = page.locator("[data-rgo-settings-page-selector]");
  const sheet = page.getByRole("dialog", { name: "Settings pages" });
  await expect(selector).toContainText("Appearance");
  await selector.click();
  await expect(selector).toHaveAttribute("aria-expanded", "true");
  await expect(sheet.getByRole("link")).toHaveCount(3);
  await expect(sheet.getByRole("link", { name: "Appearance", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(sheet.getByRole("link", { name: "Navigation", exact: true })).toHaveAttribute(
    "href",
    "/settings/navigation",
  );
  await expectNoAxeViolations(page);
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(selector).toBeFocused();
  await selector.click();
  await sheet.getByRole("link", { name: "Appearance", exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/settings\/appearance\?preview=1#theme$/);
  await expect(selector).toBeFocused();
  await openSettingsPage(page, "Navigation");
  await expect(page).toHaveURL(/\/settings\/navigation$/);
  await expect(sheet).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeFocused();
  await openSettingsPage(page, "Accessibility");
  await expect(page).toHaveURL(/\/settings\/accessibility$/);
  await expectCurrentSettingsPage(page, "Accessibility");
  await selector.click();
  await sheet.getByRole("button", { name: "Close Settings pages" }).click();
  await expect(sheet).toHaveCount(0);
  await expect(selector).toBeFocused();
  await selector.click();
  await page.setViewportSize({ height: 900, width: 1600 });
  await expect(sheet).toHaveCount(0);
  await expect(selector).toBeHidden();
  await expectCurrentSettingsPage(page, "Accessibility");
  await expectNoPageOverflow(page);
});

test("slides the Settings pages sheet and respects system and explicit reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ height: 844, width: 320 });
  await signIn(page);
  await page.goto("/settings/appearance");
  const selector = page.locator("[data-rgo-settings-page-selector]");
  const sheet = page.getByRole("dialog", { name: "Settings pages" });
  const transitionSeconds = () =>
    sheet.evaluate(element =>
      Math.max(
        ...getComputedStyle(element)
          .transitionDuration.split(",")
          .map(value => (value.trim().endsWith("ms") ? Number.parseFloat(value) / 1000 : Number.parseFloat(value))),
      ),
    );
  await selector.click();
  await expect(sheet).toBeVisible();
  await expect.poll(transitionSeconds).toBeGreaterThan(0.01);
  await expect(sheet).toHaveCSS("transition-property", "transform");
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await selector.click();
  await expect(sheet).toBeVisible();
  await expect.poll(transitionSeconds).toBeLessThan(0.001);
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openSettingsPage(page, "Accessibility");
  await page.getByRole("group", { name: "Motion" }).getByRole("button", { name: "Reduce motion" }).click();
  await selector.click();
  await expect(sheet).toBeVisible();
  await expect.poll(transitionSeconds).toBeLessThan(0.001);
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(selector).toBeFocused();
});

test("applies Accessibility motion and inline-link preferences across reloads", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ height: 900, width: 1040 });
  await signIn(page);
  await openPrimaryDestination(page, "Settings");
  const settings = page.locator('[data-rgo-page-surface="settings"]');
  await openSettingsPage(page, "Navigation");
  await settings
    .getByRole("group", { name: "Main navigation drawer" })
    .getByRole("button", { name: "Permanent" })
    .click();
  const panel = page.locator("[data-rgo-navigation-panel]");
  await expect(panel).toBeVisible();
  await expect(settings.locator("[data-rgo-settings-page-selector]")).toBeVisible();
  await openSettingsPage(page, "Accessibility");
  await expect(page).toHaveURL(/\/settings\/accessibility$/);
  await expect(settings.getByRole("heading", { level: 1, name: "Accessibility" })).toBeVisible();
  await expectCurrentSettingsPage(page, "Accessibility");
  const preview = settings.getByRole("link", { name: "Open Appearance settings" });
  const motion = settings.getByRole("group", { name: "Motion" });
  const linkUnderlines = settings.getByRole("group", { name: "Link underlines" });
  const reduceButton = motion.getByRole("button", { name: "Reduce motion" });
  const transitionSeconds = () =>
    panel.evaluate(element =>
      Math.max(
        ...getComputedStyle(element)
          .transitionDuration.split(",")
          .map(value => (value.trim().endsWith("ms") ? Number.parseFloat(value) / 1000 : Number.parseFloat(value))),
      ),
    );

  await expect(preview).toHaveCSS("text-decoration-line", "none");
  expect(await transitionSeconds()).toBeGreaterThan(0.01);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(transitionSeconds).toBeLessThan(0.001);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(transitionSeconds).toBeGreaterThan(0.01);
  const linkBackedButton = settings.locator("#accessibility-button-link-probe");
  await preview.evaluate(element => {
    const button = document.createElement("a");
    button.id = "accessibility-button-link-probe";
    button.className = "MuiButtonBase-root MuiButton-root";
    button.href = "/settings/appearance";
    button.style.textDecorationLine = "none";
    button.textContent = "Link-backed button";
    element.parentElement?.append(button);
  });
  await linkUnderlines.getByRole("button", { name: "Always" }).click();
  await expect(preview).toHaveCSS("text-decoration-line", "underline");
  await expect(linkBackedButton).toHaveCSS("text-decoration-line", "none");
  await expect(settings.locator("[data-rgo-settings-page-selector]")).toHaveCSS("text-decoration-line", "none");
  await reduceButton.click();
  await expect.poll(transitionSeconds).toBeLessThan(0.001);
  await page.reload();
  await expect(linkUnderlines.getByRole("button", { name: "Always" })).toHaveAttribute("aria-pressed", "true");
  await expect(reduceButton).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toHaveCSS("text-decoration-line", "underline");
  await expect.poll(transitionSeconds).toBeLessThan(0.001);

  await settings.getByRole("button", { name: "Restore defaults" }).click();
  await expect(motion.getByRole("button", { name: "Follow system" })).toHaveAttribute("aria-pressed", "true");
  await expect(linkUnderlines.getByRole("button", { name: "Page default" })).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toHaveCSS("text-decoration-line", "none");
  await expect.poll(transitionSeconds).toBeGreaterThan(0.01);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(transitionSeconds).toBeLessThan(0.001);
});

test("uses brighter semantic hover text for dark Settings toggles", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ height: 900, width: 1280 });
  await signIn(page);
  await openPrimaryDestination(page, "Settings");
  await openSettingsPage(page, "Navigation");
  await expect(page.locator("html")).toHaveAttribute("data-dark", "");

  const unselectedNavigation = page
    .getByRole("group", { name: "Main navigation drawer" })
    .getByRole("button", { name: "Permanent" });
  const textSecondary = await resolvedMuiColor(page, "--mui-palette-text-secondary");
  const textPrimary = await resolvedMuiColor(page, "--mui-palette-text-primary");
  const actionHover = await resolvedMuiColor(page, "--mui-palette-action-hover");

  await expect(unselectedNavigation).toHaveCSS("color", textSecondary);
  await unselectedNavigation.hover();
  await expect(unselectedNavigation).toHaveCSS("color", textPrimary);
  await expect(unselectedNavigation).toHaveCSS("background-color", actionHover);
});

test("supports keyboard navigation and has no detectable accessibility violations", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Development guide", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.locator("#main-content")).toHaveCSS("outline-style", "none");
  await openPrimaryDestination(page, "Settings");
  await expect(page.locator("#main-content").locator('[data-rgo-page-surface="settings"]')).toBeVisible();
  await expect(page.locator("[data-rgo-header-context]")).toHaveText("Settings");
  await expect(page.locator("#main-content")).toBeFocused();
  await expectNoAxeViolations(page);
  await page.goto("/retired-route");
  await expect(page.locator("#main-content").getByRole("alert")).toContainText("Page not found");
  await expectNoAxeViolations(page);
  await openPrimaryDestination(page, "Home");
  await expect(page).toHaveTitle("Home · RGO application");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("uses a temporary drawer by default and persists desktop mode changes", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await signIn(page);
  const panel = page.locator("[data-rgo-navigation-panel]");
  const header = page.getByRole("banner");
  await expect(panel).toHaveCount(0);
  expect((await header.boundingBox())?.x).toBe(0);
  expect((await page.locator("#main-content").boundingBox())?.x).toBe(0);
  const openMenu = header.getByRole("button", { name: "Open navigation" });
  await openMenu.hover();
  await expect(page.getByRole("tooltip", { name: "Open menu" })).toBeVisible();
  await openMenu.click();
  const drawer = presentation(page, "drawer");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Home" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);

  await openPrimaryDestination(page, "Settings");
  await openSettingsPage(page, "Navigation");
  const drawerMode = page.getByRole("group", { name: "Main navigation drawer" });
  await expect(drawerMode.getByRole("button", { name: "Temporary" })).toHaveAttribute("aria-pressed", "true");
  await drawerMode.getByRole("button", { name: "Permanent" }).click();
  await expect(panel).toBeVisible();
  await expect.poll(() => width(panel)).toBe(appShellConfig.permanentDrawerWidth);
  const panelBox = await panel.boundingBox();
  expect(panelBox?.y).toBe(0);
  expect(panelBox?.height).toBe(800);
  expect((await header.boundingBox())?.x).toBe(appShellConfig.permanentDrawerWidth);
  expect((await page.locator("#main-content").boundingBox())?.x).toBe(appShellConfig.permanentDrawerWidth);
  const closeMenu = header.getByRole("button", { name: "Close navigation" });
  await closeMenu.hover();
  await expect(page.getByRole("tooltip", { name: "Close menu" })).toBeVisible();
  await closeMenu.click();
  await expect(panel).toHaveCount(0);
  await page.reload();
  await expect(panel).toHaveCount(0);
  await openMenu.click();
  await expect(panel).toBeVisible();
  await page.reload();
  await expect(panel).toBeVisible();
  await expect.poll(() => width(panel)).toBe(appShellConfig.permanentDrawerWidth);
  await drawerMode.getByRole("button", { name: "Temporary" }).click();
  await expect(panel).toHaveCount(0);
  await page.reload();
  await expect(panel).toHaveCount(0);
  await openMenu.click();
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Home" }).click();
  await expect(drawer).toHaveCount(0);
});

test("collapses the permanent drawer into an accessible saved icon rail", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await page.emulateMedia({ colorScheme: "light" });
  await signIn(page);
  await openPrimaryDestination(page, "Settings");
  await openSettingsPage(page, "Navigation");
  await page.getByRole("group", { name: "Main navigation drawer" }).getByRole("button", { name: "Permanent" }).click();
  await page.goto("/");
  const panel = page.locator("[data-rgo-navigation-panel]");
  await expect(panel.getByRole("link", { name: "Settings" })).toHaveCount(0);
  await expect(panel.getByRole("link", { name: "Development guide" })).toHaveCount(0);
  const selected = panel.getByRole("link", { name: "Home" });
  await expect(selected).toHaveAttribute("aria-current", "page");
  const lightSelected = await resolvedMuiColor(page, "--mui-palette-rgo-navigationSelected");
  await expect(selected).toHaveCSS("background-color", lightSelected);
  await expect(selected).toHaveCSS("color", await resolvedMuiColor(page, "--mui-palette-text-primary"));
  await expect(selected.locator("[data-rgo-navigation-icon]")).toHaveCSS(
    "color",
    await resolvedMuiColor(page, "--mui-palette-text-primary"),
  );
  const activeLine = selected.locator("..").locator("[data-rgo-active-line]");
  await expect(activeLine).toHaveCount(1);
  await expect(selected.locator("[data-rgo-active-line]")).toHaveCount(0);
  await expect(activeLine).toHaveAttribute("aria-hidden", "true");
  await expect(activeLine).toHaveCSS("background-color", await resolvedMuiColor(page, "--mui-palette-primary-main"));
  await expect(activeLine).toHaveCSS("width", "3px");
  const expectLineInGutter = async (minimumGap: number) => {
    const buttonBox = await selected.boundingBox();
    const lineBox = await activeLine.boundingBox();
    if (!buttonBox || !lineBox) throw new Error("Selected item or active line has no bounding box");
    expect(lineBox.x + lineBox.width).toBeLessThan(buttonBox.x);
    const gap = buttonBox.x - lineBox.x - lineBox.width;
    expect(gap).toBeGreaterThanOrEqual(minimumGap);
    expect(gap).toBeLessThanOrEqual(8);
  };
  const expectSymmetricButtonMargins = async () => {
    const panelBox = await panel.boundingBox();
    const buttonBox = await selected.boundingBox();
    if (!panelBox || !buttonBox) throw new Error("Panel or selected item has no bounding box");
    const leftMargin = buttonBox.x - panelBox.x;
    const rightMargin = panelBox.x + panelBox.width - 1 - buttonBox.x - buttonBox.width;
    expect(leftMargin).toBe(12);
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(1);
  };
  await expectLineInGutter(6);
  await expectSymmetricButtonMargins();
  const sidebarToggle = panel.locator("[data-rgo-sidebar-toggle]");
  const expandedSelectedBox = await selected.boundingBox();
  const expandedToggleBox = await sidebarToggle.boundingBox();
  const navigationIcon = selected.locator("[data-rgo-navigation-icon]");
  const toggleIcon = sidebarToggle.locator("[data-rgo-sidebar-toggle-icon]");
  const navigationIconX = (await navigationIcon.boundingBox())?.x;
  const toggleIconX = (await toggleIcon.boundingBox())?.x;
  expect(expandedToggleBox?.x).toBe(expandedSelectedBox?.x);
  expect(expandedToggleBox?.width).toBe(expandedSelectedBox?.width);
  await expect(sidebarToggle.locator("[data-rgo-sidebar-toggle-label]")).toHaveCSS("text-align", "left");
  await expect(selected.locator(".MuiListItemText-primary")).toHaveCSS("font-weight", "700");
  await page.getByRole("button", { name: "Color theme" }).click();
  await page.getByRole("menu", { name: "Color theme" }).getByRole("menuitem", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-dark", "");
  const darkSelected = await resolvedMuiColor(page, "--mui-palette-rgo-navigationSelected");
  expect(darkSelected).not.toBe(lightSelected);
  await expect(selected).toHaveCSS("background-color", darkSelected);
  await expect(selected).toHaveCSS("color", await resolvedMuiColor(page, "--mui-palette-text-primary"));
  await expect(activeLine).toHaveCSS("background-color", await resolvedMuiColor(page, "--mui-palette-primary-main"));
  await expectLineInGutter(6);
  await page.getByRole("button", { name: "Color theme" }).click();
  await page.getByRole("menu", { name: "Color theme" }).getByRole("menuitem", { name: "Light" }).click();
  await expect(selected).toHaveCSS("background-color", lightSelected);
  await sidebarToggle.focus();
  await expect(sidebarToggle).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(sidebarToggle).toBeFocused();
  await expect(sidebarToggle).toHaveAccessibleName("Expand sidebar");
  await expect(sidebarToggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveAttribute("data-rgo-navigation-collapsed", "true");
  await expect(page.getByRole("tooltip", { name: "Expand sidebar" })).toBeVisible();
  await expect.poll(() => width(panel)).toBe(appShellConfig.collapsedDrawerWidth);
  await expectLineInGutter(6);
  await expectSymmetricButtonMargins();
  await expect(sidebarToggle).toHaveCSS("min-height", "36px");
  expect((await navigationIcon.boundingBox())?.x).toBe(navigationIconX);
  expect((await toggleIcon.boundingBox())?.x).toBe(toggleIconX);
  const collapsedPanelBox = await panel.boundingBox();
  const collapsedNavigationIconBox = await navigationIcon.boundingBox();
  const collapsedToggleIconBox = await toggleIcon.boundingBox();
  if (!collapsedPanelBox || !collapsedNavigationIconBox || !collapsedToggleIconBox) {
    throw new Error("Collapsed drawer or icons have no bounding box");
  }
  const railCenter = collapsedPanelBox.x + collapsedPanelBox.width / 2;
  expect(
    Math.abs(collapsedNavigationIconBox.x + collapsedNavigationIconBox.width / 2 - railCenter),
  ).toBeLessThanOrEqual(0.5);
  expect(Math.abs(collapsedToggleIconBox.x + collapsedToggleIconBox.width / 2 - railCenter)).toBeLessThanOrEqual(0.5);
  const selectedBox = await selected.boundingBox();
  const toggleBox = await sidebarToggle.boundingBox();
  expect(toggleBox?.x).toBe(selectedBox?.x);
  expect(toggleBox?.width).toBe(selectedBox?.width);
  await expect
    .poll(async () => (await page.getByRole("banner").boundingBox())?.x)
    .toBe(appShellConfig.collapsedDrawerWidth);
  await expect
    .poll(async () => (await page.locator("#main-content").boundingBox())?.x)
    .toBe(appShellConfig.collapsedDrawerWidth);
  const home = panel.getByRole("link", { name: "Home" });
  await expect(home).toBeVisible();
  await expect(home.locator(".MuiListItemText-root")).toHaveCSS("opacity", "0");
  await home.hover();
  await expect(page.getByRole("tooltip", { name: "Home" })).toBeVisible();

  await page.reload();
  await expect(panel).toHaveAttribute("data-rgo-navigation-collapsed", "true");
  await expect.poll(() => width(panel)).toBe(appShellConfig.collapsedDrawerWidth);
  await expect(panel.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  expect(await page.evaluate(() => localStorage.getItem("rgo.app.permanent-drawer-collapsed"))).toBe("true");
  await page.getByRole("button", { name: "Close navigation" }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect.poll(() => width(panel)).toBe(appShellConfig.collapsedDrawerWidth);
  await sidebarToggle.focus();
  await expect(sidebarToggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(sidebarToggle).toBeFocused();
  await expect(sidebarToggle).toHaveAccessibleName("Collapse sidebar");
  await expect(sidebarToggle).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toHaveAttribute("data-rgo-navigation-collapsed", "false");
  await expect.poll(() => width(panel)).toBe(appShellConfig.permanentDrawerWidth);
  expect((await navigationIcon.boundingBox())?.x).toBe(navigationIconX);
  expect((await toggleIcon.boundingBox())?.x).toBe(toggleIconX);

  await toggleIcon.click();
  await expect(panel).toHaveAttribute("data-rgo-navigation-collapsed", "true");
  await expect.poll(() => width(panel)).toBe(appShellConfig.collapsedDrawerWidth);
  const tooltip = page.getByRole("tooltip", { name: "Expand sidebar" });
  await expect(tooltip).toBeVisible();
  const tooltipBox = await tooltip.boundingBox();
  const railBox = await panel.boundingBox();
  if (!tooltipBox || !railBox) throw new Error("Sidebar tooltip or icon rail has no bounding box");
  expect(tooltipBox.x).toBeGreaterThanOrEqual(railBox.x + railBox.width - 8);
  expect(tooltipBox.x).toBeLessThanOrEqual(railBox.x + railBox.width + 24);
});

test("offers the account menu and working color-mode and language shortcuts", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await signIn(page);
  const accountButton = page.getByRole("banner").getByRole("button", { name: "Account" });
  const headerAvatar = accountButton.locator(".MuiAvatar-root");
  await expect(headerAvatar).toHaveText("RD");
  const headerAvatarBackground = await headerAvatar.evaluate(element => getComputedStyle(element).backgroundColor);
  await expect(page.getByRole("banner").getByRole("link", { name: "Settings", exact: true })).toHaveCount(0);
  await accountButton.hover();
  await expect(page.getByRole("tooltip", { name: "Open user navigation menu" })).toBeVisible();
  await accountButton.click();
  const accountMenu = page.getByRole("menu", { name: "Account" });
  await expect(accountMenu).toBeVisible();
  await expect(accountMenu.getByText("RGO Demo User")).toBeVisible();
  await expect(accountMenu.locator(".MuiAvatar-root")).toHaveText("RD");
  await expect(accountMenu.locator(".MuiAvatar-root")).toHaveCSS("background-color", headerAvatarBackground);
  await expect(accountMenu.getByRole("menuitem", { name: "Settings" })).toHaveAttribute("href", "/settings/appearance");
  await expect(accountMenu.getByRole("menuitem", { name: "Development guide" })).toHaveCount(0);
  await expect(accountMenu.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  await expect(accountMenu.getByRole("menuitem", { name: "Settings" })).toBeFocused();
  const counter = page.locator("#main-content").getByRole("button", { name: "Count: 0", includeHidden: true });
  const counterBox = await counter.boundingBox();
  if (!counterBox) throw new Error("Home counter has no bounding box");
  await page.mouse.click(counterBox.x + counterBox.width / 2, counterBox.y + counterBox.height / 2);
  await expect(accountMenu).toHaveCount(0);
  await expect(counter).toBeVisible();
  await expect(accountButton).toBeFocused();
  await counter.click();
  await expect(page.locator("#main-content").getByRole("button", { name: "Count: 1" })).toBeVisible();
  await accountButton.click();
  await page.keyboard.press("ArrowDown");
  await expect(accountMenu.getByRole("menuitem", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(accountMenu).toHaveCount(0);
  await expect(accountButton).toBeFocused();
  await accountButton.click();
  await page.keyboard.press("Escape");
  await expect(accountMenu).toHaveCount(0);
  await expect(accountButton).toBeFocused();
  await accountButton.click();
  await expect(accountMenu.getByRole("menuitem", { name: "Settings" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(accountMenu).toHaveCount(0);
  await expect(accountButton).toBeFocused();
  await page.getByRole("button", { name: "Color theme" }).click();
  await page.getByRole("menu", { name: "Color theme" }).getByRole("menuitem", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-dark", "");
  await page.getByRole("button", { name: "Choose language" }).click();
  await page.getByRole("menu", { name: "Choose language" }).getByRole("menuitem", { name: "HR" }).click();
  await expect(page.getByRole("button", { name: "Odaberite jezik" })).toBeVisible();
  await page.getByRole("button", { name: "Račun" }).click();
  await page.getByRole("menu", { name: "Račun" }).getByRole("menuitem", { name: "Postavke" }).click();
  await expect(page.getByRole("heading", { name: "Postavke", exact: true })).toBeVisible();
});

test("lets the replaceable Home starter demonstrate React state and open Settings", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await signIn(page);
  const home = page.locator("#main-content");
  const counter = home.getByRole("button", { name: "Count: 0" });
  await expect(counter).toBeVisible();
  await counter.click();
  await expect(home.getByRole("button", { name: "Count: 1" })).toBeVisible();
  await home.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings\/appearance$/);
  await expect(page.locator('[data-rgo-page-surface="settings"]')).toBeVisible();
});

test("does not expose development-only documentation in production", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await signIn(page);
  await expect(
    page.locator("#main-content").getByRole("heading", { level: 2, name: "Your application starts here." }),
  ).toBeVisible();
  await expect(page.locator("[data-rgo-header-context]")).toHaveText("Home");
  await expect(page.getByText("Edit src/pages/HomePage.tsx to start building your application.")).toBeVisible();
  await expect(page.locator("#main-content").getByRole("link", { name: "Development guide" })).toHaveCount(0);
  await expect(page.getByText("Patterns", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Architecture", { exact: true })).toHaveCount(0);

  await page.goto("/dev-guide/patterns/feedback/toast-notifications");
  await expect(page.locator("#main-content").getByRole("alert")).toContainText("Page not found");
  await expect(page.locator("[data-examples-rail]")).toHaveCount(0);

  await page.goto("/dev-guide/architecture/source-map-and-ownership");
  await expect(page.locator("#main-content").getByRole("alert")).toContainText("Page not found");
  await expect(page.locator("[data-documentation-rail]")).toHaveCount(0);

  await page.goto("/dev-guide/contacts");
  await expect(page.locator("#main-content").getByRole("alert")).toContainText("Page not found");
});

test("keeps the Contacts dock and sticky table edges aligned", async ({ page }) => {
  await page.setViewportSize({ height: 768, width: 1366 });
  await signIn(page);
  await openPrimaryDestination(page, "Contacts");
  const filtersButton = page.getByRole("button", { name: "Filters" });
  const addContactButton = page.getByRole("button", { name: "Add contact" });
  const filtersButtonBox = await filtersButton.boundingBox();
  const addContactButtonBox = await addContactButton.boundingBox();
  expect(filtersButtonBox).not.toBeNull();
  expect(addContactButtonBox).not.toBeNull();
  expect((filtersButtonBox?.x ?? 0) + (filtersButtonBox?.width ?? 0)).toBeLessThan(addContactButtonBox?.x ?? 0);
  expect(
    (addContactButtonBox?.x ?? 0) - ((filtersButtonBox?.x ?? 0) + (filtersButtonBox?.width ?? 0)),
  ).toBeLessThanOrEqual(16);
  await filtersButton.click();

  const dock = page.getByRole("complementary", { name: "Filters" });
  const mountedPanel = page.locator("[data-rgo-overlay-session]");
  const overlayRoot = dock.locator("..");
  const resizeHandle = page.getByRole("separator", {
    name: "Resize contact panel",
  });
  await expect(dock).toBeVisible();
  await expect
    .poll(async () => {
      const dockBox = await dock.boundingBox();
      const rootBox = await overlayRoot.boundingBox();
      if (!dockBox || !rootBox) return Number.POSITIVE_INFINITY;
      return Math.abs(dockBox.y + dockBox.height - (rootBox.y + rootBox.height));
    })
    .toBeLessThanOrEqual(1);
  await expect
    .poll(async () => {
      const dockBox = await dock.boundingBox();
      const rootBox = await overlayRoot.boundingBox();
      if (!dockBox || !rootBox) return Number.POSITIVE_INFINITY;
      return Math.abs(dockBox.x + dockBox.width - (rootBox.x + rootBox.width));
    })
    .toBeLessThanOrEqual(1);

  const handleBox = await resizeHandle.boundingBox();
  const headerBox = await page.locator("thead").boundingBox();
  expect(handleBox).not.toBeNull();
  expect(headerBox).not.toBeNull();
  expect(
    await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.getAttribute("role") === "separator", {
      x: (handleBox?.x ?? 0) + (handleBox?.width ?? 0) / 2,
      y: (headerBox?.y ?? 0) + (headerBox?.height ?? 0) / 2,
    }),
  ).toBe(true);

  await expect(
    page.getByRole("checkbox", { name: "Select all filtered contacts" }).locator("xpath=ancestor::th"),
  ).toHaveCSS("position", "sticky");
  await expect(page.getByRole("columnheader", { name: "Name" })).toHaveCSS("position", "sticky");
  await expect(page.getByRole("columnheader", { name: "Actions" })).toHaveCSS("position", "sticky");

  const panelBox = await mountedPanel.boundingBox();
  await page.getByRole("button", { name: "Open details for Ana Horvat" }).click();
  await expect(mountedPanel).toHaveAccessibleName("Contact details");
  await mountedPanel.getByRole("button", { name: "Edit contact" }).click();
  await expect(mountedPanel).toHaveAccessibleName("Edit contact");
  await expect
    .poll(async () => {
      const nextPanelBox = await mountedPanel.boundingBox();
      if (!panelBox || !nextPanelBox) return Number.POSITIVE_INFINITY;
      return Math.max(
        Math.abs(nextPanelBox.x - panelBox.x),
        Math.abs(nextPanelBox.y - panelBox.y),
        Math.abs(nextPanelBox.width - panelBox.width),
        Math.abs(nextPanelBox.height - panelBox.height),
      );
    })
    .toBeLessThanOrEqual(1);
  await expect(page.locator("[data-rgo-overlay-session]")).toHaveCount(1);
});

test("protects dirty Contacts edits when switching contacts, opening filters, and closing", async ({ page }) => {
  await page.setViewportSize({ height: 768, width: 1366 });
  await signIn(page);
  await openPrimaryDestination(page, "Contacts");

  await page.getByRole("button", { name: "Edit Ana Horvat" }).click();
  const panel = page.getByRole("complementary", { name: "Edit contact" });
  const role = panel.getByRole("textbox", { name: "Role" });
  await role.fill("Unsaved role");

  await page.getByRole("button", { name: "Edit Iva Kovač" }).click();
  const discardDialog = page.getByRole("dialog", { name: "Discard unsaved contact changes?" });
  await expect(discardDialog).toBeVisible();
  await discardDialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(role).toHaveValue("Unsaved role");
  await page.getByRole("button", { name: "Edit Iva Kovač" }).click();
  await discardDialog.getByRole("button", { name: "Discard changes" }).click();
  await expect(panel.getByRole("textbox", { name: "Name" })).toHaveValue("Iva Kovač");

  await panel.getByRole("textbox", { name: "Role" }).fill("Another draft");
  await page.getByRole("button", { name: "Filters" }).click();
  await discardDialog.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByRole("complementary", { name: "Filters" })).toBeVisible();

  await page.getByRole("button", { name: "Edit Ana Horvat" }).click();
  await panel.getByRole("textbox", { name: "Role" }).fill("Close draft");
  await panel.getByRole("button", { name: "Close contact panel" }).click();
  await discardDialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(panel.getByRole("textbox", { name: "Role" })).toHaveValue("Close draft");
  await panel.getByRole("button", { name: "Close contact panel" }).click();
  await discardDialog.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.locator("[data-rgo-overlay-session]")).toHaveCount(0);
});

test("uses the narrow Contacts bulk menu for status changes and delete cancellation", async ({ page }) => {
  await page.setViewportSize({ height: 760, width: 1366 });
  await signIn(page);
  await openPrimaryDestination(page, "Contacts");
  await page.setViewportSize({ height: 760, width: 760 });

  await page.getByRole("checkbox", { name: "Select Ana Horvat" }).click();
  const bulkToolbar = page.getByRole("toolbar", { name: "Actions" });
  await expect(bulkToolbar.getByRole("button", { name: "Actions" })).toBeVisible();
  await bulkToolbar.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Set inactive" }).click();
  const anaRow = page
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: "Open details for Ana Horvat" }) });
  await expect(anaRow.getByText("Inactive", { exact: true })).toBeVisible();
  await expect(bulkToolbar).toHaveCount(0);

  await page.getByRole("checkbox", { name: "Select Iva Kovač" }).click();
  await bulkToolbar.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const confirmation = page.getByRole("dialog", { name: "Delete selected contacts?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Keep contacts" }).click();
  await expect(page.getByRole("checkbox", { name: "Select Iva Kovač" })).toBeChecked();
});

test("keeps the Contacts bulk menu reachable at phone width in English and Croatian", async ({ page }) => {
  const viewport = { height: 760, width: 320 };
  await page.setViewportSize({ height: 760, width: 1366 });
  await signIn(page);
  await openPrimaryDestination(page, "Contacts");
  await page.setViewportSize(viewport);
  const bottom = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect
    .poll(async () => {
      const barBox = await bottom.boundingBox();
      const mainBox = await page.locator("#main-content").boundingBox();
      if (!barBox || !mainBox) return Number.POSITIVE_INFINITY;
      return mainBox.y + mainBox.height - barBox.y;
    })
    .toBeLessThanOrEqual(1);

  const expectReachableMenu = async (button: Locator) => {
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await button.click();
  };

  await page.getByRole("checkbox", { name: "Select Ana Horvat" }).click();
  await expectReachableMenu(page.getByRole("toolbar", { name: "Actions" }).getByRole("button", { name: "Actions" }));
  await expect(page.getByRole("menuitem", { name: "Set inactive" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.evaluate(() => localStorage.setItem("rgo.app.locale", '"hr"'));
  await page.reload();
  await page.getByRole("checkbox", { name: "Odaberi kontakt Ana Horvat" }).click();
  await expectReachableMenu(page.getByRole("toolbar", { name: "Radnje" }).getByRole("button", { name: "Radnje" }));
  await expect(page.getByRole("menuitem", { name: "Postavi neaktivnima" })).toBeVisible();
});

async function expectCenteredEmptyContacts(page: Page, message: string) {
  const table = page.getByRole("table", { name: "Contacts", exact: true });
  const cell = table.getByRole("cell").first();
  await expect(table.getByText(message, { exact: true })).toBeVisible();
  await expect
    .poll(async () =>
      cell.evaluate(element => {
        const viewport = element.closest("table")?.parentElement;
        const header = element.closest("table")?.querySelector("thead");
        const group = element.firstElementChild?.firstElementChild;
        if (!viewport || !header || !group) return Number.POSITIVE_INFINITY;
        const view = viewport.getBoundingClientRect();
        const head = header.getBoundingClientRect();
        const content = group.getBoundingClientRect();
        return Math.max(
          Math.abs(content.x + content.width / 2 - (view.x + viewport.clientWidth / 2)),
          Math.abs(content.y + content.height / 2 - (view.y + head.height + (viewport.clientHeight - head.height) / 2)),
        );
      }),
    )
    .toBeLessThanOrEqual(2);
}

test("centers filtered empty Contacts and offers creation and filter clearing", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await signIn(page);
  await openPrimaryDestination(page, "Contacts");
  const table = page.getByRole("table", { name: "Contacts", exact: true });
  const search = page.getByRole("textbox", { name: "Search contacts" });
  await search.fill("no matching contact");
  const message = "No contacts match the current filters.";
  await expectCenteredEmptyContacts(page, message);
  await expect(table.getByRole("button", { name: "Add contact", exact: true })).toBeVisible();
  await expect(table.getByRole("button", { name: "Create first contact" })).toHaveCount(0);
  await expectNoAxeViolations(page);

  await page.setViewportSize({ width: 760, height: 700 });
  await expectCenteredEmptyContacts(page, message);
  await table.locator("..").evaluate(element => {
    element.scrollLeft = element.scrollWidth;
  });
  await expectCenteredEmptyContacts(page, message);
  await table.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(table.getByText("Ana Horvat", { exact: true })).toBeVisible();
  await expect(table.getByRole("button", { name: "Add contact", exact: true })).toHaveCount(0);
});

for (const editorPresentation of ["dialog", "docked-panel", "overlay-panel"] as const) {
  test(`creates the first contact from the empty table using ${editorPresentation}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.addInitScript(presentation => {
      localStorage.setItem("rgo.app.contacts", "[]");
      localStorage.setItem("rgo.app.editor-presentation", JSON.stringify(presentation));
    }, editorPresentation);
    await signIn(page);
    await openPrimaryDestination(page, "Contacts");
    await expectCenteredEmptyContacts(page, "No contacts yet. Add the first contact to get started.");
    const table = page.getByRole("table", { name: "Contacts", exact: true });
    const create = table.getByRole("button", { name: "Create first contact" });
    await create.focus();
    await page.keyboard.press("Enter");
    const editor = page.getByRole(editorPresentation === "docked-panel" ? "complementary" : "dialog", {
      name: "New contact",
    });
    await expect(editor).toBeVisible();
    await editor.getByRole("textbox", { name: "Name", exact: false }).fill("First Contact");
    await editor.getByRole("textbox", { name: "Email", exact: false }).fill("first@example.com");
    await editor.getByRole("textbox", { name: "Organization", exact: false }).fill("Example");
    await editor.getByRole("textbox", { name: "Role", exact: false }).fill("Designer");
    await editor.getByRole("button", { name: "Create contact", exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(table.getByText("First Contact", { exact: true })).toBeVisible();
    await expect(create).toHaveCount(0);
  });
}

test("offers Normal, Medium, and Big font sizes with the expected root scale", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await signIn(page);
  await openPrimaryDestination(page, "Settings");
  const fontSize = page.getByRole("group", { name: "Font size" });
  await expect(page.locator("html")).toHaveCSS("font-size", "18px");
  await expect(fontSize.getByRole("button", { name: "Medium" })).toHaveAttribute("aria-pressed", "true");
  await fontSize.getByRole("button", { name: "Normal" }).click();
  await expect(page.locator("html")).toHaveCSS("font-size", "16px");
  await fontSize.getByRole("button", { name: "Medium" }).click();
  await expect(page.locator("html")).toHaveCSS("font-size", "18px");
  await fontSize.getByRole("button", { name: "Big" }).click();
  await expect(page.locator("html")).toHaveCSS("font-size", "20px");
  const languageAction = page.getByRole("banner").getByRole("button", { name: "Choose language" });
  const colorAction = page.getByRole("banner").getByRole("button", { name: "Color theme" });
  const languageBox = await languageAction.boundingBox();
  const colorBox = await colorAction.boundingBox();
  expect(languageBox?.height).toBe(colorBox?.height);
  await languageAction.hover();
  await expect(page.getByRole("tooltip", { name: "Choose language" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveCSS("font-size", "20px");
  await expect(fontSize.getByRole("button", { name: "Big" })).toHaveAttribute("aria-pressed", "true");

  await page.evaluate(() => {
    localStorage.setItem("rgo.app.font-size", '"big"');
    localStorage.removeItem("rgo.app.font-size-scale-version");
  });
  await page.reload();
  await expect(page.locator("html")).toHaveCSS("font-size", "18px");
  await expect(fontSize.getByRole("button", { name: "Medium" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("rgo.app.font-size"))).toBe('"medium"');
  await page.setViewportSize({ height: 800, width: 320 });
  await expect(fontSize.getByRole("button", { name: "Medium" })).toBeVisible();
  for (const label of ["Normal", "Medium", "Big"]) {
    const text = fontSize.getByRole("button", { name: label }).locator("span[title]");
    await expect.poll(() => text.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await expectNoPageOverflow(page);
});

test("selects and persists Soft dark from Appearance and the header menu", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await signIn(page);
  await openPrimaryDestination(page, "Settings");
  const theme = page.getByRole("group", { name: "Color theme" });
  for (const label of ["System", "Light", "Dark", "Soft dark"]) {
    await expect(theme.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await theme.getByRole("button", { name: "Dark", exact: true }).click();
  const darkCanvas = await resolvedMuiColor(page, "--mui-palette-background-default");
  const darkShell = await resolvedMuiColor(page, "--mui-palette-rgo-shellSurface");

  await theme.getByRole("button", { name: "Soft dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-soft-dark", "");
  await expect(theme.getByRole("button", { name: "Soft dark" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("rgo.app.color-mode"))).toBe('"dark"');
  expect(await page.evaluate(() => localStorage.getItem("rgo.app.dark-color-scheme"))).toBe('"soft-dark"');
  await expect
    .poll(() => resolvedMuiColor(page, "--mui-palette-background-default"))
    .toBe(rgbFromHex(themeSetup.palette["soft-dark"].rgo.canvas));
  await expect
    .poll(() => resolvedMuiColor(page, "--mui-palette-rgo-shellSurface"))
    .toBe(rgbFromHex(themeSetup.palette["soft-dark"].rgo.shellSurface));
  await expect
    .poll(() => resolvedMuiColor(page, "--mui-palette-rgo-surface"))
    .toBe(rgbFromHex(themeSetup.palette["soft-dark"].rgo.surface));
  expect(await resolvedMuiColor(page, "--mui-palette-background-default")).not.toBe(darkCanvas);
  expect(await resolvedMuiColor(page, "--mui-palette-rgo-shellSurface")).not.toBe(darkShell);

  const colorAction = page.getByRole("banner").getByRole("button", { name: "Color theme" });
  await colorAction.click();
  const menu = page.getByRole("menu", { name: "Color theme" });
  await expect(menu.getByRole("menuitem", { name: "Soft dark" })).toHaveClass(/Mui-selected/);
  await menu.getByRole("menuitem", { name: "Dark", exact: true }).click();
  await expect(theme.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  await colorAction.click();
  await menu.getByRole("menuitem", { name: "Soft dark" }).click();
  await expect(theme.getByRole("button", { name: "Soft dark" })).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(theme.getByRole("button", { name: "Soft dark" })).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => resolvedMuiColor(page, "--mui-palette-rgo-shellSurface"))
    .toBe(rgbFromHex(themeSetup.palette["soft-dark"].rgo.shellSurface));
  await page.setViewportSize({ height: 800, width: 320 });
  for (const label of ["System", "Light", "Dark", "Soft dark"]) {
    const button = theme.getByRole("button", { name: label, exact: true });
    await expect(button).toBeVisible();
    const text = button.locator("span[title]");
    await expect.poll(() => text.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  const systemBox = await theme.getByRole("button", { name: "System", exact: true }).boundingBox();
  const lightBox = await theme.getByRole("button", { name: "Light", exact: true }).boundingBox();
  const darkBox = await theme.getByRole("button", { name: "Dark", exact: true }).boundingBox();
  const softDarkBox = await theme.getByRole("button", { name: "Soft dark", exact: true }).boundingBox();
  if (!systemBox || !lightBox || !darkBox || !softDarkBox) throw new Error("Theme choices have no bounding boxes");
  expect(lightBox.y).toBeCloseTo(systemBox.y, 0);
  expect(softDarkBox.y).toBeCloseTo(darkBox.y, 0);
  expect(lightBox.x).toBeGreaterThan(systemBox.x);
  expect(softDarkBox.x).toBeGreaterThan(darkBox.x);
  expect(darkBox.y).toBeGreaterThan(systemBox.y);
  await expectNoPageOverflow(page);
  await page.getByRole("button", { name: "Restore defaults" }).click();
  await expect(theme.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("rgo.app.color-mode"))).toBe("null");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("rgo.app.dark-color-scheme"))).toBe("null");
});

test("increases theme boundaries across color modes and persists the Appearance choice", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await signIn(page);
  await openPrimaryDestination(page, "Settings");
  const contrast = page.getByRole("group", { name: "Increased contrast" });
  const theme = page.getByRole("group", { name: "Color theme" });
  await expect(contrast.getByRole("button", { name: "No" })).toHaveAttribute("aria-pressed", "true");

  for (const colorMode of ["Light", "Dark", "Soft dark"] as const) {
    await theme.getByRole("button", { name: colorMode, exact: true }).click();
    const normalBoundary = await resolvedMuiColor(page, "--mui-palette-rgo-borderSubtle");
    const normalCanvas = await resolvedMuiColor(page, "--mui-palette-rgo-canvas");
    await contrast.getByRole("button", { name: "Yes" }).click();
    await expect(contrast.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => resolvedMuiColor(page, "--mui-palette-rgo-borderSubtle")).not.toBe(normalBoundary);
    expect(await resolvedMuiColor(page, "--mui-palette-rgo-canvas")).toBe(normalCanvas);
    await contrast.getByRole("button", { name: "No" }).click();
    await expect.poll(() => resolvedMuiColor(page, "--mui-palette-rgo-borderSubtle")).toBe(normalBoundary);
  }

  await contrast.getByRole("button", { name: "Yes" }).click();
  const increasedBoundary = await resolvedMuiColor(page, "--mui-palette-rgo-borderSubtle");
  await page.reload();
  await expect(contrast.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => resolvedMuiColor(page, "--mui-palette-rgo-borderSubtle")).toBe(increasedBoundary);
  expect(await page.evaluate(() => localStorage.getItem("rgo.app.increased-contrast"))).toBe("true");
  await page.getByRole("button", { name: "Restore defaults" }).click();
  await expect(contrast.getByRole("button", { name: "No" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("rgo.app.increased-contrast"))).toBe("false");
});

for (const locale of ["en", "hr"] as const) {
  test(`keeps stacked Settings choices readable in ${locale} with large text on desktop and mobile`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ height: 1000, width: 1440 });
    await signIn(page);
    await openPrimaryDestination(page, "Settings");
    await page.getByRole("group", { name: "Font size" }).getByRole("button", { name: "Big" }).click();
    await page
      .getByRole("group", { name: "Color theme" })
      .getByRole("button", {
        name: locale === "en" ? "Light" : "Dark",
        exact: true,
      })
      .click();
    if (locale === "hr") {
      await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "HR" }).click();
    }
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveCSS("font-size", "20px");

    const settings = page.locator('[data-rgo-page-surface="settings"]');
    const language = await settings.locator('[data-rgo-settings-row="language"] [role="group"]').boundingBox();
    expect(language!.width).toBeLessThan(240);
    for (const width of [1440, 1024, 768, 600, 390, 320]) {
      await page.setViewportSize({ height: 1000, width });
      for (const section of ["appearance", "navigation", "accessibility"]) {
        await page.goto(`/settings/${section}`);
        const rows = settings.locator('[data-rgo-settings-row]:has([role="group"])');
        await expect(rows.first()).toBeVisible();
        await expect
          .poll(() =>
            rows.evaluateAll(elements =>
              elements.flatMap(row => {
                const text = row.firstElementChild!.getBoundingClientRect();
                const bounds = row.getBoundingClientRect();
                const group = row.querySelector<HTMLElement>('[role="group"]')!;
                const choices = group.getBoundingClientRect();
                const problems: string[] = [];
                if (choices.top < text.bottom + 7) problems.push("control is not below its description");
                if (Math.abs(choices.left - text.left) > 1) problems.push("control is not aligned with its label");
                if (choices.right > bounds.right + 1) problems.push("group overflows its row");
                for (const button of group.querySelectorAll<HTMLButtonElement>("button")) {
                  const label = button.querySelector<HTMLElement>("[data-app-choice-label]")!;
                  const buttonBounds = button.getBoundingClientRect();
                  if (label.scrollWidth > label.clientWidth + 1 || label.scrollHeight > label.clientHeight + 1) {
                    problems.push(`clipped label: ${label.textContent}`);
                  }
                  if (buttonBounds.left < choices.left - 1 || buttonBounds.right > choices.right + 1) {
                    problems.push(`overflowing choice: ${label.textContent}`);
                  }
                  if (Number.parseFloat(getComputedStyle(button).borderLeftWidth) === 0) {
                    problems.push(`missing choice outline: ${label.textContent}`);
                  }
                }
                return problems.map(problem => ({ row: row.getAttribute("data-rgo-settings-row"), problem }));
              }),
            ),
          )
          .toEqual([]);
      }
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
        .toBe(0);
    }

    await page.goto("/settings/appearance");
    const roundness = settings.locator('[data-rgo-settings-row="corner-roundness"]');
    const lastChoice = roundness.getByRole("button", { name: "18px", exact: true });
    await lastChoice.click();
    await expect(lastChoice).toHaveAttribute("aria-pressed", "true");
    await lastChoice.press("ArrowLeft");
    await expect(roundness.getByRole("button", { name: "16px", exact: true })).toBeFocused();
  });
}

test("persists Settings preferences and resets Appearance and Navigation independently", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await signIn(page);
  await openPrimaryDestination(page, "Settings");
  const panel = page.locator("[data-rgo-navigation-panel]");
  await expect(page.getByRole("group", { name: "Font size" }).getByRole("button", { name: "Medium" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("group", { name: "Table size" }).getByRole("button", { name: "Small" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("group", { name: "Corner roundness" }).getByRole("button", { name: "8px", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("font-size", "18px");

  await openSettingsPage(page, "Navigation");
  const drawerMode = page.getByRole("group", { name: "Main navigation drawer" });
  await expect(panel).toHaveCount(0);
  await expect(drawerMode.getByRole("button", { name: "Temporary" })).toHaveAttribute("aria-pressed", "true");
  await drawerMode.getByRole("button", { name: "Permanent" }).click();
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(panel).toHaveAttribute("data-rgo-navigation-collapsed", "true");
  await drawerMode.getByRole("button", { name: "Temporary" }).click();
  await page.getByRole("group", { name: "Header while scrolling" }).getByRole("button", { name: "Both rows" }).click();

  await openSettingsPage(page, "Appearance");
  await page.getByRole("group", { name: "Table size" }).getByRole("button", { name: "Medium" }).click();
  await page
    .getByRole("group", { name: "Corner roundness" })
    .getByRole("button", { name: "14px", exact: true })
    .click();
  await page.getByRole("group", { name: "Font size" }).getByRole("button", { name: "Big" }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "HR" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveCSS("font-size", "20px");
  await expect(
    page.getByRole("group", { name: "Veličina tablice" }).getByRole("button", { name: "Srednja" }),
  ).toHaveAttribute("aria-pressed", "true");
  await openSettingsPage(page, "Navigacija");
  await expect(
    page.getByRole("group", { name: "Ladica glavne navigacije" }).getByRole("button", { name: "Privremena" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("group", { name: "Zaglavlje pri pomicanju" }).getByRole("button", { name: "Oba retka" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(panel).toHaveCount(0);

  await page.getByRole("button", { name: "Vrati zadano" }).click();
  await expect(
    page.getByRole("group", { name: "Zaglavlje pri pomicanju" }).getByRole("button", { name: "Prvi redak" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("font-size", "20px");
  await expectCurrentSettingsPage(page, "Navigacija");
  await openSettingsPage(page, "Izgled");
  await expect(
    page.getByRole("group", { name: "Veličina tablice" }).getByRole("button", { name: "Srednja" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Vrati zadano" }).click();
  await expectCurrentSettingsPage(page, "Appearance");
  await expect(page.getByRole("group", { name: "Font size" }).getByRole("button", { name: "Medium" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("group", { name: "Table size" }).getByRole("button", { name: "Small" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("group", { name: "Corner roundness" }).getByRole("button", { name: "8px", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveCSS("font-size", "18px");
  await expect(panel).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      drawerMode: localStorage.getItem("rgo.app.drawer-mode"),
      headerStickiness: localStorage.getItem("rgo.app.header-stickiness"),
      permanentDrawerOpen: localStorage.getItem("rgo.app.permanent-drawer-open"),
      permanentDrawerCollapsed: localStorage.getItem("rgo.app.permanent-drawer-collapsed"),
      oldPlacement: localStorage.getItem("rgo.app.navigation-placement"),
    })),
  ).toEqual({
    drawerMode: '"temporary"',
    headerStickiness: '"first-row"',
    permanentDrawerOpen: "true",
    permanentDrawerCollapsed: "false",
    oldPlacement: null,
  });
});

test("keeps the open Settings surface flush on mobile", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 320 });
  await signIn(page);
  const main = page.locator("#main-content");
  await expect(main).toHaveCSS("padding-left", "8px");
  await expect(page.locator("[data-rgo-header-context]")).toBeVisible();

  await page.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Settings" }).click();
  const settingsSurface = page.locator('[data-rgo-page-surface="settings"]');
  await expect(settingsSurface).toBeVisible();
  for (const width of [320, 375, 768, 1023]) {
    await page.setViewportSize({ height: 800, width });
    await expect(main).toHaveCSS("padding-left", "0px");
    await expect(settingsSurface).toHaveCSS("border-top-width", "0px");
    await expect(settingsSurface).toHaveCSS("border-top-left-radius", "0px");
    await expect(page.getByRole("banner").getByRole("link", { name: "Go to home page" })).toHaveCount(0);
    await expectNoPageOverflow(page);
  }

  await page.setViewportSize({ height: 800, width: 1024 });
  await expect(page.getByRole("banner").getByRole("link", { name: "Go to home page" })).toBeVisible();
  await expect(main).toHaveCSS("padding-left", "12px");
  await expect(settingsSurface).toHaveCSS("border-top-width", "0px");
  await expect(settingsSurface.getByRole("link", { name: "Appearance" })).toBeVisible();
});

test("keeps mobile shortcuts and a temporary drawer across desktop preference changes", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await signIn(page);
  await openPrimaryDestination(page, "Settings");
  await openSettingsPage(page, "Navigation");
  await page.getByRole("group", { name: "Main navigation drawer" }).getByRole("button", { name: "Permanent" }).click();
  await expect(page.locator("[data-rgo-navigation-panel]")).toBeVisible();
  await page.setViewportSize({ height: 800, width: 320 });
  const bottom = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect(bottom).toBeVisible();
  await expect(page.locator("[data-rgo-navigation-panel]")).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(presentation(page, "drawer")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ height: 800, width: 1280 });
  await expect(bottom).toHaveCount(0);
  await expect(page.locator("[data-rgo-navigation-panel]")).toBeVisible();
  await expectNoPageOverflow(page);
});

test("uses one mobile drawer without overflow and preserves appropriate focus", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 320 });
  await signIn(page);
  await expectNoPageOverflow(page);
  await expect(page.getByRole("button", { name: "Account" })).toBeVisible();
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(presentation(page, "drawer")).toBeVisible();
  await expect(presentation(page, "drawer").getByRole("link", { name: "Settings" })).toHaveCount(0);
  await expect(presentation(page, "drawer").getByRole("link", { name: "Development guide" })).toHaveCount(0);
  await presentation(page, "drawer").getByRole("link", { name: "Home" }).click();
  await expect(page.locator("[data-rgo-header-context]")).toHaveText("Home");
  await expect(presentation(page, "drawer")).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeFocused();
  await page.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Settings" }).click();
  await expect(page.locator('[data-rgo-page-surface="settings"]')).toBeVisible();
  await expect(page.locator("[data-rgo-header-context]")).toHaveText("Settings");
  await menu.click();
  await page.getByRole("button", { name: "Close navigation" }).last().click();
  await expect(presentation(page, "drawer")).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(presentation(page, "drawer")).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await page.mouse.click(310, 300);
  await expect(presentation(page, "drawer")).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await page.setViewportSize({ height: 800, width: 1280 });
  await expect(presentation(page, "drawer")).toHaveCount(0);
  await expect(page.locator("[data-rgo-navigation-panel]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
});

test("opens page search by keyboard and exposes only production destinations", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search pages" })).toHaveCount(0);
  await signIn(page);

  const launcher = page.getByRole("button", { name: "Search pages", exact: true });
  await launcher.focus();
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Search pages" });
  const search = palette.getByRole("combobox", { name: "Search pages" });
  await expect(search).toBeFocused();
  await expect(palette.getByRole("option")).toHaveCount(4);
  const context = palette.locator(".MuiListItemText-secondary").first();
  const firstResult = palette
    .getByRole("option")
    .filter({ has: page.locator(".MuiListItemText-secondary") })
    .first();
  const primary = firstResult.locator(".MuiTypography-root").first();
  expect(await context.evaluate(element => getComputedStyle(element).color)).not.toBe(
    await primary.evaluate(element => getComputedStyle(element).color),
  );
  expect(await context.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeLessThan(
    await primary.evaluate(element => parseFloat(getComputedStyle(element).fontSize)),
  );
  await expectNoAxeViolations(page);

  await search.fill("development guide");
  await expect(palette.getByText("No pages found")).toBeVisible();
  await search.fill("settings");
  await expect(palette.getByRole("option")).toHaveCount(3);
  await search.fill("accessibility");
  await expect(palette.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/settings\/accessibility$/);
  await expect(palette).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.locator("#main-content")).toHaveCSS("outline-style", "none");

  await launcher.click();
  await page.keyboard.press("Escape");
  await expect(palette).toHaveCount(0);
  await expect(launcher).toBeFocused();
  await expect(launcher).toHaveCSS("outline-style", "solid");
});

for (const theme of ["Light", "Dark", "Soft dark"]) {
  test(`page search exposes hover and press feedback in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1280 });
    await signIn(page);
    await page.goto("/settings/appearance");
    await page.getByRole("group", { name: "Color theme" }).getByRole("button", { name: theme, exact: true }).click();
    await page.getByRole("button", { name: "Search pages", exact: true }).click();
    const palette = page.getByRole("dialog", { name: "Search pages" });
    const search = palette.getByRole("combobox", { name: "Search pages" });
    const option = palette.getByRole("option", { name: "Navigation Settings", exact: true });
    const paperColor = await palette.evaluate(element => getComputedStyle(element).backgroundColor);
    const normalColor = await option.evaluate(element => getComputedStyle(element).backgroundColor);
    await option.hover();
    await expect
      .poll(() => option.evaluate(element => getComputedStyle(element).backgroundColor))
      .not.toBe(normalColor);
    await expect.poll(() => option.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(paperColor);
    const bounds = await option.boundingBox();
    if (!bounds) throw new Error("Search option has no bounds");
    await page.mouse.down();
    await expect(option.locator(".MuiTouchRipple-rippleVisible")).toBeVisible();
    await expect(search).toBeFocused();
    await page.mouse.up();
    await expect(palette).toHaveCount(0);
    await expect(page).toHaveURL(/\/settings\/navigation$/);
    await expect(page.locator("#main-content")).toBeFocused();
  });
}

test("page search preserves the current URL and respects the account modal", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await signIn(page);
  await page.goto("/settings/appearance?view=compact#preferences");
  const launcher = page.getByRole("button", { name: "Search pages", exact: true });
  await launcher.click();
  const palette = page.getByRole("dialog", { name: "Search pages" });
  await palette.getByRole("combobox", { name: "Search pages" }).fill("appearance");
  await palette.getByRole("option", { name: /^Appearance/ }).click();
  await expect(palette).toHaveCount(0);
  await expect(page).toHaveURL(/\/settings\/appearance\?view=compact#preferences$/);
  await expect(launcher).toBeFocused();

  await page.getByRole("button", { name: /^Account / }).click();
  const account = page.getByRole("menu", { name: "Account", exact: true });
  await expect(account).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(palette).toHaveCount(0);
  await expect(account).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(account).toHaveCount(0);
});

test("keeps Croatian page search accessible on a narrow dark large-text layout", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 320 });
  await signIn(page);
  await page.goto("/settings/appearance");
  await page
    .getByRole("group", { name: "Font size", exact: true })
    .getByRole("button", { name: "Big", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Color theme", exact: true })
    .getByRole("button", { name: "Dark", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Language", exact: true })
    .getByRole("button", { name: "HR", exact: true })
    .click();
  const launcher = page.getByRole("button", { name: "Pretraži stranice", exact: true });
  await expect(launcher).toBeVisible();
  await launcher.click();
  const palette = page.getByRole("dialog", { name: "Pretraži stranice" });
  const search = palette.getByRole("combobox", { name: "Pretraži stranice" });
  await expect(search).toBeFocused();
  const labelBox = await palette.locator(".MuiInputLabel-root").boundingBox();
  const contentBox = await palette.locator(".MuiDialogContent-root").boundingBox();
  if (!labelBox || !contentBox) throw new Error("Search field has no label or content bounds");
  expect(labelBox.y).toBeGreaterThanOrEqual(contentBox.y);
  await expect(palette.getByRole("option")).toHaveCount(4);
  await expectNoPageOverflow(page);
  await expectNoAxeViolations(page);
  await search.fill("pocetna");
  await expect(palette.getByRole("option", { name: /^Početna/ })).toBeVisible();
  await search.fill("postavke");
  await expect(palette.getByRole("option")).toHaveCount(3);
  await palette.getByRole("option", { name: /^Pristupačnost/ }).click();
  await expect(page).toHaveURL(/\/settings\/accessibility$/);
  await expect(palette).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeFocused();
  await expectNoPageOverflow(page);
});
