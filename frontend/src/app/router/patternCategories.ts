import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import FunctionsOutlinedIcon from "@mui/icons-material/FunctionsOutlined";
import CloudQueueOutlinedIcon from "@mui/icons-material/CloudQueueOutlined";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import type SvgIcon from "@mui/material/SvgIcon";

import type { AppExampleGroupId, AppExampleNavigationGroup, AppPatternCategoryRouteId } from "./types/AppRoute";

type PatternCategoryDefinition = Readonly<{
  id: AppExampleGroupId;
  routeId: AppPatternCategoryRouteId;
  path: string;
  labelKey: AppExampleNavigationGroup["labelKey"];
  Icon: typeof SvgIcon;
}>;

/** Ordered category destinations shared by the registry and Patterns index. */
export const patternCategoryDefinitions = [
  {
    id: "localization",
    routeId: "patternLocalization",
    path: "dev-guide/frontend/patterns/localization-and-formatting",
    labelKey: "navigation.i18n",
    Icon: TranslateOutlinedIcon,
  },
  {
    id: "applicationState",
    routeId: "patternApplicationState",
    path: "dev-guide/frontend/patterns/application-state",
    labelKey: "navigation.applicationState",
    Icon: FunctionsOutlinedIcon,
  },
  {
    id: "serverData",
    routeId: "patternServerData",
    path: "dev-guide/frontend/patterns/server-data",
    labelKey: "navigation.serverData",
    Icon: CloudQueueOutlinedIcon,
  },
  {
    id: "routingAndUrlState",
    routeId: "patternRoutingAndUrlState",
    path: "dev-guide/frontend/patterns/routing-and-url-state",
    labelKey: "navigation.routingAndUrlState",
    Icon: AltRouteOutlinedIcon,
  },
  {
    id: "overlays",
    routeId: "patternOverlays",
    path: "dev-guide/frontend/patterns/overlays",
    labelKey: "navigation.overlays",
    Icon: LayersOutlinedIcon,
  },
  {
    id: "tablesAndCollections",
    routeId: "patternTablesAndCollections",
    path: "dev-guide/frontend/patterns/tables-and-collections",
    labelKey: "navigation.tablesAndCollections",
    Icon: TableRowsOutlinedIcon,
  },
  {
    id: "forms",
    routeId: "patternForms",
    path: "dev-guide/frontend/patterns/forms",
    labelKey: "navigation.forms",
    Icon: FactCheckOutlinedIcon,
  },
  {
    id: "feedback",
    routeId: "patternFeedback",
    path: "dev-guide/frontend/patterns/feedback",
    labelKey: "navigation.feedback",
    Icon: NotificationsOutlinedIcon,
  },
] as const satisfies readonly PatternCategoryDefinition[];
