import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureArticle, architectureArticle } from "@/features/development-guide/architecture";
import { markdownHeadings } from "@/features/development-guide/architecture/utils/markdownHeadings";

const locale = vi.hoisted(() => ({ current: "en" as "en" | "hr" }));

vi.mock("@/app/localization/hooks/useAppLocalization", () => ({
  useAppLocalization: () => ({
    direction: "ltr",
    locale: locale.current,
    setLocale: vi.fn(),
  }),
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("ArchitectureArticle", () => {
  it.each(["en", "hr"] as const)("renders the canonical %s Markdown with contents anchors", activeLocale => {
    locale.current = activeLocale;
    const article = architectureArticle("source-map-and-ownership");
    const markdown = article.markdown[activeLocale];
    const title = markdown.match(/^#\s+(.+)$/m)?.[1];
    const firstSection = markdownHeadings(markdown)[0];
    render(
      <MemoryRouter>
        <ArchitectureArticle articleId="source-map-and-ownership" />
      </MemoryRouter>,
    );

    expect(title).toBeDefined();
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    if (firstSection) {
      expect(screen.getByRole("link", { name: firstSection.title })).toHaveAttribute("href", `#${firstSection.id}`);
      expect(document.getElementById(firstSection.id)).toBeVisible();
    }
  });

  it("renders only related Pattern links supplied by route composition", () => {
    locale.current = "en";
    render(
      <MemoryRouter>
        <ArchitectureArticle
          articleId="state-ownership-and-signal-lifecycle"
          relatedPatternLinks={[
            {
              labelKey: "architectureGuide.articles.sourceMapAndOwnership",
              to: "/dev-guide/patterns/application-state/source-and-computed-signals",
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("navigation", {
        name: "architectureGuide.relatedPatterns.label",
      }),
    ).toContainElement(
      screen.getByRole("link", {
        name: "architectureGuide.articles.sourceMapAndOwnership",
      }),
    );
  });
});
