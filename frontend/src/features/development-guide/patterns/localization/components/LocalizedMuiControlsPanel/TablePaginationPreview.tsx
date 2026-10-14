import { Box, TablePagination } from "@mui/material";
import { useState } from "react";

export function TablePaginationPreview() {
  const [tablePage, setTablePage] = useState(0);
  return (
    <Box sx={{ maxWidth: "100%", overflowX: "auto", width: "100%" }}>
      <TablePagination
        component="div"
        count={42}
        onPageChange={(_, nextPage) => setTablePage(nextPage)}
        page={tablePage}
        rowsPerPage={10}
        rowsPerPageOptions={[10]}
        sx={{
          "& .MuiTablePagination-actions": { ml: 1 },
          "& .MuiTablePagination-spacer": { display: "none" },
          "& .MuiTablePagination-toolbar": {
            flexWrap: "wrap",
            justifyContent: "center",
            minHeight: "auto",
            px: 0,
            rowGap: 1,
          },
          "& .MuiTablePagination-selectLabel": { ml: 0 },
        }}
      />
    </Box>
  );
}
