import { Box, Stack, Typography } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useMemo, useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { tableExampleRecords, type TableExampleRecord } from "../../models/TableExamples";

function TableFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Box sx={{ maxWidth: 840, width: "100%" }}>{children}</Box>;
}

function useDataColumns(): readonly TableColumnDef<TableExampleRecord>[] {
  const { t } = useDevelopmentGuideTranslation();
  return useMemo(
    () => [
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
    ],
    [t],
  );
}

function tableLabels(t: ReturnType<typeof useDevelopmentGuideTranslation>["t"]) {
  return {
    emptyContent: t("tablesExamples.shared.empty"),
    getRowKey: (row: TableExampleRecord) => row.id,
    size: "small" as const,
    tableLabel: t("tablesExamples.shared.tableLabel"),
  };
}

export function RowActivationPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const columns = useDataColumns();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = tableExampleRecords.find(row => row.id === activeId);

  return (
    <TableFrame>
      <Stack spacing={1.5}>
        <RgoDesktopTable
          columns={columns}
          rowActivation={{
            getRowLabel: ({ row }) =>
              t("tablesExamples.selection.activation.label", {
                name: row.name,
              }),
            onActivate: ({ row }) => setActiveId(row.id),
            selectedRowKey: activeId,
          }}
          rows={tableExampleRecords.slice(0, 4)}
          {...tableLabels(t)}
        />
        <Typography aria-live="polite" color="text.secondary" variant="body2">
          {active
            ? t("tablesExamples.selection.activation.active", {
                name: active.name,
              })
            : t("tablesExamples.selection.activation.none")}
        </Typography>
      </Stack>
    </TableFrame>
  );
}
