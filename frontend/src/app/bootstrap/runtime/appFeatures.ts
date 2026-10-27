import type { QueryClient } from "@tanstack/react-query";

export type AppFeatureDependencies = Readonly<{ queryClient: QueryClient }>;
/** Register product feature runtime contracts here when their capabilities are installed. */
export type AppFeatures = Readonly<Record<never, never>>;
export type AppFeatureName = keyof AppFeatures;

/** Creates application features from the shared runtime dependencies. */
export function createAppFeatures(_dependencies: AppFeatureDependencies): AppFeatures {
  void _dependencies;
  return Object.freeze({});
}

/** Prefer public UI composition or factory injection over exceptional feature-hook dependencies. */
export const allowedCrossFeatureHooks = {} as const satisfies Partial<
  Record<AppFeatureName, readonly AppFeatureName[]>
>;
