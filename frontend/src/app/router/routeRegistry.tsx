import { ServerDataOptimisticUpdatesAndRollbackPage } from "@/pages/development-guide/patterns/serverData/ServerDataOptimisticUpdatesAndRollbackPage";
import { FormsRepeatedAndNestedFieldsPage } from "@/pages/development-guide/patterns/forms/FormsRepeatedAndNestedFieldsPage";
import { FormsAsyncLookupsPage } from "@/pages/development-guide/patterns/forms/FormsAsyncLookupsPage";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloudQueueOutlinedIcon from "@mui/icons-material/CloudQueueOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import DataObjectOutlinedIcon from "@mui/icons-material/DataObjectOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import FunctionsOutlinedIcon from "@mui/icons-material/FunctionsOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ViewQuiltOutlinedIcon from "@mui/icons-material/ViewQuiltOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import SchemaOutlinedIcon from "@mui/icons-material/SchemaOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import WebOutlinedIcon from "@mui/icons-material/WebOutlined";
import { Outlet } from "react-router";
import { LegacyDevelopmentGuideRedirect } from "./components/LegacyDevelopmentGuideRedirect";
import { DynamicProjectHeaderIdentity } from "./components/DynamicProjectHeaderIdentity";
import { SettingsLayoutRoute } from "./components/SettingsLayoutRoute";
import {
  SettingsAccessibilityPage,
  SettingsAppearancePage,
  SettingsNavigationPage,
} from "@/pages/settings/SettingsPage";

import type {
  AppArchitectureNavigationGroup,
  AppExampleNavigationGroup,
  AppPatternCategoryRouteId,
  AppNavigationItem,
  AppNavigationLink,
  AppRouteDefinition,
} from "./types/AppRoute";
import {
  directChildRouteIdForDestination,
  routeDestinationFromRegistry,
  routeIsEnabledInRegistry,
  type AppRouteHierarchyMetadata,
} from "./routeHierarchy";
import {
  architectureArticleCatalog,
  architectureGroups,
  type ArchitectureArticleId,
  type ArchitectureRelatedLink,
} from "@/features/development-guide/architecture";
import { ArchitectureArticlePage } from "@/pages/development-guide/architecture/ArchitectureArticlePage";
import { ArchitectureRouteLayout } from "@/pages/development-guide/architecture/ArchitectureRouteLayout";
import { ExamplePagesIndexPage } from "@/pages/development-guide/examplePages/ExamplePagesIndexPage";
import { PatternsIndexPage } from "@/pages/development-guide/patterns/PatternsIndexPage";
import { PatternCategoryLayoutRoute } from "./components/PatternCategoryLayoutRoute";
import { patternCategoryDefinitions } from "./patternCategories";
import { handbookCategoryEntries, handbookRouteRegistry } from "./handbookRoutes";
import { ApplicationStateEffectsAndCleanupPage } from "@/pages/development-guide/patterns/applicationState/ApplicationStateEffectsAndCleanupPage";
import { ApplicationStatePersistentStatePage } from "@/pages/development-guide/patterns/applicationState/ApplicationStatePersistentStatePage";
import { ApplicationStateSharingBetweenRoutesPage } from "@/pages/development-guide/patterns/applicationState/ApplicationStateSharingBetweenRoutesPage";
import { ApplicationStateSourceAndComputedSignalsPage } from "@/pages/development-guide/patterns/applicationState/ApplicationStateSourceAndComputedSignalsPage";
import { ConfirmationDialogsPage } from "@/pages/development-guide/patterns/feedback/ConfirmationDialogsPage";
import { ContactsPage } from "@/pages/development-guide/contacts/ContactsPage";
import { DevelopmentGuidePage } from "@/pages/development-guide/DevelopmentGuidePage";
import { DevelopmentGuideHomePage } from "@/pages/development-guide/DevelopmentGuideHomePage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ToastNotificationsPage } from "@/pages/development-guide/patterns/feedback/ToastNotificationsPage";
import { OverlayPresentationsPage } from "@/pages/development-guide/patterns/overlays/OverlayPresentationsPage";
import { OverlayResultsAndCompositionPage } from "@/pages/development-guide/patterns/overlays/OverlayResultsAndCompositionPage";
import { OverlayGuardsAndLifecyclePage } from "@/pages/development-guide/patterns/overlays/OverlayGuardsAndLifecyclePage";
import { ServerDataMutationsAndRefreshPage } from "@/pages/development-guide/patterns/serverData/ServerDataMutationsAndRefreshPage";
import { ServerDataPaginationAndFilteringPage } from "@/pages/development-guide/patterns/serverData/ServerDataPaginationAndFilteringPage";
import { ServerDataQueryStatesPage } from "@/pages/development-guide/patterns/serverData/ServerDataQueryStatesPage";
import { ServerDataRequestCancellationPage } from "@/pages/development-guide/patterns/serverData/ServerDataRequestCancellationPage";
import { RoutingNestedRoutesPage } from "@/pages/development-guide/patterns/routingAndUrlState/RoutingNestedRoutesPage";
import { RoutingRouteParametersAndBreadcrumbsPage } from "@/pages/development-guide/patterns/routingAndUrlState/RoutingRouteParametersAndBreadcrumbsPage";
import {
  RoutingRouteRecoveryErrorBoundary,
  RoutingRouteRecoveryPage,
} from "@/pages/development-guide/patterns/routingAndUrlState/RoutingRouteRecoveryPage";
import { RoutingSearchParametersPage } from "@/pages/development-guide/patterns/routingAndUrlState/RoutingSearchParametersPage";
import { LocalizationInterpolationAndPluralsPage } from "@/pages/development-guide/patterns/localization/LocalizationInterpolationAndPluralsPage";
import { LocalizationDatesAndTimesPage } from "@/pages/development-guide/patterns/localization/LocalizationDatesAndTimesPage";
import { LocalizationNumbersPercentagesAndCurrenciesPage } from "@/pages/development-guide/patterns/localization/LocalizationNumbersPercentagesAndCurrenciesPage";
import { LocalizedMuiControlsPage } from "@/pages/development-guide/patterns/localization/LocalizedMuiControlsPage";
import { FormsAsyncSubmissionAndServerErrorsPage } from "@/pages/development-guide/patterns/forms/FormsAsyncSubmissionAndServerErrorsPage";
import { FormsDependentFieldsPage } from "@/pages/development-guide/patterns/forms/FormsDependentFieldsPage";
import { FormsDirtyStateAndNavigationGuardPage } from "@/pages/development-guide/patterns/forms/FormsDirtyStateAndNavigationGuardPage";
import { FormsValidationAndErrorPresentationPage } from "@/pages/development-guide/patterns/forms/FormsValidationAndErrorPresentationPage";
import { TablesLoadingEmptyAndErrorPresentationPage } from "@/pages/development-guide/patterns/tablesAndCollections/TablesLoadingEmptyAndErrorPresentationPage";
import { TablesRowSelectionAndBulkActionsPage } from "@/pages/development-guide/patterns/tablesAndCollections/TablesRowSelectionAndBulkActionsPage";
import { TablesSortingAndPaginationPage } from "@/pages/development-guide/patterns/tablesAndCollections/TablesSortingAndPaginationPage";
import { TablesUrlBackedFiltersPage } from "@/pages/development-guide/patterns/tablesAndCollections/TablesUrlBackedFiltersPage";

