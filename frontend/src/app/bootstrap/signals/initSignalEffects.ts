import { createRgoSignalEffectsService, type SignalEffectsModule } from "@rgo-web/frontend";

import { signalModules } from "./signalModules";

export function createSignalEffectsInitializer(modules: readonly SignalEffectsModule[]): () => () => void {
  const signalEffects = createRgoSignalEffectsService(modules);
  return () => signalEffects.initialize();
}

const initializeApplicationSignalEffects = createSignalEffectsInitializer(signalModules);

/** Hydrates every Signal module, then starts its application-lifetime effects. */
export function initSignalEffects(): () => void {
  return initializeApplicationSignalEffects();
}
