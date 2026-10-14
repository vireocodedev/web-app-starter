import { useTranslation } from "react-i18next";

/** Translates removable development guide content from its own namespace. */
export function useDevelopmentGuideTranslation() {
  return useTranslation("development-guide");
}
