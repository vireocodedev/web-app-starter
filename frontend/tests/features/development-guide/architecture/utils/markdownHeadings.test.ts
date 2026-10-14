import { describe, expect, it } from "vitest";

import { markdownHeadingId, markdownHeadings } from "@/features/development-guide/architecture/utils/markdownHeadings";

describe("architecture Markdown headings", () => {
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
      { depth: 2, id: "ownership", title: "Ownership" },
      { depth: 3, id: "index-ts-exports", title: "index.ts exports" },
      { depth: 2, id: "runbook", title: "Runbook" },
    ]);
  });
});
