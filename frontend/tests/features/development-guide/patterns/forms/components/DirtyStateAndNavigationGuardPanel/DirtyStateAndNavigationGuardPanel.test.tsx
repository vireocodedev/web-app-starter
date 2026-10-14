import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, Link, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DirtyStateAndNavigationGuardPanel } from "@/features/development-guide/patterns/forms/components/DirtyStateAndNavigationGuardPanel/DirtyStateAndNavigationGuardPanel";

const feedback = vi.hoisted(() => ({ confirm: vi.fn() }));

vi.mock("@/features/development-guide/patterns/gallery", () => ({
  ExampleGallery: ({ resources }: { resources: { examples: { preview: React.ReactNode }[] } }) =>
    resources.examples[1]?.preview,
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@rgo-web/frontend", async importOriginal => {
  const actual = await importOriginal<typeof import("@rgo-web/frontend")>();
  return { ...actual, useRgoFeedback: () => feedback };
});

describe("DirtyStateAndNavigationGuardPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the current route when navigation confirmation is cancelled", async () => {
    feedback.confirm.mockResolvedValue({ status: "cancelled" });
    const router = createMemoryRouter(
      [
        {
          Component: () => (
            <>
              <DirtyStateAndNavigationGuardPanel />
              <Link to="/next">Leave form</Link>
            </>
          ),
          path: "/forms",
        },
        { Component: () => <div>Next route</div>, path: "/next" },
      ],
      { initialEntries: ["/forms"] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /formsExamples\.dirty\.fields\.title/,
      }),
      { target: { value: "Edited draft" } },
    );
    fireEvent.click(screen.getByRole("link", { name: "Leave form" }));

    await waitFor(() => expect(feedback.confirm).toHaveBeenCalledOnce());
    expect(feedback.confirm.mock.calls[0]?.[0]).toMatchObject({
      signal: expect.any(AbortSignal),
    });
    await waitFor(() => expect(router.state.location.pathname).toBe("/forms"));
  });
});
