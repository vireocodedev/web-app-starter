import { useEffect, useState } from "react";

import { StandalonePagesExample } from "./StandalonePagesExample";
import { createStandalonePagesRouter } from "./standalonePagesRoutes";

function StandalonePagesRouter({ initialPath }: Readonly<{ initialPath: string }>) {
  const [router] = useState(() => createStandalonePagesRouter(initialPath));
  useEffect(() => () => router.dispose(), [router]);
  return <StandalonePagesExample router={router} />;
}

/** Theme changes preserve history; a different entry path starts a new example. */
export function StandalonePagesPreview({ initialPath }: Readonly<{ initialPath: string }>) {
  return <StandalonePagesRouter initialPath={initialPath} key={initialPath} />;
}
