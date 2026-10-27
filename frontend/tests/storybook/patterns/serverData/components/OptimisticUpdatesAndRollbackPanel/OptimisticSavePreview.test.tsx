import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExampleGallery } from "../../../../../../docs/storybook/patterns/shared/gallery";
import { OptimisticSavePreview } from "../../../../../../docs/storybook/patterns/ServerData/components/OptimisticUpdatesAndRollbackPanel/OptimisticSavePreview";
import type {
  OptimisticExampleApi,
  OptimisticRecord,
} from "../../../../../../docs/storybook/patterns/ServerData/api/optimisticUpdates.api";

vi.mock("../../../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => (values ? `${key} ${Object.values(values).join(" ")}` : key),
  }),
}));

function renderGallery(api?: OptimisticExampleApi) {
  return render(
    <ExampleGallery
      resources={{
        codeLabels: { hide: "Hide", show: "Show", language: "tsx" },
        contents: { label: "Contents", title: "Examples" },
        examples: ["First", "Sibling"].map(title => ({
          id: title.toLowerCase(),
          title,
          description: title,
          code: "<OptimisticSavePreview />",
          sourcePath:
            "docs/storybook/patterns/ServerData/components/OptimisticUpdatesAndRollbackPanel/OptimisticSavePreview.tsx",
          preview: <OptimisticSavePreview api={api} />,
        })),
      }}
    />,
  );
}

describe("OptimisticSavePreview", () => {
  it("shows rollback and allows a successful retry without changing its sibling", async () => {
    renderGallery();
    const first = within(document.getElementById("first")!);
    const sibling = within(document.getElementById("sibling")!);
    const save = await first.findByRole("button", {
      name: "serverDataExamples.optimistic.save",
    });
    fireEvent.click(first.getByRole("checkbox"));
    fireEvent.click(save);
    expect(
      await first.findByText("serverDataExamples.optimistic.detail serverDataExamples.optimistic.status.paused"),
    ).toBeVisible();
    expect(
      first.getByRole("button", {
        name: "serverDataExamples.optimistic.saving",
      }),
    ).toBeDisabled();
    expect(await first.findByText("serverDataExamples.optimistic.failed")).toBeVisible();
    expect(
      first.getByText("serverDataExamples.optimistic.detail serverDataExamples.optimistic.status.active"),
    ).toBeVisible();
    fireEvent.click(first.getByRole("checkbox"));
    fireEvent.click(first.getByRole("button", { name: "serverDataExamples.optimistic.save" }));
    expect(await first.findByText("serverDataExamples.optimistic.saved")).toBeVisible();
    expect(first.getByText("serverDataExamples.optimistic.revision 2")).toBeVisible();
    expect(
      sibling.getByText("serverDataExamples.optimistic.detail serverDataExamples.optimistic.status.active"),
    ).toBeVisible();
    expect(sibling.getByText("serverDataExamples.optimistic.revision 1")).toBeVisible();
  });

  it("rejects duplicate clicks and isolates a pending completion from a reloaded preview", async () => {
    const initial: OptimisticRecord = {
      id: "atlas",
      name: "Atlas",
      status: "active",
      revision: 1,
    };
    let finish!: (value: OptimisticRecord) => void;
    const api: OptimisticExampleApi = {
      list: async () => [initial],
      detail: async () => initial,
      save: vi.fn(
        () =>
          new Promise<OptimisticRecord>(resolve => {
            finish = resolve;
          }),
      ),
    };
    renderGallery(api);
    const first = within(document.getElementById("first")!);
    const save = await first.findByRole("button", {
      name: "serverDataExamples.optimistic.save",
    });
    act(() => {
      fireEvent.click(save);
      fireEvent.click(save);
    });
    await waitFor(() => expect(api.save).toHaveBeenCalledOnce());
    fireEvent.click(first.getByRole("button", { name: "exampleGallery.reload" }));
    await first.findByRole("button", {
      name: "serverDataExamples.optimistic.save",
    });
    await act(async () => {
      finish({ ...initial, status: "paused", revision: 2 });
    });
    expect(
      first.getByText("serverDataExamples.optimistic.detail serverDataExamples.optimistic.status.active"),
    ).toBeVisible();
    expect(first.getByText("serverDataExamples.optimistic.revision 1")).toBeVisible();
    expect(screen.queryByText("serverDataExamples.optimistic.saved")).not.toBeInTheDocument();
  });
});
