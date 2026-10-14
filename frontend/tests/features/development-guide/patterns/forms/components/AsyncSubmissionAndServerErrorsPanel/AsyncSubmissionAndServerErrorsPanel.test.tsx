import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AsyncSubmissionAndServerErrorsPanel } from "@/features/development-guide/patterns/forms/components/AsyncSubmissionAndServerErrorsPanel/AsyncSubmissionAndServerErrorsPanel";

vi.mock("@/features/development-guide/patterns/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[1]?.preview,
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

describe("AsyncSubmissionAndServerErrorsPanel", () => {
  it("keeps submitted values after a typed server error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AsyncSubmissionAndServerErrorsPanel />
      </QueryClientProvider>,
    );

    const nameInput = screen.getByRole("textbox", {
      name: /formsExamples\.async\.fields\.name/,
    });
    const submit = screen.getByRole("button", {
      name: "formsExamples.async.submit",
    });
    fireEvent.click(submit);

    expect(submit).toBeDisabled();
    expect(await screen.findByText("formsExamples.async.serverErrors.conflict", {}, { timeout: 2_000 })).toBeVisible();
    expect(nameInput).toHaveValue("formsExamples.async.defaults.existingName");
  });
});
