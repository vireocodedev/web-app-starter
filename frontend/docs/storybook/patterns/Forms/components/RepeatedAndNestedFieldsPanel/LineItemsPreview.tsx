import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { revalidateLogic } from "@tanstack/react-form";
import { RgoContainerGrid, useRgoForm } from "@rgo-web/frontend";
import { useRef, useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { createLineItem, lineItemsTotal, type LineItemsFormValue } from "../../models/RepeatedFields";
import { createLineItemsFormSchema } from "../../validation/repeatedFields.validation";

export function LineItemsPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const { formatCurrency } = useAppLocalizationFormatters();
  const nextId = useRef(2);
  const schema = createLineItemsFormSchema(t);
  const [accepted, setAccepted] = useState<ReturnType<typeof schema.parse> | null>(null);
  const [defaultValues, setDefaultValues] = useState<LineItemsFormValue>(() => ({
    items: [createLineItem("line-1", t("formsExamples.repeated.defaultItem"))],
  }));
  const form = useRgoForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: schema },
    onSubmit: ({ value, formApi }) => {
      const result = schema.parse(value);
      // Keep the hook options aligned with the accepted baseline on rerender.
      setDefaultValues(result);
      setAccepted(result);
      formApi.reset(result);
    },
  });

  return (
    <form.AppForm>
      <form.Form style={{ maxWidth: 720, width: "100%" }}>
        <Stack spacing={2}>
          <form.AppField name="items" mode="array">
            {itemsField => (
              <Stack spacing={2}>
                {itemsField.state.value.map((item, index) => (
                  <Box
                    component="fieldset"
                    key={item.id}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      m: 0,
                      minWidth: 0,
                      p: 2,
                    }}
                  >
                    <Typography component="legend" variant="subtitle2">
                      {t("formsExamples.repeated.row", { number: index + 1 })}
                    </Typography>
                    <RgoContainerGrid columns={{ xs: 1, sm: 2 }} container spacing={2}>
                      <RgoContainerGrid size={{ xs: 1, sm: 2 }}>
                        <form.AppField name={`items[${index}].description`}>
                          {field => (
                            <field.TextField
                              fullWidth
                              label={t("formsExamples.repeated.fields.description")}
                              required
                            />
                          )}
                        </form.AppField>
                      </RgoContainerGrid>
                      <RgoContainerGrid size={1}>
                        <form.AppField name={`items[${index}].pricing.quantity`}>
                          {field => (
                            <field.NumberField fullWidth label={t("formsExamples.repeated.fields.quantity")} required />
                          )}
                        </form.AppField>
                      </RgoContainerGrid>
                      <RgoContainerGrid size={1}>
                        <form.AppField name={`items[${index}].pricing.unitPrice`}>
                          {field => (
                            <field.NumberField
                              fullWidth
                              label={t("formsExamples.repeated.fields.unitPrice")}
                              required
                            />
                          )}
                        </form.AppField>
                      </RgoContainerGrid>
                    </RgoContainerGrid>
                    <Button
                      aria-label={t("formsExamples.repeated.removeRow", {
                        number: index + 1,
                      })}
                      onClick={() => void itemsField.removeValue(index)}
                      type="button"
                    >
                      {t("formsExamples.repeated.remove")}
                    </Button>
                  </Box>
                ))}
                {itemsField.state.value.length === 0 ? (
                  <Alert severity="warning">{t("formsExamples.repeated.errors.itemRequired")}</Alert>
                ) : null}
                <Button
                  onClick={() => itemsField.pushValue(createLineItem(`line-${nextId.current++}`))}
                  type="button"
                  variant="outlined"
                >
                  {t("formsExamples.repeated.add")}
                </Button>
              </Stack>
            )}
          </form.AppField>
          <form.Subscribe selector={({ values }) => values.items}>
            {items => (
              <Typography aria-live="polite">
                {t("formsExamples.repeated.total", {
                  total: formatCurrency(lineItemsTotal(items), "EUR"),
                })}
              </Typography>
            )}
          </form.Subscribe>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button onClick={() => form.reset()} type="button" variant="outlined">
              {t("formsExamples.repeated.reset")}
            </Button>
            <form.SubmitButton variant="contained">{t("formsExamples.repeated.submit")}</form.SubmitButton>
          </Stack>
          {accepted ? (
            <Alert severity="success">
              <Typography variant="subtitle2">{t("formsExamples.repeated.accepted")}</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {accepted.items.map(item => (
                  <li key={item.id}>
                    {t("formsExamples.repeated.acceptedItem", {
                      description: item.description,
                      quantity: item.pricing.quantity,
                      price: formatCurrency(item.pricing.unitPrice, "EUR"),
                    })}
                  </li>
                ))}
              </Box>
              {t("formsExamples.repeated.total", {
                total: formatCurrency(lineItemsTotal(accepted.items), "EUR"),
              })}
            </Alert>
          ) : null}
        </Stack>
      </form.Form>
    </form.AppForm>
  );
}
