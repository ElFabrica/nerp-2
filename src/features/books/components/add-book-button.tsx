"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { CreateBookDialog } from "./create-book-dialog";

export function AddBookButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" />
        Novo book
      </Button>
      <CreateBookDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
