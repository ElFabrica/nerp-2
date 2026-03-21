import { PaymentMethod, PersonType } from "@/generated/prisma/enums";
import { z } from "zod";

export const saleSchema = z
  .object({
    cartItems: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number().positive(),
          quantity: z.number().positive(),
          currentStock: z.number(),
          sku: z.string().nullable(),
        }),
      )
      .min(1, "Adicione pelo menos um item ao carrinho"),

    paymentMethod: z.enum(PaymentMethod),
    customer: z
      .object({
        id: z.string(),
        name: z.string(),
        document: z.string().nullable(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        personType: z.enum(PersonType),
      })
      .optional(),

    discount: z.number().min(0, "Desconto não pode ser negativo"),

    discountType: z.enum(["percent", "value"]),

    // Validação condicional: se for porcentagem, não pode ser > 100
  })
  .refine(
    (data) => {
      if (data.discountType === "percent" && data.discount > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Desconto percentual não pode ser maior que 100%",
      path: ["discount"],
    },
  );

export type SaleFormData = z.infer<typeof saleSchema>;
