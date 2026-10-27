import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Stack } from "@mui/material";
import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";
import { ContactsFeature } from "./components/ContactsFeature";
import { ContactsDashboard } from "./components/ContactsDashboard";
import { createContactsFeature } from "./contacts.feature";
import { createMemoryContactApi } from "./api/contact.api.memory";
import { ContactsReferenceProvider } from "./hooks/ContactsReferenceProvider";
import { StorybookAddressBar } from "../../routing/shared/StorybookAddressBar";

export function ContactsPreview({ dashboard = false }: Readonly<{ dashboard?: boolean }>) {
  const [runtime] = useState(() => {
    const queryClient = createAppQueryClient({ retry: () => false });
    const feature = createContactsFeature({ queryClient, api: createMemoryContactApi() });
    function Frame({ children }: { children: ReactNode }) {
      return (
        <Stack spacing={3}>
          <StorybookAddressBar />
          {children}
        </Stack>
      );
    }
    const router = createMemoryRouter(
      [
        {
          path: "/contacts",
          element: (
            <Frame>
              <ContactsFeature />
            </Frame>
          ),
        },
        {
          path: "*",
          element: (
            <Frame>
              <ContactsDashboard />
            </Frame>
          ),
        },
      ],
      { initialEntries: [dashboard ? "/dashboard" : "/contacts"] },
    );
    return { queryClient, feature, router };
  });
  useEffect(
    () => () => {
      runtime.router.dispose();
      void runtime.queryClient.cancelQueries();
      runtime.queryClient.clear();
    },
    [runtime],
  );
  return (
    <QueryClientProvider client={runtime.queryClient}>
      <ContactsReferenceProvider value={runtime.feature}>
        <RouterProvider router={runtime.router} />
      </ContactsReferenceProvider>
    </QueryClientProvider>
  );
}
