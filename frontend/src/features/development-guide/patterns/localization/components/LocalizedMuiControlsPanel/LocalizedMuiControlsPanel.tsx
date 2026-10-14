import { ExampleGallery, type ExampleGalleryResources } from "@/features/development-guide/patterns/gallery";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

import { MuiLocaleBridgePreview } from "./MuiLocaleBridgePreview";

import { TablePaginationPreview } from "./TablePaginationPreview";

import { AutocompletePreview } from "./AutocompletePreview";

import { PaginationPreview } from "./PaginationPreview";

const localeBridgeCode = `const { direction, locale } = useAppLocalization()
const localeOptions = React.useMemo(() => muiLocaleOptions[locale], [locale])

<AppThemeProvider direction={direction} localeOptions={localeOptions}>
  <App />
</AppThemeProvider>`;

const tablePaginationCode = `import { TablePagination } from '@mui/material'

const [page, setPage] = React.useState(0)

<TablePagination
  component="div"
  count={42}
  onPageChange={(_, nextPage) => setPage(nextPage)}
  page={page}
  rowsPerPage={10}
  rowsPerPageOptions={[10]}
/>`;

const autocompleteCode = `import { Autocomplete, TextField } from '@mui/material'

const { t } = useDevelopmentGuideTranslation()

<Autocomplete
  options={['Harbor renewal', 'Station modernization']}
  renderInput={(params) => (
    <TextField {...params} label={t('projects.name')} />
  )}
/>`;

const paginationCode = `import { Pagination } from '@mui/material'

const [page, setPage] = React.useState(1)

<Pagination
  count={10}
  onChange={(_, nextPage) => setPage(nextPage)}
  page={page}
  showFirstButton
  showLastButton
/>`;

export function LocalizedMuiControlsPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("localizationExamples.mui.contents.label"),
      title: t("localizationExamples.mui.contents.title"),
    },
    examples: [
      {
        code: localeBridgeCode,
        description: t("localizationExamples.mui.bridge.description"),
        id: "localization-mui-locale-bridge",
        sourcePath:
          "src/features/development-guide/patterns/localization/components/LocalizedMuiControlsPanel/MuiLocaleBridgePreview.tsx",
        preview: <MuiLocaleBridgePreview />,
        title: t("localizationExamples.mui.bridge.title"),
      },
      {
        code: tablePaginationCode,
        description: t("localizationExamples.mui.table.description"),
        id: "localization-table-pagination",
        sourcePath:
          "src/features/development-guide/patterns/localization/components/LocalizedMuiControlsPanel/TablePaginationPreview.tsx",
        preview: <TablePaginationPreview />,
        title: t("localizationExamples.mui.table.title"),
      },
      {
        code: autocompleteCode,
        description: t("localizationExamples.mui.autocomplete.description"),
        id: "localization-autocomplete",
        sourcePath:
          "src/features/development-guide/patterns/localization/components/LocalizedMuiControlsPanel/AutocompletePreview.tsx",
        preview: <AutocompletePreview />,
        title: t("localizationExamples.mui.autocomplete.title"),
      },
      {
        code: paginationCode,
        description: t("localizationExamples.mui.pagination.description"),
        id: "localization-pagination",
        sourcePath:
          "src/features/development-guide/patterns/localization/components/LocalizedMuiControlsPanel/PaginationPreview.tsx",
        preview: <PaginationPreview />,
        title: t("localizationExamples.mui.pagination.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
