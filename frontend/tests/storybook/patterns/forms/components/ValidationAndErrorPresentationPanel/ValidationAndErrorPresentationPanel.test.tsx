import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ValidationAndErrorPresentationPanel } from "../../../../../../docs/storybook/patterns/Forms/components/ValidationAndErrorPresentationPanel/ValidationAndErrorPresentationPanel";

vi.mock("../../../../../../docs/storybook/patterns/shared/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[0]?.preview,
}));

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("ValidationAndErrorPresentationPanel", () => {
  it("clears a successful validation result when a field changes", async () => {
    render(<ValidationAndErrorPresentationPanel />);

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /formsExamples\.validation\.fields\.name/,
      }),
      { target: { value: "Ana" } },
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: /formsExamples\.validation\.fields\.email/,
      }),
      { target: { value: "ana@example.test" } },
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: /formsExamples\.validation\.fields\.confirmEmail/,
      }),
      { target: { value: "ana@example.test" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "formsExamples.validation.submit",
      }),
    );

    expect(await screen.findByText("formsExamples.validation.success")).toBeVisible();

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /formsExamples\.validation\.fields\.email/,
      }),
      { target: { value: "invalid" } },
    );

    expect(screen.queryByText("formsExamples.validation.success")).not.toBeInTheDocument();
  });
});
