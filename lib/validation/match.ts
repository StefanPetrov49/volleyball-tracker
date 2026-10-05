import { z } from "zod";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

export const matchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.preprocess(emptyToNull, z.string().regex(/^\d{2}:\d{2}$/).nullable()),
  opponent: z.string().trim().min(1).max(80),
  location: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  home: z.boolean(),
});

export type MatchInput = z.infer<typeof matchSchema>;