const architectureArticleRoutes = import.meta.env.DEV
  ? Object.fromEntries(
      architectureArticleCatalog.map(article => {
        const definition: AppRouteDefinition = {
          Component: () => (
            <ArchitectureArticlePage
              articleId={article.id}
              relatedPatternLinks={architectureRelatedPatternLinks(
                "relatedPatternRouteIds" in article ? article.relatedPatternRouteIds : undefined,
              )}
            />
          ),
          access: "authenticated",
          commandPalette: true,
          translationNamespace: "development-guide",
          groupId: article.groupId,
          navigation: {
            Icon: ArticleOutlinedIcon,
            labelKey: article.labelKey,
          },
          parentId: "architecture",
          path: `dev-guide/frontend/architecture/${article.id}`,
          scrollToTop: true,
          title: t => t(article.labelKey),
        };
        return [article.id, definition] as const;
      }),
    )
  : {};

/** The single developer-edited registry for pages, paths, access, titles, and navigation. */
const baseRouteRegistry = {
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

const patternCategoryRoutes = Object.fromEntries(
  patternCategoryDefinitions.map((category): [AppPatternCategoryRouteId, AppRouteDefinition] => [
    category.routeId,
    {
      Component: PatternCategoryLayoutRoute,
      access: "authenticated",
      commandPalette: true,
      parentId: "examples",
      path: category.path,
      title: t => t(category.labelKey),
      translationNamespace: "development-guide",
    } satisfies AppRouteDefinition,
  ]),
) as Record<AppPatternCategoryRouteId, AppRouteDefinition>;

const developmentRouteRegistry = {
  developmentGuide: {
    Component: Outlet,
    access: "authenticated",
    contentMaxWidth: "xl",
    developmentOnly: true,
    navigation: {
      activePath: "/dev-guide/*",
      Icon: MenuBookOutlinedIcon,
      labelKey: "navigation.developmentGuide",
    },
    path: "dev-guide",
    title: t => t("navigation.developmentGuide"),
    translationNamespace: "development-guide",
  },
  developmentGuideIndex: {
    Component: () => (
      <DevelopmentGuidePage
        categories={[
          {
            id: "frontend",
            Icon: WebOutlinedIcon,
            titleKey: "navigation.frontend",
            descriptionKey: "categories.frontendDescription",
            to: "/dev-guide/frontend",
          },
          ...handbookCategoryEntries,
        ]}
      />
    ),
    access: "authenticated",
    breadcrumbs: false,
    commandPalette: true,
    index: true,
    parentId: "developmentGuide",
    title: t => t("navigation.developmentGuide"),
    translationNamespace: "development-guide",
  },
  developmentGuideFrontend: {
    Component: Outlet,
    access: "authenticated",
    defaultChildId: "developmentGuideExamplePages",
    headerBreadcrumb: true,
    headerNavigation: true,
    parentId: "developmentGuide",
    path: "dev-guide/frontend",
    title: t => t("navigation.frontend"),
    translationNamespace: "development-guide",
  },
  ...handbookRouteRegistry,
  legacyDevelopmentGuideHome: {
    Component: LegacyDevelopmentGuideRedirect,
    access: "authenticated",
    breadcrumbs: false,
    parentId: "developmentGuide",
    path: "dev-guide/home",
    title: t => t("navigation.contactsDashboard"),
    translationNamespace: "development-guide",
  },
  legacyDevelopmentGuideContacts: {
    Component: LegacyDevelopmentGuideRedirect,
    access: "authenticated",
    breadcrumbs: false,
    parentId: "developmentGuide",
    path: "dev-guide/contacts",
    title: t => t("navigation.contacts"),
    translationNamespace: "development-guide",
  },
  legacyDevelopmentGuidePatterns: {
    Component: LegacyDevelopmentGuideRedirect,
    access: "authenticated",
    breadcrumbs: false,
    parentId: "developmentGuide",
    path: "dev-guide/patterns/*",
    title: t => t("navigation.examples"),
    translationNamespace: "development-guide",
  },
  legacyDevelopmentGuideArchitecture: {
    Component: LegacyDevelopmentGuideRedirect,
    access: "authenticated",
    breadcrumbs: false,
    parentId: "developmentGuide",
    path: "dev-guide/architecture/*",
    title: t => t("navigation.architecture"),
    translationNamespace: "development-guide",
  },
  legacyFrontendHome: {
    Component: LegacyDevelopmentGuideRedirect,
    access: "authenticated",
    breadcrumbs: false,
    parentId: "developmentGuideFrontend",
    path: "dev-guide/frontend/home",
    title: t => t("navigation.contactsDashboard"),
    translationNamespace: "development-guide",
  },
  legacyFrontendContacts: {
    Component: LegacyDevelopmentGuideRedirect,
    access: "authenticated",
    breadcrumbs: false,
    parentId: "developmentGuideFrontend",
    path: "dev-guide/frontend/contacts",
    title: t => t("navigation.contactsCrud"),
    translationNamespace: "development-guide",
  },
  developmentGuideExamplePages: {
    Component: Outlet,
    access: "authenticated",
    navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.examplePages" },
    parentId: "developmentGuideFrontend",
    path: "dev-guide/frontend/example-pages",
    title: t => t("navigation.examplePages"),
    translationNamespace: "development-guide",
  },
  developmentGuideExamplePagesIndex: {
    Component: ExamplePagesIndexPage,
    access: "authenticated",
    commandPalette: true,
    index: true,
    parentId: "developmentGuideExamplePages",
    title: t => t("navigation.examplePages"),
    translationNamespace: "development-guide",
  },
  developmentGuideHome: {
    Component: DevelopmentGuideHomePage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    developmentOnly: true,
    navigation: { Icon: HomeOutlinedIcon, labelKey: "navigation.contactsDashboard" },
    parentId: "developmentGuideExamplePages",
    path: "dev-guide/frontend/example-pages/contacts-dashboard",
    title: t => t("navigation.contactsDashboard"),
  },
  contacts: {
    Component: ContactsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    contentOverflow: "hidden",
    developmentOnly: true,
    mobileSurface: "flush",
    navigation: { Icon: ContactsOutlinedIcon, labelKey: "navigation.contactsCrud" },
    parentId: "developmentGuideExamplePages",
    path: "dev-guide/frontend/example-pages/contacts-crud",
    title: t => t("navigation.contactsCrud"),
  },
  examples: {
    Component: Outlet,
    access: "authenticated",
    translationNamespace: "development-guide",
    developmentOnly: true,
    navigation: {
      Icon: ViewQuiltOutlinedIcon,
      labelKey: "navigation.examples",
    },
    parentId: "developmentGuideFrontend",
    path: "dev-guide/frontend/patterns",
    title: t => t("navigation.examples"),
  },
  examplesIndex: {
    Component: () => (
      <PatternsIndexPage
        categories={patternCategoryDefinitions.map(({ id, Icon, labelKey, path }) => ({
          id,
          Icon,
          labelKey,
          to: "/" + path,
        }))}
      />
    ),
    access: "authenticated",
    commandPalette: true,
    index: true,
    parentId: "examples",
    title: t => t("navigation.examples"),
    translationNamespace: "development-guide",
  },
  ...patternCategoryRoutes,
  architecture: {
    Component: ArchitectureRouteLayout,
    access: "authenticated",
    translationNamespace: "development-guide",
    developmentOnly: true,
    navigation: {
      Icon: AccountTreeOutlinedIcon,
      labelKey: "navigation.architecture",
    },
    parentId: "developmentGuideFrontend",
    path: "dev-guide/frontend/architecture",
    title: t => t("navigation.architecture"),
  },
  ...(architectureArticleRoutes as Record<ArchitectureArticleId, AppRouteDefinition>),
  toastNotifications: {
    Component: ToastNotificationsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: NotificationsOutlinedIcon,
      labelKey: "navigation.toastNotifications",
    },
    groupId: "feedback",
    parentId: "patternFeedback",
    path: "dev-guide/frontend/patterns/feedback/toast-notifications",
    scrollToTop: true,
    title: t => t("navigation.toastNotifications"),
  },
  confirmationDialogs: {
    Component: ConfirmationDialogsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: HelpOutlineOutlinedIcon,
      labelKey: "navigation.confirmationDialogs",
    },
    groupId: "feedback",
    parentId: "patternFeedback",
    path: "dev-guide/frontend/patterns/feedback/confirmation-dialogs",
    scrollToTop: true,
    title: t => t("navigation.confirmationDialogs"),
  },
  overlayPresentations: {
    Component: OverlayPresentationsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: LayersOutlinedIcon,
      labelKey: "navigation.overlayPresentations",
    },
    groupId: "overlays",
    parentId: "patternOverlays",
    path: "dev-guide/frontend/patterns/overlays/presentations",
    scrollToTop: true,
    title: t => t("navigation.overlayPresentations"),
  },
  overlayResultsAndComposition: {
    Component: OverlayResultsAndCompositionPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: DataObjectOutlinedIcon,
      labelKey: "navigation.overlayResultsAndComposition",
    },
    groupId: "overlays",
    parentId: "patternOverlays",
    path: "dev-guide/frontend/patterns/overlays/results-and-composition",
    scrollToTop: true,
    title: t => t("navigation.overlayResultsAndComposition"),
  },
  overlayGuardsAndLifecycle: {
    Component: OverlayGuardsAndLifecyclePage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: ShieldOutlinedIcon,
      labelKey: "navigation.overlayGuardsAndLifecycle",
    },
    groupId: "overlays",
    parentId: "patternOverlays",
    path: "dev-guide/frontend/patterns/overlays/guards-and-lifecycle",
    scrollToTop: true,
    title: t => t("navigation.overlayGuardsAndLifecycle"),
  },
  localizationInterpolationAndPlurals: {
    Component: LocalizationInterpolationAndPluralsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: TranslateOutlinedIcon,
      labelKey: "navigation.localizationInterpolationAndPlurals",
    },
    groupId: "localization",
    parentId: "patternLocalization",
    path: "dev-guide/frontend/patterns/localization-and-formatting/interpolation-and-plurals",
    scrollToTop: true,
    title: t => t("navigation.localizationInterpolationAndPlurals"),
  },
  localizationDatesAndTimes: {
    Component: LocalizationDatesAndTimesPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: TodayOutlinedIcon,
      labelKey: "navigation.localizationDatesAndTimes",
    },
    groupId: "localization",
    parentId: "patternLocalization",
    path: "dev-guide/frontend/patterns/localization-and-formatting/dates-and-times",
    scrollToTop: true,
    title: t => t("navigation.localizationDatesAndTimes"),
  },
  localizationNumbersPercentagesAndCurrencies: {
    Component: LocalizationNumbersPercentagesAndCurrenciesPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: CalculateOutlinedIcon,
      labelKey: "navigation.localizationNumbersPercentagesAndCurrencies",
    },
    groupId: "localization",
    parentId: "patternLocalization",
    path: "dev-guide/frontend/patterns/localization-and-formatting/numbers-percentages-and-currencies",
    scrollToTop: true,
    title: t => t("navigation.localizationNumbersPercentagesAndCurrencies"),
  },
  localizedMuiControls: {
    Component: LocalizedMuiControlsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: WidgetsOutlinedIcon,
      labelKey: "navigation.localizedMuiControls",
    },
    groupId: "localization",
    parentId: "patternLocalization",
    path: "dev-guide/frontend/patterns/localization-and-formatting/localized-mui-controls",
    scrollToTop: true,
    title: t => t("navigation.localizedMuiControls"),
  },
  applicationStateSourceAndComputedSignals: {
    Component: ApplicationStateSourceAndComputedSignalsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: FunctionsOutlinedIcon,
      labelKey: "navigation.applicationStateSourceAndComputedSignals",
    },
    groupId: "applicationState",
    parentId: "patternApplicationState",
    path: "dev-guide/frontend/patterns/application-state/source-and-computed-signals",
    scrollToTop: true,
    title: t => t("navigation.applicationStateSourceAndComputedSignals"),
  },
  applicationStatePersistentState: {
    Component: ApplicationStatePersistentStatePage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: SaveOutlinedIcon,
      labelKey: "navigation.applicationStatePersistentState",
    },
    groupId: "applicationState",
    parentId: "patternApplicationState",
    path: "dev-guide/frontend/patterns/application-state/persistent-state",
    scrollToTop: true,
    title: t => t("navigation.applicationStatePersistentState"),
  },
  applicationStateEffectsAndCleanup: {
    Component: ApplicationStateEffectsAndCleanupPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: SyncOutlinedIcon,
      labelKey: "navigation.applicationStateEffectsAndCleanup",
    },
    groupId: "applicationState",
    parentId: "patternApplicationState",
    path: "dev-guide/frontend/patterns/application-state/effects-and-cleanup",
    scrollToTop: true,
    title: t => t("navigation.applicationStateEffectsAndCleanup"),
  },
  applicationStateSharingBetweenRoutes: {
    Component: ApplicationStateSharingBetweenRoutesPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: ShareOutlinedIcon,
      labelKey: "navigation.applicationStateSharingBetweenRoutes",
    },
    groupId: "applicationState",
    parentId: "patternApplicationState",
    path: "dev-guide/frontend/patterns/application-state/sharing-state-between-routes",
    scrollToTop: true,
    title: t => t("navigation.applicationStateSharingBetweenRoutes"),
  },
  serverDataQueryStates: {
    Component: ServerDataQueryStatesPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: CloudQueueOutlinedIcon,
      labelKey: "navigation.serverDataQueryStates",
    },
    groupId: "serverData",
    parentId: "patternServerData",
    path: "dev-guide/frontend/patterns/server-data/query-states",
    scrollToTop: true,
    title: t => t("navigation.serverDataQueryStates"),
  },
  serverDataMutationsAndRefresh: {
    Component: ServerDataMutationsAndRefreshPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: EditOutlinedIcon,
      labelKey: "navigation.serverDataMutationsAndRefresh",
    },
    groupId: "serverData",
    parentId: "patternServerData",
    path: "dev-guide/frontend/patterns/server-data/mutations-and-refresh",
    scrollToTop: true,
    title: t => t("navigation.serverDataMutationsAndRefresh"),
  },
  serverDataOptimisticUpdatesAndRollback: {
    Component: ServerDataOptimisticUpdatesAndRollbackPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: EditOutlinedIcon,
      labelKey: "navigation.serverDataOptimisticUpdatesAndRollback",
    },
    groupId: "serverData",
    parentId: "patternServerData",
    path: "dev-guide/frontend/patterns/server-data/optimistic-updates-and-rollback",
    scrollToTop: true,
    title: t => t("navigation.serverDataOptimisticUpdatesAndRollback"),
  },
  serverDataPaginationAndFiltering: {
    Component: ServerDataPaginationAndFilteringPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: FilterListOutlinedIcon,
      labelKey: "navigation.serverDataPaginationAndFiltering",
    },
    groupId: "serverData",
    parentId: "patternServerData",
    path: "dev-guide/frontend/patterns/server-data/pagination-and-filtering",
    scrollToTop: true,
    title: t => t("navigation.serverDataPaginationAndFiltering"),
  },
  serverDataRequestCancellation: {
    Component: ServerDataRequestCancellationPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: CancelOutlinedIcon,
      labelKey: "navigation.serverDataRequestCancellation",
    },
    groupId: "serverData",
    parentId: "patternServerData",
    path: "dev-guide/frontend/patterns/server-data/request-cancellation",
    scrollToTop: true,
    title: t => t("navigation.serverDataRequestCancellation"),
  },
  routingSearchParameters: {
    Component: RoutingSearchParametersPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: SearchOutlinedIcon,
      labelKey: "navigation.routingSearchParameters",
    },
    groupId: "routingAndUrlState",
    parentId: "patternRoutingAndUrlState",
    path: "dev-guide/frontend/patterns/routing-and-url-state/search-parameters",
    scrollToTop: true,
    title: t => t("navigation.routingSearchParameters"),
  },
  routingRouteParametersAndBreadcrumbs: {
    Component: RoutingRouteParametersAndBreadcrumbsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    breadcrumbs: [
      {
        title: t => t("navigation.routingRouteParametersAndBreadcrumbs"),
        translationNamespace: "development-guide",
        to: () => "/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas",
      },
    ],
    navigation: {
      activePath: "/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/:projectId",
      Icon: BadgeOutlinedIcon,
      labelKey: "navigation.routingRouteParametersAndBreadcrumbs",
      to: "/dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/atlas",
    },
    groupId: "routingAndUrlState",
    parentId: "patternRoutingAndUrlState",
    HeaderContext: DynamicProjectHeaderIdentity,
    path: "dev-guide/frontend/patterns/routing-and-url-state/route-parameters-and-breadcrumbs/:projectId",
    scrollToTop: true,
    title: (t, { projectId }) => t("navigation.routingProject", { projectId: projectId ?? "" }),
  },
  routingNestedRoutes: {
    Component: RoutingNestedRoutesPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: AltRouteOutlinedIcon,
      labelKey: "navigation.routingNestedRoutes",
    },
    groupId: "routingAndUrlState",
    parentId: "patternRoutingAndUrlState",
    path: "dev-guide/frontend/patterns/routing-and-url-state/nested-routes/*",
    scrollToTop: true,
    title: t => t("navigation.routingNestedRoutes"),
  },
  routingRouteRecovery: {
    Component: RoutingRouteRecoveryPage,
    ErrorBoundary: RoutingRouteRecoveryErrorBoundary,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: ErrorOutlineOutlinedIcon,
      labelKey: "navigation.routingRouteRecovery",
    },
    groupId: "routingAndUrlState",
    parentId: "patternRoutingAndUrlState",
    path: "dev-guide/frontend/patterns/routing-and-url-state/route-level-recovery/*",
    scrollToTop: true,
    title: t => t("navigation.routingRouteRecovery"),
  },
  formsValidationAndErrorPresentation: {
    Component: FormsValidationAndErrorPresentationPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: FactCheckOutlinedIcon,
      labelKey: "navigation.formsValidationAndErrorPresentation",
    },
    groupId: "forms",
    parentId: "patternForms",
    path: "dev-guide/frontend/patterns/forms/validation-and-error-presentation",
    scrollToTop: true,
    title: t => t("navigation.formsValidationAndErrorPresentation"),
  },
  formsAsyncSubmissionAndServerErrors: {
    Component: FormsAsyncSubmissionAndServerErrorsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: SendOutlinedIcon,
      labelKey: "navigation.formsAsyncSubmissionAndServerErrors",
    },
    groupId: "forms",
    parentId: "patternForms",
    path: "dev-guide/frontend/patterns/forms/async-submission-and-server-errors",
    scrollToTop: true,
    title: t => t("navigation.formsAsyncSubmissionAndServerErrors"),
  },
  formsDirtyStateAndNavigationGuard: {
    Component: FormsDirtyStateAndNavigationGuardPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: EditNoteOutlinedIcon,
      labelKey: "navigation.formsDirtyStateAndNavigationGuard",
    },
    groupId: "forms",
    parentId: "patternForms",
    path: "dev-guide/frontend/patterns/forms/dirty-state-reset-or-navigation-guard",
    scrollToTop: true,
    title: t => t("navigation.formsDirtyStateAndNavigationGuard"),
  },
  formsDependentFields: {
    Component: FormsDependentFieldsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: SchemaOutlinedIcon,
      labelKey: "navigation.formsDependentFields",
    },
    groupId: "forms",
    parentId: "patternForms",
    path: "dev-guide/frontend/patterns/forms/dependent-fields",
    scrollToTop: true,
    title: t => t("navigation.formsDependentFields"),
  },
  formsAsyncLookups: {
    Component: FormsAsyncLookupsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: SchemaOutlinedIcon,
      labelKey: "navigation.formsAsyncLookups",
    },
    groupId: "forms",
    parentId: "patternForms",
    path: "dev-guide/frontend/patterns/forms/async-lookups",
    scrollToTop: true,
    title: t => t("navigation.formsAsyncLookups"),
  },
  formsRepeatedAndNestedFields: {
    Component: FormsRepeatedAndNestedFieldsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: SchemaOutlinedIcon,
      labelKey: "navigation.formsRepeatedAndNestedFields",
    },
    groupId: "forms",
    parentId: "patternForms",
    path: "dev-guide/frontend/patterns/forms/repeated-and-nested-fields",
    scrollToTop: true,
    title: t => t("navigation.formsRepeatedAndNestedFields"),
  },
  tablesLoadingEmptyAndErrorPresentation: {
    Component: TablesLoadingEmptyAndErrorPresentationPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: TableRowsOutlinedIcon,
      labelKey: "navigation.tablesLoadingEmptyAndErrorPresentation",
    },
    groupId: "tablesAndCollections",
    parentId: "patternTablesAndCollections",
    path: "dev-guide/frontend/patterns/tables-and-collections/loading-empty-and-error-presentation",
    scrollToTop: true,
    title: t => t("navigation.tablesLoadingEmptyAndErrorPresentation"),
  },
  tablesSortingAndPagination: {
    Component: TablesSortingAndPaginationPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: SwapVertOutlinedIcon,
      labelKey: "navigation.tablesSortingAndPagination",
    },
    groupId: "tablesAndCollections",
    parentId: "patternTablesAndCollections",
    path: "dev-guide/frontend/patterns/tables-and-collections/sorting-and-pagination",
    scrollToTop: true,
    title: t => t("navigation.tablesSortingAndPagination"),
  },
  tablesRowSelectionAndBulkActions: {
    Component: TablesRowSelectionAndBulkActionsPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: ChecklistOutlinedIcon,
      labelKey: "navigation.tablesRowSelectionAndBulkActions",
    },
    groupId: "tablesAndCollections",
    parentId: "patternTablesAndCollections",
    path: "dev-guide/frontend/patterns/tables-and-collections/row-selection-and-bulk-actions",
    scrollToTop: true,
    title: t => t("navigation.tablesRowSelectionAndBulkActions"),
  },
  tablesUrlBackedFilters: {
    Component: TablesUrlBackedFiltersPage,
    access: "authenticated",
    commandPalette: true,
    translationNamespace: "development-guide",
    navigation: {
      Icon: ManageSearchOutlinedIcon,
      labelKey: "navigation.tablesUrlBackedFilters",
    },
    groupId: "tablesAndCollections",
    parentId: "patternTablesAndCollections",
    path: "dev-guide/frontend/patterns/tables-and-collections/url-backed-filters",
    scrollToTop: true,
    title: t => t("navigation.tablesUrlBackedFilters"),
  },
} as const satisfies Record<string, AppRouteDefinition>;

