import { z } from "zod";

const page = z.codec(z.string().regex(/^\d+$/), z.number().int().positive().max(Number.MAX_SAFE_INTEGER), {
  decode: Number,
  encode: String,
});

/** Filters and pagination share one URL contract and update it atomically. */
export const searchParametersSchema = z.object({
  q: z.string().default(""),
  status: z.enum(["all", "active", "archived"]).default("all"),
  page: page.default(1),
});
