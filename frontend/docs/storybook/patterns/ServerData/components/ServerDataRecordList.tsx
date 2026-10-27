import { Chip, Stack, Typography } from "@mui/material";

import { useDevelopmentGuideTranslation } from "../../../examples/shared/localization/useDevelopmentGuideTranslation";

import type { ServerDataRecord } from "../models/ServerDataRecord";

type ServerDataRecordListProps = Readonly<{
  records: readonly ServerDataRecord[];
}>;

export function ServerDataRecordList({ records }: ServerDataRecordListProps) {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Stack spacing={1.25} sx={{ maxWidth: 420, width: "100%" }}>
      {records.map(record => (
        <Stack
          direction="row"
          key={record.id}
          spacing={2}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <Typography noWrap variant="body2">
            {record.name}
          </Typography>
          <Chip
            color={record.status === "active" ? "success" : "default"}
            label={t(`serverDataExamples.shared.status.${record.status}`)}
            size="small"
            variant="outlined"
          />
        </Stack>
      ))}
    </Stack>
  );
}
