import { z } from "zod";

export const appLoginCredentialsSchema = z.object({
  password: z.string().min(1),
  username: z.string().min(1),
});

export type AppLoginCredentials = z.output<typeof appLoginCredentialsSchema>;
