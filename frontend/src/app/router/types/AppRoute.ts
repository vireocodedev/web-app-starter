import type { ParseKeys, TFunction } from "i18next";
import type SvgIcon from "@mui/material/SvgIcon";
import type { ContainerProps } from "@mui/material/Container";
import type { ComponentType } from "react";
import type { Params, RouteObject } from "react-router";

type AppTranslationNamespace = "translation";

export type AppRouteTranslations = Readonly<{
  app: TFunction<"translation">;
}>;

export type AppRouteTitleResolver<Namespace extends AppTranslationNamespace = "translation"> = (
  t: TFunction<Namespace>,
  params: Readonly<Params<string>>,
) => string;

export type AppBreadcrumb = Readonly<{
  label: string;
  to?: string;
}>;

export type AppMobileSurface = "inset" | "flush";

export type AppRouteBreadcrumbDefinition = Readonly<{
  title: AppRouteTitleResolver;
  to: (params: Readonly<Params<string>>) => string;
  translationNamespace?: "translation";
}>;

export type AppRouteHandle = {
  contentMaxWidth?: ContainerProps["maxWidth"];
  contentOverflow?: "auto" | "hidden";
  HeaderContext?: ComponentType<{ params: Readonly<Params<string>> }>;
  headerBreadcrumb?: boolean;
  sectionNavigation?: readonly AppNavigationLink[];
  mobileBottomNavigation?: boolean;
  mobileSurface?: AppMobileSurface;
  resolveBreadcrumbs: (
    translations: AppRouteTranslations,
    params: Readonly<Params<string>>,
  ) => readonly AppBreadcrumb[];
  resolveTitle: (translations: AppRouteTranslations, params: Readonly<Params<string>>) => string;
  scrollToTop: boolean;
};

type AppNavigationLabel = Readonly<{ labelKey: ParseKeys<"translation">; labelNamespace?: "translation" }>;

export type AppNavigationLink = Readonly<{
  activePath?: string;
  Icon: typeof SvgIcon;
  kind: "link";
  to: string;
}> &
  AppNavigationLabel;

export type AppNavigationMenu = Readonly<{
  activePath: string;
  Icon: typeof SvgIcon;
  items: readonly AppNavigationLink[];
  kind: "menu";
}> &
  AppNavigationLabel;

export type AppNavigationItem = AppNavigationLink | AppNavigationMenu;

type AppRouteLocation = Readonly<{ index: true; path?: never }> | Readonly<{ index?: false; path: string }>;

type AppRouteImplementation =
  | Readonly<{ Component: ComponentType; lazy?: never }>
  | Readonly<{
      Component?: never;
      lazy: () => Promise<{ Component: ComponentType }>;
    }>;

export type AppRouteAccess = "authenticated" | "public";

type AppRouteLocalization = Readonly<{
  translationNamespace?: "translation";
  title: AppRouteTitleResolver;
  navigation?: Readonly<{
    activePath?: string;
    Icon: typeof SvgIcon;
    labelKey: ParseKeys<"translation">;
    to?: string;
  }>;
}>;

export type AppRouteDefinition = Readonly<{
  access: AppRouteAccess;
  breadcrumbs?: false | readonly AppRouteBreadcrumbDefinition[];
  commandPalette?: true;
  contentMaxWidth?: ContainerProps["maxWidth"];
  contentOverflow?: "auto" | "hidden";
  defaultChildId?: string;
  HeaderContext?: ComponentType<{ params: Readonly<Params<string>> }>;
  headerBreadcrumb?: boolean;
  headerNavigation?: boolean;
  developmentOnly?: boolean;
  ErrorBoundary?: ComponentType;
  mobileBottomNavigation?: boolean;
  mobileSurface?: AppMobileSurface;
  scrollToTop?: boolean;
}> &
  AppRouteLocalization &
  Readonly<{ parentId?: string }> &
  AppRouteLocation &
  AppRouteImplementation;

export type AppRouteObject = RouteObject & {
  children?: AppRouteObject[];
  handle?: AppRouteHandle;
};
