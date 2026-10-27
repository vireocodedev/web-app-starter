import { useState } from "react";
import { Stack, Typography } from "@mui/material";
import { useRgoForm } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import type { LookupPerson } from "../../models/AsyncLookup";
import { LookupStatus } from "./LookupStatus";
import { useAsyncLookup } from "./useAsyncLookup";

export function SearchLookupPreview({ failFirst = false }: { failFirst?: boolean }) {
  const { t } = useDevelopmentGuideTranslation();
  const { result, search, setSearch } = useAsyncLookup(undefined, failFirst);
  const [selected, setSelected] = useState<LookupPerson | null>(null);
  const form = useRgoForm({
    defaultValues: { personId: null as string | null },
  });
  const matches = result.data ?? [];
  // The field requires the selected option even when this result page omits it.
  const options = selected && !matches.some(({ id }) => id === selected.id) ? [selected, ...matches] : matches;

  return (
    <form.AppForm>
      <form.Form style={{ maxWidth: 520, width: "100%" }}>
        <Stack spacing={2}>
          <form.AppField
            name="personId"
            listeners={{
              onChange: ({ value }) => {
                setSelected(options.find(({ id }) => id === value) ?? null);
              },
            }}
          >
            {field => (
              <field.AutocompleteField
                label={t("formsExamples.asyncLookups.person")}
                clearText={t("formsExamples.asyncLookups.clear")}
                openText={t("formsExamples.asyncLookups.open")}
                closeText={t("formsExamples.asyncLookups.close")}
                options={options}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.id}
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
          <Typography variant="body2">
            {t("formsExamples.asyncLookups.selection", {
              name: selected?.label ?? t("formsExamples.asyncLookups.none"),
            })}
          </Typography>
        </Stack>
      </form.Form>
    </form.AppForm>
  );
}
