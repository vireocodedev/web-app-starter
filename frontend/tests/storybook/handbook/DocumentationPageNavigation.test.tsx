import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import {
  DocumentationPageNavigation,
  type DocumentationNavigationGroup,
} from "../../../docs/storybook/shared/documentation";

vi.mock("../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, options?: { title?: string }) => (options?.title ? `${key}: ${options.title}` : key),
  }),
}));

const groups = [
  {
    defaultExpanded: true,
    id: "start",
    items: [
      { labelKey: "navigation.home", to: "/docs/first" },
      { labelKey: "navigation.contacts", to: "/docs/second" },
    ],
    labelKey: "navigation.examples",
  },
] as const satisfies readonly DocumentationNavigationGroup[];

describe("DocumentationPageNavigation", () => {
  it("uses only the supplied tree to resolve adjacent pages", () => {
    render(
      <MemoryRouter initialEntries={["/docs/first"]}>
        <DocumentationPageNavigation
          groups={groups}
          labels={{
            labelKey: "exampleGallery.pageNavigation.label",
            nextKey: "exampleGallery.pageNavigation.next",
            previousKey: "exampleGallery.pageNavigation.previous",
          }}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", {
        name: "exampleGallery.pageNavigation.next navigation.contacts",
      }),
    ).toHaveAttribute("href", "/docs/second");
    expect(screen.queryByText("exampleGallery.pageNavigation.previous")).not.toBeInTheDocument();
  });
});