export const appRouteRegistry = {
  ...baseRouteRegistry,
  ...(import.meta.env.DEV ? developmentRouteRegistry : {}),
} as typeof baseRouteRegistry & typeof developmentRouteRegistry;

export function routeDestination(definition: AppRouteDefinition): string {
  const routeId = Object.entries(appRouteRegistry).find(([, candidate]) => candidate === definition)?.[0];
  if (!routeId) throw new Error("Route destination requires a registered route");
  return routeDestinationFromRegistry(appRouteRegistry, routeId);
}

/** Excludes development tools and every child below them from user-facing builds. */
export function routeIsEnabled(definition: AppRouteDefinition, isDevelopment = import.meta.env.DEV): boolean {
  const routeId = Object.entries(appRouteRegistry).find(([, candidate]) => candidate === definition)?.[0];
  if (!routeId) throw new Error("Route availability requires a registered route");
  return routeIsEnabledInRegistry(appRouteRegistry, routeId, isDevelopment);
}

function directDocumentationChildIsEnabled(
  definition: AppRouteDefinition,
  parentId: "architecture" | AppPatternCategoryRouteId,
  isDevelopment = import.meta.env.DEV,
): boolean {
  return definition.parentId === parentId && routeIsEnabled(definition, isDevelopment);
}

