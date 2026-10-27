import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { DocumentationMarkdown } from "../../../docs/storybook/shared/documentation/DocumentationMarkdown";
import { resolveReferenceHref } from "../../../docs/storybook/shared/documentation/referenceLinks";

describe("reference Markdown link targets", () => {
  it("opens tutorial Docs in the top-level manager while keeping article links in the preview", () => {
    const source = "/frontend/docs/development-guide/en/backend/foundation/validation-and-error-contracts.md";
    render(
      <MemoryRouter>
        <DocumentationMarkdown
          markdown={
            "[Backend-connected tutorial](../../../../storybook/data/BackendConnectedFeature/BackendConnectedFeature.mdx)\n\n[HTTP boundaries](http-service-persistence-boundaries.md)"
          }
          contentsLabels={{ label: "Article contents", title: "On this page" }}
          resolveHref={href => resolveReferenceHref(source, href)}
        />
      </MemoryRouter>,
    );
    const tutorial = screen.getByRole("link", { name: "Backend-connected tutorial" });
    expect(tutorial).toHaveAttribute(
      "href",
      "/?path=/docs/development-guide-data-building-a-backend-connected-feature--docs",
    );
    expect(tutorial).toHaveAttribute("target", "_top");
    const article = screen.getByRole("link", { name: "HTTP boundaries" });
    expect(article).toHaveAttribute("href", "/handbook/backend/foundation/http-service-persistence-boundaries");
    expect(article).not.toHaveAttribute("target");
  });

  it("exposes horizontally scrollable code and tables as named keyboard-focusable reading regions", () => {
    render(
      <MemoryRouter>
        <DocumentationMarkdown
          markdown={
            "```ts\nconst contract = 'long example content remains available through keyboard scrolling';\n```\n\n| Owner | Contract |\n| --- | --- |\n| Feature | Preserves authoritative write outcomes |"
          }
          contentsLabels={{ label: "Article contents", title: "On this page" }}
        />
      </MemoryRouter>,
    );
    const code = screen.getByRole("region", { name: "Code example" });
    const table = screen.getByRole("region", { name: "Reference table" });
    expect(code).toHaveAttribute("tabindex", "0");
    expect(table).toHaveAttribute("tabindex", "0");
    expect(code).toHaveTextContent("long example content");
    expect(table).toContainElement(screen.getByRole("table"));
    code.focus();
    expect(code).toHaveFocus();
    table.focus();
    expect(table).toHaveFocus();
  });
});
