import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RgoFormGroup } from "@rgo-web/frontend";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContactsReferenceProvider } from "../../../../docs/storybook/examples/Contacts/hooks/ContactsReferenceProvider";
import { ContactConflictError, type ContactApi } from "../../../../docs/storybook/examples/Contacts/api/contact.api";
import { createContactMutation } from "../../../../docs/storybook/examples/Contacts/api/contact.mutation";
import { createContactQuery } from "../../../../docs/storybook/examples/Contacts/api/contact.query";
import { ContactForm } from "../../../../docs/storybook/examples/Contacts/components/ContactForm";
import { ContactsSidePanel } from "../../../../docs/storybook/examples/Contacts/components/ContactsSidePanel";
import type { Contact, ContactFormValue } from "../../../../docs/storybook/examples/Contacts/models/Contact";
import { buildDefaultContactFilters } from "../../../../docs/storybook/examples/Contacts/models/ContactFilters";
import type { ContactsFeature } from "../../../../docs/storybook/examples/Contacts/contacts.feature";

const feedback = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@rgo-web/frontend", async importOriginal => ({
  ...(await importOriginal<typeof import("@rgo-web/frontend")>()),
  RgoOverlayFrame: ({ children }: { children: React.ReactNode }) => children,
  useRgoFeedback: () => feedback,
}));

const labels: Record<string, string> = {
  "contacts.fields.email": "Email",
  "contacts.fields.name": "Name",
  "contacts.fields.organization": "Organization",
  "contacts.fields.role": "Role",
  "contacts.fields.status": "Status",
  "contacts.form.createAction": "Create contact",
  "contacts.form.updateAction": "Save changes",
  "contacts.save.conflict": "This contact changed while you were editing. Reopen it to apply your changes.",
  "contacts.save.created": "Contact created.",
  "contacts.save.failed": "Contact could not be saved.",
  "contacts.save.updated": "Contact updated.",
  "contacts.status.ACTIVE": "Active",
  "contacts.status.INACTIVE": "Inactive",
  "contacts.validation.emailInvalid": "Enter a valid email address.",
  "contacts.validation.emailRequired": "Email is required.",
  "contacts.validation.nameRequired": "Name is required.",
  "contacts.validation.organizationRequired": "Organization is required.",
  "contacts.validation.roleRequired": "Role is required.",
};

vi.mock("../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      (labels[key] ?? key).replace(/{{(\w+)}}/g, (_, name: string) => String(values?.[name] ?? "")),
  }),
}));

function renderForm(group: RgoFormGroup, api: ContactApi, initialValue?: Contact, onSaved = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const contactsFeature = {
    ContactMutation: createContactMutation(api, queryClient),
    ContactQuery: createContactQuery(api),
  } satisfies ContactsFeature;

  const view =
    group === RgoFormGroup.CREATE ? ({ mode: "create" } as const) : ({ mode: "edit", contact: initialValue! } as const);
  render(
    <ContactsReferenceProvider value={contactsFeature}>
      <QueryClientProvider client={queryClient}>
        <ContactsSidePanel
          editorState={{ dirty: false, submitting: false }}
          filters={buildDefaultContactFilters()}
          onBeforeClose={async () => true}
          onClearFilters={vi.fn()}
          onEditorSaved={() => {
            onSaved();
            return true;
          }}
          onEditorStateChange={vi.fn()}
          onFiltersChange={vi.fn()}
          onOpenEditor={vi.fn()}
          overlay={{ close: async () => true, complete: async () => true }}
          session={{ sessionId: 1, view }}
        />
      </QueryClientProvider>
    </ContactsReferenceProvider>,
  );
  return onSaved;
}

function createApi() {
  return {
    create: vi.fn(async contact => ({ ...contact, id: "created" })),
    findAll: vi.fn(async () => []),
    remove: vi.fn(async () => undefined),
    removeMany: vi.fn(async () => undefined),
    update: vi.fn(async ({ contact }) => contact),
    updateStatusMany: vi.fn(async () => []),
  } satisfies ContactApi;
}

