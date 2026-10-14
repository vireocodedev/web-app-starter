import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderFatalStartupError } from "@/app/bootstrap/failure/renderFatalStartupError";

describe("renderFatalStartupError", () => {
  it("renders and focuses provider-independent safe recovery content", async () => {
    const rootElement = document.createElement("div");
    document.body.append(rootElement);

    let fatalRoot: ReturnType<typeof renderFatalStartupError> = undefined;
    await act(async () => {
      fatalRoot = renderFatalStartupError(rootElement);
    });

    const heading = screen.getByRole("heading", {
      name: "Something went wrong",
    });
    expect(heading).toHaveFocus();
    expect(document.querySelector("main")).toContainElement(heading);
    expect(document.body).not.toHaveTextContent("Server detail");

    await act(async () => fatalRoot?.unmount());
    rootElement.remove();
  });
});
