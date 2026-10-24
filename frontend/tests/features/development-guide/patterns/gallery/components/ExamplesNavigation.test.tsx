import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { ExamplesNavigation } from "@/features/development-guide/patterns/gallery/components/ExamplesNavigation";
import type { AppExampleNavigationGroup } from "@/features/development-guide/patterns/gallery/types/ExampleNavigation";

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, options?: { category?: string }) => {
      if (key === "navigation.collapseCategory") {
        return `Collapse ${options?.category}`;
      }
      if (key === "navigation.expandCategory") {
        return `Expand ${options?.category}`;
      }
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
        to: "/dev-guide/frontend/patterns/feedback/toast-notifications",
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
        labelKey: "navigation.settings",
        to: "/dev-guide/frontend/patterns/overlays/presentations",
      },
    ],
    labelKey: "navigation.settings",
  },
] as const satisfies readonly AppExampleNavigationGroup[];

const sectionMembers = [
  {
    ...groups[0],
    defaultExpanded: false,
    id: "applicationState",
    labelKey: "navigation.home",
    section: "applicationState",
    items: [{ ...groups[0].items[0], to: "/dev-guide/frontend/patterns/state/signals" }],
  },
  {
    ...groups[0],
    defaultExpanded: false,
    id: "serverData",
    labelKey: "navigation.settings",
    section: "applicationState",
    items: [{ ...groups[0].items[0], to: "/dev-guide/frontend/patterns/state/server" }],
  },
  {
    ...groups[0],
    defaultExpanded: false,
    id: "routingAndUrlState",
    labelKey: "navigation.examples",
    section: "applicationState",
    items: [{ ...groups[0].items[0], to: "/dev-guide/frontend/patterns/state/routing" }],
  },
] as const satisfies readonly AppExampleNavigationGroup[];

function setLabelMeasurements(
  element: HTMLElement,
  { clientWidth, scrollWidth }: { clientWidth: number; scrollWidth: number },
) {
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollWidth: { configurable: true, value: scrollWidth },
  });
  element.getBoundingClientRect = vi.fn(() => ({
    bottom: 44,
    height: 20,
    left: 36,
    right: 156,
    toJSON: () => ({}),
    top: 24,
    width: clientWidth,
    x: 36,
    y: 24,
  }));
}

