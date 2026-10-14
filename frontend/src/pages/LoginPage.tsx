import { Box, CircularProgress } from "@mui/material";
import { Navigate, useLocation } from "react-router";

import { LoginForm } from "@/app/auth/components/LoginForm";
import { useAppAuth } from "@/app/auth/hooks/useAppAuth";
import { resolveAuthReturnPath } from "@/app/auth/routing/authReturnPath";

export function LoginPage() {
  const { status } = useAppAuth();
  const location = useLocation();
  const returnTo = resolveAuthReturnPath((location.state as { from?: unknown } | null)?.from);

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (status === "authenticated") {
    return <Navigate replace to={returnTo} />;
  }

  return <LoginForm returnTo={returnTo} />;
}
