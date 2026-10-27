import { MutationObserver } from "@tanstack/react-query";

import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";
import type { ContactApi } from "../../examples/Contacts/api/contact.api";
import { createContactMutation } from "../../examples/Contacts/api/contact.mutation";
import { ContactQueryKey } from "../../examples/Contacts/api/contact.querykeys";
import { contactSchema, type ContactInput } from "../../examples/Contacts/models/Contact";

export type TestingScenario = "schema" | "accepted-write" | "rejected-write";
export type BoundaryObservation = Readonly<{ label: string; satisfied: boolean; observed: string }>;

/** Browser-executable observations, deliberately independent of the Vitest runner. */
export async function observeContactBoundary(scenario: TestingScenario): Promise<readonly BoundaryObservation[]> {
  const queryClient = createAppQueryClient({ retry: () => false });
  const collectionKey = ContactQueryKey.collection();
  const unrelatedKey = ["unrelated", "collection"] as const;
  queryClient.setQueryData(collectionKey, []);
  queryClient.setQueryData(unrelatedKey, ["keep"]);
  let writes = 0;
  const api: ContactApi = {
    create: async input => {
      writes += 1;
      if (scenario === "rejected-write") throw new Error("Synthetic rejection before commit");
      return { ...input, id: "synthetic-contact" };
    },
    findAll: async () => [],
    remove: async () => undefined,
    removeMany: async () => undefined,
    update: async ({ contact }) => contact,
    updateStatusMany: async () => [],
  };
  const input: ContactInput = {
    email: " alex@example.com ",
    name: " Alex Morgan ",
    organization: " Example Studio ",
    role: " Designer ",
    status: "ACTIVE",
  };
  try {
    if (scenario === "schema") {
      const schema = contactSchema.omit({ id: true });
      const valid = schema.parse(input);
      const invalid = schema.safeParse({ ...input, email: "invalid" });
      return [
        { label: "Valid input is normalized", satisfied: valid.name === "Alex Morgan", observed: valid.name },
        { label: "Malformed email is rejected", satisfied: !invalid.success, observed: String(invalid.success) },
        { label: "Model validation sends no write", satisfied: writes === 0, observed: `${writes} writes` },
      ];
    }
    const observer = new MutationObserver(queryClient, createContactMutation(api, queryClient).create());
    let acknowledged = false;
    try {
      await observer.mutate(contactSchema.omit({ id: true }).parse(input));
      acknowledged = true;
    } catch {
      // This rejection is the scenario input; the observations below inspect its effects.
    }
    const accepted = scenario === "accepted-write";
    const invalidated = queryClient.getQueryState(collectionKey)?.isInvalidated;
    const unrelatedInvalidated = queryClient.getQueryState(unrelatedKey)?.isInvalidated;
    return [
      { label: "The command reaches the port once", satisfied: writes === 1, observed: `${writes} write` },
      {
        label: accepted ? "The command is acknowledged" : "The rejection remains a rejection",
        satisfied: acknowledged === accepted,
        observed: acknowledged ? "acknowledged" : "rejected",
      },
      {
        label: accepted ? "Contacts becomes stale" : "Rejected write leaves Contacts fresh",
        satisfied: invalidated === accepted,
        observed: `invalidated: ${String(invalidated)}`,
      },
      {
        label: "The unrelated collection remains fresh",
        satisfied: unrelatedInvalidated === false,
        observed: `invalidated: ${String(unrelatedInvalidated)}`,
      },
      {
        label: "The unrelated value is retained",
        satisfied: queryClient.getQueryData<string[]>(unrelatedKey)?.[0] === "keep",
        observed: JSON.stringify(queryClient.getQueryData(unrelatedKey)),
      },
    ];
  } finally {
    await queryClient.cancelQueries();
    queryClient.clear();
  }
}
