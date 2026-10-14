import { z } from "zod";

/** Status values persisted by the Contacts feature. */
export const contactStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export type ContactStatus = z.output<typeof contactStatusSchema>;
