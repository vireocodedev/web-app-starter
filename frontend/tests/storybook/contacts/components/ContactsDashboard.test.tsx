import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContactsReferenceProvider } from "../../../../docs/storybook/examples/Contacts/hooks/ContactsReferenceProvider";
import type { ContactApi } from "../../../../docs/storybook/examples/Contacts/api/contact.api";
import { createContactMutation } from "../../../../docs/storybook/examples/Contacts/api/contact.mutation";
import { createContactQuery } from "../../../../docs/storybook/examples/Contacts/api/contact.query";
import { ContactsDashboard } from "../../../../docs/storybook/examples/Contacts/components/ContactsDashboard";
import type { Contact } from "../../../../docs/storybook/examples/Contacts/models/Contact";
import type { ContactsFeature } from "../../../../docs/storybook/examples/Contacts/contacts.feature";
import { createTestQueryClient, renderApp } from "../../../renderApp";

const labels: Record<string, string> = {
  "contacts.dashboard.description": "Dashboard description",
  "contacts.dashboard.directory.description": "Directory description",
  "contacts.dashboard.directory.title": "Directory snapshot",
  "contacts.dashboard.empty.action": "Add the first contact",
  "contacts.dashboard.empty.description": "Empty directory description",
  "contacts.dashboard.empty.title": "Your contact directory is ready",
  "contacts.dashboard.eyebrow": "Workspace overview",
  "contacts.dashboard.loadFailed": "Dashboard failed to load.",
  "contacts.dashboard.loading": "Loading contact dashboard…",
  "contacts.dashboard.metrics.active": "Active contacts",
  "contacts.dashboard.metrics.inactive": "Inactive contacts",
  "contacts.dashboard.metrics.organizations": "Organizations",
  "contacts.dashboard.metrics.total": "Total contacts",
  "contacts.dashboard.open": "Open contacts",
  "contacts.dashboard.organizations.count": "{{count}} contacts",
  "contacts.dashboard.organizations.description": "Organizations description",
  "contacts.dashboard.organizations.title": "Organization breakdown",
  "contacts.dashboard.retry": "Try again",
  "contacts.dashboard.status.description": "Status description",
  "contacts.dashboard.status.title": "Status distribution",
  "contacts.dashboard.status.value": "{{count}} · {{percentage}}%",
  "contacts.dashboard.title": "Your contacts at a glance",
  "contacts.status.ACTIVE": "Active",
  "contacts.status.INACTIVE": "Inactive",
};

vi.mock("../../../../docs/storybook/examples/shared/localization/useDevelopmentGuideTranslation", () => ({
  useDevelopmentGuideTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      (labels[key] ?? key).replace(/{{(\w+)}}/g, (_, name: string) => String(values?.[name] ?? "")),
  }),
}));

const contacts: Contact[] = [
  {
    email: "ana@example.com",
    id: "ana",
    name: "Ana Horvat",
    organization: "RGO",
    role: "Designer",
    status: "ACTIVE",
  },
  {
    email: "marko@example.com",
    id: "marko",
    name: "Marko Novak",
    organization: "RGO",
    role: "Engineer",
    status: "ACTIVE",
  },
  {
    email: "iva@example.com",
    id: "iva",
    name: "Iva Kovač",
    organization: "Studio Kadar",
    role: "Operations manager",
    status: "INACTIVE",
  },
  {
    email: "lea@example.com",
    id: "lea",
    name: "Lea Babić",
    organization: "Northstar Labs",
    role: "Product manager",
    status: "ACTIVE",
  },
];

function createApi(findAll: ContactApi["findAll"]): ContactApi {
  return {
    create: vi.fn(async contact => ({ ...contact, id: "created" })),
    findAll,
    remove: vi.fn(async () => undefined),
    removeMany: vi.fn(async () => undefined),
    update: vi.fn(async ({ contact }: Parameters<ContactApi["update"]>[0]) => contact),
    updateStatusMany: vi.fn(async () => []),
  };
}

function renderDashboard(api: ContactApi) {
  const queryClient = createTestQueryClient();
  const contactsFeature = {
    ContactMutation: createContactMutation(api, queryClient),
    ContactQuery: createContactQuery(api),
  } satisfies ContactsFeature;

  return renderApp(
    <ContactsReferenceProvider value={contactsFeature}>
      <ContactsDashboard />
    </ContactsReferenceProvider>,
    { queryClient },
  );
}

describe("ContactsDashboard", () => {
  it("aggregates contact status and organizations from the contact query", async () => {
    renderDashboard(createApi(vi.fn(async () => contacts)));

    const total = await screen.findByRole("group", { name: "Total contacts" });
    expect(within(total).getByText("4")).toBeVisible();
    expect(within(screen.getByRole("group", { name: "Active contacts" })).getByText("3")).toBeVisible();
    expect(within(screen.getByRole("group", { name: "Inactive contacts" })).getByText("1")).toBeVisible();
    expect(within(screen.getByRole("group", { name: "Organizations" })).getByText("3")).toBeVisible();
    expect(screen.getByText("2 contacts")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Directory snapshot" })).toBeVisible();
    expect(screen.getByText("Ana Horvat")).toBeVisible();
  });

  it("presents a useful empty state", async () => {
    renderDashboard(createApi(vi.fn(async () => [])));

    expect(
      await screen.findByRole("heading", {
        name: "Your contact directory is ready",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Add the first contact" })).toHaveAttribute("href", "/contacts");
  });

  it("retries a failed contact query", async () => {
    const user = userEvent.setup();
    const findAll = vi
      .fn<ContactApi["findAll"]>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(contacts);
    renderDashboard(createApi(findAll));

    expect(await screen.findByText("Dashboard failed to load.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(findAll).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("group", { name: "Total contacts" })).toBeVisible();
  });
});
