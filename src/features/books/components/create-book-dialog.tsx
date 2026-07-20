"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useSupplier } from "@/features/supplier/hooks/use-supplier";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCreateBook } from "../hooks/use-books";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface CreateBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBookDialog({
  open,
  onOpenChange,
}: CreateBookDialogProps) {
  const router = useRouter();
  const createBook = useCreateBook();

  const now = new Date();
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const debouncedSupplierSearch = useDebouncedValue(supplierSearch);
  const { suppliers, isLoading: isLoadingSuppliers } = useSupplier({
    search: debouncedSupplierSearch.trim() || undefined,
    pageSize: 20,
  });

  useEffect(() => {
    if (!open) return;
    setName("");
    setSupplier(null);
    setSupplierSearch("");
    setMonth(String(new Date().getMonth() + 1));
    setYear(String(new Date().getFullYear()));
  }, [open]);

  const handleSubmit = () => {
    createBook.mutate(
      {
        name,
        supplierId: supplier?.id,
        periodMonth: Number(month),
        periodYear: Number(year),
      },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          router.push(`/books/${result.id}`);
        },
      },
    );
  };

  const isValid = name.trim() && month && year;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo book</DialogTitle>
          <DialogDescription>
            Crie um book fotográfico para enviar à indústria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="book-name">Nome do book</FieldLabel>
            <Input
              id="book-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Ações Nestlé — Julho"
            />
          </Field>

          <Field>
            <FieldLabel>Indústria (opcional)</FieldLabel>
            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={supplierOpen}
                  className="w-full justify-between font-normal"
                >
                  {supplier ? (
                    supplier.name
                  ) : (
                    <span className="text-muted-foreground">
                      Nenhuma (book geral de ações)
                    </span>
                  )}
                  <ChevronsUpDown className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    value={supplierSearch}
                    onValueChange={setSupplierSearch}
                    placeholder="Buscar indústria…"
                  />
                  <CommandList>
                    {isLoadingSuppliers && (
                      <div className="flex justify-center py-6">
                        <Spinner />
                      </div>
                    )}
                    {!isLoadingSuppliers && suppliers.length === 0 && (
                      <CommandEmpty>Nenhuma indústria encontrada.</CommandEmpty>
                    )}
                    <CommandGroup>
                      <CommandItem
                        value="__none__"
                        className="cursor-pointer"
                        onSelect={() => {
                          setSupplier(null);
                          setSupplierOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "size-4",
                            supplier ? "opacity-0" : "opacity-100",
                          )}
                        />
                        Nenhuma (book geral de ações)
                      </CommandItem>
                      {!isLoadingSuppliers &&
                        suppliers.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.id}
                            className="cursor-pointer"
                            onSelect={() => {
                              setSupplier({ id: item.id, name: item.name });
                              setSupplierOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "size-4",
                                supplier?.id === item.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {item.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>

          <div className="flex gap-4">
            <Field>
              <FieldLabel>Mês</FieldLabel>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((label, index) => (
                    <SelectItem key={label} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="book-year">Ano</FieldLabel>
              <Input
                id="book-year"
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || createBook.isPending}
          >
            {createBook.isPending && <Spinner />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
