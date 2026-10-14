import { act, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRuntimeProvider, type AppRuntimeContextValue } from "@/app/bootstrap/runtime/AppRuntimeProvider";
import { applicationTheme } from "@/app/theme/config/theme";
import type { ContactApi } from "@/features/development-guide/contacts/api/contact.api";
import { createContactMutation } from "@/features/development-guide/contacts/api/contact.mutation";
import { createContactQuery } from "@/features/development-guide/contacts/api/contact.query";
import { ContactsFeature } from "@/features/development-guide/contacts/components/ContactsFeature";
import {
  ContactsSidePanel,
  type ContactsSidePanelProps,
} from "@/features/development-guide/contacts/components/ContactsSidePanel";
import type { ContactsFeature as ContactsRuntimeFeature } from "@/features/development-guide/contacts/contacts.feature";
import type { Contact } from "@/features/development-guide/contacts/models/Contact";

const mocks = vi.hoisted(() => ({ complete: vi.fn(), confirm: vi.fn(), notify: vi.fn(), open: vi.fn() }));

vi.mock("@rgo-web/frontend", async importOriginal => ({
  ...(await importOriginal<typeof import("@rgo-web/frontend")>()),
  RgoOverlayFrame: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <section aria-label={title}>{children}</section>
  ),
  RgoOverlayProvider: ({ children }: { children: React.ReactNode }) => children,
  useRgoFeedback: () => mocks,
  useRgoOverlays: () => ({ open: mocks.open }),
}));

vi.mock("@/app/localization/hooks/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/app/theme/preferences/useAppDisplayPreferences", () => ({
  useAppDisplayPreferences: () => ({ editorPresentation: "docked-panel" }),
}));

const ana: Contact = {
  email: "ana@example.com",
  id: "ana",
  name: "Ana",
  organization: "RGO",
  role: "Designer",
  status: "ACTIVE",
};
const iva: Contact = {
  email: "iva@example.com",
  id: "iva",
  name: "Iva",
  organization: "Studio",
  role: "Manager",
  status: "INACTIVE",
};

vi.mock("@/features/development-guide/contacts/components/ContactsTable", () => ({
  ContactsTable: ({
    onOpenEditor,
    onOpenFilters,
  }: {
    onOpenEditor: (contact: Contact) => void;
    onOpenFilters: () => void;
  }) => (
    <>
      <button onClick={() => onOpenEditor(ana)}>Edit Ana</button>
      <button onClick={() => onOpenEditor(iva)}>Edit Iva</button>
      <button onClick={onOpenFilters}>Filters</button>
    </>
  ),
}));

