import { useState } from "react";
import { Alert, Stack } from "@mui/material";
import { revalidateLogic, useStore } from "@tanstack/react-form";
import { useRgoForm } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { isLookupAssigneeValid, type LookupDepartment, type LookupPerson } from "../../models/AsyncLookup";
import { createAsyncAssignmentSchema } from "../../validation/asyncLookup.validation";
import { LookupStatus } from "./LookupStatus";
import { useAsyncLookup } from "./useAsyncLookup";

export function DependentLookupPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [selected, setSelected] = useState<LookupPerson | null>(null);
  const [accepted, setAccepted] = useState<string | null>(null);
  const schema = createAsyncAssignmentSchema(t);
  const form = useRgoForm({
    defaultValues: {
      department: "engineering" as LookupDepartment,
      assigneeId: null as string | null,
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => {
      const parsed = schema.parse(value);
      setAccepted(parsed.assigneeId);
    },
  });
  const department = useStore(form.store, state => state.values.department);
  const { result, search, setSearch } = useAsyncLookup(department);
  const matches = result.data ?? [];
  const options =
    selected && selected.department === department && !matches.some(({ id }) => id === selected.id)
      ? [selected, ...matches]
      : matches;

  return (
    <form.AppForm>
      <form.Form style={{ maxWidth: 520, width: "100%" }}>
        <Stack spacing={2}>
          <form.AppField
            name="department"
            listeners={{
              onChange: ({ value }) => {
                // Clear dependent form state in the same event, before the next request.
                if (!isLookupAssigneeValid(value, form.state.values.assigneeId)) {
                  form.setFieldValue("assigneeId", null);
                  setSelected(null);
                }
                setSearch("");
                setAccepted(null);
              },
            }}
          >
            {field => (
              <field.SelectField
                label={t("formsExamples.asyncLookups.department")}
                options={[
                  {
                    id: "engineering",
                    label: t("formsExamples.dependent.departments.engineering"),
                  },
                  {
                    id: "operations",
                    label: t("formsExamples.dependent.departments.operations"),
                  },
                ]}
                getOptionValue={option => option.id}
                renderOption={option => option.label}
              />
            )}
          </form.AppField>
          <form.AppField
            name="assigneeId"
            listeners={{
              onChange: ({ value }) => {
                setSelected(options.find(({ id }) => id === value) ?? null);
                setAccepted(null);
              },
            }}
          >
            {field => (
              <field.AutocompleteField
                label={t("formsExamples.asyncLookups.assignee")}
                clearText={t("formsExamples.asyncLookups.clear")}
                openText={t("formsExamples.asyncLookups.open")}
                closeText={t("formsExamples.asyncLookups.close")}
                options={options}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.id}
                getOptionDisabled={option => option.department !== department}
                filterOptions={() => [...matches]}
                inputValue={search}
                onInputChange={(_event, value, reason) => {
                  if (reason === "input" || reason === "clear") setSearch(value);
                }}
                loading={result.isFetching}
                loadingText={t("formsExamples.asyncLookups.loading")}
                noOptionsText={t("formsExamples.asyncLookups.empty")}
              />
            )}
          </form.AppField>
          <LookupStatus
            loading={result.isFetching}
            failed={result.isError}
            count={matches.length}
            retry={() => void result.refetch()}
          />
          <Alert severity="info">
            {t("formsExamples.asyncLookups.selection", {
              name: selected?.label ?? t("formsExamples.asyncLookups.none"),
            })}
          </Alert>
          <form.SubmitButton variant="contained">{t("formsExamples.asyncLookups.submit")}</form.SubmitButton>
          {accepted && <Alert severity="success">{t("formsExamples.asyncLookups.accepted", { id: accepted })}</Alert>}
        </Stack>
      </form.Form>
    </form.AppForm>
  );
}
