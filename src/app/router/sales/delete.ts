import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/db";
import z from "zod";

export const deleteSale = base
  .use(requireAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    summary: "Listar vendas",
    tags: ["sales"],
  })
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .handler(async ({ context, input, errors }) => {
    try {
      const { id } = input;

      const saleFinded = await prisma.sale.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

      if (!saleFinded) {
        throw errors.NOT_FOUND({ message: "Venda não encontrada" });
      }

      await prisma.sale.delete({
        where: {
          id,
        },
      });
    } catch (err) {
      console.log(err);
      throw new Error();
    }
  });
