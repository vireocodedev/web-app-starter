import { describe, expect, it } from "vitest";

import { markdownHeadingId, markdownHeadings } from "../../../docs/storybook/shared/documentation/markdownHeadings";

describe("documentation Markdown headings", () => {
  it("derives stable LTR anchors for English and Croatian headings", () => {
    expect(markdownHeadingId("State ownership & Signal lifecycle")).toBe("state-ownership-signal-lifecycle");
    expect(markdownHeadingId("Životni vijek značajke")).toBe("zivotni-vijek-znacajke");
  });

  it("collects only article section headings in document order", () => {
    expect(
      markdownHeadings(`# Title

## Ownership

### \`index.ts\` exports

#### Omitted detail

## [Runbook](./runbook.md)
`),
    ).toEqual([
      { depth: 2, id: "ownership", title: "Ownership", sourceLine: 3 },
      { depth: 3, id: "index-ts-exports", title: "index.ts exports", sourceLine: 5 },
      { depth: 2, id: "runbook", title: "Runbook", sourceLine: 9 },
    ]);
  });

  it("ignores list and blockquote fences while keeping following sections", () => {
    const markdown = [
      "- ```md",
      "  ## Example heading",
      "  ```",
      "",
      "> ~~~md",
      "> ## Quoted example",
      "> ~~~",
      "",
      "## Real section",
    ].join("\n");

    expect(markdownHeadings(markdown)).toEqual([
      { depth: 2, id: "real-section", title: "Real section", sourceLine: 9 },
    ]);
  });

  it("ends fences with their containers and recognizes headings in nested containers", () => {
    const markdown = [
      "> ```md",
      "> ## Quoted example",
      "",
      "## Outside quote",
      "",
      "- ```md",
      "  ## List example",
      "",
      "## Outside list",
      "",
      "> ## Nested section",
      "",
      "- ### Nested detail",
    ].join("\n");

    expect(markdownHeadings(markdown)).toEqual([
      { depth: 2, id: "outside-quote", title: "Outside quote", sourceLine: 4 },
      { depth: 2, id: "outside-list", title: "Outside list", sourceLine: 9 },
      { depth: 2, id: "nested-section", title: "Nested section", sourceLine: 11 },
      { depth: 3, id: "nested-detail", title: "Nested detail", sourceLine: 13 },
    ]);
  });

  it("assigns unique IDs to repeated and setext headings using parser source lines", () => {
    expect(markdownHeadings("## Section\n\nSection\n---\n\n### Section\n\n## Section-1")).toEqual([
      { depth: 2, id: "section", title: "Section", sourceLine: 1 },
      { depth: 2, id: "section-1", title: "Section", sourceLine: 3 },
      { depth: 3, id: "section-2", title: "Section", sourceLine: 6 },
      { depth: 2, id: "section-1-1", title: "Section-1", sourceLine: 8 },
    ]);
  });
});
