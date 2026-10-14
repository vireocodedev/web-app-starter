import type { SignalEffectsModule } from "@rgo-web/frontend";

import { applicationStateSignalModule } from "@/features/development-guide/patterns/applicationState";

export const signalModules: readonly SignalEffectsModule[] = [
  ...(import.meta.env.DEV ? [applicationStateSignalModule] : []),
];
