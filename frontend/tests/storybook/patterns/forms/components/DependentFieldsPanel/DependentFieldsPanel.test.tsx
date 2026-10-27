import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DependentFieldsPanel } from "../../../../../../docs/storybook/patterns/Forms/components/DependentFieldsPanel/DependentFieldsPanel";

vi.mock("../../../../../../docs/storybook/patterns/shared/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[1]?.preview,
}));

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
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
