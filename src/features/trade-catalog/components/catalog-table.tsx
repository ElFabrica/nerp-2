"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export interface CatalogRow {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isSystemDefault: boolean;
}

interface CatalogTableProps {
  rows: CatalogRow[];
  isLoading: boolean;
  onCreate: (code: string, name: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  isCreating: boolean;
}

export function CatalogTable({
  rows,
  isLoading,
  onCreate,
  onRename,
  onToggleActive,
  onDelete,
  isCreating,
}: CatalogTableProps) {
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (!newCode.trim() || !newName.trim()) return;
    onCreate(newCode.trim().toUpperCase(), newName.trim());
    setNewCode("");
    setNewName("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="w-24 space-y-1">
          <span className="text-xs text-muted-foreground">Código</span>
          <Input
            value={newCode}
            placeholder="Ex.: PG"
            maxLength={6}
            className="font-mono uppercase"
            onChange={(event) => setNewCode(event.target.value.toUpperCase())}
          />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Nome</span>
          <Input
            value={newName}
            placeholder="Ex.: Ponta de Gôndola"
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
            }}
          />
        </div>
        <Button type="button" onClick={handleCreate} disabled={isCreating}>
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24 text-center">Ativo</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Nenhum item cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {row.code}
                    {row.isSystemDefault && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px]">
                        padrão
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      defaultValue={row.name}
                      className="h-8 border-transparent hover:border-input focus:border-input"
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value && value !== row.name) onRename(row.id, value);
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={row.isActive}
                      onCheckedChange={(checked) => onToggleActive(row.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive disabled:opacity-30"
                      title={
                        row.isSystemDefault
                          ? "Padrão não pode ser excluído — desative se não usar"
                          : "Excluir"
                      }
                      disabled={row.isSystemDefault}
                      onClick={() => onDelete(row.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
