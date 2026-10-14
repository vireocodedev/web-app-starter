import type { Contact } from "../models/Contact";

/** Seed data keeps the generated feature useful before the first edit. */
export function createDefaultContacts(): Contact[] {
  return [
    {
      email: "ana.horvat@example.com",
      id: "ana-horvat",
      name: "Ana Horvat",
      organization: "RGO",
      role: "Product designer",
      status: "ACTIVE",
    },
    {
      email: "marko.novak@example.com",
      id: "marko-novak",
      name: "Marko Novak",
      organization: "Northstar Labs",
      role: "Engineering lead",
      status: "ACTIVE",
    },
    {
      email: "iva.kovac@example.com",
      id: "iva-kovac",
      name: "Iva Kovač",
      organization: "Studio Kadar",
      role: "Operations manager",
      status: "INACTIVE",
    },
  ];
}
