import { ProductUnit } from "@/generated/prisma/enums";
import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.enum(ProductUnit).optional(),

  // Preços
  costPrice: z
    .number({ error: "Valor deve ser 0 ou maior" })
    .min(0, "Preço de custo deve ser maior ou igual a 0"),
  salePrice: z
    .number({ error: "Valor deve ser 0 ou maior" })
    .min(0, "Preço de venda deve ser maior ou igual a 0"),

  // Estoque
  currentStock: z.number().optional(),
  minStock: z.number().optional(),
  maxStock: z.number().optional(),
  location: z.string().optional(),

  // Imagens
  images: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),

  // Dimensões e peso
  weight: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),

  // Controle
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  trackStock: z.boolean().optional(),
});

export type ProductType = z.infer<typeof ProductSchema>;
