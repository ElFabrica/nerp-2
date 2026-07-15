"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_PHOTO_ADJUSTMENT,
  type PhotoAdjustment,
} from "../../lib/photo-adjustment";

const MAX_ZOOM = 3;

interface PhotoAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string;
  aspectRatio: number;
  initialAdjustment: PhotoAdjustment | undefined;
  onSave: (adjustment: PhotoAdjustment) => void;
}

export function PhotoAdjustDialog({
  open,
  onOpenChange,
  photoUrl,
  aspectRatio,
  initialAdjustment,
  onSave,
}: PhotoAdjustDialogProps) {
  const [adjustment, setAdjustment] = useState<PhotoAdjustment>(
    initialAdjustment ?? DEFAULT_PHOTO_ADJUSTMENT,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setAdjustment(initialAdjustment ?? DEFAULT_PHOTO_ADJUSTMENT);
    }
  }, [open, initialAdjustment]);

  const handlePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosX: adjustment.posX,
      startPosY: adjustment.posY,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    const dragState = dragStateRef.current;
    const container = containerRef.current;
    const image = imageRef.current;
    if (!dragState || !container || !image?.naturalWidth) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scale = Math.max(
      containerWidth / image.naturalWidth,
      containerHeight / image.naturalHeight,
    );
    const excessX = image.naturalWidth * scale - containerWidth;
    const excessY = image.naturalHeight * scale - containerHeight;

    const dxPx = event.clientX - dragState.startClientX;
    const dyPx = event.clientY - dragState.startClientY;

    const deltaPosX =
      excessX > 0 ? (-100 * (dxPx / adjustment.zoom)) / excessX : 0;
    const deltaPosY =
      excessY > 0 ? (-100 * (dyPx / adjustment.zoom)) / excessY : 0;

    setAdjustment((prev) => ({
      ...prev,
      posX: clamp(dragState.startPosX + deltaPosX, 0, 100),
      posY: clamp(dragState.startPosY + deltaPosY, 0, 100),
    }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLImageElement>) => {
    dragStateRef.current = null;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajustar enquadramento</DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-lg border bg-neutral-100"
          style={{ aspectRatio }}
        >
          {/* biome-ignore lint/performance/noImgElement: preview de ajuste, sem otimização do next/image */}
          <img
            ref={imageRef}
            src={photoUrl}
            alt=""
            draggable={false}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="size-full cursor-grab touch-none select-none object-cover active:cursor-grabbing"
            style={{
              objectPosition: `${adjustment.posX}% ${adjustment.posY}%`,
              transform: `scale(${adjustment.zoom})`,
            }}
          />
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-neutral-500">Zoom</p>
          <Slider
            value={[adjustment.zoom]}
            min={1}
            max={MAX_ZOOM}
            step={0.05}
            onValueChange={([zoom]) =>
              setAdjustment((prev) => ({ ...prev, zoom }))
            }
          />
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
            onClick={() => {
              onSave(adjustment);
              onOpenChange(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