describe("ContactForm", () => {
  beforeEach(() => feedback.notify.mockReset());

  it("submits validated values through a caller-provided handler", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async (value: ContactFormValue) => {
      expect(value.name).toBe("Ana");
    });
    const onSaved = vi.fn();
    render(
      <ContactForm
        group={RgoFormGroup.CREATE}
        onSaved={onSaved}
        onStateChange={vi.fn()}
        onSubmit={onSubmit}
        saveFailed={false}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Name" }), " Ana ");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "ana@example.com");
    await user.type(screen.getByRole("textbox", { name: "Organization" }), " RGO ");
    await user.type(screen.getByRole("textbox", { name: "Role" }), " Designer ");
    await user.click(screen.getByRole("button", { name: "Create contact" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      email: "ana@example.com",
      name: "Ana",
      organization: "RGO",
      role: "Designer",
      status: "ACTIVE",
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("presents localized validation before creating a contact", async () => {
    const user = userEvent.setup();
    const api = createApi();
    renderForm(RgoFormGroup.CREATE, api);

    await user.click(screen.getByRole("button", { name: "Create contact" }));

    expect(await screen.findByText("Name is required.")).toBeVisible();
    expect(screen.getByText("Email is required.")).toBeVisible();
    expect(screen.getByText("Organization is required.")).toBeVisible();
    expect(screen.getByText("Role is required.")).toBeVisible();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("trims and submits a complete create form", async () => {
    const user = userEvent.setup();
    const api = createApi();
    renderForm(RgoFormGroup.CREATE, api);

    await user.type(screen.getByRole("textbox", { name: "Name" }), " Ana ");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "ana@example.com");
    await user.type(screen.getByRole("textbox", { name: "Organization" }), " RGO ");
    await user.type(screen.getByRole("textbox", { name: "Role" }), " Designer ");
    await user.click(screen.getByRole("button", { name: "Create contact" }));

    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
    expect(api.create).toHaveBeenCalledWith({
      email: "ana@example.com",
      name: "Ana",
      organization: "RGO",
      role: "Designer",
      status: "ACTIVE",
    });
    expect(feedback.notify).toHaveBeenCalledWith(expect.objectContaining({ severity: "success" }));
  });

  it("preserves a rejected edit for retry and calls onSaved only after success", async () => {
    const user = userEvent.setup();
    const api = createApi();
    api.update.mockRejectedValueOnce(new Error("write failed"));
    const onSaved = renderForm(RgoFormGroup.UPDATE, api, {
      email: "ana@example.com",
      id: "ana",
      name: "Ana",
      organization: "RGO",
      role: "Designer",
      status: "ACTIVE",
    });

    const role = screen.getByRole("textbox", { name: "Role" });
    await user.clear(role);
    await user.type(role, "Product lead");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Contact could not be saved.")).toBeVisible();
    expect(role).toHaveValue("Product lead");
    expect(onSaved).not.toHaveBeenCalled();
    expect(feedback.notify).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(api.update).toHaveBeenCalledTimes(2);
    expect(api.update).toHaveBeenLastCalledWith({
      contact: expect.objectContaining({ id: "ana", role: "Product lead" }),
      expected: expect.objectContaining({ id: "ana", role: "Designer" }),
    });
    expect(feedback.notify).toHaveBeenCalledWith(expect.objectContaining({ severity: "success" }));
  });

  it("keeps a stale edit visible and explains how to resolve the conflict", async () => {
    const user = userEvent.setup();
    const api = createApi();
    api.update.mockRejectedValue(new ContactConflictError("ana"));
    const onSaved = renderForm(RgoFormGroup.UPDATE, api, {
      email: "ana@example.com",
      id: "ana",
      name: "Ana",
      organization: "RGO",
      role: "Designer",
      status: "ACTIVE",
    });

    const role = screen.getByRole("textbox", { name: "Role" });
    await user.clear(role);
    await user.type(role, "Product lead");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("This contact changed while you were editing. Reopen it to apply your changes."),
    ).toBeVisible();
    expect(screen.queryByText("Contact could not be saved.")).not.toBeInTheDocument();
    expect(role).toHaveValue("Product lead");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("updates the existing contact identity", async () => {
    const user = userEvent.setup();
    const api = createApi();
    renderForm(RgoFormGroup.UPDATE, api, {
      email: "ana@example.com",
      id: "ana",
      name: "Ana",
      organization: "RGO",
      role: "Designer",
      status: "ACTIVE",
    });

    const role = screen.getByRole("textbox", { name: "Role" });
    await user.clear(role);
    await user.type(role, "Product lead");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
    expect(api.update).toHaveBeenCalledWith({
      contact: expect.objectContaining({ id: "ana", role: "Product lead" }),
      expected: expect.objectContaining({ id: "ana", role: "Designer" }),
    });
  });
});
