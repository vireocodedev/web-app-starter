import { Button } from "@mui/material";
import { RgoContainerGrid } from "@rgo-web/frontend";
import { useLocation, useNavigate } from "react-router";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

export function NavigationActionsPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useDevelopmentGuideTranslation();

  return (
    <RgoContainerGrid columns={2} container spacing={1} sx={{ maxWidth: 520, width: "100%" }}>
      <RgoContainerGrid size={1}>
        <Button
          fullWidth
          onClick={() => navigate(location.pathname, { replace: true })}
          type="button"
          variant="outlined"
        >
          {t("formsExamples.dirty.actions.samePage")}
        </Button>
      </RgoContainerGrid>
      <RgoContainerGrid size={1}>
        <Button
          fullWidth
          onClick={() => navigate("/dev-guide/frontend/patterns/forms/dependent-fields")}
          type="button"
          variant="contained"
        >
          {t("formsExamples.dirty.actions.sibling")}
        </Button>
      </RgoContainerGrid>
    </RgoContainerGrid>
  );
}
