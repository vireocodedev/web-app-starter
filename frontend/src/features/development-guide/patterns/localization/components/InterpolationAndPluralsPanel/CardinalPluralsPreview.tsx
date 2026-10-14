import { Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

export function CardinalPluralsPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const [count, setCount] = useState(1);
  return (
    <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
      <Typography sx={{ textAlign: "center" }} variant="h6">
        {t("localizationExamples.interpolation.plural.message", {
          count,
        })}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: "100%",
          mx: "auto",
          width: "fit-content",
        }}
      >
        <Button
          aria-label={t("localizationExamples.interpolation.plural.decrease")}
          disabled={count === 0}
          onClick={() => setCount(current => Math.max(0, current - 1))}
          variant="outlined"
        >
          −
        </Button>
        <Button onClick={() => setCount(1)} variant="text">
          {t("localizationExamples.interpolation.plural.reset")}
        </Button>
        <Button
          aria-label={t("localizationExamples.interpolation.plural.increase")}
          onClick={() => setCount(current => current + 1)}
          variant="outlined"
        >
          +
        </Button>
      </Stack>
    </Stack>
  );
}