export function architectureRelatedPatternLinks(
  routeIds: readonly string[] | undefined,
): readonly ArchitectureRelatedLink[] {
  return (routeIds ?? []).flatMap(routeId => {
    const definition = (appRouteRegistry as Record<string, AppRouteDefinition | undefined>)[routeId];
    if (
      definition?.translationNamespace !== "development-guide" ||
      !definition.navigation ||
      !routeIsEnabled(definition)
    )
      return [];

    return [
      {
        labelKey: definition.navigation.labelKey,
        to: routeDestination(definition),
      },
    ];
  });
}

function navigationLink(definition: AppRouteDefinition): Extract<AppNavigationItem, { kind: "link" }> {
  if (!definition.navigation) {
    throw new Error("A navigation route must define navigation metadata");
  }

  const metadata = {
    ...(definition.navigation.activePath ? { activePath: definition.navigation.activePath } : {}),
    Icon: definition.navigation.Icon,
    kind: "link" as const,
    to: routeDestination(definition),
  };
  return definition.translationNamespace === "development-guide"
    ? { ...metadata, labelKey: definition.navigation.labelKey, labelNamespace: "development-guide" }
    : { ...metadata, labelKey: definition.navigation.labelKey, labelNamespace: "translation" };
}

const homeNavigationItem = navigationLink(appRouteRegistry.home);
const settingsNavigationItem = navigationLink(appRouteRegistry.settings);
const developmentGuideNavigationItem = import.meta.env.DEV
  ? navigationLink(appRouteRegistry.developmentGuide)
  : undefined;

