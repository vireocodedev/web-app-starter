import type { PropsWithChildren } from "react";
import type { ContactsFeature } from "../contacts.feature";
import { ContactsReferenceContext } from "./ContactsReferenceContext";

export function ContactsReferenceProvider({ children, value }: PropsWithChildren<{ value: ContactsFeature }>) {
  return <ContactsReferenceContext.Provider value={value}>{children}</ContactsReferenceContext.Provider>;
}
