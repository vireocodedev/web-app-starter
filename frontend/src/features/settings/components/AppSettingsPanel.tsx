import { Box, Divider, Typography } from "@mui/material";

import type { AppSettingsRowDefinition, AppSettingsSectionDefinition } from "../types/AppSettingsSection";

type AppSettingsPanelProps = Readonly<{
  groups: readonly AppSettingsSectionDefinition[];
  resetRow?: AppSettingsRowDefinition;
}>;

/** Presents application-owned preferences as open, grouped Settings rows. */
export function AppSettingsPanel({ groups, resetRow }: AppSettingsPanelProps) {
  const visibleGroups = groups.filter(group => group.rows.length > 0);

  return (
    <Box data-rgo-settings-panel sx={{ containerType: "inline-size", minWidth: 0 }}>
      {visibleGroups.map(group => (
        <Box aria-labelledby={`settings-${group.id}-heading`} component="section" key={group.id} sx={{ mb: 4 }}>
          <Typography component="h2" id={`settings-${group.id}-heading`} sx={{ fontWeight: 600, py: 1.5 }} variant="h6">
            {group.title}
          </Typography>
          <Divider />
          <Box sx={{ py: 0.5 }}>
            {group.rows.map(row => (
              <SettingsRow key={row.id} row={row} />
            ))}
          </Box>
        </Box>
      ))}
      {resetRow ? (
        <Box aria-labelledby="settings-restore-heading" component="section" sx={{ pb: 2, pt: 1 }}>
          <Divider sx={{ mb: 2 }} />
          <SettingsRow row={resetRow} titleId="settings-restore-heading" />
        </Box>
      ) : null}
    </Box>
  );
}

function SettingsRow({ row, titleId }: Readonly<{ row: AppSettingsRowDefinition; titleId?: string }>) {
  return (
    <Box
      data-rgo-settings-row={row.id}
      sx={{
        columnGap: 3,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        minWidth: 0,
        py: 3,
        rowGap: 2.5,
        ...(titleId
          ? {
              "@container (min-width: 680px)": {
                alignItems: "center",
                gridTemplateColumns: "minmax(0, 1fr) auto",
              },
            }
          : {}),
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component={titleId ? "h2" : "h3"} id={titleId} sx={{ fontWeight: 600 }} variant="body2">
          {row.title}
        </Typography>
        {row.description ? (
          <Typography sx={{ color: "rgo.textMuted", display: "block", lineHeight: 1.5, mt: 0.25 }} variant="body2">
            {row.description}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          maxWidth: "100%",
          minWidth: 0,
          ...(titleId ? { "@container (min-width: 680px)": { justifyContent: "flex-end" } } : {}),
        }}
      >
        {row.control}
      </Box>
    </Box>
  );
}
