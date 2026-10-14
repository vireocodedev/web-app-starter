import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ComponentEffectPreview } from "@/features/development-guide/patterns/applicationState/components/EffectsAndCleanupPanel/ComponentEffectPreview";
import { resetEstimate } from "@/features/development-guide/patterns/applicationState/signals/estimate/sigEstimate.actions";

const localization = vi.hoisted(() => ({ locale: "en" }));

vi.mock("@/app/localization/hooks/useAppLocalization", () => ({
  useAppLocalization: () => localization,
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      key === "applicationStateExamples.effects.component.documentTitle" ? `${values?.total} · Estimate` : key,
  }),
}));

afterEach(() => {
  resetEstimate();
});

describe("ComponentEffectPreview", () => {
  beforeEach(() => {
    localization.locale = "en";
  });

  it("restores the previous document title when its component effect stops", async () => {
    document.title = "Patterns";
    const view = render(<ComponentEffectPreview />);

    fireEvent.click(
      screen.getByRole("switch", {
        name: "applicationStateExamples.effects.component.action",
      }),
    );

    await waitFor(() => expect(document.title).toContain("€600.00"));

    view.unmount();
    expect(document.title).toBe("Patterns");
  });

  it("updates formatting when the locale changes and restores the original title when disabled", async () => {
    document.title = "Original title";
    const view = render(<ComponentEffectPreview />);
    const toggle = screen.getByRole("switch", {
      name: "applicationStateExamples.effects.component.action",
    });

    fireEvent.click(toggle);
    await waitFor(() => expect(document.title).toContain("€600.00"));

    localization.locale = "hr";
    view.rerender(<ComponentEffectPreview />);
    await waitFor(() => expect(document.title).toContain("600,00"));

    fireEvent.click(toggle);
    await waitFor(() => expect(document.title).toBe("Original title"));
  });
});
