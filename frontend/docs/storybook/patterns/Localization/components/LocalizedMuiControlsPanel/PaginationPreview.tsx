import { Pagination, Stack } from "@mui/material";
import { useState } from "react";

export function PaginationPreview() {
  const [page, setPage] = useState(1);
  return (
    <Stack sx={{ alignItems: "center", maxWidth: "100%", width: "100%" }}>
      <Pagination
        count={10}
        onChange={(_, nextPage) => setPage(nextPage)}
        page={page}
        showFirstButton
        showLastButton
        siblingCount={0}
      />
    </Stack>
  );
}
