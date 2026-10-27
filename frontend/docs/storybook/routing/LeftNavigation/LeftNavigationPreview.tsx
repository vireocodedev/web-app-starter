import { useEffect, useState } from "react";

import { LeftNavigationExample } from "./LeftNavigationExample";
import { createLeftNavigationRouter } from "./leftNavigationRoutes";

type LeftNavigationPreviewProps = Readonly<{ initialPath: string; maxWidth?: number }>;

function LeftNavigationRouter({ initialPath, maxWidth }: LeftNavigationPreviewProps) {
  const [router] = useState(() => createLeftNavigationRouter(initialPath, maxWidth));
  useEffect(() => () => router.dispose(), [router]);
  return <LeftNavigationExample router={router} />;
}

/** Keep history while mounted; a new entry path or container width starts afresh. */
export function LeftNavigationPreview({ initialPath, maxWidth = 1280 }: LeftNavigationPreviewProps) {
  return <LeftNavigationRouter initialPath={initialPath} key={`${initialPath}:${maxWidth}`} maxWidth={maxWidth} />;
}
