import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import axe from "axe-core";
import { chromium } from "playwright";
import { steps } from "../scripts/preparation/model.mjs";
import { startPreparationServer } from "../scripts/preparation/server.mjs";
import {
  executionDraft,
  schemaForTests,
  workspaceFixture,
} from "./preparation/test-support.mjs";

async function fixture(t, { seeded = false, mobile = false } = {}) {
  const workspace = await workspaceFixture();
  let app = await startPreparationServer({ root: workspace.root });
  t.after(async () => {
    await app.close();
    await workspace.remove();
  });
  if (seeded) {
    await writeFile(
      join(app.stateDirectory, "preparation-draft.json"),
      JSON.stringify(executionDraft(await schemaForTests())),
      {
        mode: 0o600,
      },
    );
  }
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(app.url);
  await page.locator("#field-execution_mode").waitFor();
  return {
    page,
    errors,
    workspace,
    get app() {
      return app;
    },
    async restart() {
      await app.close();
      app = await startPreparationServer({ root: workspace.root });
      await page.goto(app.url);
      await page
        .locator("#step-title")
        .filter({ hasNotText: "Opening" })
        .waitFor();
    },
  };
}

test("every execution step is usable and accessible on desktop and mobile, including conditional replacement", async (t) => {
  for (const mobile of [false, true]) {
    const f = await fixture(t, { seeded: true, mobile });
    const { page } = f;
    for (const step of steps) {
      await page
        .locator("#navigation button")
        .filter({ hasText: step.title })
        .click();
      assert.equal(await page.locator("#step-title").textContent(), step.title);
      assert.equal(
        await page.locator("#navigation [aria-current=step]").count(),
        1,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.evaluate(axe.source);
      const result = await page.evaluate(() =>
        axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
        }),
      );
      assert.deepEqual(
        result.violations.map((value) => `${value.id}: ${value.help}`),
        [],
        step.id,
      );
    }
    await page
      .locator("#navigation button")
      .filter({ hasText: "Resolve package ownership" })
      .click();
    await page
      .locator("#field-registry_policy")
      .selectOption("replace-listed-only");
    await page
      .getByRole("button", { name: "Add exact replacement", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Remove this row", exact: true })
        .count(),
      1,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    const replacementAudit = await page.evaluate(() =>
      axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      }),
    );
    assert.deepEqual(
      replacementAudit.violations.map((value) => value.id),
      [],
    );
    await page
      .locator("#navigation button")
      .filter({ hasText: "Save the workbook, not a deployment" })
      .click();
    assert.equal(await page.locator("#save-workbook").isDisabled(), true);
    assert.equal(await page.locator("#reviewed").isChecked(), false);
    assert.deepEqual(f.errors, []);
  }
});

test("a human planning flow persists, restarts and requires review plus replacement consent before export", async (t) => {
  const f = await fixture(t, { mobile: true });
  const { page } = f;
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator(".skip")
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator("#field-execution_mode")
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.locator("#field-execution_mode").selectOption("plan-only");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  assert.equal(
    await page.locator("#step-title").textContent(),
    "Connect your repository",
  );
  await page
    .locator("#navigation button")
    .filter({ hasText: "Name your application" })
    .click();
  await page.locator("#field-display_name").fill("Example <Portal> & Company");
  await page.waitForFunction(
    () =>
      document.querySelector("#save-status").textContent ===
      "Draft saved on this machine",
  );
  await f.restart();
  assert.equal(
    await page.locator("#field-display_name").inputValue(),
    "Example <Portal> & Company",
  );
  await page
    .locator("#navigation button")
    .filter({ hasText: "Save the workbook, not a deployment" })
    .click();
  await page.locator("#save-workbook").click();
  assert.match(
    await page.locator("#global-error").textContent(),
    /Review the exact workbook/,
  );
  await page.locator("#reviewed").check();
  await page.locator("#save-workbook").click();
  await page
    .getByRole("heading", { name: "Your private workbook is saved" })
    .waitFor();
  const workbook = join(f.app.stateDirectory, "preparation.md");
  const original = await readFile(workbook, "utf8");
  assert.match(original, /Example <Portal> & Company/);
  assert.match(original, /\| `approval_signer` \| REQUIRED \|/);
  assert.doesNotMatch(original, /^- \[x\]/m);
  await f.restart();
  await page.locator("#save-workbook").waitFor();
  await page.locator("#reviewed").check();
  await page.locator("#save-workbook").click();
  assert.match(
    await page.locator("#global-error").textContent(),
    /replacement first/,
  );
  assert.equal(await readFile(workbook, "utf8"), original);
  await page.locator("#replace-existing").check();
  await page.locator("#save-workbook").click();
  await page
    .getByRole("heading", { name: "Your private workbook is saved" })
    .waitFor();
  assert.deepEqual(f.errors, []);
});

test("the bundled reference opens with working anchors and no consumer readiness or browser storage", async (t) => {
  const f = await fixture(t);
  const { page } = f;
  const link = page.getByRole("link", { name: "Full reference guide" });
  const popupPromise = page.waitForEvent("popup");
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  assert.equal(
    await popup.evaluate(() =>
      Boolean(document.getElementById(location.hash.slice(1))),
    ),
    true,
  );
  assert.match(await popup.locator(".hero .pill").textContent(), /Not ready/);
  assert.equal(await popup.locator("[data-kind=consumer]").count(), 0);
  assert.equal(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
    0,
  );
  assert.deepEqual(f.errors, []);
});
