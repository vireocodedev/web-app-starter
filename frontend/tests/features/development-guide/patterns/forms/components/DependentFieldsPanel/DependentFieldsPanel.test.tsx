import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DependentFieldsPanel } from "@/features/development-guide/patterns/forms/components/DependentFieldsPanel/DependentFieldsPanel";

vi.mock("@/features/development-guide/patterns/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[1]?.preview,
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("DependentFieldsPanel", () => {
  it("submits the conditional-field example with hidden dependencies valid", async () => {
    render(<DependentFieldsPanel />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "formsExamples.dependent.conditional.submit",
      }),
    );

    expect(await screen.findByText("formsExamples.dependent.conditional.valid")).toBeVisible();
  });
});
