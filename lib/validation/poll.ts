import { z } from "zod";

const emptyToNull = (v: string | null | undefined) => v || null;

export const pollInput = z.object({
  question: z.string().trim().min(1).max(200),
  options: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z
          .union([z.string().regex(/^\d{2}:\d{2}$/), z.literal("")])
          .nullish()
          .transform(emptyToNull),
        location: z.string().trim().max(120).nullish().transform(emptyToNull),
      })
    )
    .min(2)
    .max(10),
});

export type PollInput = z.infer<typeof pollInput>;