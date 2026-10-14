import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

export function RouteError() {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <Stack component="main" spacing={2} sx={{ p: 3 }}>
      <Typography component="h1" ref={headingRef} tabIndex={-1} variant="h4">
        {t("navigation.routeError")}
      </Typography>
      <Button onClick={() => navigate("/")} variant="contained">
        {t("navigation.goHome")}
      </Button>
    </Stack>
  );
}
