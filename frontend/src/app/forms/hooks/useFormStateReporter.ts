import { useStore, type ReadonlyStore } from "@tanstack/react-store";
import { useEffect } from "react";

import type { AppFormState } from "../types/AppEntityForm";

/** Reports the form lifecycle state needed by a parent editor or navigation guard. */
export function useFormStateReporter<FormState extends { isDirty: boolean; isSubmitting: boolean }>(
  store: Pick<ReadonlyStore<FormState>, "get" | "subscribe">,
  onStateChange: (state: AppFormState) => void,
): void {
  const dirty = useStore(store, state => state.isDirty);
  const submitting = useStore(store, state => state.isSubmitting);

  useEffect(() => {
    onStateChange({ dirty, submitting });
  }, [dirty, onStateChange, submitting]);
}
