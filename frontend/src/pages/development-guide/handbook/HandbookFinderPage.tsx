import { Stack } from "@mui/material";

import { AppBreadcrumbs } from "@/app/shell/components/AppBreadcrumbs";
import { HandbookFinder, type HandbookFinderProps } from "@/features/development-guide/handbook";

export function HandbookFinderPage(props: HandbookFinderProps) {
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      {/* The shell's local trail starts at three items; this utility has only two. */}
      <AppBreadcrumbs local minimumLocalItems={2} />
      <HandbookFinder {...props} />
    </Stack>
  );
}
