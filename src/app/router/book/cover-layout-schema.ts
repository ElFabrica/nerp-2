import { z } from "zod";

const baseElementSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
});

const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  text: z.string(),
  fontSize: z.number(),
  color: z.string(),
  fontWeight: z.enum(["normal", "bold"]),
  align: z.enum(["left", "center", "right"]),
  uppercase: z.boolean(),
});

const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  imageKey: z.string(),
  objectFit: z.enum(["contain", "cover"]),
});

const dividerElementSchema = baseElementSchema.extend({
  type: z.literal("divider"),
  color: z.string(),
});

export const coverElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  dividerElementSchema,
]);

export const coverLayoutSchema = z.array(coverElementSchema);

export const coverBackgroundSchema = z.object({
  color: z.string(),
  opacity: z.number().min(0).max(1),
  imageKey: z.string().nullable().optional(),
});
