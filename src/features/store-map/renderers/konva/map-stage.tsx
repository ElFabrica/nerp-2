"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { useSceneStore } from "../../engine/scene-store";
import { snapToGrid } from "../../engine/geometry";
import { CREATE_TOOLS_BY_TYPE } from "../../engine/tools";
import type { EditorTool, Vec2 } from "../../engine/types";
import {
  useCreateAnnotation,
  useMapAnnotations,
  useUpdateAnnotation,
} from "../../hooks/use-map-annotations";
import { AnnotationEditor } from "../../components/annotation-editor";
import { AnnotationLayer } from "./annotation-layer";
import { MapBackground } from "./map-background";
import { MapGrid } from "./map-grid";
import { MapShape } from "./shape-node";

interface DraftRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function cursorFor(tool: EditorTool): string {
  if (tool === "PAN") return "grab";
  if (tool === "SELECT") return "default";
  return "crosshair";
}

export function MapStage() {
  const floorPlan = useSceneStore((state) => state.floorPlan);
  const objects = useSceneStore((state) => state.objects);
  const layers = useSceneStore((state) => state.layers);
  const viewport = useSceneStore((state) => state.viewport);
  const tool = useSceneStore((state) => state.tool);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const gridEnabled = useSceneStore((state) => state.gridEnabled);
  const snapEnabled = useSceneStore((state) => state.snapEnabled);
  const gridSizeM = useSceneStore((state) => state.gridSizeM);
  const activeLayerId = useSceneStore((state) => state.activeLayerId);
  const calibrating = useSceneStore((state) => state.calibrating);
  const calibrationPoints = useSceneStore((state) => state.calibrationPoints);
  const pushCalibrationPoint = useSceneStore(
    (state) => state.pushCalibrationPoint,
  );
  const annotating = useSceneStore((state) => state.annotating);
  const annotationType = useSceneStore((state) => state.annotationType);
  const setAnnotating = useSceneStore((state) => state.setAnnotating);

  const addObject = useSceneStore((state) => state.addObject);
  const panBy = useSceneStore((state) => state.panBy);
  const zoomAt = useSceneStore((state) => state.zoomAt);
  const clearSelection = useSceneStore((state) => state.clearSelection);
  const setTool = useSceneStore((state) => state.setTool);
  const setStageSize = useSceneStore((state) => state.setStageSize);
  const fitToPlan = useSceneStore((state) => state.fitToPlan);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const panLast = useRef<Vec2 | null>(null);
  const draftStart = useRef<Vec2 | null>(null);
  const readoutRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<DraftRect | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(
    null,
  );
  const fittedPlanId = useRef<string | null>(null);

  const annotations = useMapAnnotations(floorPlan?.id);
  const createAnnotation = useCreateAnnotation();
  const updateAnnotation = useUpdateAnnotation();

  const ppm = floorPlan?.pixelsPerMeter ?? 50;
  const scale = viewport.zoom * ppm;

  const editingAnnotation =
    annotations.find((item) => item.id === editingAnnotationId) ?? null;

  const layerById = useMemo(
    () => new Map(layers.map((layer) => [layer.id, layer])),
    [layers],
  );

  const visibleObjects = useMemo(() => {
    return Object.values(objects)
      .filter((object) => layerById.get(object.layerId)?.visible !== false)
      .sort((a, b) => a.z - b.z);
  }, [objects, layerById]);

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

  // Enquadra o mapa na primeira vez que ele carrega com a tela já medida.
  useEffect(() => {
    if (!floorPlan || size.width === 0) return;
    if (fittedPlanId.current === floorPlan.id) return;
    fittedPlanId.current = floorPlan.id;
    fitToPlan();
  }, [floorPlan, size.width, fitToPlan]);

  // Reatacha o Transformer aos retângulos selecionados (ferramenta SELECT).
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    if (tool !== "SELECT") {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }
    const nodes = selectedIds
      .filter((id) => objects[id]?.geometry.kind === "RECT")
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => Boolean(node));
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, tool, objects]);

  const snap = (value: number) =>
    snapEnabled ? snapToGrid(value, gridSizeM) : value;

  const getWorldPoint = (): Vec2 | null =>
    stageRef.current?.getRelativePointerPosition() ?? null;
  const getScreenPoint = (): Vec2 | null =>
    stageRef.current?.getPointerPosition() ?? null;

  const handleDown = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const screen = getScreenPoint();
    const world = getWorldPoint();
    if (!screen || !world) return;

    if (calibrating) {
      pushCalibrationPoint(world);
      return;
    }

    if (annotating && floorPlan) {
      createAnnotation.mutate(
        {
          floorPlanId: floorPlan.id,
          type: annotationType,
          x: world.x,
          y: world.y,
        },
        { onSuccess: (created) => setEditingAnnotationId(created.id) },
      );
      setAnnotating(false);
      return;
    }

    if (tool === "PAN") {
      panLast.current = screen;
      return;
    }

    if (tool === "SELECT") {
      if (event.target === stageRef.current) clearSelection();
      return;
    }

    const def = CREATE_TOOLS_BY_TYPE.get(tool);
    if (!def || !activeLayerId) return;

    if (def.shapeKind === "POINT") {
      addObject({
        type: def.type,
        layerId: activeLayerId,
        geometry: { kind: "POINT", x: snap(world.x), y: snap(world.y) },
        style: def.style,
      });
      setTool("SELECT");
      return;
    }

    draftStart.current = { x: snap(world.x), y: snap(world.y) };
    setDraft({
      x: draftStart.current.x,
      y: draftStart.current.y,
      width: 0,
      height: 0,
    });
  };

  const handleMove = () => {
    const world = getWorldPoint();
    if (world && readoutRef.current) {
      readoutRef.current.textContent = `${world.x.toFixed(2)} m · ${world.y.toFixed(2)} m`;
    }

    if (panLast.current) {
      const screen = getScreenPoint();
      if (!screen) return;
      panBy(screen.x - panLast.current.x, screen.y - panLast.current.y);
      panLast.current = screen;
      return;
    }
    if (draftStart.current && world) {
      const start = draftStart.current;
      const currentX = snap(world.x);
      const currentY = snap(world.y);
      setDraft({
        x: Math.min(start.x, currentX),
        y: Math.min(start.y, currentY),
        width: Math.abs(currentX - start.x),
        height: Math.abs(currentY - start.y),
      });
    }
  };

  const handleUp = () => {
    if (panLast.current) {
      panLast.current = null;
      return;
    }
    if (!draftStart.current || !activeLayerId) return;

    const def = CREATE_TOOLS_BY_TYPE.get(tool);
    const start = draftStart.current;
    const world = getWorldPoint();
    draftStart.current = null;
    setDraft(null);
    if (!def) return;

    let x = start.x;
    let y = start.y;
    let width = def.defaultSizeM;
    let height = def.defaultSizeM;
    if (world) {
      const currentX = snap(world.x);
      const currentY = snap(world.y);
      const drawnW = Math.abs(currentX - start.x);
      const drawnH = Math.abs(currentY - start.y);
      if (drawnW >= 0.2 && drawnH >= 0.2) {
        x = Math.min(start.x, currentX);
        y = Math.min(start.y, currentY);
        width = drawnW;
        height = drawnH;
      }
    }

    addObject({
      type: def.type,
      layerId: activeLayerId,
      geometry: { kind: "RECT", x, y, width, height, rotation: 0 },
      style: def.style,
    });
    setTool("SELECT");
  };

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const screen = getScreenPoint();
    if (!screen) return;
    const factor = event.evt.deltaY > 0 ? 1 / 1.1 : 1.1;
    zoomAt(screen, factor);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-[#f8fafc]"
      style={{
        cursor: calibrating || annotating ? "crosshair" : cursorFor(tool),
      }}
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
          onMouseUp={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
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
                draggable={
                  tool === "SELECT" && !layerById.get(object.layerId)?.locked
                }
              />
            ))}
            {draft && (
              <Rect
                x={draft.x}
                y={draft.y}
                width={draft.width}
                height={draft.height}
                fill="#3b82f633"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeScaleEnabled={false}
                listening={false}
              />
            )}
            {calibrating && calibrationPoints.length === 2 && (
              <Line
                points={[
                  calibrationPoints[0].x,
                  calibrationPoints[0].y,
                  calibrationPoints[1].x,
                  calibrationPoints[1].y,
                ]}
                stroke="#ef4444"
                strokeWidth={2}
                dash={[0.3, 0.2]}
                strokeScaleEnabled={false}
                listening={false}
              />
            )}
            {calibrating &&
              calibrationPoints.map((point, index) => (
                <Circle
                  key={`calib-${index}-${point.x}-${point.y}`}
                  x={point.x}
                  y={point.y}
                  radius={0.15}
                  fill="#ef4444"
                  strokeScaleEnabled={false}
                  listening={false}
                />
              ))}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              ignoreStroke
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
              }
            />
          </Layer>
          <Layer>
            <AnnotationLayer
              annotations={annotations}
              selectedId={editingAnnotationId}
              draggable={tool === "SELECT" && !annotating && !calibrating}
              onSelect={setEditingAnnotationId}
              onMove={(id, x, y) => updateAnnotation.mutate({ id, x, y })}
            />
          </Layer>
        </Stage>
      )}

      {calibrating && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground shadow">
          Clique em dois pontos de uma medida conhecida na planta
        </div>
      )}

      {annotating && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground shadow">
          Clique na planta para adicionar uma anotação
        </div>
      )}

      <div
        ref={readoutRef}
        className="pointer-events-none absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-xs tabular-nums text-muted-foreground"
      />

      <AnnotationEditor
        annotation={editingAnnotation}
        onClose={() => setEditingAnnotationId(null)}
      />
    </div>
  );
}
