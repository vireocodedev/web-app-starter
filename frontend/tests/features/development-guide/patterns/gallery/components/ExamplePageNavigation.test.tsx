import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { ExamplePageNavigation } from "@/features/development-guide/patterns/gallery";
import type { AppExampleNavigationGroup } from "@/app/router/types/AppRoute";

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string) => {
      if (key === "exampleGallery.pageNavigation.label") {
        return "Pattern page navigation";
      }
      if (key === "exampleGallery.pageNavigation.next") return "Next";
      if (key === "exampleGallery.pageNavigation.previous") return "Previous";
      return key;
    },
  }),
}));

const groups = [
  {
    defaultExpanded: true,
    id: "feedback",
    items: [
      {
        Icon: HomeOutlinedIcon,
        kind: "link",
        labelKey: "navigation.home",
        labelNamespace: "development-guide",
        to: "/dev-guide/patterns/first",
      },
      {
        Icon: HomeOutlinedIcon,
        kind: "link",
        labelKey: "navigation.settings",
        labelNamespace: "development-guide",
        to: "/dev-guide/patterns/second",
      },
    ],
    labelKey: "navigation.examples",
  },
  {
    defaultExpanded: false,
    id: "overlays",
    items: [
      {
        Icon: HomeOutlinedIcon,
        kind: "link",
        labelKey: "navigation.notFound",
        labelNamespace: "development-guide",
        to: "/dev-guide/patterns/third",
      },
    ],
    labelKey: "navigation.settings",
  },
] as const satisfies readonly AppExampleNavigationGroup[];

function renderNavigation(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <ExamplePageNavigation groups={groups} />
    </MemoryRouter>,
  );
}

describe("ExamplePageNavigation", () => {
  it("links both neighbors and crosses category boundaries in tree order", () => {
    renderNavigation("/dev-guide/patterns/second");

    expect(screen.getByRole("navigation", { name: "Pattern page navigation" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Previous navigation.home" })).toHaveAttribute(
      "href",
      "/dev-guide/patterns/first",
    );
    expect(screen.getByRole("link", { name: "Next navigation.notFound" })).toHaveAttribute(
      "href",
      "/dev-guide/patterns/third",
    );
  });

  it("renders only the available direction at the ends", () => {
    const first = renderNavigation("/dev-guide/patterns/first");

    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next navigation.settings" })).toBeVisible();

    first.unmount();
    renderNavigation("/dev-guide/patterns/third");

    expect(screen.getByRole("link", { name: "Previous navigation.settings" })).toBeVisible();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("matches dynamic active paths and hides itself outside the example tree", () => {
    const dynamicGroups = [
      {
        defaultExpanded: true,
        id: "feedback",
        items: [
          {
            activePath: "/dev-guide/patterns/projects/:projectId",
            Icon: HomeOutlinedIcon,
            kind: "link",
            labelKey: "navigation.home",
            labelNamespace: "development-guide",
            to: "/dev-guide/patterns/projects/atlas",
          },
          {
            Icon: HomeOutlinedIcon,
            kind: "link",
            labelKey: "navigation.settings",
            labelNamespace: "development-guide",
            to: "/dev-guide/patterns/settings",
          },
        ],
        labelKey: "navigation.examples",
      },
    ] as const satisfies readonly AppExampleNavigationGroup[];

    const dynamic = render(
      <MemoryRouter initialEntries={["/dev-guide/patterns/projects/harbor"]}>
        <ExamplePageNavigation groups={dynamicGroups} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Next navigation.settings" })).toBeVisible();

    dynamic.unmount();
    renderNavigation("/dev-guide/patterns/not-registered");

    expect(screen.queryByRole("navigation", { name: "Pattern page navigation" })).not.toBeInTheDocument();
  });
});
