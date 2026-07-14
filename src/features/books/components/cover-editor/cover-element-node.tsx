"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Image as KonvaImage, Rect, Text } from "react-konva";
import useImage from "use-image";
import { constructUrl } from "@/hooks/use-construct-url";
import type { CoverElement } from "../../lib/cover-layout";

interface CoverElementNodeProps {
  element: CoverElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<CoverElement>) => void;
}

function CoverImageNode({
  element,
  common,
  onChange,
}: {
  element: Extract<CoverElement, { type: "image" }>;
  common: Record<string, unknown>;
  onChange: (patch: Partial<CoverElement>) => void;
}) {
  const [image] = useImage(
    element.imageKey ? constructUrl(element.imageKey) : "",
    "anonymous",
  );

  return (
    <KonvaImage
      {...common}
      image={image}
      onTransformEnd={(event: KonvaEventObject<Event>) => {
        const node = event.target as Konva.Image;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(10, element.width * scaleX),
          height: Math.max(10, element.height * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

export function CoverElementNode({
  element,
  isSelected,
  onSelect,
  onChange,
}: CoverElementNodeProps) {
  const handleSelect = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    event.cancelBubble = true;
    onSelect(element.id);
  };

  const handleDragEnd = (event: KonvaEventObject<DragEvent>) => {
    onChange(element.id, { x: event.target.x(), y: event.target.y() });
  };

  const patch = (value: Partial<CoverElement>) => onChange(element.id, value);

  const common = {
    id: element.id,
    name: "coverElement",
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    draggable: true,
    onMouseDown: handleSelect,
    onTap: handleSelect,
    onDragEnd: handleDragEnd,
    stroke: isSelected ? "#2563eb" : undefined,
    strokeWidth: isSelected ? 1 : 0,
    dash: isSelected ? [4, 4] : undefined,
  };

  if (element.type === "image") {
    return <CoverImageNode element={element} common={common} onChange={patch} />;
  }

  if (element.type === "divider") {
    return (
      <Rect
        {...common}
        fill={element.color}
        stroke={isSelected ? "#2563eb" : undefined}
        onTransformEnd={(event: KonvaEventObject<Event>) => {
          const node = event.target as Konva.Rect;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          patch({
            x: node.x(),
            y: node.y(),
            width: Math.max(2, element.width * scaleX),
            height: Math.max(2, element.height * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
    );
  }

  return (
    <Text
      {...common}
      text={element.uppercase ? element.text.toUpperCase() : element.text}
      fontSize={element.fontSize}
      fontStyle={element.fontWeight === "bold" ? "bold" : "normal"}
      fill={element.color}
      align={element.align}
      verticalAlign="middle"
      wrap="word"
      onTransformEnd={(event: KonvaEventObject<Event>) => {
        const node = event.target as Konva.Text;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        patch({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, element.width * scaleX),
          height: Math.max(16, element.height * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
