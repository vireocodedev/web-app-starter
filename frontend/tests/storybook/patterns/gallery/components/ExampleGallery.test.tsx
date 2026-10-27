import { Button, Stack, Typography } from "@mui/material";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExampleGallery, type ExampleGalleryResources } from "../../../../../docs/storybook/patterns/shared/gallery";
import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";
import { englishDevelopmentGuideTranslations as englishTranslations } from "../../../../../docs/storybook/examples/shared/localization/development-guide.en";
import { croatianDevelopmentGuideTranslations as croatianTranslations } from "../../../../../docs/storybook/examples/shared/localization/development-guide.hr";

const locale = vi.hoisted(() => ({ current: "en" }));

vi.mock("../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string) => {
      const translations = locale.current === "hr" ? croatianTranslations : englishTranslations;
      if (key === "exampleGallery.reload") return translations.exampleGallery.reload;
      const sourceKey = key.replace("exampleGallery.source.", "");
      return translations.exampleGallery.source[sourceKey as keyof typeof translations.exampleGallery.source] ?? key;
    },
  }),
}));

const mountCounts = { first: 0, second: 0 };

function StatefulPreview({ name }: Readonly<{ name: "first" | "second" }>) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    mountCounts[name] += 1;
  }, [name]);

  return (
    <Stack>
      <Typography>{`${name} count: ${count}`}</Typography>
      <Button onClick={() => setCount(value => value + 1)}>{`Increment ${name}`}</Button>
    </Stack>
  );
}

function QueryBackedPreview() {
  const queryClient = useQueryClient();
  const [, refresh] = useState(0);
  const value = queryClient.getQueryData<string>(["gallery-reload-test"]);

  return (
    <Stack>
      <Typography>{`Query value: ${value ?? "empty"}`}</Typography>
      <Button
        onClick={() => {
          queryClient.setQueryData(["gallery-reload-test"], "resolved");
          refresh(revision => revision + 1);
        }}
      >
        Resolve query
      </Button>
    </Stack>
  );
}

const resources = {
  codeLabels: {
    hide: "Hide code",
    language: "TSX",
    show: "Show code",
  },
  contents: {
    label: "Example contents",
    title: "On this page",
  },
  examples: [
    {
      code: "const first = true",
      description: "First description",
      id: "first-example",
      preview: <StatefulPreview name="first" />,
      sourcePath: "docs/storybook/patterns/First example.tsx",
      title: "First example",
    },
    {
      code: "const second = true",
      description: "Second description",
      id: "second-example",
      preview: <StatefulPreview name="second" />,
      sourcePath: "docs/storybook/patterns/Second#example.tsx",
      title: "Second example",
    },
  ],
} satisfies ExampleGalleryResources;

