import { expect, test } from "@playwright/test";

import {
  appAuthSpringSessionEndpoints,
  serializeSpringSessionUser,
} from "../../src/app/auth/api/appAuth.api.springSession";
import { mockAuthUser } from "../../mocks/auth";

test.use({
  launchOptions: {
    // Real scrollbar gutters reproduce the hover/resize feedback loop.
    ignoreDefaultArgs: ["--hide-scrollbars"],
    args: ["--disable-features=OverlayScrollbar,FluentOverlayScrollbar"],
  },
});

for (const scenario of [
  { locale: "hr", mode: "light", permanent: false, width: 1280, height: 800 },
  { locale: "hr", mode: "dark", permanent: true, width: 2478, height: 1453 },
  { locale: "en", mode: "dark", permanent: true, width: 1280, height: 800 },
] as const) {
  test(`keeps hover stable in ${scenario.locale} ${scenario.mode} with a ${scenario.permanent ? "permanent" : "temporary"} drawer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.addInitScript(
      preferences => {
        for (const [key, value] of Object.entries(preferences)) localStorage.setItem(key, JSON.stringify(value));
      },
      {
        "rgo.app.locale": scenario.locale,
        "rgo.app.color-mode": scenario.mode,
        "rgo.app.drawer-mode": scenario.permanent ? "permanent" : "temporary",
        "rgo.app.permanent-drawer-collapsed": scenario.permanent,
      },
    );
    await page.route(`https://api.example.invalid${appAuthSpringSessionEndpoints.session}`, async route => {
      await route.fulfill({
        body: JSON.stringify(serializeSpringSessionUser(mockAuthUser)),
        contentType: "application/json",
      });
    });
    await page.goto("/");
    const accountLabel = scenario.locale === "hr" ? "Račun" : "Account";
    const tooltipText =
      scenario.locale === "hr" ? "Otvori izbornik korisničke navigacije" : "Open user navigation menu";
    const account = page.getByRole("button", { name: accountLabel });
    await expect(account).toBeVisible();
    const box = await account.boundingBox();
    if (!box) throw new Error("Missing account button bounds");
    const initialDimensions = await account.evaluate(element => {
      const root = document.documentElement;
      return [
        root.clientWidth,
        root.clientHeight,
        root.scrollWidth,
        root.scrollHeight,
        element.getBoundingClientRect().right,
      ];
    });
    await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2);
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toHaveText(tooltipText);
    const observedDimensions = await account.evaluate(
      element =>
        new Promise<number[][]>(resolve => {
          const dimensions = new Set<string>();
          let frames = 0;
          const sample = () => {
            const root = document.documentElement;
            dimensions.add(
              JSON.stringify([
                root.clientWidth,
                root.clientHeight,
                root.scrollWidth,
                root.scrollHeight,
                element.getBoundingClientRect().right,
              ]),
            );
            if (++frames === 120) resolve(Array.from(dimensions, value => JSON.parse(value) as number[]));
            else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }),
    );
    expect(observedDimensions).toEqual([initialDimensions]);
    expect(initialDimensions[2]).toBeLessThanOrEqual(initialDimensions[0]!);
    expect(initialDimensions[3]).toBeLessThanOrEqual(initialDimensions[1]!);
    await expect(tooltip).toBeVisible();
    await expect
      .poll(() =>
        tooltip.evaluate(element => element.getBoundingClientRect().right <= document.documentElement.clientWidth),
      )
      .toBe(true);
    await account.click();
    const menu = page.getByRole("menu", { name: accountLabel });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(account).toBeFocused();
  });
}
