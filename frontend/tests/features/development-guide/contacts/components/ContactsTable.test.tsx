import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRuntimeProvider, type AppRuntimeContextValue } from "@/app/bootstrap/runtime/AppRuntimeProvider";
import { AppDisplayPreferencesProvider } from "@/app/theme/preferences/AppDisplayPreferencesProvider";
import type { ContactApi } from "@/features/development-guide/contacts/api/contact.api";
import { createContactMutation } from "@/features/development-guide/contacts/api/contact.mutation";
import { createContactQuery } from "@/features/development-guide/contacts/api/contact.query";
import { ContactsTable } from "@/features/development-guide/contacts/components/ContactsTable";
import type { ContactStatusFilter } from "@/features/development-guide/contacts/models/ContactFilters";
import type { Contact } from "@/features/development-guide/contacts/models/Contact";
import type { ContactsFeature } from "@/features/development-guide/contacts/contacts.feature";

const feedback = vi.hoisted(() => ({
  confirm: vi.fn(async (): Promise<{ status: "confirmed" | "cancelled" }> => ({ status: "confirmed" })),
  notify: vi.fn(),
}));
const overlays = vi.hoisted(() => ({ open: vi.fn() }));

vi.mock("@rgo-web/frontend", async importOriginal => {
  const original = await importOriginal<typeof import("@rgo-web/frontend")>();
  return {
    ...original,
    RgoDesktopTable: ({
      columns,
      emptyAction,
      emptyContent,
      loading,
      rowActivation,
      rows,
    }: {
      columns: readonly {
        header?: React.ReactNode;
        id: string;
        renderCell?: (context: { row: Contact }) => React.ReactNode;
      }[];
      emptyAction?: React.ReactNode;
      emptyContent: React.ReactNode;
      loading?: boolean;
      rowActivation?: {
        onActivate: (context: { row: Contact }) => void;
      };
      rows: readonly Contact[];
    }) => (
      <div role="table">
        <div>
          {columns.map(column => (
            <span key={column.id}>{column.header}</span>
          ))}
        </div>
        {!loading && rows.length === 0 ? (
          <div>
            {emptyContent}
            {emptyAction}
          </div>
        ) : null}
        {rows.map(row => (
          <div key={row.id}>
            <button onClick={() => rowActivation?.onActivate({ row })}>{row.name}</button>
            {columns.map(column => (
              <span key={column.id}>{column.renderCell?.({ row })}</span>
            ))}
          </div>
        ))}
      </div>
    ),
    useRgoFeedback: () => feedback,
    useRgoOverlays: () => overlays,
  };
});

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      key.replace(/{{(\w+)}}/g, (_, name: string) => String(values?.[name] ?? "")),
  }),
}));

const contacts: Contact[] = [
  {
    email: "ana@example.com",
    id: "ana",
    name: "Ana",
    organization: "RGO",
    role: "Designer",
    status: "ACTIVE",
  },
  {
    email: "iva@example.com",
    id: "iva",
    name: "Iva",
    organization: "Studio",
    role: "Manager",
    status: "INACTIVE",
  },
];

