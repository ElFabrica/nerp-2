import type { Bounds, Geometry, MapShapeKind, Vec2, Viewport } from "./types";

/** Converte um ponto do mundo (metros) para coordenadas de tela (px). */
export function worldToScreen(
  point: Vec2,
  viewport: Viewport,
  pixelsPerMeter: number,
): Vec2 {
  const scale = viewport.zoom * pixelsPerMeter;
  return {
    x: point.x * scale + viewport.x,
    y: point.y * scale + viewport.y,
  };
}

/** Converte um ponto de tela (px) para coordenadas do mundo (metros). */
export function screenToWorld(
  point: Vec2,
  viewport: Viewport,
  pixelsPerMeter: number,
): Vec2 {
  const scale = viewport.zoom * pixelsPerMeter;
  return {
    x: (point.x - viewport.x) / scale,
    y: (point.y - viewport.y) / scale,
  };
}

export function boundsOf(geometry: Geometry): Bounds {
  switch (geometry.kind) {
    case "RECT": {
      // Considera rotação projetando os quatro cantos.
      const { x, y, width, height, rotation } = geometry;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const corners: Vec2[] = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ].map((corner) => {
        const dx = corner.x - cx;
        const dy = corner.y - cy;
        return {
          x: cx + dx * cos - dy * sin,
          y: cy + dx * sin + dy * cos,
        };
      });
      return boundsOfPoints(corners);
    }
    case "POLYGON":
    case "POLYLINE":
      return boundsOfPoints(geometry.points);
    case "POINT":
      return {
        minX: geometry.x,
        minY: geometry.y,
        maxX: geometry.x,
        maxY: geometry.y,
      };
  }
}

export function boundsOfPoints(points: Vec2[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY };
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
  );
}

/** Área visível do mundo (metros) a partir do tamanho da tela e do viewport. */
export function visibleWorldBounds(
  screenWidth: number,
  screenHeight: number,
  viewport: Viewport,
  pixelsPerMeter: number,
): Bounds {
  const topLeft = screenToWorld({ x: 0, y: 0 }, viewport, pixelsPerMeter);
  const bottomRight = screenToWorld(
    { x: screenWidth, y: screenHeight },
    viewport,
    pixelsPerMeter,
  );
  return {
    minX: topLeft.x,
    minY: topLeft.y,
    maxX: bottomRight.x,
    maxY: bottomRight.y,
  };
}

export function translateGeometry(
  geometry: Geometry,
  dx: number,
  dy: number,
): Geometry {
  switch (geometry.kind) {
    case "RECT":
      return { ...geometry, x: geometry.x + dx, y: geometry.y + dy };
    case "POINT":
      return { ...geometry, x: geometry.x + dx, y: geometry.y + dy };
    case "POLYGON":
    case "POLYLINE":
      return {
        ...geometry,
        points: geometry.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        })),
      };
  }
}

/** Geometria inicial ao criar um objeto de determinado tipo de forma. */
export function defaultGeometryFor(
  shapeKind: MapShapeKind,
  origin: Vec2,
): Geometry {
  switch (shapeKind) {
    case "RECT":
      return {
        kind: "RECT",
        x: origin.x,
        y: origin.y,
        width: 1,
        height: 1,
        rotation: 0,
      };
    case "POLYLINE":
      return { kind: "POLYLINE", points: [origin] };
    case "POLYGON":
      return { kind: "POLYGON", points: [origin] };
    case "POINT":
      return { kind: "POINT", x: origin.x, y: origin.y };
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Arredonda uma coordenada em metros ao passo do grid (para snapping). */
export function snapToGrid(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}
