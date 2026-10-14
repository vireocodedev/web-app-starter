import type { DocumentationNavigationGroup, DocumentationNavigationItem } from "@/app/shell/documentation";
import type SvgIcon from "@mui/material/SvgIcon";

export type AppNavigationLink = DocumentationNavigationItem &
  Readonly<{
    Icon: typeof SvgIcon;
    kind: "link";
  }>;

export type AppExampleGroupId =
  | "applicationState"
  | "feedback"
  | "forms"
  | "localization"
  | "overlays"
  | "routingAndUrlState"
  | "serverData"
  | "tablesAndCollections";

export type AppExampleNavigationGroup = Omit<DocumentationNavigationGroup, "id" | "items"> &
  Readonly<{
    id: AppExampleGroupId;
    items: readonly AppNavigationLink[];
  }>;
