import type { ToolcraftSceneRect } from "@/toolcraft/runtime";

import { drawBurstFrame, drawFieldFrame } from "./dot-depth-renderer";
import { hash2, shapeDotFieldValue, type DotFieldSampler } from "./dot-field";
import type { DotPatternValues } from "./dot-values";

const TAU = Math.PI * 2;
const HEX_ROW_FACTOR = Math.sqrt(3) / 2;

/** Backing pixel size for the preview canvas at the selected render scale. */
export function getDotBackingSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  renderScale: number,
): { height: number; width: number } {
  const scale = devicePixelRatio * Math.min(2, Math.max(1, renderScale));
  return {
    height: Math.max(1, Math.round(cssHeight * scale)),
    width: Math.max(1, Math.round(cssWidth * scale)),
  };
}

/** Row count for the dot lattice at the given frame and arrangement. */
export function getDotGridRows(
  width: number,
  height: number,
  columns: number,
  arrangement: DotPatternValues["arrangement"],
): number {
  const cellWidth = width / Math.max(1, columns);
  const rowHeight =
    arrangement === "hex" ? cellWidth * HEX_ROW_FACTOR : cellWidth;
  return Math.max(1, Math.ceil(height / rowHeight));
}

export type DotFrameOptions = {
  /** Draw the product background rectangle before the dots. */
  includeBackground: boolean;
  /** Timeline loop progress in [0, 1); drives every motion style. */
  loopProgress: number;
  sampler: DotFieldSampler;
  values: DotPatternValues;
};

/**
 * Circular drift offset for the current loop progress. The offset travels a
 * closed circle in field space, so any field — including non-periodic noise
 * and raster sources — loops seamlessly forward.
 */
export function getDotDriftOffset(
  values: Pick<DotPatternValues, "motionAmount" | "motionStyle">,
  loopProgress: number,
): readonly [number, number] {
  if (values.motionStyle !== "drift") {
    return [0, 0];
  }
  const radius = (values.motionAmount / 100) * 0.12;
  const phase = loopProgress * TAU;
  return [radius * Math.cos(phase), radius * Math.sin(phase)];
}

/**
 * Draws one deterministic Foci Dots frame in scene coordinates. Shared by the
 * live preview and the runtime-owned image export so both surfaces render the
 * identical product output for a given state and loop progress.
 */
export function drawDotPatternFrame(
  context: CanvasRenderingContext2D,
  frame: ToolcraftSceneRect,
  options: DotFrameOptions,
): void {
  const { includeBackground, loopProgress, sampler, values } = options;
  const { height, width } = frame;
  if (width <= 0 || height <= 0) {
    return;
  }

  if (includeBackground) {
    context.fillStyle = values.background;
    context.fillRect(frame.x, frame.y, width, height);
  }

  if (values.source === "burst" || values.source === "field") {
    context.fillStyle = values.dotColor;
    context.beginPath();
    const drawDepthFrame =
      values.source === "burst" ? drawBurstFrame : drawFieldFrame;
    drawDepthFrame(context, frame, { loopProgress, values });
    context.fill();
    return;
  }

  const columns = Math.max(1, Math.round(values.columns));
  const cellWidth = width / columns;
  const rowHeight =
    values.arrangement === "hex" ? cellWidth * HEX_ROW_FACTOR : cellWidth;
  const rows = Math.max(1, Math.ceil(height / rowHeight));
  const jitterAmplitude = (values.jitter / 100) * cellWidth * 0.55;
  const phase = loopProgress * TAU;
  const motionAmount = values.motionAmount / 100;
  // Cosine keeps the loop seamless (cos 0 === cos 2π) while making the pulse
  // depth visible at the loop start, so Amount edits are observable at t = 0.
  const pulseFactor =
    values.motionStyle === "pulse"
      ? 1 + motionAmount * 0.35 * Math.cos(phase)
      : 1;
  const [driftU, driftV] = getDotDriftOffset(values, loopProgress);
  const theta = (values.angle * Math.PI) / 180;
  const waveDirX = Math.cos(theta);
  const waveDirY = Math.sin(theta);
  const aspect = width / height;
  const sizeSpan = (values.sizeMax - values.sizeMin) / 100;
  const sizeBase = values.sizeMin / 100;

  context.fillStyle = values.dotColor;
  context.beginPath();

  for (let row = 0; row < rows; row += 1) {
    const hexOffset =
      values.arrangement === "hex" && row % 2 === 1 ? cellWidth / 2 : 0;
    const columnCount =
      values.arrangement === "hex" && hexOffset > 0 ? columns + 1 : columns;
    for (let column = 0; column < columnCount; column += 1) {
      const jitterX = jitterAmplitude * (hash2(column, row) - 0.5) * 2;
      const jitterY =
        jitterAmplitude * (hash2(column + 57.3, row + 113.9) - 0.5) * 2;
      const centerX =
        frame.x + (column + 0.5) * cellWidth - hexOffset + jitterX;
      const centerY = frame.y + (row + 0.5) * rowHeight + jitterY;
      const u = (centerX - frame.x) / width;
      const v = (centerY - frame.y) / height;

      let value = shapeDotFieldValue(
        sampler(u + driftU, v + driftV),
        values,
      );

      if (values.motionStyle === "wave") {
        const along = (u * waveDirX * aspect + v * waveDirY) * TAU * 1.5;
        value += motionAmount * 0.4 * Math.sin(phase + along);
        value = Math.min(1, Math.max(0, value));
      }

      const radius =
        (cellWidth / 2) * (sizeBase + sizeSpan * value) * pulseFactor;
      if (radius < 0.2) {
        continue;
      }

      context.moveTo(centerX + radius, centerY);
      context.arc(centerX, centerY, radius, 0, TAU);
    }
  }

  context.fill();
}
