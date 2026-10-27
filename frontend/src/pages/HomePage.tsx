import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { Link } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

/** A replaceable starter page for a new application's real home experience. */
export function HomePage() {
  const { t } = useAppTranslation();
  const [count, setCount] = useState(0);

  return (
    <Box
      sx={{
        marginInline: "auto",
        maxWidth: 960,
        minWidth: 0,
        pb: { xs: 4, md: 8 },
        pt: { xs: 3, md: 7 },
        width: "100%",
      }}
    >
      <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ maxWidth: 680 }}>
          <Typography
            component="p"
            sx={{
              color: "primary.main",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              mb: 1.5,
              textTransform: "uppercase",
            }}
          >
            {t("home.starterLabel")}
          </Typography>
          <Typography
            component="h2"
            sx={{ fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, mb: 2 }}
            variant="h3"
          >
            {t("home.heroTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1.1rem", lineHeight: 1.6 }}>
            {t("home.description")}
          </Typography>
        </Box>

        <Box
          component="section"
          aria-labelledby="home-counter-heading"
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 3 },
            pt: 1,
          }}
        >
          <Button onClick={() => setCount(current => current + 1)} sx={{ minWidth: 144 }} variant="contained">
            {t("home.counterLabel")}: {count}
          </Button>
          <Box>
            <Typography id="home-counter-heading" sx={{ fontWeight: 600 }} variant="body2">
              {t("home.counterTitle")}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {t("home.counterDescription")}
            </Typography>
          </Box>
        </Box>
      </Stack>

      <Box
        component="section"
        aria-labelledby="home-explore-heading"
        sx={{ borderTop: 1, borderColor: "divider", mt: { xs: 6, md: 8 }, pt: 3 }}
      >
        <Typography component="h2" id="home-explore-heading" sx={{ fontWeight: 650, mb: 0.5 }} variant="h6">
          {t("home.exploreTitle")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
          {t("home.exploreDescription")}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            component={Link}
            endIcon={<ArrowForwardRoundedIcon />}
            startIcon={<SettingsOutlinedIcon />}
            sx={{ justifyContent: "space-between", minWidth: { sm: 220 }, py: 1.25 }}
            to="/settings/appearance"
            variant="outlined"
          >
            {t("navigation.settings")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
