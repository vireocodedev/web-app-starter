import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import type { ServerDataExampleApi } from "./serverData.api";
import { ServerDataExampleQueryKey } from "./serverData.querykeys";
import type { ServerDataRecordStatus } from "../models/ServerDataRecord";

type UpdateStatusInput = Readonly<{
  id: string;
  status: ServerDataRecordStatus;
}>;

export function createServerDataExampleMutation(api: ServerDataExampleApi, queryClient: QueryClient) {
  return Object.freeze({
    updateStatus: mutationOptions({
      mutationFn: ({ id, status }: UpdateStatusInput) => api.updateStatus(id, status),
      onSuccess: async record => {
        queryClient.setQueryData(ServerDataExampleQueryKey.detail(record.id), record);
        await queryClient.invalidateQueries({
          queryKey: ServerDataExampleQueryKey.collections(),
        });
      },
    }),
  });
}
