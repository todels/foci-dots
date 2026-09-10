import type { ToolcraftState } from "@/toolcraft/runtime";

/** Runtime schema targets owned by the Foci Dots product. */
export const dotTargets = {
  background: "appearance.background",
  columns: "grid.columns",
  arrangement: "grid.arrangement",
  jitter: "grid.jitter",
  sizeRange: "dots.sizeRange",
  dotColor: "dots.color",
  source: "pattern.source",
  scale: "pattern.scale",
  angle: "pattern.angle",
  contrast: "pattern.contrast",
  invert: "pattern.invert",
  text: "pattern.text",
  imageSource: "source.image",
  motionStyle: "motion.style",
  motionAmount: "motion.amount",
} as const;

export type DotPatternSource =
  | "waves"
  | "rings"
  | "noise"
  | "gradient"
  | "image"
  | "text";

export type DotArrangement = "square" | "hex";

export type DotMotionStyle = "none" | "pulse" | "wave" | "drift";

export const dotDefaults = {
  background: "#0A0A0A",
  columns: 48,
  arrangement: "square" as DotArrangement,
  jitter: 0,
  sizeRange: [8, 92] as readonly [number, number],
  dotColor: "#FFFFFF",
  source: "waves" as DotPatternSource,
  scale: 100,
  angle: 30,
  contrast: 60,
  invert: false,
  text: "FOCI",
  motionStyle: "wave" as DotMotionStyle,
  motionAmount: 40,
} as const;

export const gridColumnsDomain = { max: 96, min: 12, step: 1 } as const;

const patternSources: readonly DotPatternSource[] = [
  "waves",
  "rings",
  "noise",
  "gradient",
  "image",
  "text",
];

const motionStyles: readonly DotMotionStyle[] = [
  "none",
  "pulse",
  "wave",
  "drift",
];

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readRange(
  value: unknown,
  fallback: readonly [number, number],
): readonly [number, number] {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  ) {
    return [value[0], value[1]];
  }
  return fallback;
}

export type DotPatternValues = {
  background: string;
  columns: number;
  arrangement: DotArrangement;
  jitter: number;
  sizeMin: number;
  sizeMax: number;
  dotColor: string;
  source: DotPatternSource;
  scale: number;
  angle: number;
  contrast: number;
  invert: boolean;
  text: string;
  motionStyle: DotMotionStyle;
  motionAmount: number;
};

/** Decodes the canonical runtime value model into the typed product values. */
export function readDotPatternValues(
  values: ToolcraftState["values"],
): DotPatternValues {
  const source = readString(values[dotTargets.source], dotDefaults.source);
  const arrangement = readString(
    values[dotTargets.arrangement],
    dotDefaults.arrangement,
  );
  const motionStyle = readString(
    values[dotTargets.motionStyle],
    dotDefaults.motionStyle,
  );
  const sizeRange = readRange(
    values[dotTargets.sizeRange],
    dotDefaults.sizeRange,
  );

  return {
    background: readString(
      values[dotTargets.background],
      dotDefaults.background,
    ),
    columns: readNumber(values[dotTargets.columns], dotDefaults.columns),
    arrangement: (
      arrangement === "hex" ? "hex" : "square"
    ) satisfies DotArrangement,
    jitter: readNumber(values[dotTargets.jitter], dotDefaults.jitter),
    sizeMin: Math.min(sizeRange[0], sizeRange[1]),
    sizeMax: Math.max(sizeRange[0], sizeRange[1]),
    dotColor: readString(values[dotTargets.dotColor], dotDefaults.dotColor),
    source: (patternSources.includes(source as DotPatternSource)
      ? source
      : dotDefaults.source) as DotPatternSource,
    scale: readNumber(values[dotTargets.scale], dotDefaults.scale),
    angle: readNumber(values[dotTargets.angle], dotDefaults.angle),
    contrast: readNumber(values[dotTargets.contrast], dotDefaults.contrast),
    invert: readBoolean(values[dotTargets.invert], dotDefaults.invert),
    text: readString(values[dotTargets.text], dotDefaults.text),
    motionStyle: (motionStyles.includes(motionStyle as DotMotionStyle)
      ? motionStyle
      : dotDefaults.motionStyle) as DotMotionStyle,
    motionAmount: readNumber(
      values[dotTargets.motionAmount],
      dotDefaults.motionAmount,
    ),
  };
}
