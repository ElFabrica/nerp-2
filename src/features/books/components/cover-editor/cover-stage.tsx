"use client";

import type Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Transformer } from "react-konva";
import useImage from "use-image";
import { constructUrl } from "@/hooks/use-construct-url";
import {
  COVER_CANVAS_HEIGHT,
  COVER_CANVAS_WIDTH,
  type CoverBackground,
  type CoverElement,
} from "../../lib/cover-layout";
import { CoverElementNode } from "./cover-element-node";

// Preenche o canvas inteiro tipo `object-fit: cover` — sem essa conta a
// imagem de fundo ficaria esticada/distorcida quando a proporção dela não
// bate com 960x540.
function BackgroundImage({ imageKey }: { imageKey: string }) {
  const [image] = useImage(constructUrl(imageKey), "anonymous");
  if (!image) return null;

  const scale = Math.max(
    COVER_CANVAS_WIDTH / image.width,
    COVER_CANVAS_HEIGHT / image.height,
  );
  const width = image.width * scale;
  const height = image.height * scale;

  return (
    <KonvaImage
      image={image}
      x={(COVER_CANVAS_WIDTH - width) / 2}
      y={(COVER_CANVAS_HEIGHT - height) / 2}
      width={width}
      height={height}
      listening={false}
    />
  );
}

interface CoverStageProps {
  elements: CoverElement[];
  background: CoverBackground;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<CoverElement>) => void;
}

export function CoverStage({
  elements,
  background,
  selectedId,
  onSelect,
  onChange,
}: CoverStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / COVER_CANVAS_WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const node = selectedId ? stage.findOne(`#${selectedId}`) : null;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg border shadow-sm"
      style={{
        aspectRatio: `${COVER_CANVAS_WIDTH} / ${COVER_CANVAS_HEIGHT}`,
        // Xadrez cinza atrás do canvas — deixa visível o efeito de
        // transparência quando a opacidade do fundo é menor que 100%.
        backgroundColor: "#f3f4f6",
        backgroundImage:
          "conic-gradient(#e5e7eb 90deg, transparent 90deg 180deg, #e5e7eb 180deg 270deg, transparent 270deg)",
        backgroundSize: "20px 20px",
      }}
    >
      {scale > 0 && (
        <Stage
          ref={stageRef}
          width={COVER_CANVAS_WIDTH * scale}
          height={COVER_CANVAS_HEIGHT * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(event) => {
            if (event.target === stageRef.current) onSelect(null);
          }}
        >
          <Layer listening={false}>
            {background.imageKey && (
              <BackgroundImage imageKey={background.imageKey} />
            )}
            <Rect
              x={0}
              y={0}
              width={COVER_CANVAS_WIDTH}
              height={COVER_CANVAS_HEIGHT}
              fill={background.color}
              opacity={background.opacity}
            />
          </Layer>
          <Layer>
            {elements.map((element) => (
              <CoverElementNode
                key={element.id}
                element={element}
                isSelected={element.id === selectedId}
                onSelect={onSelect}
                onChange={onChange}
              />
            ))}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
