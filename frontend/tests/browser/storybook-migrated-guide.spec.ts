import { expect, test, type Frame, type Page } from "@playwright/test";
import axe from "axe-core";

const panels = [
  {
    id: "development-guide-patterns-application-state--effects-and-cleanup",
    heading: "Effect lifetime and cleanup",
    category: "ApplicationState",
  },
  {
    id: "development-guide-patterns-application-state--persistent-state",
    heading: "Typed private preview storage",
    category: "ApplicationState",
  },
  {
    id: "development-guide-patterns-application-state--sharing-state-between-routes",
    heading: "Share one state surface",
    category: "ApplicationState",
  },
  {
    id: "development-guide-patterns-application-state--source-and-computed-signals",
    heading: "Source Signals",
    category: "ApplicationState",
  },
  {
    id: "development-guide-patterns-feedback--confirmation-dialogs",
    heading: "Standard confirmation",
    category: "Feedback",
  },
  {
    id: "development-guide-patterns-feedback--toast-notifications",
    heading: "Success notification",
    category: "Feedback",
  },
  {
    id: "development-guide-patterns-forms--async-submission-and-server-errors",
    heading: "Pending submission",
    category: "Forms",
  },
  {
    id: "development-guide-patterns-forms--dependent-fields",
    heading: "Dependent options",
    category: "Forms",
  },
  {
    id: "development-guide-patterns-forms--dirty-state-and-navigation-guard",
    heading: "Reset to accepted values",
    category: "Forms",
  },
  {
    id: "development-guide-patterns-forms--validation-and-error-presentation",
    heading: "Localized Zod schema",
    category: "Forms",
  },
  {
    id: "development-guide-patterns-forms--async-lookups",
    heading: "Search-backed autocomplete",
    category: "Forms",
  },
  {
    id: "development-guide-patterns-forms--repeated-and-nested-fields",
    heading: "Editable line items",
    category: "Forms",
  },
  {
    id: "development-guide-patterns-localization--dates-and-times",
    heading: "Locale date",
    category: "Localization",
  },
  {
    id: "development-guide-patterns-localization--interpolation-and-plurals",
    heading: "Named interpolation",
    category: "Localization",
  },
  {
    id: "development-guide-patterns-localization--localized-mui-controls",
    heading: "Application locale bridge",
    category: "Localization",
  },
  {
    id: "development-guide-patterns-localization--numbers-percentages-and-currencies",
    heading: "Grouped decimal",
    category: "Localization",
  },
  {
    id: "development-guide-patterns-overlays--overlay-guards-and-lifecycle",
    heading: "Confirm unsaved changes",
    category: "Overlays",
  },
  {
    id: "development-guide-patterns-overlays--overlay-presentations",
    heading: "Centered dialog",
    category: "Overlays",
  },
  {
    id: "development-guide-patterns-overlays--overlay-results-and-composition",
    heading: "Typed input and result",
    category: "Overlays",
  },
  {
    id: "development-guide-patterns-routing-and-url-state--nested-routes",
    heading: "Shared nested layout",
    category: "RoutingAndUrlState",
  },
  {
    id: "development-guide-patterns-routing-and-url-state--route-parameters-and-breadcrumbs",
    heading: "Dynamic route parameter",
    category: "RoutingAndUrlState",
  },
  {
    id: "development-guide-patterns-routing-and-url-state--route-recovery",
    heading: "Scoped route boundary",
    category: "RoutingAndUrlState",
  },
  {
    id: "development-guide-patterns-routing-and-url-state--search-parameters",
    heading: "Search parameters as filter state",
    category: "RoutingAndUrlState",
  },
  {
    id: "development-guide-patterns-server-data--mutations-and-refresh",
    heading: "Pending mutation state",
    category: "ServerData",
  },
  {
    id: "development-guide-patterns-server-data--pagination-and-filtering",
    heading: "Filter a collection",
    category: "ServerData",
  },
  {
    id: "development-guide-patterns-server-data--query-states",
    heading: "Loading state",
    category: "ServerData",
  },
  {
    id: "development-guide-patterns-server-data--request-cancellation",
    heading: "Cancel obsolete searches",
    category: "ServerData",
  },
  {
    id: "development-guide-patterns-server-data--optimistic-updates-and-rollback",
    heading: "Save immediately, recover on rejection",
    category: "ServerData",
  },
  {
    id: "development-guide-patterns-tables-and-collections--loading-empty-and-error-presentation",
    heading: "Initial loading",
    category: "TablesAndCollections",
  },
  {
    id: "development-guide-patterns-tables-and-collections--row-selection-and-bulk-actions",
    heading: "Row activation",
    category: "TablesAndCollections",
  },
  {
    id: "development-guide-patterns-tables-and-collections--sorting-and-pagination",
    heading: "Local sorting",
    category: "TablesAndCollections",
  },
  {
    id: "development-guide-patterns-tables-and-collections--url-backed-filters",
    heading: "Canonical URL filters",
    category: "TablesAndCollections",
  },
] as const;

