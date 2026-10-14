import type { TFunction } from "i18next";
import { z } from "zod";
import { isLookupAssigneeValid } from "../models/AsyncLookup";

export function createAsyncAssignmentSchema(t: TFunction<"development-guide">) {
  return z
    .object({
      department: z.enum(["engineering", "operations"]),
      assigneeId: z.string().nullable(),
    })
    .refine(({ department, assigneeId }) => isLookupAssigneeValid(department, assigneeId), {
      path: ["assigneeId"],
      message: t("formsExamples.asyncLookups.invalidAssignee"),
    });
}
