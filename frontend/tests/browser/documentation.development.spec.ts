import { expect, test } from "@playwright/test";

for (const locale of ["en", "hr"] as const) {
  test(`development app exposes only application navigation in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      activeLocale => localStorage.setItem("rgo.app.locale", JSON.stringify(activeLocale)),
      locale,
    );
    await page.goto("/");
    await page.getByLabel(locale === "en" ? "Username" : "Korisničko ime").fill("demo");
    await page.getByLabel(locale === "en" ? "Password" : "Lozinka").fill("demo-password");
    await page.getByRole("button", { name: locale === "en" ? "Sign in" : "Prijava", exact: true }).click();
    const home = locale === "en" ? "Home" : "Početna";
    const settings = locale === "en" ? "Settings" : "Postavke";
    await expect(page.locator("[data-rgo-header-context]")).toHaveText(home);
    await expect(page.locator('a[href^="/dev-guide"]')).toHaveCount(0);
    await expect(page.locator("[data-rgo-bottom-navigation]").getByRole("link")).toHaveCount(2);
    await page.getByRole("button", { name: locale === "en" ? "Open navigation" : "Otvori navigaciju" }).click();
    const drawer = page.locator('[data-rgo-navigation-presentation="drawer"]');
    await expect(drawer.getByRole("link")).toHaveCount(1);
    await expect(drawer.getByRole("link", { name: home, exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^Account |^Račun / }).click();
    const menu = page.getByRole("menu", { name: locale === "en" ? "Account" : "Račun", exact: true });
    await expect(menu.getByRole("menuitem")).toHaveCount(2);
    await menu.getByRole("menuitem", { name: settings, exact: true }).click();
    await expect(page).toHaveURL("/settings/appearance");
    await expect(page.locator('[data-rgo-page-surface="settings"]')).toBeVisible();
    await page.keyboard.press("Control+k");
    const search = page.getByRole("combobox", { name: locale === "en" ? "Search pages" : "Pretraži stranice" });
    await search.fill("dev-guide");
    await expect(page.getByRole("option")).toHaveCount(0);
    await page.keyboard.press("Escape");
    for (const path of [
      "/dev-guide",
      "/dev-guide/contacts",
      "/dev-guide/frontend/patterns/forms/dependent-fields",
      "/dev-guide/frontend/architecture/source-map-and-ownership",
      "/dev-guide/backend",
    ]) {
      await page.goto(path);
      await expect(page.locator("#main-content").getByRole("alert")).toContainText(
        locale === "en" ? "Page not found" : "Stranica nije pronađena",
      );
      await expect(page.locator('a[href^="/dev-guide"]')).toHaveCount(0);
    }
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
}