describe("ExampleGallery", () => {
  beforeEach(() => {
    mountCounts.first = 0;
    mountCounts.second = 0;
    locale.current = "en";
    vi.stubGlobal("location", new URL("http://localhost:5173"));
    vi.stubGlobal("__RGO_EXAMPLE_SOURCE__", {
      editorEndpoint: null,
      repositoryBaseUrl: null,
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "opens the exact example in the local editor on %s without resetting state",
    async hostname => {
      vi.stubGlobal("location", new URL(`http://${hostname}:5173`));
      vi.stubGlobal("__RGO_EXAMPLE_SOURCE__", {
        editorEndpoint: "/app/__rgo_example_source",
        repositoryBaseUrl: "https://git.example.test/team/app/src/commit/abc/",
      });
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      render(<ExampleGallery resources={resources} />);

      fireEvent.click(screen.getByRole("button", { name: "Increment first" }));
      const codeButtons = screen.getAllByRole("button", { name: "Hide code" });
      expect(codeButtons).toHaveLength(2);
      fireEvent.click(codeButtons[0]!);
      const sourceButtons = screen.getAllByRole("button", {
        name: englishTranslations.exampleGallery.source.openEditor,
      });
      const reload = screen.getAllByRole("button", {
        name: "Reload example",
      })[0]!;
      expect(sourceButtons[0]!.parentElement!.nextElementSibling).toBe(reload);

      fireEvent.click(sourceButtons[0]!);
      await waitFor(() => expect(sourceButtons[0]).toBeEnabled());
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/app/__rgo_example_source", {
        body: JSON.stringify({ path: resources.examples[0].sourcePath }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(screen.getByText("first count: 1")).toBeVisible();
      expect(screen.getAllByRole("button", { name: "Show code" })).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Hide code" })).toBeVisible();
      expect(mountCounts).toEqual({ first: 1, second: 1 });

      fireEvent.click(reload);
      expect(screen.getByText("first count: 0")).toBeVisible();
      expect(mountCounts).toEqual({ first: 2, second: 1 });
    },
  );

  it.each([
    { editorEndpoint: null, hostname: "localhost" },
    { editorEndpoint: "/__rgo_example_source", hostname: "app.example.test" },
    {
      editorEndpoint: "/__rgo_example_source",
      hostname: "localhost.example.test",
    },
  ])(
    "links to encoded repository paths for $hostname with endpoint $editorEndpoint",
    ({ editorEndpoint, hostname }) => {
      vi.stubGlobal("location", new URL(`http://${hostname}:5173`));
      vi.stubGlobal("__RGO_EXAMPLE_SOURCE__", {
        editorEndpoint,
        repositoryBaseUrl: "https://git.example.test/team/app/src/commit/abc/application/",
      });
      render(<ExampleGallery resources={resources} />);

      const links = screen.getAllByRole("link", {
        name: englishTranslations.exampleGallery.source.openRepository,
      });
      expect(links[0]).toHaveAttribute(
        "href",
        "https://git.example.test/team/app/src/commit/abc/application/docs/storybook/patterns/First%20example.tsx",
      );
      expect(links[1]).toHaveAttribute(
        "href",
        "https://git.example.test/team/app/src/commit/abc/application/docs/storybook/patterns/Second%23example.tsx",
      );
      for (const link of links) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    },
  );

  it("keeps the source control visible and explains missing repository configuration", async () => {
    render(<ExampleGallery resources={resources} />);
    const buttons = screen.getAllByRole("button", {
      name: englishTranslations.exampleGallery.source.unavailable,
    });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeDisabled();
    fireEvent.mouseOver(buttons[0]!.parentElement!);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(englishTranslations.exampleGallery.source.unavailable);
  });

  it.each(["response", "network"])(
    "reports a localized actionable editor %s failure and allows retry",
    async failure => {
      locale.current = "hr";
      vi.stubGlobal("__RGO_EXAMPLE_SOURCE__", {
        editorEndpoint: "/__rgo_example_source",
        repositoryBaseUrl: null,
      });
      const fetchMock = vi.fn();
      if (failure === "network") fetchMock.mockRejectedValueOnce(new Error("Offline"));
      else fetchMock.mockResolvedValueOnce({ ok: false });
      fetchMock.mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
      render(<ExampleGallery resources={resources} />);
      const source = screen.getAllByRole("button", {
        name: croatianTranslations.exampleGallery.source.openEditor,
      })[0]!;

      fireEvent.click(source);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        croatianTranslations.exampleGallery.source.editorError,
      );
      expect(source).toBeEnabled();
      fireEvent.click(source);
      await waitFor(() => expect(source).toBeEnabled());
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(mountCounts).toEqual({ first: 1, second: 1 });
    },
  );

  it("remounts only the selected live preview", () => {
    render(<ExampleGallery resources={resources} />);

    fireEvent.click(screen.getByRole("button", { name: "Increment first" }));
    fireEvent.click(screen.getByRole("button", { name: "Increment second" }));
    expect(screen.getByText("first count: 1")).toBeVisible();
    expect(screen.getByText("second count: 1")).toBeVisible();

    fireEvent.click(screen.getAllByRole("button", { name: "Reload example" })[0]!);

    expect(screen.getByText("first count: 0")).toBeVisible();
    expect(screen.getByText("second count: 1")).toBeVisible();
    expect(mountCounts).toEqual({ first: 2, second: 1 });
  });

  it("replaces preview-owned query state when reloading", () => {
    const queryResources = {
      ...resources,
      examples: [
        {
          ...resources.examples[0],
          preview: <QueryBackedPreview />,
        },
      ],
    } satisfies ExampleGalleryResources;

    render(
      <QueryClientProvider client={createAppQueryClient()}>
        <ExampleGallery resources={queryResources} />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Query value: empty")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Resolve query" }));
    expect(screen.getByText("Query value: resolved")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Reload example" }));

    expect(screen.getByText("Query value: empty")).toBeVisible();
  });
});
