"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryCollaborators } from "@/features/collaborators/hooks/use-collaborators";
import { useCreateSalesGoalEntry } from "../hooks/use-ranking";
import { parseBrlAmount } from "../lib/parse-brl-amount";
import { currentPeriodBounds } from "../lib/sales-goal-period-bounds";
import type { SalesGoalPeriodType } from "../lib/sales-goal-xlsx-parser";

interface SalesGoalAddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodType: SalesGoalPeriodType;
  existingPeriod?: {
    periodStart: string | Date;
    periodEnd: string | Date;
  } | null;
  existingBranchNames: string[];
}

function toIsoDate(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function SalesGoalAddEntryDialog({
  open,
  onOpenChange,
  periodType,
  existingPeriod,
  existingBranchNames,
}: SalesGoalAddEntryDialogProps) {
  const collaboratorsQuery = useQueryCollaborators(true);
  const collaborators = collaboratorsQuery.data ?? [];
  const createEntry = useCreateSalesGoalEntry();

  const [branchName, setBranchName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [achievedAmount, setAchievedAmount] = useState("");

  const reset = () => {
    setBranchName("");
    setSellerName("");
    setGoalAmount("");
    setAchievedAmount("");
  };

  const handleSubmit = () => {
    const goalAmountValue = parseBrlAmount(goalAmount);
    if (
      !branchName.trim() ||
      !sellerName.trim() ||
      goalAmountValue === null ||
      goalAmountValue < 0
    ) {
      toast.error("Preencha equipe, vendedor e meta corretamente.");
      return;
    }
    const achievedAmountValue = achievedAmount
      ? parseBrlAmount(achievedAmount)
      : null;

    const bounds = existingPeriod
      ? {
          periodStart: toIsoDate(existingPeriod.periodStart),
          periodEnd: toIsoDate(existingPeriod.periodEnd),
        }
      : currentPeriodBounds(periodType);

    createEntry.mutate(
      {
        periodType,
        periodStart: bounds.periodStart,
        periodEnd: bounds.periodEnd,
        branchName: branchName.trim(),
        sellerName: sellerName.trim(),
        goalAmount: goalAmountValue,
        achievedAmount: achievedAmountValue ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Meta adicionada ao ranking!");
          reset();
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar equipe e meta</DialogTitle>
          <DialogDescription>
            Cria (ou reaproveita) a equipe e adiciona um vendedor com meta e
            vendido, sem precisar importar planilha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sales-goal-branch-name">Equipe</Label>
            <Input
              id="sales-goal-branch-name"
              list="sales-goal-branch-suggestions"
              value={branchName}
              onChange={(event) => setBranchName(event.target.value)}
              placeholder="Ex: Loja Centro"
            />
            <datalist id="sales-goal-branch-suggestions">
              {existingBranchNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sales-goal-seller-name">Vendedor</Label>
            <Input
              id="sales-goal-seller-name"
              list="sales-goal-seller-suggestions"
              value={sellerName}
              onChange={(event) => setSellerName(event.target.value)}
              placeholder="Nome do vendedor"
            />
            <datalist id="sales-goal-seller-suggestions">
              {collaborators.map((collaborator) => (
                <option key={collaborator.id} value={collaborator.name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sales-goal-goal-amount">Meta (R$)</Label>
              <Input
                id="sales-goal-goal-amount"
                type="text"
                inputMode="decimal"
                value={goalAmount}
                onChange={(event) => setGoalAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sales-goal-achieved-amount">Vendido (R$)</Label>
              <Input
                id="sales-goal-achieved-amount"
                type="text"
                inputMode="decimal"
                value={achievedAmount}
                onChange={(event) => setAchievedAmount(event.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createEntry.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createEntry.isPending}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