describe("ExamplesNavigation", () => {
  it("labels only contiguous section members without adding a section toggle", () => {
    render(
      <MemoryRouter>
        <ExamplesNavigation groups={[groups[0], ...sectionMembers, groups[1]]} />
      </MemoryRouter>,
    );
    const section = screen.getByRole("group", {
      name: "navigation.stateCategory",
    });
    expect(
      within(section)
        .getAllByRole("button")
        .map(button => button.getAttribute("aria-label")),
    ).toEqual(["Expand navigation.home", "Expand navigation.settings", "Expand navigation.examples"]);
    expect(screen.getAllByRole("button")).toHaveLength(5);
    const caption = within(section).getByText("navigation.stateCategory");
    expect(caption.closest("button, a")).toBeNull();
    expect(caption).not.toHaveAttribute("tabindex");
    expect(section).not.toHaveAttribute("tabindex");
    expect(section).not.toHaveAttribute("aria-expanded");
    expect(within(section).queryByRole("link", { name: "navigation.home" })).not.toBeInTheDocument();
  });

  it("keeps section category toggles independent and opens the active member", async () => {
    render(
      <MemoryRouter initialEntries={["/dev-guide/frontend/patterns/state/server"]}>
        <ExamplesNavigation groups={sectionMembers} />
      </MemoryRouter>,
    );
    const section = within(screen.getByRole("group", { name: "navigation.stateCategory" }));
    const active = section.getByRole("link", { name: "navigation.home" });
    expect(active).toHaveAttribute("href", "/dev-guide/frontend/patterns/state/server");
    expect(active).toHaveClass("Mui-selected");
    fireEvent.click(section.getByRole("button", { name: "Expand navigation.home" }));
    expect(section.getAllByRole("link")).toHaveLength(2);
    expect(section.getByRole("button", { name: "Collapse navigation.settings" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    fireEvent.click(section.getByRole("button", { name: "Collapse navigation.home" }));
    await waitFor(() => expect(section.getAllByRole("link")).toHaveLength(1));
    expect(active).toBeVisible();
  });

  it("retains available nonempty members in order and omits an empty section", () => {
    const view = render(
      <MemoryRouter>
        <ExamplesNavigation
          groups={[sectionMembers[0], { ...sectionMembers[1], items: [] }, sectionMembers[2], groups[1]]}
        />
      </MemoryRouter>,
    );
    const section = screen.getByRole("group", {
      name: "navigation.stateCategory",
    });
    expect(
      within(section)
        .getAllByRole("button")
        .map(button => button.getAttribute("aria-label")),
    ).toEqual(["Expand navigation.home", "Expand navigation.examples"]);

    view.rerender(
      <MemoryRouter>
        <ExamplesNavigation groups={[{ ...sectionMembers[1], items: [] }, groups[1]]} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(screen.queryByText("navigation.stateCategory")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);

    view.rerender(
      <MemoryRouter>
        <ExamplesNavigation groups={[groups[1]]} />
      </MemoryRouter>,
    );
    expect(screen.queryByText("navigation.stateCategory")).not.toBeInTheDocument();
  });

  it("does not group across an intervening available category", () => {
    render(
      <MemoryRouter>
        <ExamplesNavigation groups={[sectionMembers[0], groups[0], sectionMembers[2]]} />
      </MemoryRouter>,
    );
    const sections = screen.getAllByRole("group", {
      name: "navigation.stateCategory",
    });
    expect(sections).toHaveLength(2);
    expect(within(sections[0]!).getAllByRole("button")).toHaveLength(1);
    expect(within(sections[1]!).getAllByRole("button")).toHaveLength(1);
    expect(screen.getAllByRole("button").map(button => button.getAttribute("aria-label"))).toEqual([
      "Expand navigation.home",
      "Collapse navigation.examples",
      "Expand navigation.examples",
    ]);
  });

  it("uses each category default and toggles its children independently", async () => {
    render(
      <MemoryRouter>
        <ExamplesNavigation groups={groups} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "navigation.home" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "navigation.settings" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation.examples" }));
    await waitFor(() => expect(screen.queryByRole("link", { name: "navigation.home" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Expand navigation.settings" }));
    expect(
      await screen.findByRole("link", {
        name: "navigation.settings",
      }),
    ).toBeVisible();
  });

  it("opens the current route category even when its default is collapsed", () => {
    render(
      <MemoryRouter initialEntries={["/dev-guide/frontend/patterns/overlays/presentations"]}>
        <ExamplesNavigation
          groups={groups.map(group => ({
            ...group,
            defaultExpanded: false,
          }))}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "navigation.settings" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Collapse navigation.settings" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("matches a dynamic active path independently from its concrete destination", () => {
    const dynamicGroups = [
      {
        defaultExpanded: false,
        id: "feedback",
        items: [
          {
            activePath: "/dev-guide/frontend/patterns/projects/:projectId",
            Icon: HomeOutlinedIcon,
            kind: "link",
            labelKey: "navigation.home",
            to: "/dev-guide/frontend/patterns/projects/atlas",
          },
        ],
        labelKey: "navigation.examples",
      },
    ] as const satisfies readonly AppExampleNavigationGroup[];

    render(
      <MemoryRouter initialEntries={["/dev-guide/frontend/patterns/projects/harbor"]}>
        <ExamplesNavigation groups={dynamicGroups} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "navigation.home" })).toHaveClass("Mui-selected");
    expect(screen.getByRole("button", { name: "Collapse navigation.examples" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("reveals only truncated labels on pointer hover and keyboard focus", () => {
    render(
      <MemoryRouter>
        <ExamplesNavigation groups={groups} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "navigation.home" });
    const label = link.querySelector<HTMLElement>("[data-examples-navigation-label]");
    expect(label).not.toBeNull();

    setLabelMeasurements(label!, { clientWidth: 120, scrollWidth: 120 });
    fireEvent.pointerEnter(link);
    expect(document.querySelector("[data-examples-navigation-label-reveal]")).not.toBeInTheDocument();

    setLabelMeasurements(label!, { clientWidth: 120, scrollWidth: 240 });
    fireEvent.focus(link);
    expect(document.querySelector("[data-examples-navigation-label-reveal]")).toHaveTextContent("navigation.home");
  });

  it("inherits a truncated label color and weight from the active theme", () => {
    render(
      <MemoryRouter initialEntries={["/dev-guide/frontend/patterns/feedback/toast-notifications"]}>
        <ExamplesNavigation groups={groups} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "navigation.home" });
    const label = link.querySelector<HTMLElement>("[data-examples-navigation-label]");
    expect(label).not.toBeNull();
    setLabelMeasurements(label!, { clientWidth: 120, scrollWidth: 240 });
    const computedStyle = vi.spyOn(window, "getComputedStyle").mockReturnValueOnce({
      color: "rgb(244, 247, 249)",
      fontWeight: "700",
    } as CSSStyleDeclaration);

    fireEvent.pointerEnter(link);
    computedStyle.mockRestore();

    expect(document.querySelector("[data-examples-navigation-label-reveal]")).toHaveStyle({
      color: "rgb(244, 247, 249)",
      fontWeight: "700",
    });
  });

  it("closes a truncated link reveal after it navigates to the selected item", async () => {
    render(
      <MemoryRouter>
        <ExamplesNavigation groups={groups} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "navigation.home" });
    const label = link.querySelector<HTMLElement>("[data-examples-navigation-label]");
    expect(label).not.toBeNull();
    setLabelMeasurements(label!, { clientWidth: 120, scrollWidth: 240 });

    fireEvent.pointerEnter(link);
    const reveal = document.querySelector<HTMLElement>("[data-examples-navigation-label-reveal]");
    expect(reveal).toHaveTextContent("navigation.home");

    fireEvent.click(reveal!);

    await waitFor(() => expect(link).toHaveClass("Mui-selected"));
    fireEvent.pointerEnter(link);
    expect(document.querySelector("[data-examples-navigation-label-reveal]")).not.toBeInTheDocument();
  });

  it("keeps a truncated category reveal actionable", async () => {
    render(
      <MemoryRouter>
        <ExamplesNavigation groups={groups} />
      </MemoryRouter>,
    );

    const category = screen.getByRole("button", {
      name: "Collapse navigation.examples",
    });
    const label = category.querySelector<HTMLElement>("[data-examples-navigation-label]");
    expect(label).not.toBeNull();
    setLabelMeasurements(label!, { clientWidth: 80, scrollWidth: 160 });

    fireEvent.pointerEnter(category);
    const reveal = document.querySelector<HTMLElement>("[data-examples-navigation-label-reveal]");
    expect(reveal).toHaveTextContent("navigation.examples");

    fireEvent.click(reveal!);
    await waitFor(() => expect(screen.queryByRole("link", { name: "navigation.home" })).not.toBeInTheDocument());
  });
});
