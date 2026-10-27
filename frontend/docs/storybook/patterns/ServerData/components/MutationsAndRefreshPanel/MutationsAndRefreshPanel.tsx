import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { PendingMutationPreview } from "./PendingMutationPreview";
import { CacheRefreshPreview } from "./CacheRefreshPreview";

const pendingMutationCode = `import { useMutation, useQueryClient } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const queryClient = useQueryClient()
const ServerDataMutation = createServerDataExampleMutation(api, queryClient)
const updateStatus = useMutation(ServerDataMutation.updateStatus)

<Button
  disabled={updateStatus.isPending}
  onClick={() => updateStatus.mutate({ id: 'atlas', status: 'paused' })}
>
  {updateStatus.isPending ? t('saving') : t('pause')}
</Button>`;

const cacheRefreshCode = `import { mutationOptions, useQueryClient } from '@tanstack/react-query'

const api = createServerDataExampleApi()
const queryClient = useQueryClient()
const updateStatus = mutationOptions({
  mutationFn: ({ id, status }) => api.updateStatus(id, status),
  onSuccess: async (record) => {
    queryClient.setQueryData(ServerDataExampleQueryKey.detail(record.id), record)
    await queryClient.invalidateQueries({
      queryKey: ServerDataExampleQueryKey.collections(),
    })
  },
})`;

export function MutationsAndRefreshPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("serverDataExamples.mutations.contents.label"),
      title: t("serverDataExamples.mutations.contents.title"),
    },
    examples: [
      {
        code: pendingMutationCode,
        description: t("serverDataExamples.mutations.pending.description"),
        id: "server-data-mutation-pending",
        sourcePath: "docs/storybook/patterns/ServerData/components/MutationsAndRefreshPanel/PendingMutationPreview.tsx",
        preview: <PendingMutationPreview />,
        title: t("serverDataExamples.mutations.pending.title"),
      },
      {
        code: cacheRefreshCode,
        description: t("serverDataExamples.mutations.refresh.description"),
        id: "server-data-cache-refresh",
        sourcePath: "docs/storybook/patterns/ServerData/components/MutationsAndRefreshPanel/CacheRefreshPreview.tsx",
        preview: <CacheRefreshPreview />,
        title: t("serverDataExamples.mutations.refresh.title"),
      },
    ],
  } satisfies ExampleGalleryResources;

  return <ExampleGallery resources={resources} />;
}
