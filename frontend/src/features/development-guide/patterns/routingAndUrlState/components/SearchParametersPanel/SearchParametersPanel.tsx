import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { UrlFilterPreview } from "./UrlFilterPreview";
import { UrlPaginationPreview } from "./UrlPaginationPreview";

const filterStateCode = `import { useAppQueryParams } from '@/app/router/hooks/useAppQueryParams'
import { searchParametersSchema } from '../../models/SearchParameters'

const { values, setValues } = useAppQueryParams(searchParametersSchema)
const query = values.q
const status = values.status

function updateQuery(q: string) {
  setValues({ q, page: 1 }, { replace: true })
}`;

const navigationHistoryCode = `import { useAppQueryParams } from '@/app/router/hooks/useAppQueryParams'
import { searchParametersSchema } from '../../models/SearchParameters'

const { get, set } = useAppQueryParams(searchParametersSchema)
const page = get('page')

function goToPage(page: number) {
  // Page changes push history; Back restores the previous typed value.
  set('page', page)
}`;

export function SearchParametersPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("routingExamples.searchParams.contents.label"),
      title: t("routingExamples.searchParams.contents.title"),
    },
    examples: [
      {
        code: filterStateCode,
        description: t("routingExamples.searchParams.filters.description"),
        id: "routing-search-parameters-filters",
        sourcePath:
          "src/features/development-guide/patterns/routingAndUrlState/components/SearchParametersPanel/UrlFilterPreview.tsx",
        preview: <UrlFilterPreview />,
        title: t("routingExamples.searchParams.filters.title"),
      },
      {
        code: navigationHistoryCode,
        description: t("routingExamples.searchParams.history.description"),
        id: "routing-search-parameters-history",
        sourcePath:
          "src/features/development-guide/patterns/routingAndUrlState/components/SearchParametersPanel/UrlPaginationPreview.tsx",
        preview: <UrlPaginationPreview />,
        title: t("routingExamples.searchParams.history.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
