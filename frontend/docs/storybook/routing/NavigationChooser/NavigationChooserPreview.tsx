import { useEffect, useState } from "react";

import { NavigationChooserExample } from "./NavigationChooserExample";
import { createNavigationChooserRouter } from "./navigationChooserRoutes";

function NavigationChooserRouter({ initialPath }: Readonly<{ initialPath: string }>) {
  const [router] = useState(() => createNavigationChooserRouter(initialPath));
  useEffect(() => () => router.dispose(), [router]);
  return <NavigationChooserExample router={router} />;
}

/** Theme changes preserve history; a different entry path starts a new example. */
export function NavigationChooserPreview({ initialPath }: Readonly<{ initialPath: string }>) {
  return <NavigationChooserRouter initialPath={initialPath} key={initialPath} />;
}
