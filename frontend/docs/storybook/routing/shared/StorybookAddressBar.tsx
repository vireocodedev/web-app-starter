import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import { Box, InputAdornment, OutlinedInput } from "@mui/material";
import { useLocation } from "react-router";

/** Mount inside a story's router, before its shell; the URL follows that router. */
export function StorybookAddressBar() {
  const { pathname, search, hash } = useLocation();

  return (
    <Box
      aria-label="Preview browser"
      component="section"
      data-storybook-address-bar
      sx={{
        alignItems: "center",
        bgcolor: "rgo.shellSurface",
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        gap: 1.5,
        minWidth: 0,
        px: 1.5,
        py: 1,
      }}
    >
      <Box aria-hidden="true" sx={{ display: { xs: "none", sm: "flex" }, flexShrink: 0, gap: 0.75 }}>
        {[0, 1, 2].map(dot => (
          <Box key={dot} sx={{ bgcolor: "text.disabled", borderRadius: "50%", height: 8, width: 8 }} />
        ))}
      </Box>
      <OutlinedInput
        fullWidth
        readOnly
        size="small"
        slotProps={{ input: { "aria-label": "Preview URL" } }}
        startAdornment={
          <InputAdornment position="start">
            <LanguageOutlinedIcon fontSize="small" />
          </InputAdornment>
        }
        sx={{
          bgcolor: "background.default",
          fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
          fontSize: "0.8125rem",
          minWidth: 0,
        }}
        value={pathname + search + hash}
      />
    </Box>
  );
}
