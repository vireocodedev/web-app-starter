import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import axe from 'axe-core';
import { chromium } from 'playwright';
import { skillDirectory } from '../scripts/workspace.mjs';

test('offline bundled documentation supports navigation, search and filters on desktop and mobile', async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    try {
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(join(skillDirectory, 'web/reference.html')).href);
      await page.getByRole('heading', { name: 'Your project, at a glance.' }).waitFor();
      assert.match(await page.locator('.hero .pill').textContent(), /Not ready/);
      assert.equal(await page.locator('[data-kind=consumer]').count(), 0);
      await page.locator('#search').fill('no-matching-synthetic-phrase');
      assert.equal(await page.locator('#empty').isVisible(), true);
      await page.locator('#reset').click();
      await page.locator('#kind').selectOption('reference');
      assert.equal(await page.locator('.record:visible').count(), 0);
      const firstLink = page.getByRole('navigation', { name: 'Documentation', exact: true }).locator('a').first();
      assert.equal(await firstLink.isVisible(), false);
      await page.evaluate(hash => { location.hash = hash; }, await firstLink.getAttribute('href'));
      await firstLink.waitFor({ state: 'visible' });
      assert.equal(await page.locator('#kind').inputValue(), 'all');
      await firstLink.click();
      assert.equal(await page.evaluate(() => Boolean(document.getElementById(location.hash.slice(1)))), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.evaluate(axe.source);
      const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
      assert.deepEqual(result.violations.map(v => `${v.id}: ${v.help}`), []);
      assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  }
});
