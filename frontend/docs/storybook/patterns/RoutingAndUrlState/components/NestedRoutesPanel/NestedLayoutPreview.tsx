import { Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink, Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

const routeBase = "/dev-guide/frontend/patterns/routing-and-url-state/nested-routes/workspace";

function WorkspaceLayout() {
  const { t } = useDevelopmentGuideTranslation();
  const { pathname } = useLocation();

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", width: "100%" }}>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
        {(["overview", "activity"] as const).map(section => (
          <Button
            component={RouterLink}
            key={section}
            to={`${routeBase}/${section}`}
            variant={pathname.endsWith(section) ? "contained" : "outlined"}
          >
            {t(`routingExamples.nested.preview.${section}`)}
          </Button>
        ))}
      </Stack>
      <Outlet />
    </Stack>
  );
}

function WorkspaceSection({ section }: Readonly<{ section: "activity" | "overview" }>) {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <Paper sx={{ maxWidth: 440, p: 3, textAlign: "center", width: "100%" }}>
      <Typography color="text.secondary" variant="body2">
        {t(`routingExamples.nested.preview.${section}Description`)}
      </Typography>
    </Paper>
  );
}

export function NestedLayoutPreview() {
  return (
    <Routes>
      <Route element={<Navigate replace to="workspace/overview" />} index />
      <Route element={<WorkspaceLayout />} path="workspace">
        <Route element={<WorkspaceSection section="overview" />} path="overview" />
        <Route element={<WorkspaceSection section="activity" />} path="activity" />
      </Route>
    </Routes>
  );
}
