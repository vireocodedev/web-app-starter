import { useAppFeature } from "@/app/bootstrap/runtime/useAppFeature";

/** The Contacts feature's only approved access point to its runtime. */
export function useContactsFeature() {
  return useAppFeature("contacts");
}
