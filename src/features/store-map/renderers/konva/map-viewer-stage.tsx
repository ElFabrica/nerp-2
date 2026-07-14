"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Layer, Line, Stage } from "react-konva";
import { boundsOf } from "../../engine/geometry";
import { useSceneStore } from "../../engine/scene-store";
import type { Vec2 } from "../../engine/types";
import { MapBackground } from "./map-background";
import { MapGrid } from "./map-grid";
import { MapShape } from "./shape-node";

const PIN_RADIUS_PX = 9;
const PIN_HEIGHT_PX = 26;
const PIN_GAP_PX = 6;
const PIN_COLOR = "#dc2626";
// Só reenquadra quando o palco muda de verdade (rotação/responsivo), não a cada
// pixel da barra de endereço do navegador móvel.
const RESIZE_TOLERANCE = 0.2;

function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/**
 * Stage somente-leitura para o promotor em campo: navega, dá zoom e seleciona,
 * mas não desenha, move nem redimensiona objetos.
 */
export function MapViewerStage() {
  const floorPlan = useSceneStore((state) => state.floorPlan);
  const objects = useSceneStore((state) => state.objects);
  const layers = useSceneStore((state) => state.layers);
  const viewport = useSceneStore((state) => state.viewport);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const gridEnabled = useSceneStore((state) => state.gridEnabled);
  const gridSizeM = useSceneStore((state) => state.gridSizeM);

  const panBy = useSceneStore((state) => state.panBy);
  const zoomAt = useSceneStore((state) => state.zoomAt);
  const clearSelection = useSceneStore((state) => state.clearSelection);
  const setStageSize = useSceneStore((state) => state.setStageSize);
  const fitToPlan = useSceneStore((state) => state.fitToPlan);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const panLast = useRef<Vec2 | null>(null);
  const pinchLast = useRef<number | null>(null);
  const fittedPlanId = useRef<string | null>(null);
  const fittedSize = useRef<{ width: number; height: number } | null>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const ppm = floorPlan?.pixelsPerMeter ?? 50;
  const scale = viewport.zoom * ppm;

  const layerById = useMemo(
    () => new Map(layers.map((layer) => [layer.id, layer])),
    [layers],
  );

  const visibleObjects = useMemo(
    () =>
      Object.values(objects)
        .filter((object) => layerById.get(object.layerId)?.visible !== false)
        .sort((a, b) => a.z - b.z),
    [objects, layerById],
  );

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedObject = selectedId ? objects[selectedId] : undefined;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
      setSize(next);
      setStageSize(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [setStageSize]);

  useEffect(() => {
    if (!floorPlan || size.width === 0 || size.height === 0) return;

    const planChanged = fittedPlanId.current !== floorPlan.id;
    const previous = fittedSize.current;
    // Girar o celular ou redimensionar a janela muda o palco: sem reenquadrar, o
    // mapa fica fora da tela e o promotor precisa arrastar até achá-lo. Variações
    // pequenas (barra de endereço do mobile) são ignoradas para não resetar o zoom.
    const resized =
      !previous ||
      Math.abs(size.width - previous.width) / previous.width >
        RESIZE_TOLERANCE ||
      Math.abs(size.height - previous.height) / previous.height >
        RESIZE_TOLERANCE;

    if (!planChanged && !resized) return;

    fittedPlanId.current = floorPlan.id;
    fittedSize.current = { width: size.width, height: size.height };
    fitToPlan();
  }, [floorPlan, size.width, size.height, fitToPlan]);

  const getScreenPoint = (): Vec2 | null =>
    stageRef.current?.getPointerPosition() ?? null;

  const handleDown = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Clique no shape é tratado pelo MapShape (seleção); aqui só o fundo.
    if (event.target !== stageRef.current) return;
    const screen = getScreenPoint();
    if (!screen) return;
    clearSelection();
    panLast.current = screen;
    setIsPanning(true);
  };

  const handleMove = () => {
    if (!panLast.current) return;
    const screen = getScreenPoint();
    if (!screen) return;
    panBy(screen.x - panLast.current.x, screen.y - panLast.current.y);
    panLast.current = screen;
  };

  const endPan = () => {
    panLast.current = null;
    pinchLast.current = null;
    setIsPanning(false);
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const screen = getScreenPoint();
    if (!screen) return;
    zoomAt(screen, event.evt.deltaY > 0 ? 1 / 1.1 : 1.1);
  };

  const handleTouchMove = (event: KonvaEventObject<TouchEvent>) => {
    const touches = event.evt.touches;
    if (touches.length < 2) {
      handleMove();
      return;
    }

    // Pinch: dois dedos controlam o zoom, então o pan é suspenso.
    event.evt.preventDefault();
    panLast.current = null;

    const [first, second] = [touches[0], touches[1]];
    const distance = touchDistance(first, second);
    const previous = pinchLast.current;
    pinchLast.current = distance;
    if (!previous || previous === 0) return;

    const box = stageRef.current?.container().getBoundingClientRect();
    if (!box) return;

    zoomAt(
      {
        x: (first.clientX + second.clientX) / 2 - box.left,
        y: (first.clientY + second.clientY) / 2 - box.top,
      },
      distance / previous,
    );
  };

  const pinRadius = PIN_RADIUS_PX / scale;
  const pinHeight = PIN_HEIGHT_PX / scale;
  const highlight = selectedObject
    ? (() => {
        const bounds = boundsOf(selectedObject.geometry);
        const x = (bounds.minX + bounds.maxX) / 2;
        const baseY = bounds.minY - PIN_GAP_PX / scale;
        return { x, baseY, tipY: baseY - pinHeight };
      })()
    : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none bg-[#f8fafc]"
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      {size.width > 0 && floorPlan && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          scaleX={scale}
          scaleY={scale}
          x={viewport.x}
          y={viewport.y}
          onWheel={handleWheel}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          onTouchStart={handleDown}
          onTouchMove={handleTouchMove}
          onTouchEnd={endPan}
        >
          <Layer listening={false}>
            <MapBackground floorPlan={floorPlan} />
            {gridEnabled && (
              <MapGrid
                widthM={floorPlan.widthM}
                heightM={floorPlan.heightM}
                stepM={gridSizeM}
              />
            )}
          </Layer>

          <Layer>
            {visibleObjects.map((object) => (
              <MapShape
                key={object.id}
                object={object}
                isSelected={selectedIds.includes(object.id)}
                draggable={false}
              />
            ))}
          </Layer>

          {highlight && (
            <Layer listening={false}>
              <Line
                points={[
                  highlight.x,
                  highlight.baseY,
                  highlight.x - pinRadius * 0.75,
                  highlight.tipY + pinRadius,
                  highlight.x + pinRadius * 0.75,
                  highlight.tipY + pinRadius,
                ]}
                closed
                fill={PIN_COLOR}
                strokeScaleEnabled={false}
              />
              <Circle
                x={highlight.x}
                y={highlight.tipY}
                radius={pinRadius}
                fill={PIN_COLOR}
                strokeScaleEnabled={false}
              />
              <Circle
                x={highlight.x}
                y={highlight.tipY}
                radius={pinRadius * 0.4}
                fill="#ffffff"
                strokeScaleEnabled={false}
              />
            </Layer>
          )}
        </Stage>
      )}
    </div>
  );
}
