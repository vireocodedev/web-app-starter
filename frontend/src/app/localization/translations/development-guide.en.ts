import { englishHandbookTranslations } from "./development-guide-handbook.en";

export const englishDevelopmentGuideTranslations = {
  generatedExamples: {
    title: "Generated examples",
    description: "Interactive examples of generated application components. Each example uses local fixtures.",
    kinds: {
      component: "Components",
      form: "Forms",
      shell: "Layouts",
      table: "Tables",
      page: "Pages",
      feature: "Features",
      navigation: "Navigation workspaces",
    },
    default: "Default",
    populated: "Populated",
    disabled: "Disabled",
    simulateFailure: "Simulate failure",
    saved: "Saved",
    pending: "Submitting",
    complete: "Complete submission",
    reset: "Reset",
    filter: "Filter",
    state: "State",
    empty: "Empty",
    loading: "Loading",
    error: "Error",
    content: "Content",
    sidebar: "Sidebar",
    header: "Header",
    action: "Action",
    count: "Count: {{count}}",
  },
  handbook: englishHandbookTranslations,
  categories: {
    title: "Categories",
    description: "Choose a category to explore the development guide.",
    navigationLabel: "Development guide categories",
    frontendDescription: "Example pages, interactive patterns, workflow recipes, and architecture.",
    backendDescription: "Server-side development.",
  },
  examplePages: {
    description: "Explore complete application page examples.",
    navigationLabel: "Example pages",
    dashboardDescription: "Contact summaries and statistics.",
    contactsDescription: "Search, create, edit, and delete contacts.",
  },
  patternCategories: {
    description: "Choose a category to explore frontend patterns.",
    navigationLabel: "Pattern categories",
    choosePage: "Choose an example, current example: {{page}}",
    closePages: "Close examples",
  },
  application: {
    description: "An application-owned localization recipe.",
    title: "Application localization",
  },
  home: {
    description: "Edit src/pages/HomePage.tsx to start building your application.",
    title: "Home",
  },
  architectureGuide: {
    articles: {
      addChangeOrRemoveAFeature: "Add, change, or remove a feature",
      apisModelsQueriesAndMutations: "APIs, models, queries, and mutations",
      authenticationAndSession: "Authentication and session",
      dependencyBoundariesAndImports: "Dependency boundaries and imports",
      entryPointToRenderedApplication: "From entry point to rendered application",
      featureAnatomyFilenamesAndPublicInterfaces: "Feature anatomy, filenames, and public interfaces",
      featureInventoryAndResponsibilities: "Feature inventory and responsibilities",
      httpQueryAndBrowserStorage: "HTTP, Query, and browser storage",
      localizationThemeAndPreferences: "Localization, theme, and preferences",
      routeEntriesAndFeatureComposition: "Route entries and feature composition",
      routerAndShellResponsibilities: "Router and shell responsibilities",
      runtimeProvidersAndLifetimes: "Runtime, providers, and lifetimes",
      sourceMapAndOwnership: "Source map and ownership",
      stateOwnershipAndSignalLifecycle: "State ownership and Signal lifecycle",
      testsMocksStoriesAndArchitectureChecks: "Tests, mocks, stories, and architecture checks",
    },
    contents: {
      label: "Article contents",
      title: "On this page",
    },
    groups: {
      application: "Application — src/app",
      contributing: "Contributing",
      features: "Features — src/features",
      pages: "Pages — src/pages",
      startHere: "Start here",
      startup: "Startup — main.tsx + app/bootstrap",
    },
    pageNavigation: {
      label: "Architecture article navigation",
      next: "Next",
      previous: "Previous",
    },
    relatedPatterns: {
      label: "Related interactive Patterns",
      title: "Try it in Patterns",
    },
  },
  applicationStateExamples: {
    effects: {
      application: {
        active: "Application effect active",
        description:
          "Start application-lifetime effects once, after hydration, and return their disposer to the runtime.",
        hint: "Editing the estimate triggers its registered persistence effect.",
        title: "Application-lifetime effect",
      },
      component: {
        action: "Show the estimate total in the browser title",
        description: "Own browser integration in a component effect and restore the previous value during cleanup.",
        documentTitle: "{{total}} · Estimate",
        title: "Component effect with cleanup",
      },
      contents: {
        label: "Signal effect and cleanup examples",
        title: "On this page",
      },
      nonReactive: {
        action: "Record current total",
        description:
          "Use peek for event-time bookkeeping that should read a Signal without creating a reactive dependency.",
        empty: "No total has been recorded.",
        recorded: "Recorded total: {{total}}",
        title: "Non-reactive bookkeeping",
      },
    },
    persistence: {
      contents: {
        label: "Persistent state examples",
        title: "On this page",
      },
      contract: {
        description:
          "Declare the storage key, schema, and default together so persisted state stays validated and typed.",
        title: "Typed storage contract",
      },
      effect: {
        description:
          "Register persistence as an application effect so every state change is saved outside UI components.",
        hint: "Change either estimate value to persist the complete state.",
        status: {
          idle: "Waiting for the effect",
          saved: "Saved locally",
          unavailable: "Storage unavailable",
        },
        title: "Persist through an effect",
      },
      hydration: {
        action: "Restore saved estimate",
        description:
          "Hydrate the Signal group before effects start so defaults never overwrite a valid persisted value.",
        title: "Hydrate before effects",
      },
    },
    shared: {
      formula: "{{hours}} hours × {{rate}}",
      hoursLabel: "Hours",
      rateLabel: "Hourly rate",
    },
    sharing: {
      actions: {
        description: "Expose feature actions instead of letting routed components coordinate multiple Signal writes.",
        reset: "Reset estimate",
        title: "Keep writes behind actions",
      },
      contents: {
        label: "Cross-route state examples",
        title: "On this page",
      },
      surface: {
        description:
          "Read the same feature-owned Signals from any routed surface without copying state into route components.",
        title: "Share one state surface",
      },
      transition: {
        action: "Review persistence",
        description:
          "Navigate normally between routes; the application-owned Signal group remains alive outside either page.",
        hint: "Change the estimate, follow the route, and find the same values there.",
        title: "Preserve state across a route transition",
      },
    },
    source: {
      batch: {
        apply: "Apply example estimate",
        description:
          "Group related writes in one feature action when consumers should observe them as a single update.",
        reset: "Reset estimate",
        title: "Batch related writes",
      },
      computed: {
        description: "Derive totals with a computed Signal so every consumer shares the same calculation.",
        title: "Computed Signal",
      },
      contents: {
        label: "Source and computed Signal examples",
        title: "On this page",
      },
      writable: {
        description:
          "Keep the smallest writable values as source Signals and update them through feature-owned actions.",
        title: "Source Signals",
      },
    },
  },
  serverDataExamples: {
    optimistic: {
      contents: {
        label: "Optimistic update examples",
        title: "On this page",
      },
      title: "Save immediately, recover on rejection",
      description:
        "Update the collection and detail together before the server responds. Reject a save to see both restored, or accept it to advance the server revision. One save runs at a time.",
      loading: "Loading example records",
      loadFailed: "The example could not be loaded.",
      collection: "Collection status: {{status}}",
      detail: "Detail status: {{status}}",
      revision: "Accepted server revision: {{revision}}",
      rejectSave: "Reject this save",
      save: "Toggle status and save",
      saving: "Saving…",
      pending: "The change is optimistic until the server responds.",
      failed: "Save rejected. The previous state was restored. Clear “Reject this save” and try again.",
      saved: "Saved and reconciled with the server.",
      status: {
        active: "Active",
        paused: "Paused",
      },
    },
    cancellation: {
      automatic: {
        description: "Forward the query signal to the request so changing filters cancels obsolete work automatically.",
        label: "Search records",
        title: "Cancel obsolete searches",
      },
      contents: {
        label: "Request cancellation examples",
        title: "On this page",
      },
      manual: {
        action: "Cancel current request",
        cancelled: "Request cancelled",
        description: "Cancel a cache scope explicitly when a user action makes the current request irrelevant.",
        pending: "Request in progress",
        settled: "No request in progress",
        start: "Start request",
        title: "Cancel explicitly",
      },
      unmount: {
        description: "Let TanStack Query abort an in-flight request when its last consuming surface unmounts.",
        hide: "Unmount results",
        show: "Mount results",
        title: "Cancel on unmount",
      },
    },
    mutations: {
      contents: {
        label: "Mutation and cache refresh examples",
        title: "On this page",
      },
      pending: {
        action: {
          active: "Activate first record",
          paused: "Pause first record",
        },
        description: "Disable repeated submission and show local progress while a mutation is pending.",
        saving: "Saving…",
        title: "Pending mutation state",
      },
      refresh: {
        description:
          "Write the returned detail immediately and invalidate the collection scope after a successful mutation.",
        ready: "Cached list is current",
        refreshing: "Refreshing cached list…",
        title: "Refresh related cache data",
      },
    },
    pagination: {
      contents: {
        label: "Pagination and filtering examples",
        title: "On this page",
      },
      filtering: {
        description: "Keep normalized filter values in the query key so each result set owns a stable cache entry.",
        empty: "No records match the current filter.",
        label: "Search records",
        title: "Filter a collection",
      },
      key: {
        description: "Build every collection key from one feature-owned root and normalized serializable filters.",
        title: "Own stable query keys",
      },
      paging: {
        description: "Keep the previous page visible while the next page loads to avoid disruptive layout changes.",
        title: "Move between pages",
      },
    },
    queryStates: {
      contents: {
        label: "Server query state examples",
        title: "On this page",
      },
      empty: {
        description: "Treat a successful empty response as its own useful state with a clear next step.",
        message: "No records are available yet.",
        title: "Empty state",
      },
      error: {
        description: "Keep recoverable request failures in the content surface and offer a focused retry action.",
        title: "Error state",
      },
      loading: {
        description: "Reserve the result area and show progress while the first response is pending.",
        label: "Loading records",
        ready: "The first response is ready.",
        replay: "Replay loading",
        title: "Loading state",
      },
      success: {
        description: "Render cached server data after the request completes successfully.",
        title: "Success state",
      },
    },
    shared: {
      recordMissing: "The selected record no longer exists.",
      requestFailed: "The records could not be loaded.",
      retry: "Retry",
      status: {
        active: "Active",
        paused: "Paused",
      },
    },
  },
  routingExamples: {
    nested: {
      contents: {
        label: "Nested route examples",
        title: "On this page",
      },
      layout: {
        description: "Keep shared section controls in a parent route and render the active child through an Outlet.",
        title: "Shared nested layout",
      },
      preview: {
        activity: "Activity",
        activityDescription: "Recent workspace activity is rendered by the active child route.",
        overview: "Overview",
        overviewDescription: "The workspace overview is rendered by the active child route.",
      },
      routes: {
        description: "Mount descendant Routes below a registry path ending in /* and provide a useful index redirect.",
        title: "Descendant route tree",
      },
    },
    parameters: {
      breadcrumbs: {
        description:
          "Declare breadcrumb and title resolvers with the route so application chrome can derive navigation from the same parameters.",
        label: "Project breadcrumbs",
        projects: "Projects",
        title: "Route-owned breadcrumbs",
      },
      contents: {
        label: "Route parameter and breadcrumb examples",
        title: "On this page",
      },
      route: {
        current: "Project parameter: {{projectId}}",
        description: "Read identity from a dynamic path segment and let links create valid, directly addressable URLs.",
        title: "Dynamic route parameter",
      },
    },
    recovery: {
      action: {
        description: "Reset the failed boundary and replace the broken location with a known safe child route.",
        title: "Focused recovery action",
      },
      boundary: {
        description:
          "Contain rendering failures within one descendant route tree so the application shell remains usable.",
        title: "Scoped route boundary",
      },
      contents: {
        label: "Route recovery examples",
        title: "On this page",
      },
      preview: {
        break: "Open failing route",
        failed: "This route could not be rendered.",
        ready: "The report summary route is ready.",
        recover: "Return to summary",
        safe: "Open summary",
      },
    },
    searchParams: {
      contents: {
        label: "Search parameter examples",
        title: "On this page",
      },
      filters: {
        description:
          "Store shareable filters in the URL, remove default values, and reset dependent pagination when filters change.",
        queryLabel: "Search projects",
        status: {
          active: "Active",
          all: "All",
          archived: "Archived",
        },
        title: "Search parameters as filter state",
      },
      history: {
        current: "Current page: {{page}}",
        description:
          "Replace history for transient typing and push meaningful page changes so browser navigation remains useful.",
        title: "Intentional navigation history",
      },
    },
  },
  exampleGallery: {
    code: {
      hide: "Hide code",
      language: "TSX",
      show: "Show code",
    },
    reload: "Reload example",
    source: {
      editorError:
        "Could not open the example in VSCode. Check that the dev server is running and the code command is available on its machine, then try again.",
      openEditor: "Open example source in VSCode",
      openRepository: "Open example source in repository (new tab)",
      unavailable: "Example source unavailable. The source repository is not configured.",
    },
    pageNavigation: {
      label: "Pattern page navigation",
      next: "Next",
      previous: "Previous",
    },
  },
  feedback: {
    closeNotification: "Close notification",
    confirmationExamples: {
      abortable: {
        action: "Open timed confirmation",
        cancel: "Stay signed in",
        cancelled: "The request was cancelled or expired.",
        confirm: "Continue session",
        confirmed: "Session continuation was confirmed.",
        description:
          "Pass an AbortSignal when the decision belongs to a route, overlay, or other lifecycle that may end first.",
        dialogTitle: "Continue this session?",
        idle: "No decision yet.",
        message: "This confirmation closes automatically after five seconds if no decision is made.",
        title: "Abortable confirmation",
      },
      contents: {
        label: "Confirmation dialog examples",
        title: "On this page",
      },
      destructive: {
        action: "Request deletion",
        cancel: "Keep project",
        cancelled: "The project was kept.",
        confirm: "Delete project",
        confirmed: "Project deletion was confirmed.",
        description:
          "Mark irreversible decisions as destructive so the provider emphasizes the dangerous action and focuses the safer choice.",
        dialogTitle: "Delete this project?",
        idle: "No decision yet.",
        message: "Deleting this project cannot be undone.",
        title: "Destructive action",
      },
      standard: {
        action: "Request publish confirmation",
        cancel: "Keep editing",
        cancelled: "The changes remain unpublished.",
        confirm: "Publish changes",
        confirmed: "Publication was confirmed.",
        description:
          "Ask for one explicit decision before a consequential action, then branch on the discriminated result.",
        dialogTitle: "Publish these changes?",
        idle: "No decision yet.",
        message: "Publishing makes the latest changes available to everyone.",
        title: "Standard confirmation",
      },
    },
    examples: {
      action: {
        action: "Show notification with action",
        description:
          "Offer one short recovery action. Notifications with actions remain open until handled or dismissed.",
        message: "The example item was archived.",
        title: "Notification with an action",
        undo: "Undo",
        undoneMessage: "The example item was restored.",
      },
      contents: {
        label: "Toast notification examples",
        title: "On this page",
      },
      error: {
        action: "Show error",
        description: "Report a completed operation that failed when there is no better local recovery surface.",
        message: "The example action could not be completed.",
        title: "Error notification",
      },
      persistent: {
        action: "Show persistent warning",
        description:
          "Keep important information visible until the user acknowledges it or the application dismisses it.",
        dismiss: "Dismiss warning",
        message: "Scheduled maintenance starts soon.",
        title: "Persistent warning",
      },
      position: {
        action: "Show positioned notification",
        bottomCenter: "Bottom center",
        bottomLeft: "Bottom left",
        bottomRight: "Bottom right",
        description:
          "Configure the notification slot on the application feedback provider to choose where every toast appears.",
        label: "Toast position",
        message: "This notification uses the selected position.",
        title: "Notification position",
        topCenter: "Top center",
        topLeft: "Top left",
        topRight: "Top right",
      },
      replacement: {
        description:
          "Reuse a caller-owned ID to update the visible notification instead of stacking duplicate status messages.",
        initialAction: "Start sync",
        initialMessage: "Synchronization started.",
        title: "Replace by stable ID",
        updatedAction: "Complete sync",
        updatedMessage: "Synchronization completed.",
      },
      success: {
        action: "Show success",
        description:
          "Confirm that an application-wide action completed successfully. It closes automatically after five seconds.",
        message: "The example action was completed.",
        title: "Success notification",
      },
    },
  },
  overlayExamples: {
    close: "Close overlay",
    complete: "Done",
    error: "The overlay could not be opened.",
    lifecycle: {
      busy: {
        action: "Open saving editor",
        description:
          "Set the frame busy while work is in progress to disable ordinary dismissal and prevent replacement.",
        idleMessage: "Start the simulated save, then inspect the disabled close action.",
        overlayTitle: "Edit project",
        save: "Simulate save",
        savedMessage: "The save finished. The overlay can be closed again.",
        saving: "Saving…",
        savingMessage: "Saving is in progress. Dismissal is temporarily blocked.",
        title: "Block dismissal while busy",
      },
      closeAll: {
        approved: "All overlays closed. Navigation can continue.",
        description: "Ask the page overlay owner to close every root before committing a route transition.",
        idle: "Open the dock before requesting page leave.",
        leaveAction: "Request page leave",
        message: "This page-owned dock is closed as part of the coordinated leave request.",
        openAction: "Open page dock",
        overlayTitle: "Project context",
        title: "Close overlays before page leave",
      },
      contents: {
        label: "Overlay guard and lifecycle examples",
        title: "On this page",
      },
      guard: {
        action: "Open guarded editor",
        confirmMessage: "Discard the unsaved project name?",
        confirmTitle: "Discard changes?",
        description: "Use the close guard with an abortable confirmation when dismissing would discard unsaved work.",
        discard: "Discard changes",
        fieldLabel: "Project name",
        initialName: "Harbor renewal",
        keepEditing: "Keep editing",
        overlayTitle: "Edit project",
        save: "Save",
        title: "Confirm unsaved changes",
      },
      reasons: {
        description:
          "Inspect cancellation reasons when follow-up behavior depends on dismissal, replacement, or route lifecycle.",
        firstMessage: "Replace this dock to resolve its handle with the replacement reason.",
        firstTitle: "Original project details",
        idle: "No cancellation reason yet.",
        openAction: "Open original dock",
        replaceAction: "Replace dock",
        replacementMessage: "This dock replaced the previous page-owned dock.",
        replacementTitle: "Replacement project details",
        result: "Cancellation reason: {{reason}}",
        title: "Handle cancellation reasons",
      },
    },
    presentations: {
      contents: {
        label: "Overlay presentation examples",
        title: "On this page",
      },
      dialog: {
        action: "Open dialog",
        description:
          "On desktop, a centered dialog suits a focused decision or short task. On mobile, it opens as a bottom drawer.",
        message: "The overlay keeps attention on one compact task while preserving the page behind it.",
        overlayTitle: "Review changes",
        title: "Centered dialog",
      },
      docked: {
        action: "Open docked panel",
        description:
          "On desktop, a docked panel keeps supporting work beside the page. On mobile, it opens as a bottom drawer.",
        message: "On desktop, docked panels consume workspace width and can be resized without blocking the page.",
        overlayTitle: "Project details",
        title: "Docked panel",
      },
      modalPanel: {
        action: "Open modal panel",
        description: "On desktop, a modal side panel suits a longer task. On mobile, it opens as a bottom drawer.",
        message: "Modal overlays require dismissal before page interaction continues.",
        overlayTitle: "Edit filters",
        title: "Modal side panel",
      },
    },
    results: {
      contents: {
        label: "Overlay result and composition examples",
        title: "On this page",
      },
      nested: {
        action: "Open project editor",
        childAction: "Choose customer",
        childChoose: "Select customer",
        childMessage: "Choose the customer associated with this project.",
        childTitle: "Choose customer",
        customer: "Northwind Shipping",
        description:
          "Open a child overlay from an active parent and consume its result without coupling either component to the page.",
        message: "The project editor stays open while its customer picker is stacked above it.",
        noneSelected: "No customer selected.",
        overlayTitle: "Edit project",
        selectedLabel: "Selected customer",
        title: "Nested overlays",
      },
      outcomes: {
        action: "Open draft editor",
        cancel: "Cancel",
        cancelled: "Cancelled: {{reason}}",
        complete: "Save draft",
        completed: "The overlay completed with a saved result.",
        description:
          "Branch on the discriminated result so successful completion and ordinary cancellation remain explicit.",
        idle: "No result yet.",
        message: "Save to complete the overlay, or cancel it to inspect the cancellation result.",
        overlayTitle: "Edit draft",
        title: "Completion and cancellation",
      },
      typed: {
        action: "Choose project",
        cancelled: "Project selection was cancelled.",
        choose: "Select project",
        completed: "Selected {{name}} ({{id}}).",
        description:
          "Pass typed caller props into overlay content and receive its typed completion value through the returned handle.",
        idle: "No completed selection yet.",
        message: "Project supplied by the page: {{project}}.",
        overlayTitle: "Choose project",
        projectName: "Harbor renewal",
        title: "Typed input and result",
      },
      updates: {
        description:
          "Keep a handle when the page must refresh caller-owned props without closing and reopening the active overlay.",
        message: "The page owns the revision value and can update it while this dock remains open.",
        openAction: "Open project details",
        overlayTitle: "Project details",
        revisionLabel: "Revision",
        title: "Update an active overlay",
        updateAction: "Send next revision",
      },
    },
    resize: "Resize overlay",
  },
  navigation: {
    architecture: "Architecture",
    developmentGuide: "Development guide",
    frontend: "Frontend",
    backend: "Backend",
    examplePages: "Example pages",
    contactsCrud: "Contacts CRUD",
    i18n: "i18n",
    contactsDashboard: "Contacts dashboard",
    formsAsyncLookups: "Async lookups",
    formsRepeatedAndNestedFields: "Repeated and nested fields",
    serverDataOptimisticUpdatesAndRollback: "Optimistic updates and rollback",

    stateCategory: "Application state",
    applicationState: "Signals",
    applicationStateEffectsAndCleanup: "Effects and cleanup",
    applicationStatePersistentState: "Persistent state",
    applicationStateSharingBetweenRoutes: "Shared route state",
    applicationStateSourceAndComputedSignals: "Source and computed values",
    serverData: "Server data",
    serverDataMutationsAndRefresh: "Mutations and refresh",
    serverDataPaginationAndFiltering: "Pagination and filters",
    serverDataQueryStates: "Query states",
    serverDataRequestCancellation: "Request cancellation",
    routingAndUrlState: "Routing and URLs",
    routingNestedRoutes: "Nested routes",
    routingRouteParametersAndBreadcrumbs: "Route parameters and breadcrumbs",
    routingRouteRecovery: "Route recovery",
    routingSearchParameters: "Search parameters",
    routingProject: "Project {{projectId}}",
    breadcrumbs: "Breadcrumbs",
    onThisPage: "On this page",
    closeNavigation: "Close navigation",
    collapseCategory: "Collapse {{category}}",
    confirmationDialogs: "Confirmation dialogs",
    contacts: "Contacts",
    examples: "Patterns",
    expandCategory: "Expand {{category}}",
    feedback: "Feedback",
    forms: "Forms",
    formsAsyncSubmissionAndServerErrors: "Submission and server errors",
    formsDependentFields: "Dependent fields",
    formsDirtyStateAndNavigationGuard: "Unsaved changes",
    formsValidationAndErrorPresentation: "Validation and errors",
    tablesAndCollections: "Tables and collections",
    tablesLoadingEmptyAndErrorPresentation: "Loading, empty, and errors",
    tablesRowSelectionAndBulkActions: "Selection and bulk actions",
    tablesSortingAndPagination: "Sorting and pagination",
    tablesUrlBackedFilters: "URL filters",
    goToContent: "Skip to content",
    goHome: "Go to home page",
    home: "Home",
    menu: "Open navigation",
    moreNavigation: "More navigation",
    notFound: "Page not found",
    overlayGuardsAndLifecycle: "Guards and lifecycle",
    overlayPresentations: "Presentation modes",
    overlayResultsAndComposition: "Results and composition",
    overlays: "Overlays",
    localizationAndFormatting: "i18n",
    localizationDatesAndTimes: "Dates and times",
    localizationInterpolationAndPlurals: "Interpolation and plurals",
    localizationNumbersPercentagesAndCurrencies: "Number formats",
    localizedMuiControls: "Localized MUI controls",
    primary: "Primary navigation",
    retry: "Try again",
    routeError: "This part of the application could not be displayed.",
    scrollToTop: "Scroll to top",
    settings: "Settings",
    toastNotifications: "Toast notifications",
    shellDescription: "A localized, accessible application shell.",
    shellTitle: "RGO application",
    loading: "Loading page…",
    switchToDarkMode: "Switch to dark color mode",
    switchToLightMode: "Switch to light color mode",
  },
  contacts: {
    actions: {
      delete: "Delete {{name}}",
      edit: "Edit {{name}}",
      more: "More actions for {{name}}",
    },
    create: "Add contact",
    dashboard: {
      description: "See the shape of your contact directory and move straight into the work that needs attention.",
      directory: {
        description: "A quick view of the people currently in your directory.",
        title: "Directory snapshot",
      },
      empty: {
        action: "Add the first contact",
        description: "Create your first contact to populate this dashboard with useful directory insights.",
        title: "Your contact directory is ready",
      },
      eyebrow: "Workspace overview",
      loadFailed: "The contact dashboard could not be loaded.",
      loading: "Loading contact dashboard…",
      metrics: {
        active: "Active contacts",
        inactive: "Inactive contacts",
        organizations: "Organizations",
        total: "Total contacts",
      },
      open: "Open contacts",
      organizations: {
        count_one: "{{count}} contact",
        count_few: "{{count}} contacts",
        count_other: "{{count}} contacts",
        description: "Where your contacts are concentrated.",
        title: "Organization breakdown",
      },
      retry: "Try again",
      status: {
        description: "The current balance across your directory.",
        title: "Status distribution",
        value: "{{count}} · {{percentage}}%",
      },
      title: "Your contacts at a glance",
    },
    bulk: {
      actions: "Actions",
      changeStatus: "Change status",
      clearSelection: "Clear",
      delete: {
        action: "Delete",
        cancel: "Keep contacts",
        confirm: "Delete {{count}} contacts",
        failed: "The selected contacts could not be deleted.",
        message: "Delete {{count}} selected contacts? This action cannot be undone.",
        success: "{{count}} contacts were deleted.",
        title: "Delete selected contacts?",
      },
      selected: "{{count}} selected",
      setActive: "Set active",
      setInactive: "Set inactive",
      statusFailed: "The selected contacts could not be updated.",
      statusSuccess: "{{count}} contacts set to {{status}}.",
    },
    delete: {
      cancel: "Keep contact",
      confirm: "Delete contact",
      failed: "{{name}} could not be deleted.",
      message: "Delete {{name}}? This action cannot be undone.",
      success: "{{name}} was deleted.",
      title: "Delete contact?",
    },
    details: {
      edit: "Edit contact",
      loadFailed: "Contact details could not be loaded.",
      loading: "Loading contact details…",
      open: "Open details for {{name}}",
      retry: "Try again",
      title: "Contact details",
      unavailable: "This contact is no longer available.",
    },
    fields: {
      email: "Email",
      name: "Name",
      organization: "Organization",
      role: "Role",
      status: "Status",
    },
    form: {
      createAction: "Create contact",
      createTitle: "New contact",
      editTitle: "Edit contact",
      updateAction: "Save changes",
    },
    filters: {
      action: "Filters",
      clear: "Clear filters",
      clearSearch: "Clear search",
      search: "Search contacts",
      searchPlaceholder: "Name, email, organization, or role",
      status: {
        ACTIVE: "Active only",
        all: "All statuses",
        INACTIVE: "Inactive only",
      },
      title: "Filters",
    },
    overlay: {
      close: "Close contact panel",
      discard: "Discard changes",
      discardTitle: "Discard unsaved contact changes?",
      discardMessage: "Your unsaved contact changes will be lost.",
      error: "The contact panel could not be opened.",
      keepEditing: "Keep editing",
      resize: "Resize contact panel",
    },
    pagination: {
      displayed: "{{from}}–{{to}} of {{count}}",
      first: "Go to first page",
      last: "Go to last page",
      next: "Go to next page",
      previous: "Go to previous page",
      rowsPerPage: "Contacts per page",
    },
    save: {
      conflict:
        "This contact changed while you were editing. Copy your changes, close this editor, then reopen the contact to apply them to the latest version.",
      created: "Contact created.",
      failed: "The contact could not be saved.",
      updated: "Contact updated.",
    },
    selection: {
      select: "Select {{name}}",
      selectAll: "Select all filtered contacts",
    },
    status: {
      ACTIVE: "Active",
      INACTIVE: "Inactive",
    },
    table: {
      createFirst: "Create first contact",
      actions: "Actions",
      count: "{{count}} contacts",
      empty: "No contacts yet. Add the first contact to get started.",
      filteredCount: "{{count}} of {{total}} contacts",
      label: "Contacts",
      loadFailed: "Contacts could not be loaded.",
      loading: "Loading contacts…",
      noMatches: "No contacts match the current filters.",
      retry: "Try again",
      scrollHint: "Swipe to see more columns",
    },
    validation: {
      emailInvalid: "Enter a valid email address.",
      emailRequired: "Email is required.",
      nameMax: "Name must contain at most {{max}} characters.",
      nameRequired: "Name is required.",
      organizationMax: "Organization must contain at most {{max}} characters.",
      organizationRequired: "Organization is required.",
      roleMax: "Role must contain at most {{max}} characters.",
      roleRequired: "Role is required.",
    },
  },
  projects: {
    collection: {
      empty: "No projects yet.",
      loadFailed: "Projects could not load.",
      loading: "Loading projects…",
    },
    create: "Create project",
    createFailed: "Project could not be created.",
    detail: {
      label: "Current project: {{name}}",
      loadFailed: "Project could not be loaded.",
      loading: "Loading project…",
      retry: "Try again",
    },
    name: "Project name",
    update: "Update project",
    updateFailed: "Project could not be updated.",
    validation: {
      nameMax: "Project name must contain at most {{max}} characters.",
      nameRequired: "Project name is required.",
    },
  },
  formatting: {
    dateTime: "Date and time",
    price: "Price",
    timezone: "Time zone: {{timezone}}",
  },
  locale: {
    active: "Active locale: {{locale}}",
    choose: "Choose language",
    configurationTitle: "Locale configuration",
    document: "The document language and direction follow the active locale.",
    fallback: "Fallback locale: {{locale}}",
    resolved: "Resolved locale: {{locale}}",
    resolutionDescription: "Explicit local storage preference, supported browser preference, then English fallback.",
  },
  formsExamples: {
    repeated: {
      contents: {
        label: "Repeated and nested field examples",
        title: "Repeated and nested fields",
      },
      lineItems: {
        title: "Editable line items",
        description:
          "Add and remove rows with stable identities and indexed field paths. Nested validation stays with each row, and accepting the complete payload establishes the baseline for reset. Remove every row to see the minimum-one-item rule.",
      },
      defaultItem: "Design review",
      row: "Item {{number}}",
      fields: {
        description: "Description",
        quantity: "Quantity",
        unitPrice: "Unit price (EUR)",
      },
      errors: {
        descriptionRequired: "Enter an item description.",
        quantityInvalid: "Enter a whole quantity greater than zero.",
        priceInvalid: "Enter a price of zero or more.",
        itemRequired: "Add at least one item before accepting.",
      },
      removeRow: "Remove item {{number}}",
      remove: "Remove item",
      add: "Add item",
      total: "Total: {{total}}",
      reset: "Reset to accepted baseline",
      submit: "Accept items",
      accepted: "Accepted items",
      acceptedItem: "{{description}}: {{quantity}} × {{price}}",
    },
    asyncLookups: {
      contents: {
        label: "Async lookup examples",
        title: "On this page",
      },
      search: {
        title: "Search-backed autocomplete",
        description:
          "Keep search text separate from the selected person. Query results show loading, matches, and an empty state; try a name or a search such as zzz. The selected person remains valid when a different search omits them.",
      },
      dependent: {
        title: "Dependent assignee lookup",
        description:
          "Change department to clear an incompatible assignee immediately. Department and search both identify the query, and obsolete requests are aborted. Searching within the same department retains the selection. Submit validates the complete assignment.",
      },
      error: {
        title: "Failed lookup and retry",
        description:
          "The first completed request deliberately fails. Retry recovers using the same query, and reloading this preview resets the failure. Changing search or leaving the preview cancels obsolete requests.",
      },
      person: "Person search",
      assignee: "Assignee search",
      department: "Department",
      clear: "Clear selection",
      open: "Open suggestions",
      close: "Close suggestions",
      loading: "Loading people…",
      empty: "No people match this search.",
      results_one: "{{count}} matching person",
      results_few: "{{count}} matching people",
      results_other: "{{count}} matching people",
      failed: "The lookup failed. Retry to load people.",
      retry: "Retry lookup",
      selection: "Selected person: {{name}}",
      none: "None",
      submit: "Validate assignment",
      accepted: "Accepted assignee: {{id}}",
      invalidAssignee: "Choose an assignee from the selected department.",
    },
    async: {
      contents: {
        label: "Async form submission examples",
        title: "On this page",
      },
      defaults: {
        existingName: "Existing workspace",
        newName: "New workspace",
      },
      errors: {
        nameRequired: "Workspace name is required.",
        slugFormat: "Use lowercase letters, numbers, and hyphens.",
        slugRequired: "Workspace slug is required.",
      },
      fields: {
        name: "Workspace name",
        slug: "Workspace slug",
      },
      pending: {
        description:
          "Await the mutation inside onSubmit so the form disables duplicate submission and exposes one pending lifecycle.",
        title: "Pending submission",
      },
      reset: {
        description:
          "After a successful mutation, reset to an explicit accepted baseline instead of clearing fields before the server responds.",
        title: "Reset after success",
      },
      saved: "Workspace saved.",
      serverErrors: {
        conflict: "That workspace slug is already in use.",
        description: "Translate known API errors deliberately and keep the submitted values available for correction.",
        hint: "Use “existing” for a conflict or “offline” for an unavailable service.",
        title: "Typed server errors",
        unavailable: "The workspace service is unavailable. Try again.",
      },
      submit: "Save workspace",
    },
    dependent: {
      conditional: {
        description:
          "Render exception details only when needed and clear their stale value when the request returns to standard.",
        standardHint: "Standard requests do not need an exception reason.",
        submit: "Validate request",
        title: "Conditional field",
        valid: "The request is valid.",
      },
      contents: {
        label: "Dependent field examples",
        title: "On this page",
      },
      department: {
        description: "Clear an assignee synchronously when changing department makes that selection invalid.",
        hint: "Choose an assignee, then change the department to see the stale value clear.",
        title: "Dependent options",
      },
      departments: {
        engineering: "Engineering",
        operations: "Operations",
      },
      errors: {
        assigneeInvalid: "Choose an assignee from the selected department.",
        assigneeRequired: "Choose an assignee.",
        departmentRequired: "Choose a department.",
        reasonRequired: "Explain why this request needs an exception.",
      },
      fields: {
        assignee: "Assignee",
        chooseAssignee: "Choose an assignee",
        department: "Department",
        reason: "Exception reason",
        requestType: "Request type",
      },
      requestTypes: {
        exception: "Exception",
        standard: "Standard",
      },
      summary: {
        description: "Derive read-only UI from the complete form value and the same schema used at submission.",
        incomplete: "Complete the required selections.",
        ready: "The assignment is valid and ready to submit.",
        submit: "Submit assignment",
        submitted: "Assignment submitted.",
        title: "Derived valid summary",
      },
    },
    dirty: {
      actions: {
        description: "Ignore same-path actions and guard a real transition to a sibling Patterns route.",
        samePage: "Refresh this view",
        sibling: "Open dependent fields",
        title: "Guard real navigation",
      },
      contents: {
        label: "Dirty form and navigation guard examples",
        title: "On this page",
      },
      defaultTitle: "Quarterly update",
      errors: {
        titleRequired: "Draft title is required.",
      },
      fields: {
        title: "Draft title",
      },
      guard: {
        description:
          "Block route transitions while the form is dirty and resolve one abortable confirmation before proceeding or resetting.",
        dialogTitle: "Discard unsaved changes?",
        instructions: "Change the title, then open the sibling route to trigger the navigation guard.",
        keepEditing: "Keep editing",
        leave: "Discard and leave",
        message: "Your unsaved draft changes will be lost.",
        title: "Navigation guard",
      },
      reset: {
        action: "Reset changes",
        description:
          "Reset restores the accepted baseline; a successful save replaces that baseline with the parsed value.",
        save: "Accept as baseline",
        saved: "The saved value is now the reset baseline.",
        title: "Reset to accepted values",
      },
    },
    validation: {
      contents: {
        label: "Validation and error presentation examples",
        title: "On this page",
      },
      crossField: {
        description:
          "Place a cross-field issue on the field the user must correct so the error appears beside confirmation.",
        title: "Cross-field error",
      },
      errors: {
        emailInvalid: "Enter a valid email address.",
        emailMismatch: "Email addresses must match.",
        emailRequired: "Email is required.",
        nameRequired: "Name is required.",
      },
      fields: {
        confirmEmail: "Confirm email",
        email: "Work email",
        name: "Name",
      },
      localized: {
        description:
          "Create the Zod schema from the translation function so every validation message follows the active locale.",
        title: "Localized Zod schema",
      },
      submit: "Validate profile",
      success: "Profile values are valid.",
      timing: {
        description: "Validate on the first submit, then revalidate changed fields while the user corrects them.",
        title: "Submit-first validation",
      },
    },
  },
  tablesExamples: {
    selection: {
      activation: {
        active: "Active row: {{name}}",
        description:
          "Use controlled row activation for one primary record without coupling it to checkbox selection or nested actions.",
        label: "Open {{name}}",
        none: "No active row.",
        title: "Row activation",
      },
      bulk: {
        action: "Archive selected ({{count}})",
        description:
          "Resolve selected records in the application, disable unavailable commands, and clear selection after success.",
        title: "Bulk action",
      },
      contents: {
        label: "Row selection and bulk action examples",
        title: "On this page",
      },
      multi: {
        column: "Select rows",
        count: "{{count}} rows selected",
        description:
          "Keep checkbox selection in application state so it remains distinct from row activation and can drive bulk commands.",
        select: "Select {{name}}",
        selectAll: "Select all visible rows",
        title: "Checkbox multi-selection",
      },
    },
    shared: {
      columns: {
        name: "Project",
        owner: "Owner",
        status: "Status",
      },
      empty: "No projects match the current view.",
      loading: "Loading projects…",
      loadingLabel: "Loading projects",
      pagination: {
        displayed: "{{from}}–{{to}} of {{count}}",
        first: "Go to first page",
        last: "Go to last page",
        next: "Go to next page",
        previous: "Go to previous page",
        rowsPerPage: "Projects per page",
      },
      status: {
        active: "Active",
        all: "All statuses",
        paused: "Paused",
        review: "In review",
      },
      tableLabel: "Project collection",
    },
    sorting: {
      contents: {
        label: "Sorting and pagination examples",
        title: "On this page",
      },
      local: {
        description: "Provide local comparators when the complete collection is already available in the browser.",
        title: "Local sorting",
      },
      pagination: {
        description:
          "Enable local pagination for a bounded collection and localize every visible and accessible label.",
        title: "Local pagination",
      },
      server: {
        description:
          "Control the complete table state and map sortable columns to approved server fields for remote collections.",
        title: "Controlled server state",
      },
    },
    states: {
      contents: {
        label: "Table query state examples",
        title: "On this page",
      },
      empty: {
        create: "Create first project",
        message: "No projects yet. Create the first project to get started.",
        description:
          "Center a successful empty result in the table body and offer a primary action to create the first record.",
        title: "Successful empty result",
      },
      error: {
        description:
          "Own recoverable request errors outside the table and provide an explicit retry while retaining prior rows.",
        message: "Refresh failed; showing previous results.",
        retry: "Retry",
        title: "Recoverable error",
      },
      initial: {
        description: "Use the table loading row when no successful collection is available yet.",
        title: "Initial loading",
      },
      refresh: {
        description:
          "Retain the last successful rows during a background refresh so the collection does not disappear.",
        title: "Refresh while retaining rows",
      },
    },
    url: {
      contents: {
        label: "URL-backed table examples",
        title: "On this page",
      },
      filters: {
        description:
          "Parse only allowlisted values, omit defaults when serializing, and reset the page when filters change.",
        empty: "No projects match these filters.",
        query: "Search projects",
        status: "Status",
        title: "Canonical URL filters",
      },
      table: {
        description:
          "Convert the one-based URL page to zero-based table state and keep sorting and pagination shareable.",
        title: "URL-backed controlled table state",
      },
    },
  },
  localizationExamples: {
    dates: {
      contents: {
        label: "Date and time formatting examples",
        title: "On this page",
      },
      date: {
        description: "Format a calendar date with the active application locale and an explicit time zone.",
        title: "Locale date",
      },
      dateTime: {
        description:
          "Keep the instant fixed while choosing the time zone that determines its displayed date and clock time.",
        timeZoneLabel: "Time zone",
        title: "Date and time in a time zone",
      },
      fixedInstant: "Fixed instant: 24 September 2026, 14:30 UTC",
      time: {
        description:
          "Format a clock time with the locale’s hour cycle and punctuation instead of assembling it manually.",
        title: "Locale time",
      },
      applicationTimeZone: "{{timeZone}}",
    },
    interpolation: {
      contents: {
        label: "Interpolation and plural examples",
        title: "On this page",
      },
      multiple: {
        actor: "Marta",
        description: "Pass every dynamic value by name so translators can reorder the sentence safely.",
        message: "{{actor}} added a note to {{project}}.",
        project: "Harbor renewal",
        title: "Multiple named values",
      },
      named: {
        description:
          "Insert a named value through the translation call and keep sentence structure in the locale resource.",
        fallbackName: "there",
        initialName: "Marta",
        message: "Welcome, {{name}}!",
        nameLabel: "Name",
        title: "Named interpolation",
      },
      plural: {
        decrease: "Decrease item count",
        description: "Pass count as a number and let i18next select the locale’s cardinal plural form.",
        increase: "Increase item count",
        message_one: "{{count}} item selected",
        message_few: "{{count}} items selected",
        message_other: "{{count}} items selected",
        reset: "Reset",
        title: "Cardinal plurals",
      },
    },
    mui: {
      autocomplete: {
        description:
          "Type a value that is not in the list to see the theme-provided empty-state text in the active language.",
        firstProject: "Harbor renewal",
        label: "Project",
        secondProject: "Station modernization",
        thirdProject: "River embankment",
        title: "Autocomplete empty state",
      },
      bridge: {
        active: "Active MUI locale: {{locale}}",
        description:
          "Install MUI locale options in the one application theme so every core control follows the active language.",
        title: "Application locale bridge",
      },
      contents: {
        label: "Localized MUI control examples",
        title: "On this page",
      },
      pagination: {
        description:
          "Pagination receives localized accessible labels for its first, previous, next, and last controls from the application theme.",
        title: "Pagination navigation",
      },
      table: {
        description: "Table pagination uses the active MUI locale for row labels, ranges, and navigation actions.",
        title: "Table pagination",
      },
    },
    numbers: {
      contents: {
        label: "Number formatting examples",
        title: "On this page",
      },
      currency: {
        description:
          "Pass an explicit ISO currency code so the locale determines the symbol, spacing, and decimal separators.",
        label: "Currency",
        title: "ISO currency",
      },
      decimal: {
        description:
          "Apply locale grouping and decimal separators while keeping the numeric value independent of presentation.",
        label: "Project budget units",
        title: "Grouped decimal",
      },
      percentage: {
        description: "Provide a ratio between zero and one and let the formatter apply the localized percent style.",
        label: "Completion percentage",
        title: "Ratio percentage",
      },
    },
  },
  pagination: {
    heading: "MUI localized component text",
  },
  tasks: {
    addTask: "Add a task",
    greeting: "Hello, {{name}}!",
    taskCount_one: "{{count}} task remaining",
    taskCount_few: "{{count}} tasks remaining",
    taskCount_other: "{{count}} tasks remaining",
  },
} as const;