async function preview(page: Page) {
  const handle = await page.locator("#storybook-preview-iframe").elementHandle();
  const frame = await handle?.contentFrame();
  if (!frame) throw new Error("The migrated preview did not load.");
  return frame;
}
async function open(page: Page, id: string) {
  await page.goto(`/?path=/story/${id}`);
  return preview(page);
}
async function applicationStorage(frame: Frame) {
  return frame.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .filter(key => key.startsWith("rgo.app."))
        .sort()
        .map(key => [key, localStorage.getItem(key)]),
    ),
  );
}
async function noHorizontalOverflow(frame: Frame) {
  await expect.poll(() => frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function accessible(frame: Frame) {
  await frame.evaluate(axe.source);
  const issues = await frame.evaluate(async () => {
    const engine = (window as typeof window & { axe: typeof axe }).axe;
    const result = await engine.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
    return result.violations.map(issue => `${issue.id}: ${issue.help}`);
  });
  expect(issues).toEqual([]);
}

for (const panel of panels) {
  test(`migrated ${panel.category}/${panel.id.split("--")[1]} renders its working gallery and code`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const frame = await open(page, panel.id);
    await expect(frame.getByRole("heading", { name: panel.heading, exact: true }).first()).toBeVisible();
    await expect(frame.getByRole("button", { name: "Hide code", exact: true }).first()).toBeVisible();
    const example = frame.locator("section").filter({
      has: frame.getByRole("heading", { name: panel.heading, exact: true }),
    });
    const code = example.locator("pre[aria-label]").first();
    await expect(code).toBeVisible();
    await expect(code).not.toBeEmpty();
    await example.getByRole("button", { name: "Hide code", exact: true }).click();
    await expect(code).toHaveCount(0);
    await example.getByRole("button", { name: "Show code", exact: true }).click();
    await expect(code).toBeVisible();
    await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toBeVisible();
    await expect(frame.getByText("development-guide:", { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("migrated Contacts creates, updates and deletes through its private adapter", async ({ page }) => {
  const frame = await open(page, "development-guide-examples-contacts--directory");
  await frame.getByRole("button", { name: "Add contact", exact: true }).click();
  const before = await applicationStorage(frame);
  await frame.getByRole("textbox", { name: "Name", exact: false }).fill("Migrated Example");
  await frame.getByRole("textbox", { name: "Email", exact: false }).fill("migrated@example.com");
  await frame.getByRole("textbox", { name: "Organization", exact: false }).fill("Example organization");
  await frame.getByRole("textbox", { name: "Role", exact: false }).fill("Engineer");
  await frame.getByRole("button", { name: "Create contact", exact: true }).click();
  const search = frame.getByRole("textbox", { name: "Search contacts", exact: true });
  await search.fill("Migrated Example");
  const row = frame.getByRole("row").filter({ hasText: "migrated@example.com" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit Migrated Example", exact: true }).click();
  await frame.getByRole("textbox", { name: "Role", exact: false }).fill("Senior engineer");
  await frame.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(row).toContainText("Senior engineer");
  await row.getByRole("button", { name: "Delete Migrated Example", exact: true }).click();
  await frame
    .getByRole("dialog", { name: "Delete contact?", exact: true })
    .getByRole("button", { name: "Delete contact", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  expect(await applicationStorage(frame)).toEqual(before);
});

test("migrated Contacts dashboard opens its private directory and resets on a fresh preview", async ({ page }) => {
  const frame = await open(page, "development-guide-examples-contacts--dashboard");
  await expect(frame.getByRole("heading", { name: "Your contacts at a glance", exact: true })).toBeVisible();
  await frame.getByRole("link", { name: "Open contacts", exact: true }).click();
  await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toHaveValue("/contacts");
  await expect(frame.getByRole("table", { name: "Contacts", exact: true })).toBeVisible();
  await expect(frame.getByText("Migrated Example", { exact: true })).toHaveCount(0);
});

test("confirmed private navigation unmounts the guarded draft and opens the sibling form", async ({ page }) => {
  const frame = await open(page, "development-guide-patterns-forms--dirty-state-and-navigation-guard");
  const draft = frame.locator("#forms-navigation-guard").getByRole("textbox", { name: "Draft title", exact: true });
  await draft.fill("Unsaved reference draft");
  await frame.getByRole("button", { name: "Open dependent fields", exact: true }).click();
  await frame
    .getByRole("dialog", { name: "Discard unsaved changes?", exact: true })
    .getByRole("button", { name: "Keep editing", exact: true })
    .click();
  await expect(draft).toHaveValue("Unsaved reference draft");
  await frame.getByRole("button", { name: "Open dependent fields", exact: true }).click();
  await frame
    .getByRole("dialog", { name: "Discard unsaved changes?", exact: true })
    .getByRole("button", { name: "Discard and leave", exact: true })
    .click();
  await expect(frame.getByRole("heading", { name: "Dependent options", exact: true })).toBeVisible();
  await expect(draft).toHaveCount(0);
  await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toHaveValue(
    "/dev-guide/frontend/patterns/forms/dependent-fields",
  );
});

test("shared estimate survives private route transition without using application storage", async ({ page }) => {
  const frame = await open(page, "development-guide-patterns-application-state--sharing-state-between-routes");
  const hours = frame.getByRole("spinbutton", { name: "Hours", exact: true });
  await expect(hours).toHaveValue("8");
  const before = await applicationStorage(frame);
  await hours.fill("13");
  await frame.getByRole("link", { name: "Review persistence", exact: true }).click();
  await expect(frame.getByRole("heading", { name: "Typed private preview storage", exact: true })).toBeVisible();
  await expect(frame.getByText(/13 hours ×/).first()).toBeVisible();
  await expect(frame.getByText("Saved in preview memory", { exact: true })).toBeVisible();
  expect(await applicationStorage(frame)).toEqual(before);
});

test("all handbook records are searchable and article links stay in the reference reader", async ({ page }) => {
  const frame = await open(page, "development-guide-handbook-handbook--overview");
  await expect(frame.getByRole("combobox", { name: "Read article", exact: true }).getByRole("option")).toHaveCount(159);
  await frame.getByRole("searchbox", { name: "Search reference articles", exact: true }).fill("transaction");
  await expect(frame.getByRole("status").filter({ hasText: /^Matching articles:/ })).not.toHaveText(
    "Matching articles: 0 of 158.",
  );
  await frame
    .getByRole("combobox", { name: "Read article", exact: true })
    .selectOption("/handbook/backend/application-services/transactional-commands");
  await expect(
    frame.getByRole("heading", { name: "One transaction for one complete business command", exact: true }),
  ).toBeVisible();
  await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toHaveValue(
    "/handbook/backend/application-services/transactional-commands",
  );
  await expect(
    frame.getByRole("navigation", { name: "Related reading", exact: true }).getByRole("link").first(),
  ).toBeVisible();
  await frame.getByRole("link", { name: "Architecture (15)", exact: true }).click();
  await frame
    .getByRole("combobox", { name: "Read article", exact: true })
    .selectOption("/architecture/source-map-and-ownership");
  await expect(frame.getByRole("heading", { name: "Source map and ownership", exact: true })).toBeVisible();
});

test("handbook tutorial links open the top-level Storybook Docs destination", async ({ page }) => {
  const frame = await open(page, "development-guide-handbook-handbook--overview");
  await frame
    .getByRole("combobox", { name: "Read article", exact: true })
    .selectOption("/handbook/backend/foundation/validation-and-error-contracts");
  const link = frame
    .locator('a[href="/?path=/docs/development-guide-data-building-a-backend-connected-feature--docs"]')
    .first();
  await expect(link).toHaveAttribute("target", "_top");
  await link.click();
  await expect(page).toHaveURL(/path=\/docs\/development-guide-data-building-a-backend-connected-feature--docs/);
  const docs = await preview(page);
  await expect(
    docs.getByRole("heading", { level: 1 }).filter({ hasText: "Building a backend-connected feature" }),
  ).toBeVisible();
});

test("reference section links scroll after lazy content is ready", async ({ page }) => {
  const frame = await open(page, "development-guide-architecture-architecture-reference--overview");
  await frame
    .getByRole("combobox", { name: "Read article", exact: true })
    .selectOption("/architecture/router-and-shell-responsibilities");
  await frame.getByRole("link", { name: "window scroll policy", exact: true }).click();
  await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toHaveValue(
    "/architecture/router-and-shell-responsibilities#window-scroll-policy",
  );
  const heading = frame.locator("#window-scroll-policy");
  await expect(heading).toBeInViewport();
  await expect
    .poll(() =>
      heading.evaluate(element => {
        const scroller = document.scrollingElement!;
        const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
        const requested = scroller.scrollTop + element.getBoundingClientRect().top - margin;
        const available = scroller.scrollHeight - scroller.clientHeight;
        const expected = Math.max(0, Math.min(requested, available));
        return Math.abs(scroller.scrollTop - expected);
      }),
    )
    .toBeLessThanOrEqual(2);
});

for (const [id, heading] of [
  ["development-guide-handbook-handbook--transactional-commands", "Handbook reference"],
  ["development-guide-architecture-architecture-reference--source-map", "Architecture reference"],
] as const) {
  test(`${heading} keeps selected reading through themes and supports narrow accessible content`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const frame = await open(page, id);
    await expect(frame.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(frame.locator("article")).toBeVisible();
    const address = frame.getByRole("textbox", { name: "Preview URL", exact: true });
    const value = await address.inputValue();
    for (const [label, color] of [
      ["Dark", "rgb(13, 17, 23)"],
      ["Soft dark", "rgb(34, 39, 46)"],
      ["Light", "rgb(255, 255, 255)"],
    ]) {
      await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption({ label: label! });
      await expect
        .poll(() => frame.locator("body").evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(color);
      await expect(address).toHaveValue(value);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await frame.evaluate(() => document.fonts.ready);
    await noHorizontalOverflow(frame);
    await accessible(frame);
    expect(errors).toEqual([]);
  });
}

for (const id of [
  "development-guide-examples-contacts--docs",
  "development-guide-patterns-application-state--docs",
  "development-guide-patterns-feedback--docs",
  "development-guide-patterns-forms--docs",
  "development-guide-patterns-localization--docs",
  "development-guide-patterns-overlays--docs",
  "development-guide-patterns-routing-and-url-state--docs",
  "development-guide-patterns-server-data--docs",
  "development-guide-patterns-tables-and-collections--docs",
  "development-guide-handbook-handbook--docs",
  "development-guide-architecture-architecture-reference--docs",
]) {
  test(`migrated Docs ${id} remains reachable outside the application`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/?path=/docs/${id}`);
    const docs = await preview(page);
    await expect(docs.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const inlineReader =
      id === "development-guide-handbook-handbook--docs" ||
      id === "development-guide-architecture-architecture-reference--docs";
    if (inlineReader) {
      await expect(docs.getByRole("textbox", { name: "Preview URL", exact: true })).toBeVisible();
      await expect(docs.getByRole("combobox", { name: "Read article", exact: true })).toBeVisible();
    } else {
      const handle = await docs.locator("iframe").first().elementHandle();
      const frame = await handle?.contentFrame();
      if (!frame) throw new Error("The migrated Docs preview did not load.");
      await expect(frame.getByRole("textbox", { name: "Preview URL", exact: true })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
