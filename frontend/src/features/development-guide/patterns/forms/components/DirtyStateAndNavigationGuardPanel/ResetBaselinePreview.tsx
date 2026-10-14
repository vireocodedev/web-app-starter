import { Alert, Button } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import type { DraftFormValue } from "../../models/FormExamples";
import { createDraftFormSchema } from "../../validation/forms.validation";

export function ResetBaselinePreview() {
  const { t } = useDevelopmentGuideTranslation();
  const schema = createDraftFormSchema(t);
  const defaultValues: DraftFormValue = {
    title: t("formsExamples.dirty.defaultTitle"),
  };
  const [saved, setSaved] = useState(false);
  const form = useRgoForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: schema },
    onSubmit: ({ value, formApi }) => {
      const accepted = schema.parse(value);
      formApi.reset(accepted);
      setSaved(true);
    },
  });

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
            <RgoContainerGrid columns={2} container spacing={1}>
              <RgoContainerGrid size={1}>
                <Button
                  fullWidth
                  onClick={() => {
                    form.reset();
                    setSaved(false);
                  }}
                  type="button"
                  variant="outlined"
                >
                  {t("formsExamples.dirty.reset.action")}
                </Button>
              </RgoContainerGrid>
              <RgoContainerGrid size={1}>
                <form.SubmitButton fullWidth variant="contained">
                  {t("formsExamples.dirty.reset.save")}
                </form.SubmitButton>
              </RgoContainerGrid>
            </RgoContainerGrid>
          </RgoContainerGrid>
          {saved ? (
            <RgoContainerGrid size={{ sm: 2, xs: 1 }}>
              <Alert severity="success">{t("formsExamples.dirty.reset.saved")}</Alert>
            </RgoContainerGrid>
          ) : null}
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}
