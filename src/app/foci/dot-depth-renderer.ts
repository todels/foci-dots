import type { ToolcraftSceneRect } from "@/toolcraft/runtime";

import { hash2, shapeDotFieldValue } from "./dot-field";
import type { DotPatternValues } from "./dot-values";

const TAU = Math.PI * 2;
/** Perspective easing along a burst ray: slow near the eye, fast outward. */
const BURST_PERSPECTIVE = 1.6;

type DepthFrameOptions = {
  loopProgress: number;
  values: DotPatternValues;
};

type DepthFrameGeometry = {
  centerX: number;
  centerY: number;
  /** Half-edge of the centered square that frames both depth patterns. */
  half: number;
};

function getDepthGeometry(frame: ToolcraftSceneRect): DepthFrameGeometry {
  return {
    centerX: frame.x + frame.width / 2,
    centerY: frame.y + frame.height / 2,
    half: (Math.min(frame.width, frame.height) / 2) * 0.86,
  };
}

function dot(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  if (radius < 0.15) return;
  context.moveTo(x + radius, y);
  context.arc(x, y, radius, 0, TAU);
}

/**
 * The aggressive depth pattern: perspective rays of circles streaming from a
 * scattered core to a dotted square frame, with one circle always dead
 * center. Wave motion streams the ray dots outward in a seamless depth loop.
 */
export function drawBurstFrame(
  context: CanvasRenderingContext2D,
  frame: ToolcraftSceneRect,
  options: DepthFrameOptions,
): void {
  const { loopProgress, values } = options;
  const { centerX, centerY, half } = getDepthGeometry(frame);
  const columns = Math.max(1, Math.round(values.columns));
  const anchorsPerSide = Math.max(3, Math.round(columns / 8));
  const dotsPerRay = Math.max(6, Math.round(columns / 4));
  const phase = loopProgress * TAU;
  const motionAmount = values.motionAmount / 100;
  const pulse =
    values.motionStyle === "pulse"
      ? 1 + motionAmount * 0.35 * Math.cos(phase)
      : 1;
  const swirl =
    values.motionStyle === "drift"
      ? motionAmount * 0.12 * Math.sin(phase)
      : 0;
  const stream = values.motionStyle === "wave" ? loopProgress : 0;
  const cell = (half * 2) / columns;
  const sizeBase = values.sizeMin / 100;
  const sizeSpan = (values.sizeMax - values.sizeMin) / 100;
  const radiusFor = (depth: number): number => {
    const shaped = shapeDotFieldValue(depth, values);
    return (cell / 2) * (sizeBase + sizeSpan * shaped) * pulse;
  };

  // Frame anchors: evenly spaced points along the square edges.
  const anchors: { x: number; y: number }[] = [];
  for (let index = 0; index <= anchorsPerSide; index += 1) {
    const along = -half + (index / anchorsPerSide) * half * 2;
    anchors.push({ x: along, y: -half });
    anchors.push({ x: along, y: half });
    if (index > 0 && index < anchorsPerSide) {
      anchors.push({ x: -half, y: along });
      anchors.push({ x: half, y: along });
    }
  }

  for (const anchor of anchors) {
    // Frame dot; corners read heavier, like the reference plate.
    const isCorner =
      Math.abs(anchor.x) === half && Math.abs(anchor.y) === half;
    dot(
      context,
      centerX + anchor.x,
      centerY + anchor.y,
      radiusFor(1) * (isCorner ? 1.6 : 0.9),
    );

    // Ray from the center to this anchor with perspective-eased spacing.
    const angle = Math.atan2(anchor.y, anchor.x) + swirl;
    const reach = Math.hypot(anchor.x, anchor.y);
    for (let step = 0; step < dotsPerRay; step += 1) {
      const depth = (step / dotsPerRay + stream) % 1;
      const eased = Math.pow(depth, BURST_PERSPECTIVE);
      dot(
        context,
        centerX + Math.cos(angle) * eased * reach,
        centerY + Math.sin(angle) * eased * reach,
        radiusFor(depth) * (0.35 + 0.65 * depth),
      );
    }
  }

  // Scattered core plus the guaranteed center dot.
  const coreDots = columns * 3;
  const coreReach = half * (0.07 + (values.jitter / 100) * 0.18);
  for (let index = 0; index < coreDots; index += 1) {
    const radial = Math.sqrt(hash2(index, 7.31)) * coreReach;
    const theta = hash2(index, 91.7) * TAU + swirl * 3;
    dot(
      context,
      centerX + Math.cos(theta) * radial,
      centerY + Math.sin(theta) * radial,
      radiusFor(0.12 + hash2(index, 3.3) * 0.1) *
        (0.5 + hash2(index, 17.9) * 0.8),
    );
  }
  dot(context, centerX, centerY, radiusFor(0.5));
}

/**
 * The chill depth pattern: the regular lattice where every cell renders a
 * short trail of circles pointing at the center, its length growing with
 * radial distance — a one-point-perspective vector field with a single dot
 * at the exact center.
 */
export function drawFieldFrame(
  context: CanvasRenderingContext2D,
  frame: ToolcraftSceneRect,
  options: DepthFrameOptions,
): void {
  const { loopProgress, values } = options;
  const { centerX, centerY, half } = getDepthGeometry(frame);
  const columns = Math.max(1, Math.round(values.columns));
  const cell = (half * 2) / columns;
  const phase = loopProgress * TAU;
  const motionAmount = values.motionAmount / 100;
  const pulse =
    values.motionStyle === "pulse"
      ? 1 + motionAmount * 0.35 * Math.cos(phase)
      : 1;
  const twist =
    values.motionStyle === "drift"
      ? motionAmount * 0.4 * Math.sin(phase)
      : 0;
  const trailSteps = 5;
  const thickness = Math.max(0.4, (cell / 2) * (values.sizeMin / 100) * 0.9);
  const maxLength = cell * 1.15 * (values.sizeMax / 100);
  const maxDistance = Math.SQRT2 * half;

  for (let row = 0; row <= columns; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const jitterX =
        (values.jitter / 100) * cell * (hash2(column, row) - 0.5);
      const jitterY =
        (values.jitter / 100) * cell * (hash2(column + 41.7, row) - 0.5);
      const x = -half + column * cell + jitterX;
      const y = -half + row * cell + jitterY;
      const distance = Math.hypot(x, y) / maxDistance;
      let shaped = shapeDotFieldValue(distance, values);
      if (values.motionStyle === "wave") {
        shaped += motionAmount * 0.3 * Math.sin(phase + distance * TAU);
        shaped = Math.min(1, Math.max(0, shaped));
      }
      const length = maxLength * shaped * pulse;
      const angle = Math.atan2(y, x) + twist;
      const stepX = (Math.cos(angle) * length) / (trailSteps - 1);
      const stepY = (Math.sin(angle) * length) / (trailSteps - 1);
      const startX = centerX + x - (stepX * (trailSteps - 1)) / 2;
      const startY = centerY + y - (stepY * (trailSteps - 1)) / 2;
      if (length < thickness) {
        dot(context, centerX + x, centerY + y, thickness);
        continue;
      }
      for (let step = 0; step < trailSteps; step += 1) {
        dot(context, startX + stepX * step, startY + stepY * step, thickness);
      }
    }
  }
}
