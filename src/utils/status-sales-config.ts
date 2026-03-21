import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";

export const statusConfig = {
  DRAFT: {
    label: "Rascunho",
    className: "bg-secondary text-secondary-foreground",
    icon: ClockIcon,
  },
  PROCESSING: {
    label: "Processando",
    className: "bg-primary text-primary-foreground",
    icon: ClockIcon,
  },
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-primary text-primary-foreground",
    icon: ClockIcon,
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-success text-success-foreground",
    icon: CheckCircleIcon,
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-destructive text-destructive-foreground",
    icon: XCircleIcon,
  },
};