export const appNavigationItems = [homeNavigationItem] satisfies readonly AppNavigationItem[];

export const appBottomNavigationItems = [
  homeNavigationItem,
  settingsNavigationItem,
  ...(developmentGuideNavigationItem
    ? [
        {
          ...navigationLink(appRouteRegistry.developmentGuideHome),
          activePath: "/dev-guide/frontend/example-pages/contacts-dashboard",
          Icon: ContactsOutlinedIcon,
          labelKey: "navigation.contactsDashboard" as const,
          labelNamespace: "development-guide" as const,
        },
      ]
    : []),
] satisfies readonly AppNavigationLink[];

export const appExampleNavigationGroups: readonly AppExampleNavigationGroup[] = patternCategoryDefinitions.map(
  ({ id, labelKey, routeId }) => ({
    defaultExpanded: true,
    id,
    items: (Object.values(appRouteRegistry) as readonly AppRouteDefinition[]).flatMap(definition =>
      definition.groupId === id &&
      definition.translationNamespace === "development-guide" &&
      definition.navigation &&
      directDocumentationChildIsEnabled(definition, routeId)
        ? [
            {
              ...(definition.navigation.activePath ? { activePath: definition.navigation.activePath } : {}),
              Icon: definition.navigation.Icon,
              kind: "link" as const,
              labelKey: definition.navigation.labelKey,
              labelNamespace: "development-guide" as const,
              to: routeDestination(definition),
            },
          ]
        : [],
    ),
    labelKey,
  }),
) satisfies readonly AppExampleNavigationGroup[];

