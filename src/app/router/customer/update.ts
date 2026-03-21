import { requireAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { Customer } from "@/generated/prisma/client";
import { CustomerUpdateInput } from "@/generated/prisma/models";
import prisma from "@/lib/db";
import { z } from "zod";

type UpdateCustomerInput = CustomerUpdateInput & {
  id: string;
};

export const updateCustomer = base
  .use(requireAuthMiddleware)
  .input(z.custom<UpdateCustomerInput>())
  .output(
    z.object({
      customer: z.custom<Customer>(),
    })
  )
  .handler(async ({ input, errors }) => {
    const customer = await prisma.customer.findUnique({
      where: {
        id: input.id,
      },
    });
    if (!customer) {
      throw errors.NOT_FOUND({
        message: "Cliente não encontrado",
      });
    }
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: input.id,
      },
      data: {
        name: input.name,
        document: input.document,
        phone: input.phone,
        email: input.email,
        personType: input.personType,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        address: input.address,
        notes: input.notes,
      },
    });

    return {
      customer: updatedCustomer,
    };
  });
