import type { TFunction } from "i18next";
import { z } from "zod";

import { formExampleAssigneesByDepartment } from "../models/FormExamples";

export function createProfileFormSchema(t: TFunction<"development-guide">) {
  return z
    .object({
      confirmEmail: z.string().trim(),
      email: z
        .string()
        .trim()
        .min(1, t("formsExamples.validation.errors.emailRequired"))
        .email(t("formsExamples.validation.errors.emailInvalid")),
      name: z.string().trim().min(1, t("formsExamples.validation.errors.nameRequired")),
    })
    .refine(value => value.email === value.confirmEmail, {
      message: t("formsExamples.validation.errors.emailMismatch"),
      path: ["confirmEmail"],
    });
}

export function createWorkspaceFormSchema(t: TFunction<"development-guide">) {
  return z.object({
    slug: z
      .string()
      .trim()
      .min(1, t("formsExamples.async.errors.slugRequired"))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("formsExamples.async.errors.slugFormat")),
    workspaceName: z.string().trim().min(1, t("formsExamples.async.errors.nameRequired")),
  });
}

export function createDraftFormSchema(t: TFunction<"development-guide">) {
  return z.object({
    title: z.string().trim().min(1, t("formsExamples.dirty.errors.titleRequired")),
  });
}

export function createAssignmentFormSchema(t: TFunction<"development-guide">) {
  return z
    .object({
      assigneeId: z
        .string()
        .nullable()
        .refine(value => value !== null, {
          message: t("formsExamples.dependent.errors.assigneeRequired"),
        }),
      department: z.string().min(1, t("formsExamples.dependent.errors.departmentRequired")),
      exceptionReason: z.string().trim(),
      requestType: z.enum(["exception", "standard"]),
    })
    .refine(
      value =>
        value.assigneeId === null ||
        (formExampleAssigneesByDepartment[value.department as keyof typeof formExampleAssigneesByDepartment]?.some(
          ({ id }) => id === value.assigneeId,
        ) ??
          false),
      {
        message: t("formsExamples.dependent.errors.assigneeInvalid"),
        path: ["assigneeId"],
      },
    )
    .refine(value => value.requestType === "standard" || value.exceptionReason.trim().length > 0, {
      message: t("formsExamples.dependent.errors.reasonRequired"),
      path: ["exceptionReason"],
    });
}
