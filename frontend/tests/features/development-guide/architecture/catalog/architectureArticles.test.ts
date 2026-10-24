import { describe, expect, it } from "vitest";

import { markdownHeadings } from "@/app/shell/documentation/markdownHeadings";
import {
  architectureArticleCatalog,
  architectureArticleIds,
  architectureGroups,
} from "@/features/development-guide/architecture";

describe("architecture article catalog", () => {
  it("keeps the approved IDs unique and in route order", () => {
    expect(architectureArticleCatalog.map(({ id }) => id)).toEqual(architectureArticleIds);
    expect(new Set(architectureArticleIds).size).toBe(15);
  });

  it("provides both locale sources and one known group for every article", () => {
    const groupIds = new Set(architectureGroups.map(({ id }) => id));
    for (const article of architectureArticleCatalog) {
      expect(groupIds.has(article.groupId)).toBe(true);
      expect(article.markdown.en.trim()).not.toBe("");
      expect(article.markdown.hr.trim()).not.toBe("");
      expect(article.markdown.en).toMatch(/^#\s+/);
      expect(article.markdown.hr).toMatch(/^#\s+/);
    }
  });

  it("leaves sequential navigation to the shared page navigation component", () => {
    for (const article of architectureArticleCatalog) {
      for (const markdown of Object.values(article.markdown)) {
        expect(markdown).not.toMatch(/^(?:Next|Sljedeće):\s/m);
      }
    }
  });

  it("keeps local article links and contents anchors resolvable", () => {
    const articleIds = new Set<string>(architectureArticleIds);

    for (const article of architectureArticleCatalog) {
      for (const markdown of Object.values(article.markdown)) {
        const headings = markdownHeadings(markdown);
        expect(new Set(headings.map(({ id }) => id)).size).toBe(headings.length);

        for (const [, href = ""] of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
          const [path, hash] = href.split("#");
          if (path?.endsWith(".md")) {
            expect(articleIds.has(path.split("/").at(-1)!.replace(/\.md$/, ""))).toBe(true);
          }
          if (!path && hash) {
            expect(headings.some(({ id }) => id === hash)).toBe(true);
          }
        }
      }
    }
  });
});
