import { useContext } from "react";

import { AppRuntimeContext } from "./AppRuntimeContext";
import type { AppFeatureName, AppFeatures } from "./appFeatures";

/** Returns one application-registered feature runtime by its stable name. */
export function useAppFeature<FeatureName extends AppFeatureName>(
  featureName: FeatureName,
): NonNullable<AppFeatures[FeatureName]> {
  const runtime = useContext(AppRuntimeContext);

  if (runtime === null) {
    throw new Error("useAppFeature must be used within AppRuntimeProvider.");
  }

  const feature = runtime.features[featureName];
  if (feature === undefined) {
    throw new Error(`Application feature "${featureName}" is not registered.`);
  }

  return feature;
}
