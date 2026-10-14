import { useContext } from "react";

import { AppAuthContext } from "../contexts/AppAuthContext";

export function useAppAuth() {
  const value = useContext(AppAuthContext);
  if (!value) throw new Error("useAppAuth must be used within AppAuthProvider");
  return value;
}
