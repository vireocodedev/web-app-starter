import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { SearchLookupPreview } from "./SearchLookupPreview";
import { DependentLookupPreview } from "./DependentLookupPreview";
import { ErrorRetryLookupPreview } from "./ErrorRetryLookupPreview";

const searchCode = `const result = useQuery({
  queryKey: ['forms-async-lookup', scope, department, search],
  queryFn: ({ signal }) => api.findPeople({ department, search }, signal),
  gcTime: 0,
  retry: false,
})
// Retain the selected option separately from the current result page.
const options = selected && !matches.some(({ id }) => id === selected.id)
  ? [selected, ...matches] : matches`;

const dependentCode = `<form.AppField name="department" listeners={{ onChange: ({ value }) => {
  if (!isLookupAssigneeValid(value, form.state.values.assigneeId)) {
    form.setFieldValue('assigneeId', null)
    setSelected(null)
  }
  setSearch('')
  setAccepted(null)
} }}>
  {(field) => <field.SelectField options={departments} />}
</form.AppField>`;

const retryCode = `// SearchLookupPreview creates an isolated API and query scope.
// Its first completed request fails; an aborted request does not consume failure.
<SearchLookupPreview failFirst />

// SearchLookupPreview exposes the failed request through LookupStatus:
<LookupStatus
  loading={result.isFetching}
  failed={result.isError}
  count={matches.length}
  retry={() => void result.refetch()}
/>`;

export function AsyncLookupsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("formsExamples.asyncLookups.contents.label"),
      title: t("formsExamples.asyncLookups.contents.title"),
    },
    examples: [
      {
        id: "forms-async-search",
        title: t("formsExamples.asyncLookups.search.title"),
        description: t("formsExamples.asyncLookups.search.description"),
        code: searchCode,
        preview: <SearchLookupPreview />,
        sourcePath:
          "src/features/development-guide/patterns/forms/components/AsyncLookupsPanel/SearchLookupPreview.tsx",
      },
      {
        id: "forms-async-dependent",
        title: t("formsExamples.asyncLookups.dependent.title"),
        description: t("formsExamples.asyncLookups.dependent.description"),
        code: dependentCode,
        preview: <DependentLookupPreview />,
        sourcePath:
          "src/features/development-guide/patterns/forms/components/AsyncLookupsPanel/DependentLookupPreview.tsx",
      },
      {
        id: "forms-async-retry",
        title: t("formsExamples.asyncLookups.error.title"),
        description: t("formsExamples.asyncLookups.error.description"),
        code: retryCode,
        preview: <ErrorRetryLookupPreview />,
        sourcePath:
          "src/features/development-guide/patterns/forms/components/AsyncLookupsPanel/ErrorRetryLookupPreview.tsx",
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
