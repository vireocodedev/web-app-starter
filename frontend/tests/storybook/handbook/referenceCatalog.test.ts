import { describe, expect, it } from "vitest";
import { toId } from "storybook/internal/csf";

import {
  architectureArticleCatalog,
  architectureArticleIds,
  architectureGroups,
  loadArchitectureMarkdown,
} from "../../../docs/storybook/architecture/ArchitectureReference/catalog/architectureArticles";
import { handbookArticles } from "../../../docs/storybook/handbook/Handbook/catalog/handbookManifest";
import { loadHandbookMarkdown } from "../../../docs/storybook/handbook/Handbook/catalog/handbookMarkdown";
import { markdownHeadings } from "../../../docs/storybook/shared/documentation/markdownHeadings";
import {
  handbookLabel,
  referenceArticles,
  resolveReferenceHref,
  storybookDocsBySource,
} from "../../../docs/storybook/shared/documentation/referenceLinks";

describe("Storybook reference catalog", () => {
  it("exposes every handbook and architecture article through unique canonical reading destinations", () => {
    expect(handbookArticles).toHaveLength(158);
    expect(architectureArticleCatalog.map(({ id }) => id)).toEqual(architectureArticleIds);
    expect(architectureArticleIds).toHaveLength(15);
    expect(referenceArticles).toHaveLength(173);
    expect(new Set(referenceArticles.map(({ to }) => to)).size).toBe(173);
    const groups = new Set(architectureGroups.map(({ id }) => id));
    for (const article of architectureArticleCatalog) expect(groups.has(article.groupId)).toBe(true);
    for (const article of handbookArticles) expect(handbookLabel(article.titleKey)).not.toBe(article.titleKey);
  });

  it("loads both canonical languages and retains pinned provenance for every handbook body", async () => {
    for (const article of handbookArticles) {
      for (const locale of ["en", "hr"] as const) {
        const markdown = await loadHandbookMarkdown(article.contentPath, locale);
        expect(markdown).toMatch(/^#\s+/);
        expect(markdownHeadings(markdown).length).toBeGreaterThan(0);
        for (const source of article.sources)
          expect(markdown).toContain(`${source.project}@${source.revision}:${source.path}`);
      }
    }
  });

  it("keeps architecture bodies, section anchors and cross-catalog links readable in both languages", async () => {
    for (const article of architectureArticleCatalog) {
      for (const locale of ["en", "hr"] as const) {
        const markdown = await loadArchitectureMarkdown(article.id, locale);
        expect(markdown).toMatch(/^#\s+/);
        expect(markdown).not.toMatch(/^(?:Next|Sljedeće):\s/m);
        const headings = markdownHeadings(markdown);
        expect(new Set(headings.map(({ id }) => id)).size).toBe(headings.length);
        for (const [, href = ""] of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
          if (href.endsWith(".md") || href.includes(".md#")) {
            expect(resolveReferenceHref(`/frontend/docs/architecture/${locale}/${article.id}.md`, href)).toMatch(
              /^\/(?:architecture|handbook)\//,
            );
          }
          if (href.startsWith("#")) expect(headings.some(({ id }) => id === href.slice(1))).toBe(true);
        }
      }
    }
  });

  it("preserves complete source paths and anchors across handbook and architecture links", () => {
    const source = "/frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md";
    expect(
      resolveReferenceHref(
        source,
        "../../development-guide/en/quality/test-design/architecture-invariants-and-checks.md#failure-cases",
      ),
    ).toBe("/handbook/quality/test-design/architecture-invariants-and-checks#failure-cases");
    expect(
      resolveReferenceHref(source, "/dev-guide/frontend/workflow-patterns/access/capability-aware-pages#contract"),
    ).toBe("/handbook/frontend/access/capability-aware-pages#contract");
    expect(resolveReferenceHref(source, "../hr/source-map-and-ownership.md")).toBe(
      "/architecture/source-map-and-ownership",
    );
    expect(resolveReferenceHref(source, "/dev-guide/find")).toBe("/handbook");
    expect(resolveReferenceHref(source, "#section")).toBe("#section");
    expect(resolveReferenceHref(source, "https://example.com/docs")).toBe("https://example.com/docs");
  });
});

const canonicalArticles = import.meta.glob<string>("../../../docs/{architecture,development-guide}/**/*.md", {
  import: "default",
  query: "?raw",
  eager: true,
});
const storySources = import.meta.glob<string>("../../../docs/storybook/**/*.stories.tsx", {
  import: "default",
  query: "?raw",
  eager: true,
});
const tutorialSources = import.meta.glob("../../../docs/storybook/**/*.mdx");

describe("canonical reference links to Storybook tutorials", () => {
  it("maps every registered MDX destination to its current stable CSF Docs ID", () => {
    for (const [path, href] of Object.entries(storybookDocsBySource)) {
      const relative = path.replace("/frontend/docs/", "../../../docs/");
      expect(tutorialSources[relative]).toBeDefined();
      const csf = storySources[relative.replace(/\.mdx$/, ".stories.tsx")];
      expect(csf).toBeDefined();
      const title = csf?.match(/title:\s*"([^"]+)"/)?.[1];
      expect(title).toBeDefined();
      expect(href).toBe(`/?path=/docs/${toId(title!, "docs")}`);
    }
  });

  it("resolves every current canonical article's MDX link to the Storybook manager", () => {
    let count = 0;
    for (const [path, markdown] of Object.entries(canonicalArticles)) {
      const source = path.replace("../../../docs/", "/frontend/docs/");
      for (const [, href = ""] of markdown.matchAll(/\[[^\]]+\]\(([^)]+\.mdx(?:#[^)]*)?)\)/g)) {
        count++;
        expect(resolveReferenceHref(source, href)).toMatch(/^\/\?path=\/docs\/[a-z0-9-]+--docs(?:#.*)?$/);
      }
    }
    expect(count).toBeGreaterThan(20);
  });

  it("preserves tutorial anchors while replacing source paths", () => {
    expect(
      resolveReferenceHref(
        "/frontend/docs/development-guide/en/backend/foundation/validation-and-error-contracts.md",
        "../../../../storybook/data/BackendConnectedFeature/BackendConnectedFeature.mdx#consumer-contract",
      ),
    ).toBe("/?path=/docs/development-guide-data-building-a-backend-connected-feature--docs#consumer-contract");
  });
});
