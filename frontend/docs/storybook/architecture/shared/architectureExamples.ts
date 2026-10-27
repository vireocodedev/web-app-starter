export type ArchitectureTopic =
  "source-ownership" | "dependency-direction" | "public-module-apis" | "runtime-and-state";

type ArchitectureCase = Readonly<{
  id: string;
  label: string;
  question: string;
  decision: string;
  rationale: string;
  diagram: readonly string[];
  files: readonly Readonly<{ path: string; role: string }>[];
  snippet: Readonly<{ title: string; language: "tsx" | "ts" | "text"; code: string }>;
  pitfalls: readonly string[];
}>;

type ArchitectureTopicDefinition = Readonly<{
  title: string;
  summary: string;
  cases: readonly ArchitectureCase[];
}>;

/** Inert, source-backed teaching examples; this data does not inspect or execute application modules. */
export const architectureTopics: Readonly<Record<ArchitectureTopic, ArchitectureTopicDefinition>> = {
  "source-ownership": {
    title: "Source ownership",
    summary: "Find the responsible capability before choosing a file or role folder.",
    cases: [
      {
        id: "contacts-feature",
        label: "Contacts: a complete capability",
        question: "Where do a contact editor, validation and persistence belong?",
        decision: "Keep feature behavior together; let a consumer route page compose its public interface.",
        rationale:
          "The app owns stable infrastructure. Contacts is a Storybook-only reference for feature behavior; ContactsPreview composes it inside a private router. A consumer installs its own owner and thin page explicitly.",
        diagram: [
          "src/app — stable application infrastructure and composition",
          "docs/storybook/examples/Contacts — contact UI, domain values and data boundary",
          "docs/storybook/examples/Contacts/ContactsPreview.tsx — preview-only composition",
        ],
        files: [
          {
            path: "frontend/docs/storybook/examples/Contacts/ContactsPreview.tsx",
            role: "Storybook composition with private data and router dependencies.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/components/ContactForm.tsx",
            role: "Feature-owned form presentation and form-instance lifecycle.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/models/Contact.ts",
            role: "Contact values and translated validation schema factory.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/api/contact.api.ts",
            role: "Domain persistence port, independent of Axios and Zod types.",
          },
        ],
        snippet: {
          title: "Contacts folder shape (selected roles)",
          language: "text",
          code: `docs/storybook/examples/Contacts/
├── index.ts
├── contacts.feature.ts
├── api/
├── components/
├── hooks/
└── models/`,
        },
        pitfalls: [
          "Do not create src/shared, src/common or src/utils to avoid choosing an owner.",
          "Do not move contact validation or persistence into a route page or the application shell.",
          "Documentation examples stay outside production source. Production code cannot import this tree.",
        ],
      },
      {
        id: "settings-presentation",
        label: "Settings: presentation over app preferences",
        question: "Does every feature need the same folder skeleton and runtime factory?",
        decision: "Add only the responsibilities the feature actually owns.",
        rationale:
          "Settings presents application preferences through public controls and section hooks. Preference services belong to application owners. Settings does not need an API folder or a constructed feature runtime merely to match Contacts.",
        diagram: [
          "Application theme, localization and shell preference owners — live preferences",
          "src/features/settings/sections — preference-control presentation",
          "src/pages/settings/SettingsPage.tsx — route-specific section composition",
        ],
        files: [
          {
            path: "frontend/src/features/settings/index.ts",
            role: "Named public controls, section hooks and presentation types.",
          },
          {
            path: "frontend/src/features/settings/sections/interface/hooks/useInterfaceSettingsSection.tsx",
            role: "Interface settings rows and application-preference integration.",
          },
          {
            path: "frontend/src/pages/settings/SettingsPage.tsx",
            role: "SettingsAppearancePage, SettingsNavigationPage and SettingsAccessibilityPage.",
          },
          {
            path: "frontend/src/app/theme/preferences/useAppDisplayPreferences.ts",
            role: "Application-owned display preference access.",
          },
        ],
        snippet: {
          title: "Selected Settings public exports",
          language: "ts",
          code: `export { AppSettingsPanel } from "./components/AppSettingsPanel";
export { SettingsPageNavigation } from "./components/SettingsPageNavigation";
export { useInterfaceSettingsSection } from "./sections/interface/hooks/useInterfaceSettingsSection";`,
        },
        pitfalls: [
          "Do not create empty role folders or a settings.feature.ts for symmetry.",
          "Do not duplicate application preference state inside the Settings feature.",
        ],
      },
      {
        id: "verification-fixtures",
        label: "Tests, mocks and stories",
        question: "Where do focused tests and teaching fixtures go?",
        decision: "Keep focused tests in mirrored test owners and group stories by section outside application source.",
        rationale:
          "Cross-owner scenarios belong in integration or browser tests. Development MSW fixtures live in top-level mocks. Production code must not depend on tests, stories or example-only support.",
        diagram: [
          "docs/storybook/examples/Contacts/api/contact.mutation.ts — reference owner",
          "tests/storybook/contacts/api/contact.mutation.test.ts — focused reference tests",
          "tests/integration and tests/browser — assembled scenarios",
          "docs/storybook/architecture/<Tutorial> and shared — documentation and preview fixtures",
        ],
        files: [
          {
            path: "frontend/tests/storybook/contacts/api/contact.mutation.test.ts",
            role: "Focused mutation-invalidation checks.",
          },
          { path: "frontend/tests/setup.ts", role: "DOM matchers and the test MSW server lifecycle." },
          { path: "frontend/mocks/browser.ts", role: "Development application MSW startup boundary." },
          {
            path: "frontend/docs/storybook/architecture/shared/ArchitectureExample.tsx",
            role: "This standalone teaching fixture, absent from production imports.",
          },
        ],
        snippet: {
          title: "Mirrored source and verification owners",
          language: "text",
          code: `frontend/src/app/router/queryParams.ts
frontend/tests/app/router/queryParams.test.ts

frontend/tests/integration/<area>/
frontend/tests/browser/
frontend/mocks/`,
        },
        pitfalls: [
          "Tests use @/ for production imports and @test/ for reusable test support.",
          "A browser preview is not evidence that source boundaries or business behavior were verified.",
        ],
      },
    ],
  },
  "dependency-direction": {
    title: "Dependency direction",
    summary: "Make owner crossings explicit and keep composition at the boundary that owns it.",
    cases: [
      {
        id: "page-composition",
        label: "Pages consume public feature APIs",
        question: "May a page import a feature component from its private folder?",
        decision: "Cross feature boundaries through deliberate named index.ts exports.",
        rationale:
          "A consumer page uses @/features/<feature>, while relative imports stay inside the feature. Contacts is now a docs-only reference; its preview composition is not an installed app route.",
        diagram: [
          "Consumer page → @/features/<feature> (application source import)",
          "contacts/index.ts → ./components/ContactsFeature (named public export)",
          "Contacts internals → their own relative model, hook and API imports",
        ],
        files: [
          {
            path: "frontend/docs/storybook/examples/Contacts/ContactsPreview.tsx",
            role: "Consumer crossing the feature boundary.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/index.ts",
            role: "Deliberate feature public surface.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/components/ContactForm.tsx",
            role: "Private implementation reached only within its owner.",
          },
        ],
        snippet: {
          title: "Consumer page recipe (requires installing the feature)",
          language: "tsx",
          code: `import { ContactsFeature } from "@/features/contacts";

export function ContactsPage() {
  return <ContactsFeature />;
}`,
        },
        pitfalls: [
          "A relative path crossing another feature's boundary is still a boundary crossing.",
          "An index.ts file is a deliberate contract, not permission to export every internal member.",
        ],
      },
      {
        id: "shell-presentation",
        label: "Router composition supplies shell inputs",
        question: "Should AppShell load the route registry and authentication behavior itself?",
        decision: "Let the router adapter supply navigation and account actions to shell presentation.",
        rationale:
          "The shell may use router hooks and type-only route contracts for rendering. Product route inventory, page imports and authentication composition belong to the router adapter, which supplies plain navigation data and React slots.",
        diagram: [
          "AuthenticatedAppShell → route registry and authentication composition (source imports)",
          "AuthenticatedAppShell → AppShell (source import)",
          "AppShell → router type contracts and supplied presentation inputs; no runtime registry/page/auth import",
        ],
        files: [
          {
            path: "frontend/src/app/router/components/AuthenticatedAppShell.tsx",
            role: "Composes account actions and route-based command-palette behavior.",
          },
          {
            path: "frontend/src/app/shell/components/AppShell.tsx",
            role: "Renders navigation and supplied account/header slots.",
          },
          { path: "frontend/src/app/router/routeRegistry.tsx", role: "Owns route records and page composition." },
        ],
        snippet: {
          title: "Selected shell presentation inputs (excerpt)",
          language: "tsx",
          code: `<AppShell
  navigationItems={navigationItems}
  accountActions={<AppAuthActions />}
/>`,
        },
        pitfalls: [
          "Do not make shell presentation discover product routes by importing routeRegistry.tsx.",
          "Do not interpret these source-dependency arrows as a request or render sequence.",
        ],
      },
      {
        id: "runtime-injection",
        label: "Feature construction is an explicit seam",
        question: "How does composition provide dependencies to a feature reference?",
        decision: "Construct the reference runtime once with an explicit API and Query client.",
        rationale:
          "The production feature registry is empty. ContactsPreview injects a private memory ContactApi and QueryClient into the reference factory. Installing a real feature requires a deliberate appFeatures registration and typed hook.",
        diagram: [
          "ContactsPreview.tsx → Contacts factory and private memory adapter (preview imports)",
          "contacts.feature.ts → injected ContactApi, query and mutation factories",
          "Contacts reference hook → private preview Context lookup",
        ],
        files: [
          {
            path: "frontend/src/app/bootstrap/runtime/appFeatures.ts",
            role: "Empty production feature registry and exceptional hook-edge declarations.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/contacts.feature.ts",
            role: "Receives its adapter and constructs frozen feature options.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/hooks/useContactsFeature.ts",
            role: "Typed feature-owned lookup wrapper.",
          },
        ],
        snippet: {
          title: "The current factory's construction body (excerpt)",
          language: "ts",
          code: `// api and queryClient are injected by the owner.
return Object.freeze({
  ContactMutation: createContactMutation(api, queryClient),
  ContactQuery: createContactQuery(api),
});`,
        },
        pitfalls: [
          "Prefer public UI composition or injected collaborators over a cross-feature hook dependency.",
          "An exceptional direct feature-hook edge needs named public imports and a known, unique, acyclic declaration in allowedCrossFeatureHooks; the current map is empty.",
        ],
      },
    ],
  },
  "public-module-apis": {
    title: "Public module APIs",
    summary: "Expose what consumers need while retaining freedom to change private implementation.",
    cases: [
      {
        id: "named-feature-exports",
        label: "Named exports define the feature contract",
        question: "What should a feature index make public?",
        decision: "Export only the members required by actual external consumers.",
        rationale:
          "Contacts exposes page-level UI, its construction seam and the typed runtime hook. Named exports make that surface reviewable. ContactForm is private and is not currently exported from the index.",
        diagram: [
          "Storybook preview consumes ContactsFeature and ContactsDashboard",
          "Preview composition consumes createContactsFeature and ContactsFeatureRuntime",
          "Approved consumers use useContactsFeature; implementation remains inside the owner",
        ],
        files: [
          {
            path: "frontend/docs/storybook/examples/Contacts/index.ts",
            role: "Exact public contract, including deliberate named exports.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/contacts.feature.ts",
            role: "Runtime factory and runtime type source.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/hooks/useContactsFeature.ts",
            role: "One public typed runtime lookup.",
          },
        ],
        snippet: {
          title: "Selected Contacts public exports",
          language: "ts",
          code: `export { ContactsFeature } from "./components/ContactsFeature";
export { ContactsDashboard } from "./components/ContactsDashboard";
export { createContactsFeature, type ContactsFeature as ContactsFeatureRuntime } from "./contacts.feature";
export { useContactsFeature } from "./hooks/useContactsFeature";`,
        },
        pitfalls: [
          "Do not replace named exports with export *; a barrel can leak accidental contracts.",
          "A growing public surface should prompt a review of page composition and capability boundaries.",
        ],
      },
      {
        id: "private-implementation",
        label: "Private contexts, helpers and deep paths",
        question: "Can a caller bypass the public interface because it knows an internal filename?",
        decision: "Keep the private implementation private, including through transitive re-exports.",
        rationale:
          "An external caller should compose the existing public UI or agree an intentional new seam with the owning capability. A predictable path does not make a context or internal helper public. The generic runtime lookup is reserved to the feature-owned wrapper.",
        diagram: [
          "Page → Contacts public index (allowed source dependency)",
          "Page → contacts/components/ContactForm (rejected source dependency)",
          "Reference wrapper → private ContactsReferenceContext (preview-only seam)",
        ],
        files: [
          {
            path: "frontend/docs/storybook/examples/Contacts/components/ContactForm.tsx",
            role: "Private feature component; not a page-facing export.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/hooks/useContactsFeature.ts",
            role: "The only Contacts runtime lookup wrapper.",
          },
          {
            path: "frontend/src/app/bootstrap/runtime/AppRuntimeContext.ts",
            role: "Private context, consumed through approved hooks.",
          },
          {
            path: "frontend/scripts/application-architecture-policy.mjs",
            role: "Mechanical privacy and public-interface guards, supplemented by review.",
          },
        ],
        snippet: {
          title: "Import decision examples (inert; rejected line must not be copied)",
          language: "ts",
          code: `// Page consumer: approved public seam.
import { ContactsFeature } from "@/features/contacts";

// Rejected: private deep import from a different owner.
// import { ContactForm } from "@/features/contacts/components/ContactForm";`,
        },
        pitfalls: [
          "Do not re-export a private Context or internal implementation through another barrel.",
          "Do not alias the owned runtime hook to evade its expected public name.",
          "This preview explains decisions; it does not run the architecture checker.",
        ],
      },
      {
        id: "application-leaves",
        label: "Application leaves are deliberate APIs too",
        question: "Does every app capability need a single root index.ts?",
        decision: "Use the approved application leaf that owns the behavior.",
        rationale:
          "Feature consumers use feature indexes. Application owners also expose deliberate leaf modules, such as reusable form controls and localization hooks. A feature may consume those approved leaves while retaining its own values, validation, persistence and labels.",
        diagram: [
          "Feature → @/app/forms/components/AppSingleChoiceToggleGroup (approved leaf)",
          "Feature → @/app/localization/hooks/useAppTranslation (approved leaf)",
          "Feature owns domain rules; app form control owns reusable interaction mechanics",
        ],
        files: [
          {
            path: "frontend/src/app/forms/components/AppSingleChoiceToggleGroup.tsx",
            role: "Controlled reusable choice input and its public props.",
          },
          {
            path: "frontend/src/app/localization/hooks/useAppTranslation.ts",
            role: "Application namespace translation hook.",
          },
          {
            path: "frontend/docs/architecture/en/dependency-boundaries-and-imports.md",
            role: "Allowed application inputs and direction contract.",
          },
        ],
        snippet: {
          title: "Approved owner crossings (import excerpt)",
          language: "tsx",
          code: `import { AppSingleChoiceToggleGroup } from "@/app/forms/components/AppSingleChoiceToggleGroup";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

// The feature supplies translated labels, values and validation.`,
        },
        pitfalls: [
          "Do not invent an app-wide barrel merely to make all owners look like features.",
          "An alias is a visible owner crossing, not permission to import any application internal.",
        ],
      },
    ],
  },
  "runtime-and-state": {
    title: "Runtime and state ownership",
    summary: "Choose responsibility and lifetime before choosing a provider, hook or state library.",
    cases: [
      {
        id: "constructed-runtime",
        label: "Construct stable services once",
        question: "Where should shared application infrastructure and reference options be created?",
        decision: "Construct application services at startup and reference services once per preview.",
        rationale:
          "createAppRuntime builds shared infrastructure and an empty frozen feature registry. ContactsPreview creates its own private cache and injected memory adapter once, then supplies frozen reference options through a docs-only provider.",
        diagram: [
          "Application lifetime — createAppRuntime creates QueryClient, auth and feature registry",
          "Preview lifetime — createContactsFeature creates stable reference options",
          "Preview render — useContactsFeature reads the private reference provider",
        ],
        files: [
          { path: "frontend/src/main.tsx", role: "Startup and application composition root." },
          {
            path: "frontend/src/app/bootstrap/runtime/createAppRuntime.ts",
            role: "Constructs shared services and returns a frozen runtime object.",
          },
          {
            path: "frontend/src/app/bootstrap/runtime/appFeatures.ts",
            role: "Empty feature registry; install consumer features explicitly.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/hooks/useContactsFeature.ts",
            role: "Reads the already constructed runtime.",
          },
        ],
        snippet: {
          title: "The reference-only Contacts lookup",
          language: "ts",
          code: `import { useContext } from "react";
import { ContactsReferenceContext } from "./ContactsReferenceContext";

export function useContactsFeature() {
  const value = useContext(ContactsReferenceContext);
  if (!value) throw new Error("Contacts needs its reference provider.");
  return value;
}`,
        },
        pitfalls: [
          "Do not construct QueryClient, API adapters or feature runtimes inside component render bodies.",
          "Theme and locale changes update presentation; they must not recreate service or cache identities.",
          "A frozen runtime object does not automatically dispose sockets, workers or listeners; new resources need explicit lifecycle ownership.",
        ],
      },
      {
        id: "presentation-feature",
        label: "A presentation feature needs no runtime",
        question: "Should Settings be added to the feature registry just to expose a hook?",
        decision: "Keep preference ownership with the existing application providers and services.",
        rationale:
          "Settings and other presentation features do not acquire runtime factories merely for uniformity. A component or route state ends with that owner. Providers belong as close as possible to their consumers unless application lifetime is required.",
        diagram: [
          "Application preference providers — live theme, accessibility and navigation preferences",
          "Settings section hooks — construct presentation rows from approved preference interfaces",
          "Settings route pages — compose public controls; no settings runtime registration",
        ],
        files: [
          {
            path: "frontend/src/features/settings/index.ts",
            role: "Presentation API with no runtime factory or useSettingsFeature hook.",
          },
          {
            path: "frontend/src/app/bootstrap/runtime/AppProviders.tsx",
            role: "Application provider ordering and localized theme/feedback adapters.",
          },
          {
            path: "frontend/src/app/theme/preferences/AppDisplayPreferencesProvider.tsx",
            role: "Live application display preference ownership.",
          },
        ],
        snippet: {
          title: "Choose a lifetime first (ownership map)",
          language: "text",
          code: `Application services  → startup / application provider
Feature runtime       → factory only when construction owns dependencies
Route state           → route element or loader
Temporary interaction → closest React component`,
        },
        pitfalls: [
          "Do not give every feature a Context, factory and runtime hook for symmetry.",
          "Do not promote route state globally merely to preserve it across a rerender.",
        ],
      },
      {
        id: "state-ownership",
        label: "Choose one owner for each state kind",
        question: "Should contact query results, form drafts and shareable filters use the same state mechanism?",
        decision: "Match state to its responsibility and avoid duplicated sources of truth.",
        rationale:
          "Query owns asynchronous data, including the Contacts reference's injected async port. The form owns draft values and validation. URL parameters own shareable filters. Signals serve synchronous shared reactive state; persistence is an owned validated service, not another live copy.",
        diagram: [
          "Temporary interaction → closest React component; form draft/errors → form instance",
          "Shareable filter/selection → URL; async data/cache/errors → TanStack Query",
          "Synchronous shared state → owned Signals; reload persistence → validated storage service",
        ],
        files: [
          {
            path: "frontend/docs/storybook/examples/Contacts/api/contact.query.ts",
            role: "Forwards Query cancellation to the API port.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/api/contact.mutation.ts",
            role: "Invalidates affected Contacts collection keys after writes.",
          },
          {
            path: "frontend/docs/storybook/examples/Contacts/components/ContactForm.tsx",
            role: "Owns form instance, values and validation.",
          },
          {
            path: "frontend/src/app/bootstrap/signals/initSignalEffects.ts",
            role: "Hydrates all registered Signal modules before starting effects and returns cleanup.",
          },
        ],
        snippet: {
          title: "The Contacts query option factory (excerpt)",
          language: "ts",
          code: `export function createContactQuery(api: ContactApi) {
  return Object.freeze({
    findAll: () => queryOptions({
      queryFn: ({ signal }) => api.findAll({ signal }),
      queryKey: ContactQueryKey.collection(),
    }),
  });
}`,
        },
        pitfalls: [
          "Do not mirror Query-owned records into Signals or Context.",
          "Storage needs validation and deliberate hydration through one owned service/effect.",
          "Register Signal lifecycle modules through named public exports; hydrate every module before starting any effect and dispose owned effects.",
        ],
      },
    ],
  },
};
