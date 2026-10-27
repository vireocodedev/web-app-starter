import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { CancellationSearchPreview } from "./CancellationSearchPreview";
import { ManualCancellationPreview } from "./ManualCancellationPreview";
import { UnmountCancellationPreview } from "./UnmountCancellationPreview";

const automaticCancellationCode = `import { type QueryFunctionContext, useQuery } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const [search, setSearch] = React.useState('')
const records = useQuery({
  queryKey: ['records', { search }],
  queryFn: ({ signal }: QueryFunctionContext) =>
    api.findAll({ search }, { signal }),
})`;

const manualCancellationCode = `import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
const filters = { pageSize: 4 }
const queryKey = ServerDataExampleQueryKey.list(filters)

function cancelSearch() {
  return queryClient.cancelQueries({ exact: true, queryKey })
}`;

const unmountCancellationCode = `import { useQuery } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const ServerDataQuery = createServerDataExampleQuery(api)

function SearchResults() {
  const filters = { pageSize: 5 }
  const records = useQuery(ServerDataQuery.list(filters))
  return <RecordList records={records.data?.items ?? []} />
}

function RouteSurface({ visible }: { visible: boolean }) {
  return visible ? <SearchResults /> : null
}`;

export function RequestCancellationPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("serverDataExamples.cancellation.contents.label"),
      title: t("serverDataExamples.cancellation.contents.title"),
    },
    examples: [
      {
        code: automaticCancellationCode,
        description: t("serverDataExamples.cancellation.automatic.description"),
        id: "server-data-automatic-cancellation",
        sourcePath:
          "docs/storybook/patterns/ServerData/components/RequestCancellationPanel/CancellationSearchPreview.tsx",
        preview: <CancellationSearchPreview />,
        title: t("serverDataExamples.cancellation.automatic.title"),
      },
      {
        code: manualCancellationCode,
        description: t("serverDataExamples.cancellation.manual.description"),
        id: "server-data-manual-cancellation",
        sourcePath:
          "docs/storybook/patterns/ServerData/components/RequestCancellationPanel/ManualCancellationPreview.tsx",
        preview: <ManualCancellationPreview />,
        title: t("serverDataExamples.cancellation.manual.title"),
      },
      {
        code: unmountCancellationCode,
        description: t("serverDataExamples.cancellation.unmount.description"),
        id: "server-data-unmount-cancellation",
        sourcePath:
          "docs/storybook/patterns/ServerData/components/RequestCancellationPanel/UnmountCancellationPreview.tsx",
        preview: <UnmountCancellationPreview />,
        title: t("serverDataExamples.cancellation.unmount.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
