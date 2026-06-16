"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="size-12 text-green-600" />
      </div>

      <h1 className="mb-3 text-3xl font-bold">Parabéns pela compra! 🎉</h1>

      <p className="mb-2 text-lg text-muted-foreground">
        Seu pedido foi confirmado e já foi enviado para a cozinha.
      </p>
      <p className="mb-8 text-muted-foreground">
        Em breve ele estará pronto. Obrigado pela preferência!
      </p>

      <Button size="lg" onClick={() => router.push("/")}>
        Voltar para o início
      </Button>
    </div>
  );
}
