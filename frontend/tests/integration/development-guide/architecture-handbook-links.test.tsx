import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { handbookRouteRegistry } from "@/app/router/handbookRoutes";
import { ArchitectureArticle } from "@/features/development-guide/architecture";

const locale = vi.hoisted(() => ({ current: "en" as "en" | "hr" }));

vi.mock("@/app/localization/hooks/useAppLocalization", () => ({
  useAppLocalization: () => ({ direction: "ltr", locale: locale.current, setLocale: vi.fn() }),
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("Architecture to Handbook navigation", () => {
  it.each([
    ["en", "Architecture invariants and checks"],
    ["hr", "Arhitekturne invarijante i provjere"],
  ] as const)("links the %s architecture guidance to the registered invariant map", (activeLocale, label) => {
    locale.current = activeLocale;
    render(
      <MemoryRouter>
        <ArchitectureArticle articleId="tests-mocks-stories-and-architecture-checks" />
      </MemoryRouter>,
    );

    const destination = "/dev-guide/quality/test-design/architecture-invariants-and-checks";
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", destination);
    expect(handbookRouteRegistry["handbook-article:quality-test-design-architecture-invariants-and-checks"].path).toBe(
      destination.slice(1),
    );
  });
});
