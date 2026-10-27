import { Alert } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";
import { useMemo, useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import {
  createFormExamplesApi,
  FormsServiceUnavailableError,
  FormsSlugConflictError,
} from "../../api/formExamples.api";
import type { WorkspaceFormValue } from "../../models/FormExamples";
import { createWorkspaceFormSchema } from "../../validation/forms.validation";

export function ServerErrorsPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const api = useMemo(() => createFormExamplesApi(), []);
  const saveWorkspace = useMutation({ mutationFn: api.saveWorkspace });
  const schema = createWorkspaceFormSchema(t);
  const initialValue: WorkspaceFormValue = {
    slug: "existing",
    workspaceName: t("formsExamples.async.defaults.existingName"),
  };
  const [serverError, setServerError] = useState<"conflict" | "unavailable" | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useRgoForm({
    defaultValues: initialValue,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: schema },
    onSubmit: async ({ value }) => {
      try {
        setSaved(false);
        setServerError(null);
        await saveWorkspace.mutateAsync(schema.parse(value));
        setSaved(true);
      } catch (error) {
        if (error instanceof FormsSlugConflictError) {
          setServerError("conflict");
        } else if (error instanceof FormsServiceUnavailableError) {
          setServerError("unavailable");
        } else {
          throw error;
        }
      }
    },
  });

  return (
    <form.AppForm>
      <form.Form style={{ maxWidth: 520, width: "100%" }}>
        <RgoContainerGrid columns={{ sm: 2, xs: 1 }} container spacing={2} sx={{ maxWidth: 520, width: "100%" }}>
          {serverError ? (
            <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
              <Alert severity="error">{t(`formsExamples.async.serverErrors.${serverError}`)}</Alert>
            </RgoContainerGrid>
          ) : null}
          {saved ? (
            <RgoContainerGrid size={{ sm: 2, xs: 1 }} sx={{ mb: 2 }}>
              <Alert severity="success">{t("formsExamples.async.saved")}</Alert>
            </RgoContainerGrid>
          ) : null}
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField name="workspaceName">
              {field => <field.TextField fullWidth label={t("formsExamples.async.fields.name")} required />}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 1, xs: 1 }}>
            <form.AppField name="slug">
              {field => (
                <field.TextField
                  fullWidth
                  helperText={t("formsExamples.async.serverErrors.hint")}
                  label={t("formsExamples.async.fields.slug")}
                  required
                />
              )}
            </form.AppField>
          </RgoContainerGrid>
          <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
            <form.SubmitButton variant="contained">{t("formsExamples.async.submit")}</form.SubmitButton>
          </RgoContainerGrid>
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}
