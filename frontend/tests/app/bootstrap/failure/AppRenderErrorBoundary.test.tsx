import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppRenderErrorBoundary } from "@/app/bootstrap/failure/AppRenderErrorBoundary";

function BrokenDescendant(): never {
  throw new Error("Technical failure that must not reach the user");
}

describe("AppRenderErrorBoundary", () => {
  it("focuses safe recovery content without exposing a thrown error message", () => {
    render(
      <AppRenderErrorBoundary>
        <BrokenDescendant />
      </AppRenderErrorBoundary>,
    );

    const heading = screen.getByRole("heading", {
      name: "Something went wrong",
    });

    expect(heading).toHaveFocus();
    expect(screen.queryByText("Technical failure that must not reach the user")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload application" })).toBeVisible();
  });
});
