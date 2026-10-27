import { Box, Button } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";
import { tableExampleRecords, type TableExampleRecord } from "../../models/TableExamples";

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

export function EmptyPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const columns = useColumns();
  const [rows, setRows] = useState<readonly TableExampleRecord[]>([]);

  return (
    <TableFrame>
      <RgoDesktopTable
        columns={columns}
        emptyAction={
          <Button onClick={() => setRows(tableExampleRecords.slice(0, 1))} variant="contained">
            {t("tablesExamples.states.empty.create")}
          </Button>
        }
        emptyContent={t("tablesExamples.states.empty.message")}
        getRowKey={row => row.id}
        rows={rows}
        size="small"
        sx={{ border: 1, borderColor: "divider", height: 320 }}
        tableLabel={t("tablesExamples.shared.tableLabel")}
      />
    </TableFrame>
  );
}
