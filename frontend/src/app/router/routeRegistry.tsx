import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { SettingsLayoutRoute } from "./components/SettingsLayoutRoute";
import {
  SettingsAccessibilityPage,
  SettingsAppearancePage,
  SettingsNavigationPage,
} from "@/pages/settings/SettingsPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import type { AppNavigationItem, AppNavigationLink, AppRouteDefinition } from "./types/AppRoute";
import {
  routeDestinationFromRegistry,
  routeIsEnabledInRegistry,
  type AppRouteHierarchyMetadata,
} from "./routeHierarchy";

/** The single developer-edited registry for pages, paths, access, titles, and navigation. */
export const appRouteRegistry = {
  home: {
    Component: HomePage,
    access: "authenticated",
    commandPalette: true,
    index: true,
    navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.home" },
    title: t => t("navigation.home"),
  },
  login: {
    Component: LoginPage,
    access: "public",
    path: "/login",
    title: t => t("authentication.title"),
  },
  notFound: {
    Component: NotFoundPage,
    access: "authenticated",
    path: "*",
    title: t => t("navigation.notFound"),
  },
  settings: {
    Component: SettingsLayoutRoute,
    access: "authenticated",
    defaultChildId: "settingsAppearance",
    navigation: {
      activePath: "/settings/*",
      Icon: SettingsOutlinedIcon,
      labelKey: "navigation.settings",
      to: "/settings/appearance",
    },
    path: "settings",
    title: t => t("navigation.settings"),
  },
  settingsAppearance: {
    Component: SettingsAppearancePage,
    access: "authenticated",
    commandPalette: true,
    mobileSurface: "flush",
    parentId: "settings",
    path: "settings/appearance",
    title: t => t("settings.appearance"),
  },
  settingsNavigation: {
    Component: SettingsNavigationPage,
    access: "authenticated",
    commandPalette: true,
    mobileSurface: "flush",
    parentId: "settings",
    path: "settings/navigation",
    title: t => t("settings.navigation"),
  },
  settingsAccessibility: {
    Component: SettingsAccessibilityPage,
    access: "authenticated",
    commandPalette: true,
    mobileSurface: "flush",
    parentId: "settings",
    path: "settings/accessibility",
    title: t => t("settings.accessibility"),
  },
} as const satisfies Record<string, AppRouteDefinition>;

export function routeDestination(definition: AppRouteDefinition): string {
  const routeId = Object.entries(appRouteRegistry).find(([, candidate]) => candidate === definition)?.[0];
  if (!routeId) throw new Error("Route destination requires a registered route");
  return routeDestinationFromRegistry(appRouteRegistry, routeId);
}

export function routeIsEnabled(definition: AppRouteDefinition, isDevelopment = import.meta.env.DEV): boolean {
  const routeId = Object.entries(appRouteRegistry).find(([, candidate]) => candidate === definition)?.[0];
  if (!routeId) throw new Error("Route availability requires a registered route");
  return routeIsEnabledInRegistry(appRouteRegistry, routeId, isDevelopment);
}

function navigationLink(definition: AppRouteDefinition): AppNavigationLink {
  if (!definition.navigation) throw new Error("A navigation route must define navigation metadata");
  return {
    ...(definition.navigation.activePath ? { activePath: definition.navigation.activePath } : {}),
    Icon: definition.navigation.Icon,
    kind: "link",
    labelKey: definition.navigation.labelKey,
    labelNamespace: "translation",
    to: routeDestination(definition),
  };
}

const homeNavigationItem = navigationLink(appRouteRegistry.home);
const settingsNavigationItem = navigationLink(appRouteRegistry.settings);
export const appNavigationItems = [homeNavigationItem] satisfies readonly AppNavigationItem[];
export const appBottomNavigationItems = [
  homeNavigationItem,
  settingsNavigationItem,
] satisfies readonly AppNavigationLink[];
export const appRouteHierarchyMetadata = {} satisfies AppRouteHierarchyMetadata;
