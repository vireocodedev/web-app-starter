import { createContext } from "react";
import type { ContactsFeature } from "../contacts.feature";

export const ContactsReferenceContext = createContext<ContactsFeature | null>(null);
