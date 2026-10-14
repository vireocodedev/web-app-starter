import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router";

import { useAppAuth } from "../hooks/useAppAuth";

export function AppAuthGate() {
  const auth = useAppAuth();
  const { status } = auth;
  const location = useLocation();
  if (status === "loading")
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (status === "anonymous") {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace state={{ from: next.startsWith("/") ? next : "/" }} to="/login" />;
  }
  return <Outlet />;
}
