import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const inboxMessageSchema = z.object({
  id: z.string().min(1),
  message: z.string().min(1).max(2000),
  requestId: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
  readAt: z.iso.datetime({ offset: true }).nullable(),
});
export type InboxMessage = z.output<typeof inboxMessageSchema>;
export type InboxScenario = "overview" | "readFailure" | "markFailure" | "ownership";
export type InboxViewer = "alex" | "sam";
export class InboxHiddenError extends Error {}

export interface InboxApi {
  list(options?: Readonly<{ signal?: AbortSignal }>): Promise<InboxMessage[]>;
  unreadCount(options?: Readonly<{ signal?: AbortSignal }>): Promise<number>;
  markRead(id: string): Promise<InboxMessage>;
}

export const InboxKey = {
  scope: (viewerId: string) => ["inbox-reference", viewerId] as const,
  list: (viewerId: string) => [...InboxKey.scope(viewerId), "messages"] as const,
  unread: (viewerId: string) => [...InboxKey.scope(viewerId), "unread"] as const,
};

export function createInboxOptions(api: InboxApi, queryClient: QueryClient, viewerId: string) {
  return {
    list: () => queryOptions({ queryKey: InboxKey.list(viewerId), queryFn: ({ signal }) => api.list({ signal }) }),
    unread: () =>
      queryOptions({ queryKey: InboxKey.unread(viewerId), queryFn: ({ signal }) => api.unreadCount({ signal }) }),
    markRead: () =>
      mutationOptions({
        mutationFn: (id: string) => api.markRead(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: InboxKey.scope(viewerId) }),
      }),
  };
}

/** A private server-shaped fixture outlives cold client remounts, never the whole browser session. */
export function createInboxServer(scenario: InboxScenario) {
  const initial = [
    { id: "alex-1", recipient: "alex", message: "Equipment request approved", requestId: "request-1", readAt: null },
    {
      id: "alex-2",
      recipient: "alex",
      message: "A comment was added to your request",
      requestId: "request-2",
      readAt: "2026-01-16T09:00:00Z",
    },
    { id: "sam-1", recipient: "sam", message: "Software request completed", requestId: "request-3", readAt: null },
  ];
  let records = initial.map(item => ({ ...item, createdAt: "2026-01-16T08:00:00Z" }));
  let failRead = scenario === "readFailure";
  let failMark = scenario === "markFailure";
  let writes = 0;
  let rejected = 0;
  return {
    counts: () => ({ writes, rejected }),
    // Selecting an actor is test-server setup. Neither production operation accepts a recipient ID.
    forActor: (actor: InboxViewer): InboxApi => ({
      async list({ signal } = {}) {
        signal?.throwIfAborted();
        if (failRead) {
          failRead = false;
          throw new Error("Synthetic inbox read failure");
        }
        return z.array(inboxMessageSchema).parse(records.filter(row => row.recipient === actor));
      },
      async unreadCount({ signal } = {}) {
        signal?.throwIfAborted();
        return records.filter(row => row.recipient === actor && row.readAt === null).length;
      },
      async markRead(id) {
        const selected = records.find(row => row.id === id && row.recipient === actor);
        if (!selected) {
          rejected += 1;
          throw new InboxHiddenError("Missing or hidden notification");
        }
        if (failMark) {
          failMark = false;
          throw new Error("Synthetic mark-read rejection before commit");
        }
        if (selected.readAt === null) {
          records = records.map(row => (row.id === selected.id ? { ...row, readAt: "2026-01-16T10:00:00Z" } : row));
          writes += 1;
        }
        return inboxMessageSchema.parse(records.find(row => row.id === selected.id));
      },
    }),
  };
}
