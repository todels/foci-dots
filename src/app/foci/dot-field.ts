import type { DotPatternValues } from "./dot-values";

/**
 * A scalar field sampled per dot cell. Coordinates are normalized to the
 * pattern frame: `u` in [0, 1] across the width, `v` in [0, 1] down the
 * height, with `aspect` = width / height so procedural fields stay isotropic.
 * Returns a value in [0, 1] before contrast/invert/motion shaping.
 */
export type DotFieldSampler = (u: number, v: number) => number;

const TAU = Math.PI * 2;

function fract(value: number): number {
  return value - Math.floor(value);
}

/** Deterministic 2D value hash in [0, 1). */
export function hash2(x: number, y: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Deterministic smooth 2D value noise in [0, 1]. */
export function valueNoise2(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smoothstep(x - xi);
  const yf = smoothstep(y - yi);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  const top = a + (b - a) * xf;
  const bottom = c + (d - c) * xf;
  return top + (bottom - top) * yf;
}

type ProceduralFieldOptions = {
  angleDeg: number;
  aspect: number;
  scale: number;
};

/**
 * Builds the procedural samplers. `scale` is the schema percent value where
 * 100 is the neutral frequency for each field family.
 */
export function createProceduralFieldSampler(
  source: "waves" | "rings" | "noise" | "gradient",
  options: ProceduralFieldOptions,
): DotFieldSampler {
  const { angleDeg, aspect, scale } = options;
  const frequency = Math.max(scale, 1) / 100;
  const theta = (angleDeg * Math.PI) / 180;
  const dirX = Math.cos(theta);
  const dirY = Math.sin(theta);

  switch (source) {
    case "waves": {
      const waveCycles = 6 * frequency;
      return (u, v) => {
        const x = u * aspect;
        const y = v;
        const along = x * dirX + y * dirY;
        return 0.5 + 0.5 * Math.sin(along * waveCycles * TAU * 0.5);
      };
    }
    case "rings": {
      const ringCycles = 5 * frequency;
      return (u, v) => {
        const x = (u - 0.5) * aspect;
        const y = v - 0.5;
        const distance = Math.hypot(x, y);
        return 0.5 + 0.5 * Math.cos(distance * ringCycles * TAU);
      };
    }
    case "noise": {
      const noiseCells = 6 * frequency;
      return (u, v) =>
        valueNoise2(
          u * aspect * noiseCells,
          v * noiseCells,
        );
    }
    case "gradient": {
      return (u, v) => {
        const x = (u - 0.5) * aspect;
        const y = v - 0.5;
        const along = x * dirX + y * dirY;
        const span = Math.abs(dirX) * aspect + Math.abs(dirY);
        const normalized = span > 0 ? along / span + 0.5 : 0.5;
        return Math.min(1, Math.max(0, normalized)) * frequency;
      };
    }
  }
}

/**
 * Applies contrast and invert shaping shared by every source. Contrast is the
 * schema percent value: 0 flattens toward 0.5, 50 is neutral, 100 doubles the
 * distance from mid-gray.
 */
export function shapeDotFieldValue(
  raw: number,
  values: Pick<DotPatternValues, "contrast" | "invert">,
): number {
  const factor = values.contrast / 50;
  const shaped = 0.5 + (raw - 0.5) * factor;
  const clamped = Math.min(1, Math.max(0, shaped));
  return values.invert ? 1 - clamped : clamped;
}