function createApi() {
  return {
    create: vi.fn(async contact => ({ ...contact, id: "created" })),
    findAll: vi.fn(async () => contacts),
    remove: vi.fn<ContactApi["remove"]>(async () => undefined),
    removeMany: vi.fn(async () => undefined),
    update: vi.fn(async ({ contact }: Parameters<ContactApi["update"]>[0]) => contact),
    updateStatusMany: vi.fn(async ({ ids, status }: Parameters<ContactApi["updateStatusMany"]>[0]) =>
      contacts.filter(contact => ids.includes(contact.id)).map(contact => ({ ...contact, status })),
    ),
  } satisfies ContactApi;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function selectedRows() {
  return screen.getAllByRole("checkbox", { name: "contacts.selection.select" });
}

function renderTable(
  api: ContactApi,
  query = "",
  status: ContactStatusFilter = "all",
  onOpenEditor = vi.fn(),
  onOpenDetails = vi.fn(),
  onFiltersChange = vi.fn(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const contactsFeature = {
    ContactMutation: createContactMutation(api, queryClient),
    ContactQuery: createContactQuery(api),
  } satisfies ContactsFeature;
  const runtime = {
    features: { contacts: contactsFeature },
    queryClient,
  } satisfies AppRuntimeContextValue;

  return render(
    <AppDisplayPreferencesProvider>
      <AppRuntimeProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
          <ContactsTable
            filters={{ query, status }}
            onFiltersChange={onFiltersChange}
            onOpenDetails={onOpenDetails}
            onOpenEditor={onOpenEditor}
            onOpenFilters={vi.fn()}
          />
        </QueryClientProvider>
      </AppRuntimeProvider>
    </AppDisplayPreferencesProvider>,
  );
}

describe("ContactsTable", () => {
  beforeEach(() => {
    feedback.confirm.mockReset();
    feedback.confirm.mockResolvedValue({ status: "confirmed" });
    feedback.notify.mockClear();
  });

  it.each(["", "missing"])('offers first-record creation for an empty dataset with query "%s"', async query => {
    const user = userEvent.setup();
    const api = createApi();
    api.findAll.mockResolvedValue([]);
    const onOpenEditor = vi.fn();
    renderTable(api, query, "all", onOpenEditor);

    const table = within(screen.getByRole("table"));
    await user.click(
      await table.findByRole("button", {
        name: "contacts.table.createFirst",
      }),
    );
    expect(onOpenEditor).toHaveBeenCalledExactlyOnceWith();
    expect(table.getByText("contacts.table.empty")).toBeVisible();
    expect(table.queryByText("contacts.table.noMatches")).not.toBeInTheDocument();
    expect(table.queryByRole("button", { name: "contacts.filters.clear" })).not.toBeInTheDocument();
  });

  it("offers creation and filter clearing when existing records do not match", async () => {
    const user = userEvent.setup();
    const onOpenEditor = vi.fn();
    const onFiltersChange = vi.fn();
    renderTable(createApi(), "missing", "INACTIVE", onOpenEditor, vi.fn(), onFiltersChange);

    const table = within(screen.getByRole("table"));
    expect(await table.findByText("contacts.table.noMatches")).toBeVisible();
    await user.click(table.getByRole("button", { name: "contacts.create" }));
    expect(onOpenEditor).toHaveBeenCalledExactlyOnceWith();
    expect(onFiltersChange).not.toHaveBeenCalled();
    await user.click(table.getByRole("button", { name: "contacts.filters.clear" }));
    expect(onFiltersChange).toHaveBeenCalledExactlyOnceWith({
      query: "",
      status: "all",
    });
    expect(table.queryByRole("button", { name: "contacts.table.createFirst" })).not.toBeInTheDocument();
  });

  it("applies the workspace filters before rendering rows", async () => {
    renderTable(createApi(), "studio", "INACTIVE");

    expect(await screen.findByRole("button", { name: "Iva" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Ana" })).not.toBeInTheDocument();
  });

  it("selects all filtered contacts and updates them in one mutation", async () => {
    const user = userEvent.setup();
    const api = createApi();
    renderTable(api, "ana@");

    await screen.findByRole("button", { name: "Ana" });
    await user.click(
      screen.getByRole("checkbox", {
        name: "contacts.selection.selectAll",
      }),
    );
    await user.click(screen.getByRole("button", { name: "contacts.bulk.changeStatus" }));
    await user.click(screen.getByRole("menuitem", { name: "contacts.bulk.setInactive" }));

    await waitFor(() => expect(api.updateStatusMany).toHaveBeenCalledTimes(1));
    expect(api.updateStatusMany).toHaveBeenCalledWith({ ids: ["ana"], status: "INACTIVE" });
  });

  it("keeps search available while selection actions move beside pagination", async () => {
    const user = userEvent.setup();
    renderTable(createApi());

    await screen.findByRole("button", { name: "Ana" });
    await user.click(
      screen.getByRole("checkbox", {
        name: "contacts.selection.selectAll",
      }),
    );

    expect(screen.getByRole("textbox", { name: "contacts.filters.search" })).toBeVisible();
    expect(screen.getByRole("toolbar", { name: "contacts.bulk.actions" })).toBeVisible();
    expect(screen.getByRole("button", { name: "contacts.create" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "contacts.details.open" })[0]).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "contacts.actions.edit" })[0]).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "contacts.actions.delete" })[0]).toBeEnabled();
  });

  it("uses the same editor action for creating and updating contacts", async () => {
    const user = userEvent.setup();
    const onOpenEditor = vi.fn();
    renderTable(createApi(), "", "all", onOpenEditor);

    await screen.findByRole("button", { name: "Ana" });
    await user.click(screen.getByRole("button", { name: "contacts.create" }));
    expect(onOpenEditor).toHaveBeenLastCalledWith();

    await user.click(screen.getAllByRole("button", { name: "contacts.actions.edit" })[0]!);
    expect(onOpenEditor).toHaveBeenLastCalledWith(contacts[0]);
  });

  it("opens details only from the dedicated row action", async () => {
    const user = userEvent.setup();
    const onOpenDetails = vi.fn();
    renderTable(createApi(), "", "all", vi.fn(), onOpenDetails);

    await user.click(await screen.findByRole("button", { name: "Ana" }));
    expect(onOpenDetails).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole("button", { name: "contacts.details.open" })[0]!);
    expect(onOpenDetails).toHaveBeenCalledWith(contacts[0]);
  });

  it.each(["update", "delete"] as const)(
    "preserves later selections when a deferred bulk %s succeeds",
    async operation => {
      const user = userEvent.setup();
      const api = createApi();
      const pendingUpdate = deferred<Contact[]>();
      const pendingDelete = deferred<undefined>();
      api.updateStatusMany.mockImplementation(() => pendingUpdate.promise);
      api.removeMany.mockImplementation(() => pendingDelete.promise);
      renderTable(api);

      await screen.findByRole("button", { name: "Ana" });
      await user.click(selectedRows()[0]!);
      if (operation === "update") {
        await user.click(screen.getByRole("button", { name: "contacts.bulk.changeStatus" }));
        await user.click(screen.getByRole("menuitem", { name: "contacts.bulk.setInactive" }));
        expect(api.updateStatusMany).toHaveBeenCalledWith({ ids: ["ana"], status: "INACTIVE" });
      } else {
        await user.click(screen.getByRole("button", { name: "contacts.bulk.delete.action" }));
        await waitFor(() => expect(api.removeMany).toHaveBeenCalledWith(["ana"]));
      }

      await user.click(selectedRows()[1]!);
      expect(selectedRows()[0]).toBeChecked();
      expect(selectedRows()[1]).toBeChecked();
      await act(async () => {
        if (operation === "update") pendingUpdate.resolve([{ ...contacts[0]!, status: "INACTIVE" }]);
        else pendingDelete.resolve(undefined);
      });

      await waitFor(() => expect(selectedRows()[0]).not.toBeChecked());
      expect(selectedRows()[1]).toBeChecked();
    },
  );

  it.each(["update", "delete"] as const)(
    "keeps submitted and later selections when a deferred bulk %s fails",
    async operation => {
      const user = userEvent.setup();
      const api = createApi();
      const pendingUpdate = deferred<Contact[]>();
      const pendingDelete = deferred<undefined>();
      api.updateStatusMany.mockImplementation(() => pendingUpdate.promise);
      api.removeMany.mockImplementation(() => pendingDelete.promise);
      renderTable(api);

      await screen.findByRole("button", { name: "Ana" });
      await user.click(selectedRows()[0]!);
      if (operation === "update") {
        await user.click(screen.getByRole("button", { name: "contacts.bulk.changeStatus" }));
        await user.click(screen.getByRole("menuitem", { name: "contacts.bulk.setInactive" }));
        await waitFor(() => expect(api.updateStatusMany).toHaveBeenCalledTimes(1));
      } else {
        await user.click(screen.getByRole("button", { name: "contacts.bulk.delete.action" }));
        await waitFor(() => expect(api.removeMany).toHaveBeenCalledTimes(1));
      }
      await user.click(selectedRows()[1]!);
      await act(async () => {
        if (operation === "update") pendingUpdate.reject(new Error("write failed"));
        else pendingDelete.reject(new Error("write failed"));
      });

      await waitFor(() =>
        expect(feedback.notify).toHaveBeenCalledWith(
          expect.objectContaining({
            id: operation === "update" ? "contacts-bulk-inactive-failed" : "contacts-bulk-delete-failed",
          }),
        ),
      );
      expect(selectedRows()[0]).toBeChecked();
      expect(selectedRows()[1]).toBeChecked();
    },
  );

  it("cancels bulk deletion before the write and preserves selection", async () => {
    const user = userEvent.setup();
    const api = createApi();
    feedback.confirm.mockResolvedValueOnce({ status: "cancelled" });
    renderTable(api);

    await screen.findByRole("button", { name: "Ana" });
    await user.click(selectedRows()[0]!);
    await user.click(screen.getByRole("button", { name: "contacts.bulk.delete.action" }));

    expect(feedback.confirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
    expect(api.removeMany).not.toHaveBeenCalled();
    expect(selectedRows()[0]).toBeChecked();
  });

  it("confirms single deletion and reports its failure without clearing selection", async () => {
    const user = userEvent.setup();
    const api = createApi();
    api.remove.mockRejectedValueOnce(new Error("write failed"));
    renderTable(api);

    await screen.findByRole("button", { name: "Ana" });
    await user.click(selectedRows()[0]!);
    await user.click(screen.getAllByRole("button", { name: "contacts.actions.delete" })[0]!);

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("ana"));
    expect(feedback.confirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
    await waitFor(() =>
      expect(feedback.notify).toHaveBeenCalledWith(expect.objectContaining({ id: "contact-ana-delete-failed" })),
    );
    expect(selectedRows()[0]).toBeChecked();
  });

  it("keeps every overlapping row deletion pending until its own write settles", async () => {
    const user = userEvent.setup();
    const api = createApi();
    const anaRemoval = deferred<undefined>();
    const ivaRemoval = deferred<undefined>();
    api.remove.mockImplementation((id: string) => (id === "ana" ? anaRemoval.promise : ivaRemoval.promise));
    renderTable(api);

    await screen.findByRole("button", { name: "Ana" });
    const deleteButtons = () => screen.getAllByRole("button", { name: "contacts.actions.delete" });
    await user.click(deleteButtons()[0]!);
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("ana"));
    await user.click(deleteButtons()[1]!);
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("iva"));
    expect(deleteButtons()[0]).toBeDisabled();
    expect(deleteButtons()[1]).toBeDisabled();

    await act(async () => ivaRemoval.resolve(undefined));
    await waitFor(() => expect(deleteButtons()[1]).toBeEnabled());
    expect(deleteButtons()[0]).toBeDisabled();
    await act(async () => anaRemoval.resolve(undefined));
    await waitFor(() => expect(deleteButtons()[0]).toBeEnabled());
  });

  it("cancels single deletion before the write and preserves selection", async () => {
    const user = userEvent.setup();
    const api = createApi();
    feedback.confirm.mockResolvedValueOnce({ status: "cancelled" });
    renderTable(api);

    await screen.findByRole("button", { name: "Ana" });
    await user.click(selectedRows()[0]!);
    await user.click(screen.getAllByRole("button", { name: "contacts.actions.delete" })[0]!);

    expect(feedback.confirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
    expect(api.remove).not.toHaveBeenCalled();
    expect(selectedRows()[0]).toBeChecked();
  });

  it("removes a confirmed single deletion from selection and reports success", async () => {
    const user = userEvent.setup();
    const api = createApi();
    renderTable(api);

    await screen.findByRole("button", { name: "Ana" });
    await user.click(selectedRows()[0]!);
    await user.click(screen.getAllByRole("button", { name: "contacts.actions.delete" })[0]!);

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("ana"));
    expect(feedback.confirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
    await waitFor(() =>
      expect(feedback.notify).toHaveBeenCalledWith(expect.objectContaining({ id: "contact-ana-deleted" })),
    );
    expect(selectedRows()[0]).not.toBeChecked();
  });
});
