import { z } from "zod";

/** The non-sensitive identity returned by the Spring session endpoint. */
export const appAuthUserSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    email: z.email(),
  })
  .readonly();

export type AppAuthUser = z.output<typeof appAuthUserSchema>;
