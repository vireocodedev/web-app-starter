import type { QueryClient } from "@tanstack/react-query";

import { createContactsFeature } from "@/features/development-guide/contacts";
import type { ContactsFeatureRuntime } from "@/features/development-guide/contacts";

export type AppFeatureDependencies = Readonly<{
  queryClient: QueryClient;
}>;

/** Creates every application feature from the shared runtime dependencies. */
export function createAppFeatures(dependencies: AppFeatureDependencies) {
  const features: AppFeatures = import.meta.env.DEV ? { contacts: createContactsFeature(dependencies) } : {};

  return Object.freeze(features);
}

export type AppFeatures = Readonly<{
  contacts?: ContactsFeatureRuntime;
}>;
export type AppFeatureName = keyof AppFeatures;

/**
 * Exceptional feature-hook dependencies must be declared here. Prefer public
 * UI composition or factory injection; keep this map empty unless neither fits.
 */
export const allowedCrossFeatureHooks = {} as const satisfies Partial<
  Record<AppFeatureName, readonly AppFeatureName[]>
>;