export const appArchitectureNavigationGroups: readonly AppArchitectureNavigationGroup[] = import.meta.env.DEV
  ? architectureGroups.map(({ id, labelKey }) => ({
      defaultExpanded: true,
      id,
      items: architectureArticleCatalog
        .filter(article => article.groupId === id)
        .map(article => ({
          labelKey: article.labelKey,
          to: routeDestination(appRouteRegistry[article.id]),
        })),
      labelKey,
    }))
  : [];

function firstNavigationRouteId(
  parentId: "architecture" | AppPatternCategoryRouteId,
  groups: readonly AppArchitectureNavigationGroup[] | readonly AppExampleNavigationGroup[],
): string | undefined {
  const destination = groups.flatMap(({ items }) => items)[0]?.to;
  if (!destination) return undefined;
  return directChildRouteIdForDestination(appRouteRegistry, parentId, destination);
}

const architectureDefaultChildId = firstNavigationRouteId("architecture", appArchitectureNavigationGroups);

export const appRouteHierarchyMetadata = {
  ...Object.fromEntries(
    patternCategoryDefinitions.map(category => {
      const documentationGroups = appExampleNavigationGroups.filter(group => group.id === category.id);
      const defaultChildId = firstNavigationRouteId(category.routeId, documentationGroups);
      return [
        category.routeId,
        {
          ...(defaultChildId ? { defaultChildId } : {}),
          documentationGroups,
        },
      ];
    }),
  ),
  architecture: {
    ...(architectureDefaultChildId ? { defaultChildId: architectureDefaultChildId } : {}),
    documentationGroups: appArchitectureNavigationGroups,
  },
} satisfies AppRouteHierarchyMetadata;