describe("Contacts workspace editor transitions", () => {
  let panelProps: ContactsSidePanelProps;
  let updateProps: ReturnType<typeof vi.fn>;

  function renderWorkspace() {
    return render(
      <ThemeProvider theme={applicationTheme}>
        <ContactsFeature />
      </ThemeProvider>,
    );
  }

  beforeEach(() => {
    mocks.confirm.mockReset();
    mocks.notify.mockReset();
    mocks.open.mockReset();
    updateProps = vi.fn(patch => {
      panelProps = { ...panelProps, ...patch };
    });
    mocks.open.mockImplementation((_component, props: ContactsSidePanelProps) => {
      panelProps = props;
      return { updateProps, result: new Promise(() => undefined) };
    });
  });

  it("asks before replacing a dirty editor with another contact or filters", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await user.click(screen.getByRole("button", { name: "Edit Ana" }));
    const sessionId = panelProps.session.view.mode === "edit" ? panelProps.session.sessionId : -1;
    act(() => panelProps.onEditorStateChange(sessionId, { dirty: true, submitting: false }));

    mocks.confirm.mockResolvedValueOnce({ status: "cancelled" });
    await user.click(screen.getByRole("button", { name: "Edit Iva" }));
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledTimes(1));
    expect(panelProps.session).toMatchObject({ sessionId, view: { mode: "edit", contact: ana } });

    mocks.confirm.mockResolvedValueOnce({ status: "confirmed" });
    await user.click(screen.getByRole("button", { name: "Filters" }));
    await waitFor(() => expect(panelProps.session.view.mode).toBe("filters"));
    expect(mocks.confirm).toHaveBeenCalledTimes(2);
  });

  it("applies the dirty decision to close and rejects switches during submission", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await user.click(screen.getByRole("button", { name: "Edit Ana" }));
    const sessionId = panelProps.session.view.mode === "edit" ? panelProps.session.sessionId : -1;
    act(() => panelProps.onEditorStateChange(sessionId, { dirty: true, submitting: false }));

    mocks.confirm.mockResolvedValueOnce({ status: "cancelled" });
    await expect(panelProps.onBeforeClose({ reason: "dismissed", signal: new AbortController().signal })).resolves.toBe(
      false,
    );
    expect(panelProps.session.view.mode).toBe("edit");

    act(() => panelProps.onEditorStateChange(sessionId, { dirty: true, submitting: true }));
    await user.click(screen.getByRole("button", { name: "Edit Iva" }));
    await user.click(screen.getByRole("button", { name: "Filters" }));
    expect(panelProps.session).toMatchObject({ sessionId, view: { mode: "edit" } });
    await expect(panelProps.onBeforeClose({ reason: "dismissed", signal: new AbortController().signal })).resolves.toBe(
      false,
    );
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  it("keeps the real form session mounted while its save is pending", async () => {
    const user = userEvent.setup();
    let resolveSave!: (contact: Contact) => void;
    const api: ContactApi = {
      create: vi.fn(async contact => ({ ...contact, id: "created" })),
      findAll: vi.fn(async () => [ana, iva]),
      remove: vi.fn(async () => undefined),
      removeMany: vi.fn(async () => undefined),
      update: vi.fn(
        () =>
          new Promise<Contact>(resolve => {
            resolveSave = resolve;
          }),
      ),
      updateStatusMany: vi.fn(async () => []),
    };
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const contactsFeature = {
      ContactMutation: createContactMutation(api, queryClient),
      ContactQuery: createContactQuery(api),
    } satisfies ContactsRuntimeFeature;
    const runtime = { features: { contacts: contactsFeature }, queryClient } satisfies AppRuntimeContextValue;
    type PanelInput = Omit<ContactsSidePanelProps, "overlay">;
    let activePanelProps: PanelInput | null = null;
    function currentPanelProps(): PanelInput {
      const props = activePanelProps as PanelInput | null;
      if (!props) throw new Error("Expected an open Contacts panel");
      return props;
    }
    let settleResult!: (result: { status: "completed"; value: void }) => void;
    mocks.complete.mockReset();

    function IntegratedWorkspace() {
      const [panel, setPanel] = useState<PanelInput | null>(null);
      useEffect(() => {
        mocks.open.mockImplementation((_component, props: PanelInput) => {
          activePanelProps = props;
          const result = new Promise<{ status: "completed"; value: void }>(resolve => {
            settleResult = resolve;
          });
          setPanel(props);
          return {
            result,
            updateProps: (patch: Partial<PanelInput>) => {
              setPanel(current => {
                if (!current) return current;
                activePanelProps = { ...current, ...patch };
                return activePanelProps;
              });
            },
          };
        });
      }, []);
      return (
        <>
          <ContactsFeature />
          {panel ? (
            <ContactsSidePanel
              {...panel}
              overlay={{
                close: async () => false,
                complete: async () => {
                  mocks.complete();
                  setPanel(null);
                  settleResult({ status: "completed", value: undefined });
                  return true;
                },
              }}
            />
          ) : null}
        </>
      );
    }

    render(
      <ThemeProvider theme={applicationTheme}>
        <AppRuntimeProvider runtime={runtime}>
          <QueryClientProvider client={queryClient}>
            <IntegratedWorkspace />
          </QueryClientProvider>
        </AppRuntimeProvider>
      </ThemeProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Edit Ana" }));
    const oldSession = currentPanelProps().session.sessionId;
    await user.clear(screen.getByRole("textbox", { name: "contacts.fields.role" }));
    await user.type(screen.getByRole("textbox", { name: "contacts.fields.role" }), "Lead");
    await user.click(screen.getByRole("button", { name: "contacts.form.updateAction" }));
    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("button", { name: "Edit Iva" }));
    expect(screen.getByRole("textbox", { name: "contacts.fields.name" })).toHaveValue("Ana");
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();

    await act(async () => resolveSave({ ...ana, role: "Lead" }));
    await waitFor(() => expect(mocks.complete).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("button", { name: "Edit Iva" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "contacts.fields.name" })).toHaveValue("Iva"));
    expect(currentPanelProps().onEditorSaved(oldSession)).toBe(false);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "contacts.fields.name" })).toHaveValue("Iva");
  });

  it("does not accept a save completion from a replaced editor", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await user.click(screen.getByRole("button", { name: "Edit Ana" }));
    const oldSession = panelProps.session.view.mode === "edit" ? panelProps.session.sessionId : -1;
    act(() => panelProps.onEditorStateChange(oldSession, { dirty: true, submitting: false }));
    mocks.confirm.mockResolvedValueOnce({ status: "confirmed" });
    await user.click(screen.getByRole("button", { name: "Edit Iva" }));
    await waitFor(() => expect(panelProps.session.view).toMatchObject({ mode: "edit", contact: iva }));
    expect(panelProps.onEditorSaved(oldSession)).toBe(false);
    expect(panelProps.session.sessionId).not.toBe(oldSession);
  });
});
