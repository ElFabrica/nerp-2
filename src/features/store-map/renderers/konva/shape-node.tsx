"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Line, Rect } from "react-konva";
import { alignmentSnap, boundsOf } from "../../engine/geometry";
import { useSceneStore } from "../../engine/scene-store";
import type { Bounds, SceneObject } from "../../engine/types";

const SNAP_PX = 8;

interface MapShapeProps {
  object: SceneObject;
  isSelected: boolean;
  draggable: boolean;
}

export function MapShape({ object, isSelected, draggable }: MapShapeProps) {
  const updateObjectGeometry = useSceneStore(
    (state) => state.updateObjectGeometry,
  );
  const setSelection = useSceneStore((state) => state.setSelection);
  const toggleSelection = useSceneStore((state) => state.toggleSelection);
  const setGuides = useSceneStore((state) => state.setGuides);

  const applyDragSnap = (node: Konva.Node, dragBounds: Bounds) => {
    const state = useSceneStore.getState();
    const ppm = state.floorPlan?.pixelsPerMeter ?? 50;
    const scale = state.viewport.zoom * ppm;
    const threshold = SNAP_PX / scale;

    const others: Bounds[] = [];
    for (const other of Object.values(state.objects)) {
      if (other.id === object.id) continue;
      others.push(boundsOf(other.geometry));
    }

    const { dx, dy, guidesX, guidesY } = alignmentSnap(
      dragBounds,
      others,
      threshold,
      state.gridSizeM,
      state.snapEnabled,
    );
    if (dx !== 0) node.x(node.x() + dx);
    if (dy !== 0) node.y(node.y() + dy);
    setGuides({ x: guidesX, y: guidesY });
  };

  const clearGuides = () => setGuides({ x: [], y: [] });

  const handleSelect = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true;
    const isMultiSelect = "shiftKey" in event.evt && event.evt.shiftKey;
    if (isMultiSelect) toggleSelection(object.id);
    else setSelection([object.id]);
  };

  const stroke = isSelected ? "#2563eb" : (object.style.stroke ?? "#334155");
  const strokeWidth = isSelected ? 2 : (object.style.strokeWidth ?? 1);
  const fill = object.style.fill ?? "#cbd5e1";
  const opacity = object.style.opacity ?? 1;

  const commonProps = {
    id: object.id,
    name: "mapObject",
    draggable,
    onMouseDown: handleSelect,
    onTap: handleSelect,
    strokeScaleEnabled: false,
    perfectDrawEnabled: false,
    stroke,
    strokeWidth,
    opacity,
  };

  const geometry = object.geometry;

  if (geometry.kind === "RECT") {
    return (
      <Rect
        {...commonProps}
        x={geometry.x}
        y={geometry.y}
        width={geometry.width}
        height={geometry.height}
        rotation={geometry.rotation}
        fill={fill}
        onDragMove={(event) => {
          if (geometry.rotation !== 0) return;
          const node = event.target;
          applyDragSnap(node, {
            minX: node.x(),
            minY: node.y(),
            maxX: node.x() + geometry.width,
            maxY: node.y() + geometry.height,
          });
        }}
        onDragEnd={(event) => {
          clearGuides();
          updateObjectGeometry(object.id, {
            ...geometry,
            x: event.target.x(),
            y: event.target.y(),
          });
        }}
        onTransformEnd={(event) => {
          const node = event.target as Konva.Rect;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          updateObjectGeometry(object.id, {
            kind: "RECT",
            x: node.x(),
            y: node.y(),
            width: Math.max(0.1, geometry.width * scaleX),
            height: Math.max(0.1, geometry.height * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
    );
  }

  if (geometry.kind === "POINT") {
    return (
      <Circle
        {...commonProps}
        x={geometry.x}
        y={geometry.y}
        radius={0.25}
        fill={fill}
        onDragMove={(event) => {
          const node = event.target;
          applyDragSnap(node, {
            minX: node.x(),
            minY: node.y(),
            maxX: node.x(),
            maxY: node.y(),
          });
        }}
        onDragEnd={(event) => {
          clearGuides();
          updateObjectGeometry(object.id, {
            kind: "POINT",
            x: event.target.x(),
            y: event.target.y(),
          });
        }}
      />
    );
  }

  const points = geometry.points.flatMap((point) => [point.x, point.y]);
  return (
    <Line
      {...commonProps}
      points={points}
      closed={geometry.kind === "POLYGON"}
      fill={geometry.kind === "POLYGON" ? fill : undefined}
      onDragEnd={(event) => {
        const dx = event.target.x();
        const dy = event.target.y();
        event.target.position({ x: 0, y: 0 });
        updateObjectGeometry(object.id, {
          ...geometry,
          points: geometry.points.map((point) => ({
            x: point.x + dx,
            y: point.y + dy,
          })),
        });
      }}
    />
  );
}
