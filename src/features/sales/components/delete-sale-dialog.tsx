import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteSale } from "../hooks/use-sales";
import { toast } from "sonner";
import { useState } from "react";

interface DeleteSaleDialog {
  isOpen: boolean;
  onClose: () => void;
  id: string;
}

export function DeleteSaleDialog({ id, isOpen, onClose }: DeleteSaleDialog) {
  const mutation = useDeleteSale();
  const [confirm, setConfirm] = useState("");

  function onDelete() {
    if (confirm.trim() !== "Confirmar") {
      toast("Palavra inválida");
      return;
    }
    mutation.mutate(
      {
        id,
      },
      {
        onSuccess: () => {
          setConfirm("");
          toast("Venda cancelada!");
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancelar venda</DialogTitle>
          <DialogDescription>
            Você confirma cancelar essa venda? Esta ação não pode ser desfeita!
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <Label htmlFor="name-1" className="gap-1 text-muted-foreground">
              Digite a palavra
              <span className="text-foreground ">Confirmar</span>
              para cancelar a venda
            </Label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Digite a palavra chave"
              id="name-1"
              name="name"
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onDelete}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
