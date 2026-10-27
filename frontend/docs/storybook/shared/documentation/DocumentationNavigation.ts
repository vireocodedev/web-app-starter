import type { ParseKeys } from "i18next";
import type SvgIcon from "@mui/material/SvgIcon";

export type DocumentationNavigationItem = Readonly<{
  activePath?: string;
  Icon?: typeof SvgIcon;
  kind?: "link";
  labelKey: ParseKeys<"development-guide">;
  to: string;
}>;

export type DocumentationNavigationGroup = Readonly<{
  defaultExpanded: boolean;
  id: string;
  items: readonly DocumentationNavigationItem[];
  labelKey: ParseKeys<"development-guide">;
  section?: string;
  sectionLabelKey?: ParseKeys<"development-guide">;
}>;

export type DocumentationPageNavigationLabels = Readonly<{
  labelKey: ParseKeys<"development-guide">;
  nextKey: ParseKeys<"development-guide">;
  previousKey: ParseKeys<"development-guide">;
}>;
