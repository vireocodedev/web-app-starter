import { useContext } from "react";
import { ContactsReferenceContext } from "./ContactsReferenceContext";

/** Preview-only lookup; the production application has no Contacts runtime. */
export function useContactsFeature() {
  const value = useContext(ContactsReferenceContext);
  if (!value) throw new Error("Contacts needs its Storybook reference provider.");
  return value;
}
