import { Alert } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { RgoContainerGrid, useRgoFeedback, useRgoForm } from "@rgo-web/frontend";
import { useEffect, useRef } from "react";
import { useBlocker } from "react-router";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import type { DraftFormValue } from "../../models/FormExamples";
import { createDraftFormSchema } from "../../validation/forms.validation";

export function GuardedDraftPreview() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const schema = createDraftFormSchema(t);
  const promptRef = useRef<AbortController | null>(null);
  const defaultValues: DraftFormValue = {
    title: t("formsExamples.dirty.defaultTitle"),
  };
  const form = useRgoForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: schema },
    onSubmit: ({ value, formApi }) => formApi.reset(schema.parse(value)),
  });
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => form.state.isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== "blocked" || promptRef.current) return;
    const controller = new AbortController();
    promptRef.current = controller;

    void feedback
      .confirm({
        cancelLabel: t("formsExamples.dirty.guard.keepEditing"),
        confirmLabel: t("formsExamples.dirty.guard.leave"),
        message: t("formsExamples.dirty.guard.message"),
        signal: controller.signal,
        title: t("formsExamples.dirty.guard.dialogTitle"),
      })
      .then(result => {
        if (controller.signal.aborted) return;
        if (result.status === "confirmed") blocker.proceed();
        else blocker.reset();
      })
      .finally(() => {
        if (promptRef.current === controller) promptRef.current = null;
      });

    return () => {
      controller.abort();
      if (promptRef.current === controller) promptRef.current = null;
    };
  }, [blocker, feedback, t]);

  return (
    <form.AppForm>
      <form.Form style={{ maxWidth: 520, width: "100%" }}>
        <RgoContainerGrid columns={{ sm: 2, xs: 1 }} container spacing={2} sx={{ maxWidth: 520, width: "100%" }}>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <form.AppField name="title">
              {field => <field.TextField fullWidth label={t("formsExamples.dirty.fields.title")} required />}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <Alert severity="info">{t("formsExamples.dirty.guard.instructions")}</Alert>
          </RgoContainerGrid>
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}
