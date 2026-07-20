"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { constructUrl } from "@/hooks/use-construct-url";
import { useUpdatePdvPhoto } from "@/features/pdv-photos/hooks/use-pdv-photos";
import { useQueryCollaborators } from "@/features/collaborators/hooks/use-collaborators";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/utils/currency-formatter";
import type {
  PhotoAdjustment,
  PhotoAdjustmentMap,
} from "../../lib/photo-adjustment";
import {
  BookPagePhotoGrid,
  type PhotoLayoutPattern,
} from "./book-page-photo-grid";

export interface BookPageItem {
  pdvPhotoId: string;
  storeName: string;
  managerName: string | null;
  section: string | null;
  code: string | null;
  actionValue: number | null;
  coordinatorName: string | null;
  consultantName: string | null;
  photoLayout: PhotoLayoutPattern | null;
  photoAdjustments: PhotoAdjustmentMap | null;
  photos: string[];
}

interface BookPageCardProps {
  item: BookPageItem;
  periodLabel: string;
  position: number;
  total: number;
  industryLogo?: string | null;
  organizationName?: string | null;
  onRemove: () => void;
}

function CollaboratorSelect({
  value,
  placeholder,
  onChange,
  collaboratorNames,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  collaboratorNames: string[];
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-auto w-full justify-start gap-1 border-none bg-transparent p-0 text-sm font-bold shadow-none focus-visible:ring-0 data-[placeholder]:text-neutral-400 data-[placeholder]:font-normal">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {collaboratorNames.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InlineField({
  value,
  placeholder,
  onChange,
  className,
  numeric,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
  numeric?: boolean;
}) {
  return (
    <input
      type={numeric ? "number" : "text"}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full border-none bg-transparent p-0 outline-none placeholder:text-neutral-400 focus:ring-0 ${className ?? ""}`}
    />
  );
}

export function BookPageCard({
  item,
  periodLabel,
  position,
  total,
  industryLogo,
  organizationName,
  onRemove,
}: BookPageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.pdvPhotoId });
  // silent: autosave em cada campo/foto/padrão — um toast por ação empilha
  // rápido (e um deles chegou a crescer e cobrir o botão "+" da grade).
  const updatePdvPhoto = useUpdatePdvPhoto({ silent: true });
  const { data: collaboratorsData } = useQueryCollaborators(true);
  const collaboratorNames = (collaboratorsData ?? []).map(
    (collaborator) => collaborator.name,
  );

  const [manager, setManager] = useState(item.managerName ?? "");
  const [section, setSection] = useState(item.section ?? "");
  const [code, setCode] = useState(item.code ?? "");
  const [coordinator, setCoordinator] = useState(item.coordinatorName ?? "");
  const [consultant, setConsultant] = useState(item.consultantName ?? "");
  const [actionValue, setActionValue] = useState(
    item.actionValue != null ? String(item.actionValue) : "",
  );
  // Estado local (não só a prop `item.photos`) porque uploads disparados em
  // sequência rápida (antes do primeiro round-trip terminar) usariam a
  // mesma foto "antiga" como base e um sobrescreveria o outro na API,
  // fazendo fotos recém-adicionadas sumirem. O updater funcional sempre
  // parte do valor mais recente, mesmo com mutations em voo.
  const [photos, setPhotos] = useState(item.photos);
  const [photoLayout, setPhotoLayout] = useState(item.photoLayout);
  const [photoAdjustments, setPhotoAdjustments] = useState(
    item.photoAdjustments ?? {},
  );

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(true);

  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updatePdvPhoto.mutate({
        id: item.pdvPhotoId,
        managerName: manager || null,
        section: section || null,
        code: code || null,
        coordinatorName: coordinator || null,
        consultantName: consultant || null,
        actionValue: actionValue ? Number(actionValue) : null,
      });
    }, 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, section, code, coordinator, consultant, actionValue]);

  const updatePhotos = (updater: (prev: string[]) => string[]) => {
    setPhotos((prev) => {
      const next = updater(prev);
      updatePdvPhoto.mutate({ id: item.pdvPhotoId, photos: next });
      return next;
    });
  };

  const saveLayoutPattern = (nextPattern: PhotoLayoutPattern | null) => {
    setPhotoLayout(nextPattern);
    updatePdvPhoto.mutate({ id: item.pdvPhotoId, photoLayout: nextPattern });
  };

  const saveAdjustment = (key: string, adjustment: PhotoAdjustment) => {
    setPhotoAdjustments((prev) => {
      const next = { ...prev, [key]: adjustment };
      updatePdvPhoto.mutate({ id: item.pdvPhotoId, photoAdjustments: next });
      return next;
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex flex-col overflow-hidden rounded-xl border bg-white text-neutral-900 shadow-sm md:aspect-[960/540]"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 bg-[#c1121f] px-3 py-3 md:px-5">
        {/* No celular o nome quebra em até 2 linhas — nomes de supermercado
            não cabem em 375px. No desktop segue truncando, senão uma segunda
            linha estouraria o aspect-ratio fixo de 960x540 da página. */}
        <h3 className="line-clamp-2 min-w-0 text-base font-bold uppercase leading-tight tracking-tight text-white md:line-clamp-none md:truncate md:text-lg">
          {item.storeName}
        </h3>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            {periodLabel}
          </span>
          <button
            type="button"
            // touch-none: sem isso o browser sequestra o gesto pro scroll
            // antes do dnd-kit enxergar o toque longo.
            className="flex size-9 cursor-grab touch-none items-center justify-center rounded-md bg-white/15 text-white active:cursor-grabbing md:size-7"
            title="Arraste para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-md bg-white/15 text-white hover:bg-white/25 md:size-7"
            title="Remover página"
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-3 md:min-h-0 md:grid-cols-[240px_1fr] md:gap-5 md:p-5">
        {/* No celular as fotos vêm primeiro: o promotor abriu a página pra
            fotografar, não pra preencher coordenador. */}
        <div className="order-2 space-y-3 overflow-y-auto md:order-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Gerente
            </p>
            <InlineField
              value={manager}
              placeholder="—"
              onChange={setManager}
              className="text-sm font-bold"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Coordenador(a)
            </p>
            <CollaboratorSelect
              value={coordinator}
              placeholder="—"
              onChange={setCoordinator}
              collaboratorNames={collaboratorNames}
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Consultor(a)
            </p>
            <CollaboratorSelect
              value={consultant}
              placeholder="—"
              onChange={setConsultant}
              collaboratorNames={collaboratorNames}
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Empresa PDV
            </p>
            <p className="text-sm font-bold">{organizationName || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Seção
            </p>
            <InlineField
              value={section}
              placeholder="—"
              onChange={setSection}
              className="text-sm font-bold"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Código
            </p>
            <InlineField
              value={code}
              placeholder="—"
              onChange={setCode}
              className="text-sm font-bold"
            />
          </div>

          <div className="rounded-md border-l-4 border-[#c1121f] bg-[#c1121f]/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#c1121f]">
              Valor da ação
            </p>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-[#c1121f]">R$</span>
              <InlineField
                value={actionValue}
                placeholder="0,00"
                onChange={setActionValue}
                numeric
                className="text-lg font-bold text-[#c1121f]"
              />
            </div>
            {actionValue && (
              <p className="text-[10px] text-neutral-500">
                {formatBRL(Number(actionValue) || 0)}
              </p>
            )}
          </div>

          {industryLogo && (
            // biome-ignore lint/performance/noImgElement: preview simples de key do R2, sem otimização do next/image
            <img
              src={constructUrl(industryLogo)}
              alt=""
              className="max-h-36 max-w-full object-contain"
            />
          )}
        </div>

        <div className="order-1 flex min-h-0 flex-col md:order-2">
          <BookPagePhotoGrid
            photos={photos}
            layoutPattern={photoLayout}
            photoAdjustments={photoAdjustments}
            onChange={updatePhotos}
            onLayoutChange={saveLayoutPattern}
            onAdjustmentChange={saveAdjustment}
            editable
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end border-t px-5 py-2 text-xs text-neutral-500">
        {position} / {total}
      </div>
    </div>
  );
}
