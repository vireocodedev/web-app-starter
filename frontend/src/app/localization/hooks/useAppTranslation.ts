import { useTranslation } from "react-i18next";

/** Keeps application translation calls on the application namespace. */
export function useAppTranslation() {
  return useTranslation("translation");
}
