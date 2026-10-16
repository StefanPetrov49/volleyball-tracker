import { z } from "zod";

const emptyToNull = (v: string | null | undefined) => v?.trim() || null;

const optionalDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
  .nullish()
  .transform(emptyToNull);

const optionalTime = z
  .union([z.string().regex(/^\d{2}:\d{2}$/), z.literal("")])
  .nullish()
  .transform(emptyToNull);

const optionalText = z
  .string()
  .trim()
  .max(120)
  .nullish()
  .transform(emptyToNull);

const pollOptionBase = z.object({
  label: optionalText,
  date: optionalDate,
  time: optionalTime,
  location: optionalText,
});

type OptionFields = z.infer<typeof pollOptionBase>;

const hasContent = (o: OptionFields) =>
  Boolean(o.label || o.date || o.time || o.location);

const question = z.string().trim().min(1).max(200);

export const pollInput = z.object({
  question,
  options: z
    .array(pollOptionBase.refine(hasContent, "Празен вариант"))
    .min(2)
    .max(10),
});

export const pollUpdateInput = z.object({
  question,
  options: z
    .array(
      pollOptionBase
        .extend({ id: z.string().uuid().optional() })
        .refine(hasContent, "Празен вариант"),
    )
    .min(2)
    .max(10),
});

export type PollInput = z.infer<typeof pollInput>;
export type PollUpdateInput = z.infer<typeof pollUpdateInput>;