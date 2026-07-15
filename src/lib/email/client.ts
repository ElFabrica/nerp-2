import "server-only";

import { Resend } from "resend";

// Remetente verificado no Resend para os e-mails transacionais da organização.
export const ORGANIZATION_FROM = "NASA <nasa@notifications.nasaex.com>";

let client: Resend | null = null;

// Lazy: sem a chave o import não pode quebrar o boot da app em dev.
export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY não configurada — não foi possível enviar o e-mail.",
    );
  }
  client ??= new Resend(apiKey);
  return client;
}
