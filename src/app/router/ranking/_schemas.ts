import z from "zod";

export const ALL_PERIOD_TYPES = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "BIMONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "ANNUAL",
] as const;

export const periodTypeSchema = z.enum(ALL_PERIOD_TYPES);

export const entryKindSchema = z.enum(["SELLER", "BUCKET"]);
