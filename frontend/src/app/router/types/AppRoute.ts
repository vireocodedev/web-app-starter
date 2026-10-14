import type { ParseKeys, TFunction } from "i18next";
import type SvgIcon from "@mui/material/SvgIcon";
import type { ContainerProps } from "@mui/material/Container";
import type { ComponentType } from "react";
import type { Params, RouteObject } from "react-router";
import type { DocumentationNavigationGroup } from "@/app/shell/documentation/DocumentationNavigation";

type AppTranslationNamespace = "translation" | "development-guide";

export type AppRouteTranslations = Readonly<{
  app: TFunction<"translation">;
  developmentGuide: TFunction<"development-guide">;
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

export type AppRouteBreadcrumbDefinition =
  | Readonly<{
      title: AppRouteTitleResolver<"translation">;
      to: (params: Readonly<Params<string>>) => string;
      translationNamespace?: "translation";
    }>
  | Readonly<{
      title: AppRouteTitleResolver<"development-guide">;
      to: (params: Readonly<Params<string>>) => string;
      translationNamespace: "development-guide";
    }>;

export type AppRouteHandle = {
  contentMaxWidth?: ContainerProps["maxWidth"];
  contentOverflow?: "auto" | "hidden";
  documentationGroups?: readonly DocumentationNavigationGroup[];
  HeaderContext?: ComponentType<{ params: Readonly<Params<string>> }>;
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

type AppNavigationLabel =
  | Readonly<{ labelKey: ParseKeys<"translation">; labelNamespace?: "translation" }>
  | Readonly<{ labelKey: ParseKeys<"development-guide">; labelNamespace: "development-guide" }>;

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

export type AppExampleGroupId =
  | "applicationState"
  | "feedback"
  | "forms"
  | "localization"
  | "overlays"
  | "routingAndUrlState"
  | "serverData"
  | "tablesAndCollections";

export type AppArchitectureGroupId = "application" | "contributing" | "features" | "pages" | "startHere" | "startup";

export type AppDocumentationGroupId = AppArchitectureGroupId | AppExampleGroupId;

export type AppExampleNavigationGroup = Omit<DocumentationNavigationGroup, "id" | "items"> &
  Readonly<{
    id: AppExampleGroupId;
    items: readonly AppGuideNavigationLink[];
  }>;

export type AppArchitectureNavigationGroup = DocumentationNavigationGroup & Readonly<{ id: AppArchitectureGroupId }>;

export type AppGuideNavigationLink = Extract<AppNavigationLink, { labelNamespace: "development-guide" }>;

export type AppNavigationItem = AppNavigationLink | AppNavigationMenu;

type AppRouteLocation = Readonly<{ index: true; path?: never }> | Readonly<{ index?: false; path: string }>;

type AppRouteImplementation =
  | Readonly<{ Component: ComponentType; lazy?: never }>
  | Readonly<{
      Component?: never;
      lazy: () => Promise<{ Component: ComponentType }>;
    }>;

export type AppRouteAccess = "authenticated" | "public";

type AppRouteLocalization =
  | Readonly<{
      translationNamespace?: "translation";
      title: AppRouteTitleResolver<"translation">;
      navigation?: Readonly<{
        activePath?: string;
        Icon: typeof SvgIcon;
        labelKey: ParseKeys<"translation">;
        to?: string;
      }>;
    }>
  | Readonly<{
      translationNamespace: "development-guide";
      title: AppRouteTitleResolver<"development-guide">;
      navigation?: Readonly<{
        activePath?: string;
        Icon: typeof SvgIcon;
        labelKey: ParseKeys<"development-guide">;
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
  headerNavigation?: boolean;
  developmentOnly?: boolean;
  ErrorBoundary?: ComponentType;
  mobileBottomNavigation?: boolean;
  mobileSurface?: AppMobileSurface;
  scrollToTop?: boolean;
}> &
  AppRouteLocalization &
  (
    | Readonly<{ groupId?: never; parentId?: string }>
    | Readonly<{ groupId: AppExampleGroupId; parentId: "examples" }>
    | Readonly<{
        groupId: AppArchitectureGroupId;
        parentId: "architecture";
      }>
  ) &
  AppRouteLocation &
  AppRouteImplementation;

export type AppRouteObject = RouteObject & {
  children?: AppRouteObject[];
  handle?: AppRouteHandle;
};
