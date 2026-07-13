"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  EditIcon,
  EyeIcon,
  MoreVerticalIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { useSupplier } from "../hooks/use-supplier";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ViewSupplier } from "./view-supplier";
import { EditSupplier } from "./edit-supplier";
import { DeleteSupplier } from "./delete-supplier";

export function ListSuppliers() {
  const [supplierId, setSupplierId] = useState("");
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const { suppliers, isLoading } = useSupplier();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput placeholder="Buscar fornecedor..." />
            </InputGroup>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Pessoa de Contato</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow className="h-24">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <TableCell key={index}>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-4 w-full mt-2" />
                        ))}
                      </TableCell>
                    ))}
                  </TableRow>
                )}

                {!isLoading && suppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Nenhum fornecedor encontrado.
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{supplier.name}</span>
                          {supplier.tradeName && (
                            <span className="text-xs text-muted-foreground">
                              {supplier.tradeName}
                            </span>
                          )}
                          {supplier.document && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {supplier.document}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {supplier.personType === "FISICA"
                            ? "Pessoa Física"
                            : "Pessoa Jurídica"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {supplier.phone && (
                            <span className="text-sm">{supplier.phone}</span>
                          )}
                          {supplier.email && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {supplier.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.contactPerson || "—"}</TableCell>
                      <TableCell>
                        {supplier.city && supplier.state
                          ? `${supplier.city}/${supplier.state}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={supplier.isActive ? "default" : "secondary"}
                        >
                          {supplier.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVerticalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSupplierId(supplier.id);
                                setOpenViewModal(true);
                              }}
                            >
                              <EyeIcon className="size-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSupplierId(supplier.id);
                                setOpenEditModal(true);
                              }}
                            >
                              <EditIcon className="size-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                setSupplierId(supplier.id);
                                setOpenDeleteModal(true);
                              }}
                            >
                              <Trash2Icon className="size-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ViewSupplier
        id={supplierId}
        open={openViewModal}
        onOpenChange={setOpenViewModal}
      />
      <EditSupplier
        id={supplierId}
        open={openEditModal}
        onOpenChange={setOpenEditModal}
      />
      <DeleteSupplier
        id={supplierId}
        open={openDeleteModal}
        onOpenChange={setOpenDeleteModal}
      />
    </>
  );
}
