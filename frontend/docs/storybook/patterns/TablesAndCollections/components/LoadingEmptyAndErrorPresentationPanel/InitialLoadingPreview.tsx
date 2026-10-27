import { Box } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { type TableExampleRecord } from "../../models/TableExamples";

function TableFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Box sx={{ maxWidth: 840, width: "100%" }}>{children}</Box>;
}

function useColumns(): readonly TableColumnDef<TableExampleRecord>[] {
  const { t } = useDevelopmentGuideTranslation();
  return [
    {
      id: "name",
      header: t("tablesExamples.shared.columns.name"),
      renderCell: ({ row }) => row.name,
      rowHeader: true,
    },
    {
      id: "owner",
      header: t("tablesExamples.shared.columns.owner"),
      renderCell: ({ row }) => row.owner,
    },
    {
      id: "status",
      header: t("tablesExamples.shared.columns.status"),
      renderCell: ({ row }) => t(`tablesExamples.shared.status.${row.status}`),
    },
  ];
}

export function InitialLoadingPreview() {
  const rows: readonly TableExampleRecord[] = [];

  const { t } = useDevelopmentGuideTranslation();
  const columns = useColumns();
  const loadingProps = {
    loading: true as const,
    loadingContent: t("tablesExamples.shared.loading"),
    loadingLabel: t("tablesExamples.shared.loadingLabel"),
  };

  return (
    <TableFrame>
      <RgoDesktopTable
        columns={columns}
        emptyContent={t("tablesExamples.shared.empty")}
        getRowKey={row => row.id}
        rows={rows}
        size="small"
        sx={{ border: 1, borderColor: "divider" }}
        tableLabel={t("tablesExamples.shared.tableLabel")}
        {...loadingProps}
      />
    </TableFrame>
  );
}
