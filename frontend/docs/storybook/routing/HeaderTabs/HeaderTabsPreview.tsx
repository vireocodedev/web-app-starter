import { useEffect, useState } from "react";

import { HeaderTabsExample } from "./HeaderTabsExample";
import { createHeaderTabsRouter } from "./headerTabsRoutes";

function HeaderTabsRouter({ initialPath }: Readonly<{ initialPath: string }>) {
  const [router] = useState(() => createHeaderTabsRouter(initialPath));
  useEffect(() => () => router.dispose(), [router]);
  return <HeaderTabsExample router={router} />;
}

/** Keep history for the mounted example; a different entry path starts afresh. */
export function HeaderTabsPreview({ initialPath }: Readonly<{ initialPath: string }>) {
  return <HeaderTabsRouter initialPath={initialPath} key={initialPath} />;
}
