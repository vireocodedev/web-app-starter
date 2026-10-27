import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";

export type WorkflowScenario = "overview" | "conflict" | "refreshFailure" | "uncertain";
export type WorkflowRecord = Readonly<{ id: string; title: string; version: number; status: "PENDING" | "APPROVED" }>;
export type ApprovalCommand = Readonly<{ id: string; expectedVersion: number; comment: string }>;
export class WorkflowConflictError extends Error {}
export class WorkflowOutcomeUnknownError extends Error {}

export const workflowKeys = {
  detail: (viewer: string, id: string) => ["tutorial-workflow", viewer, "detail", id] as const,
  lists: (viewer: string) => ["tutorial-workflow", viewer, "lists"] as const,
  queue: (viewer: string) => ["tutorial-approval-queue", viewer] as const,
  dashboard: (viewer: string) => ["tutorial-dashboard", viewer] as const,
  inbox: (viewer: string) => ["tutorial-inbox", viewer] as const,
};

/** Inject public refresh collaborators; never deep-import another feature's keys. */
export function createCoordinatedRefresh(
  owners: Readonly<{
    requests: () => Promise<void>;
    queue: () => Promise<void>;
    dashboard: () => Promise<void>;
    inbox: () => Promise<void>;
  }>,
) {
  return async () => {
    const results = await Promise.allSettled(
      [owners.requests, owners.queue, owners.dashboard, owners.inbox].map(refresh => Promise.resolve().then(refresh)),
    );
    if (results.some(result => result.status === "rejected")) throw new Error("An affected read failed to refresh.");
  };
}

export function createWorkflowFixture(scenario: WorkflowScenario) {
  const queryClient = createAppQueryClient({ retry: () => false });
  const viewer = "viewer-alex";
  const initial: WorkflowRecord = { id: "request-17", title: "Office chairs", version: 7, status: "PENDING" };
  let server: WorkflowRecord = { ...initial, version: scenario === "conflict" ? 8 : 7 };
  let attempts = 0;
  let accepted = 0;
  let failRefresh = scenario === "refreshFailure";
  let disposed = false;
  let events: readonly string[] = [];
  const listeners = new Set<() => void>();
  const timers = new Map<ReturnType<typeof setTimeout>, () => void>();
  const log = (message: string) => {
    if (disposed) return;
    events = [...events, message];
    listeners.forEach(listener => listener());
  };
  const wait = () =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        resolve();
      }, 180);
      timers.set(timer, () => {
        clearTimeout(timer);
        reject(new DOMException("Preview ended", "AbortError"));
      });
    });
  const projections = [
    { label: "Request detail", key: workflowKeys.detail(viewer, initial.id) },
    { label: "Request lists", key: workflowKeys.lists(viewer) },
    { label: "Approval queue", key: workflowKeys.queue(viewer) },
    { label: "Dashboard", key: workflowKeys.dashboard(viewer) },
    { label: "Inbox", key: workflowKeys.inbox(viewer) },
  ];
  projections.forEach(projection => queryClient.setQueryData(projection.key, { version: 7, refreshes: 0 }));
  const otherViewerKey = workflowKeys.detail("viewer-jordan", initial.id);
  const unrelatedKey = ["tutorial-unrelated", "collection"] as const;
  queryClient.setQueryData(otherViewerKey, "Other viewer retained");
  queryClient.setQueryData(unrelatedKey, "Unrelated owner retained");
  const refreshProjection = async (index: number) => {
    const projection = projections[index];
    await queryClient.invalidateQueries({ queryKey: projection.key, refetchType: "none" });
    await queryClient.fetchQuery({
      queryKey: projection.key,
      staleTime: 0,
      retry: false,
      queryFn: async () => {
        await wait();
        if (failRefresh && index === 0) {
          failRefresh = false;
          log("Request detail refresh failed.");
          throw new Error("Private read failure");
        }
        const previous = queryClient.getQueryData<{ refreshes: number }>(projection.key);
        log(`${projection.label} refreshed at version ${server.version}.`);
        return { version: server.version, refreshes: (previous?.refreshes ?? 0) + 1 };
      },
    });
  };
  const refresh = createCoordinatedRefresh({
    requests: async () => {
      await Promise.all([refreshProjection(0), refreshProjection(1)]);
    },
    queue: () => refreshProjection(2),
    dashboard: () => refreshProjection(3),
    inbox: () => refreshProjection(4),
  });
  return {
    initial,
    queryClient,
    refresh,
    failNextRefresh: () => {
      failRefresh = true;
      log("The next request-detail refresh will fail in this preview.");
    },
    async approve(command: ApprovalCommand) {
      attempts += 1;
      log(
        `Approval submitted: ${command.id}, expectedVersion ${command.expectedVersion}, comment "${command.comment}".`,
      );
      await wait();
      if (command.id !== server.id || command.expectedVersion !== server.version || server.status !== "PENDING") {
        log("409 REQUEST_REJECTED: decision basis is stale; no change committed.");
        throw new WorkflowConflictError("The decision basis is stale.");
      }
      server = { ...server, version: server.version + 1, status: "APPROVED" };
      accepted += 1;
      log("Approval committed together with its version, audit and inbox effects in this simulation.");
      if (scenario === "uncertain") {
        log("Acknowledgement lost after commit.");
        throw new WorkflowOutcomeUnknownError("Acknowledgement lost.");
      }
      return { ...server };
    },
    async readFresh() {
      await wait();
      log(`Authoritative read: version ${server.version}, ${server.status}.`);
      return { ...server };
    },
    getEvents: () => events,
    getCounts: () => ({ attempts, accepted }),
    getProjections: () =>
      projections.map(projection => ({
        label: projection.label,
        ...queryClient.getQueryData<{ version: number; refreshes: number }>(projection.key),
        stale: queryClient.getQueryState(projection.key)?.isInvalidated ?? false,
      })),
    getSentinels: () => `${queryClient.getQueryData(otherViewerKey)}. ${queryClient.getQueryData(unrelatedKey)}.`,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      disposed = true;
      [...timers.values()].forEach(abort => abort());
      timers.clear();
      void queryClient.cancelQueries();
      queryClient.clear();
      listeners.clear();
    },
  };
}
