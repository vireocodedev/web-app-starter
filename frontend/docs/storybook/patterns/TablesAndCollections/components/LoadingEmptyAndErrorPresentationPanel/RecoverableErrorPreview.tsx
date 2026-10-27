import { Alert, Box, Button, Stack } from "@mui/material";
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

export function RecoverableErrorPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const columns = useColumns();
  const [recovered, setRecovered] = useState(false);
  const retainedRows = tableExampleRecords.slice(0, 3);

  return (
    <TableFrame>
      <Stack spacing={2}>
        {!recovered ? (
          <Alert
            action={
              <Button color="inherit" onClick={() => setRecovered(true)} sx={{ whiteSpace: "nowrap" }}>
                {t("tablesExamples.states.error.retry")}
              </Button>
            }
            severity="error"
            sx={{
              "& .MuiAlert-message": {
                flex: "1 1 auto",
                minWidth: 0,
                overflowWrap: "anywhere",
              },
              "& .MuiAlert-action": {
                alignItems: "center",
                flexShrink: 0,
                ml: 2,
                mr: 0,
                p: 0,
              },
            }}
          >
            {t("tablesExamples.states.error.message")}
          </Alert>
        ) : null}
        <RgoDesktopTable
          columns={columns}
          emptyContent={t("tablesExamples.shared.empty")}
          getRowKey={row => row.id}
          rows={retainedRows}
          size="small"
          tableLabel={t("tablesExamples.shared.tableLabel")}
        />
      </Stack>
    </TableFrame>
  );
}
