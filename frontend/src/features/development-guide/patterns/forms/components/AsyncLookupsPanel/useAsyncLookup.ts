import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createAsyncLookupApi } from "../../api/asyncLookup.api";
import type { LookupDepartment } from "../../models/AsyncLookup";

export function useAsyncLookup(department?: LookupDepartment, failFirst = false) {
  const scope = useId();
  const [api] = useState(() => createAsyncLookupApi({ failFirst }));
  const [search, setSearch] = useState("");
  const result = useQuery({
    queryKey: ["forms-async-lookup", scope, department, search],
    queryFn: ({ signal }) => api.findPeople({ department, search }, signal),
    gcTime: 0,
    retry: false,
  });
  return { result, search, setSearch };
}
