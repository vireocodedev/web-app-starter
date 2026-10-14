import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { OptimisticSavePreview } from "./OptimisticSavePreview";

const code = `mutationOptions({
  mutationFn: (input) => api.save(input),
  onMutate: async ({ status }) => {
    await client.cancelQueries({ queryKey: optimisticExampleKeys.all })
    const list = client.getQueryData(optimisticExampleKeys.list)
    const detail = client.getQueryData(optimisticExampleKeys.detail)
    client.setQueryData(optimisticExampleKeys.list,
      (rows) => rows?.map((row) => ({ ...row, status })))
    client.setQueryData(optimisticExampleKeys.detail,
      (row) => row ? { ...row, status } : row)
    return { list, detail }
  },
  onError: (_error, _input, snapshot) => {
    if (!snapshot) return
    client.setQueryData(optimisticExampleKeys.list, snapshot.list)
    client.setQueryData(optimisticExampleKeys.detail, snapshot.detail)
  },
  onSuccess: (record) => {
    client.setQueryData(optimisticExampleKeys.detail, record)
    client.setQueryData(optimisticExampleKeys.list,
      (rows) => rows?.map((row) => row.id === record.id ? record : row))
  },
  onSettled: () => client.invalidateQueries({
    queryKey: optimisticExampleKeys.all,
  }),
})`;

export function OptimisticUpdatesAndRollbackPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("serverDataExamples.optimistic.contents.label"),
      title: t("serverDataExamples.optimistic.contents.title"),
    },
    examples: [
      {
        code,
        description: t("serverDataExamples.optimistic.description"),
        id: "server-data-optimistic-save",
        sourcePath:
          "src/features/development-guide/patterns/serverData/components/OptimisticUpdatesAndRollbackPanel/OptimisticSavePreview.tsx",
        preview: <OptimisticSavePreview />,
        title: t("serverDataExamples.optimistic.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
