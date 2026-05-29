import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/lib/inngest/functions";

/**
 * Endpoint que o Inngest usa para descobrir e executar as funções deste app.
 * O `src/middleware.ts` já exclui `/api`, então não há bloqueio de auth aqui.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
