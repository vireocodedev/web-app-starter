import { Breadcrumbs, Button, Link, Stack, Typography } from "@mui/material";
import { generatePath, Link as RouterLink, useParams } from "react-router";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

const routeBase = "/dev-guide/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/:projectId";

export function DynamicRouteParameterPreview() {
  const { t } = useDevelopmentGuideTranslation();
  const { projectId = "" } = useParams();

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", width: "100%" }}>
      <Breadcrumbs aria-label={t("routingExamples.parameters.breadcrumbs.label")}>
        <Link component={RouterLink} to="/projects" underline="hover">
          {t("routingExamples.parameters.breadcrumbs.projects")}
        </Link>
        <Typography color="text.primary">{projectId}</Typography>
      </Breadcrumbs>
      <Typography sx={{ textAlign: "center" }} variant="h6">
        {t("routingExamples.parameters.route.current", { projectId })}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
        {["atlas", "harbor", "summit"].map(id => (
          <Button
            component={RouterLink}
            key={id}
            to={generatePath(routeBase, { projectId: id })}
            variant={projectId === id ? "contained" : "outlined"}
          >
            {id}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
