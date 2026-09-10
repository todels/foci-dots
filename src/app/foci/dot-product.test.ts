import { describe, expect, it } from "vitest";

import type { ToolcraftSceneRect } from "@/toolcraft/runtime";

import { appComposition } from "../app-composition";
import { appSchema } from "../app-schema";
import { createProceduralFieldSampler, shapeDotFieldValue } from "./dot-field";
import { applyDotLevels, createRasterFieldSampler } from "./dot-raster";
import {
  drawDotPatternFrame,
  getDotBackingSize,
  getDotDriftOffset,
  getDotGridRows,
  type DotFrameOptions,
} from "./dot-renderer";
import { dotDefaults, readDotPatternValues } from "./dot-values";

type RecordedDot = { radius: number; x: number; y: number };

type MockFrameResult = {
  dots: RecordedDot[];
  fillRects: { color: string; height: number; width: number }[];
  fillStyleAtFill: string;
};

const frame: ToolcraftSceneRect = { height: 1080, width: 1920, x: 0, y: 0 };

function renderFrame(
  overrides: Partial<ReturnType<typeof readDotPatternValues>> = {},
  options: Partial<Omit<DotFrameOptions, "sampler" | "values">> = {},
): MockFrameResult {
  const values = { ...readDotPatternValues({}), ...overrides };
  const sampler =
    values.source === "image" || values.source === "text"
      ? createRasterFieldSampler({
          columns: 4,
          rows: 4,
          values: new Float32Array(16).fill(0.75),
        })
      : createProceduralFieldSampler(values.source, {
          angleDeg: values.angle,
          aspect: frame.width / frame.height,
          scale: values.scale,
        });

  const result: MockFrameResult = {
    dots: [],
    fillRects: [],
    fillStyleAtFill: "",
  };
  let fillStyle = "";
  let pendingDots: RecordedDot[] = [];
  const context = {
    arc(x: number, y: number, radius: number) {
      pendingDots.push({ radius, x, y });
    },
    beginPath() {
      pendingDots = [];
    },
    fill() {
      result.dots.push(...pendingDots);
      result.fillStyleAtFill = fillStyle;
    },
    fillRect(_x: number, _y: number, width: number, height: number) {
      result.fillRects.push({ color: fillStyle, height, width });
    },
    moveTo() {},
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(next: string) {
      fillStyle = next;
    },
  } as unknown as CanvasRenderingContext2D;

  drawDotPatternFrame(context, frame, {
    includeBackground: options.includeBackground ?? true,
    loopProgress: options.loopProgress ?? 0,
    sampler,
    values,
  });
  return result;
}

describe("Foci Dots product renderer", () => {
  it("grid columns change the dot lattice density", () => {
    const sparse = renderFrame({ columns: 20 });
    const dense = renderFrame({ columns: 60 });
    expect(dense.dots.length).toBeGreaterThan(sparse.dots.length * 4);
  });

  it("grid arrangement switches square and hex packing", () => {
    expect(getDotGridRows(1920, 1080, 48, "hex")).toBeGreaterThan(
      getDotGridRows(1920, 1080, 48, "square"),
    );
    const square = renderFrame({ arrangement: "square", columns: 24 });
    const hex = renderFrame({ arrangement: "hex", columns: 24 });
    const squareXs = new Set(square.dots.map((dot) => Math.round(dot.x)));
    const hexOffsetDots = hex.dots.filter(
      (dot) => !squareXs.has(Math.round(dot.x)),
    );
    expect(hexOffsetDots.length).toBeGreaterThan(0);
  });

  it("dot size range rescales circle radii", () => {
    const narrow = renderFrame({ sizeMax: 30, sizeMin: 20 });
    const wide = renderFrame({ sizeMax: 95, sizeMin: 5 });
    const cell = frame.width / dotDefaults.columns;
    const narrowRadii = narrow.dots.map((dot) => dot.radius);
    expect(Math.min(...narrowRadii)).toBeGreaterThanOrEqual(
      (cell / 2) * 0.2 - 0.01,
    );
    expect(Math.max(...narrowRadii)).toBeLessThanOrEqual(
      (cell / 2) * 0.3 + 0.01,
    );
    expect(Math.max(...wide.dots.map((dot) => dot.radius))).toBeGreaterThan(
      Math.max(...narrowRadii),
    );
  });

  it("grid jitter offsets dot centers", () => {
    const regular = renderFrame({ jitter: 0, motionStyle: "none" });
    const jittered = renderFrame({ jitter: 60, motionStyle: "none" });
    const regularKeys = new Set(
      regular.dots.map((dot) => `${Math.round(dot.x)}:${Math.round(dot.y)}`),
    );
    const moved = jittered.dots.filter(
      (dot) => !regularKeys.has(`${Math.round(dot.x)}:${Math.round(dot.y)}`),
    );
    expect(moved.length).toBeGreaterThan(jittered.dots.length / 2);
  });

  it("dot color fills every circle", () => {
    const rendered = renderFrame({ dotColor: "#22DD88" });
    expect(rendered.fillStyleAtFill).toBe("#22DD88");
  });

  it("pattern source selects the field family", () => {
    const probe = (source: "waves" | "rings" | "noise" | "gradient") => {
      const sampler = createProceduralFieldSampler(source, {
        angleDeg: 30,
        aspect: 16 / 9,
        scale: 100,
      });
      return [sampler(0.1, 0.2), sampler(0.5, 0.5), sampler(0.8, 0.7)]
        .map((value) => value.toFixed(4))
        .join(",");
    };
    const signatures = new Set([
      probe("waves"),
      probe("rings"),
      probe("noise"),
      probe("gradient"),
    ]);
    expect(signatures.size).toBe(4);

    // The depth sources render their own geometry: burst streams perspective
    // rays from a scattered core with a guaranteed center dot; field renders
    // center-facing circle trails on the lattice.
    const burst = renderFrame({ motionStyle: "none", source: "burst" });
    const fieldPattern = renderFrame({ motionStyle: "none", source: "field" });
    const grid = renderFrame({ motionStyle: "none" });
    expect(burst.dots.length).toBeGreaterThan(0);
    expect(fieldPattern.dots.length).toBeGreaterThan(grid.dots.length);
    expect(burst.dots.length).not.toBe(fieldPattern.dots.length);
    const center = { x: frame.width / 2, y: frame.height / 2 };
    expect(
      burst.dots.some(
        (dot) =>
          Math.abs(dot.x - center.x) < 0.01 &&
          Math.abs(dot.y - center.y) < 0.01,
      ),
    ).toBe(true);
  });

  it("uploaded image drives the halftone field", () => {
    const grid = {
      columns: 2,
      rows: 1,
      values: Float32Array.from([1, 0]),
    };
    const sampler = createRasterFieldSampler(grid);
    expect(sampler(0.25, 0.5)).toBe(1);
    expect(sampler(0.75, 0.5)).toBe(0);
    const rendered = renderFrame({ motionStyle: "none", source: "image" });
    expect(rendered.dots.length).toBeGreaterThan(0);
  });

  it("pattern text rasterizes into the dot grid", () => {
    const rendered = renderFrame({ motionStyle: "none", source: "text" });
    const cell = frame.width / dotDefaults.columns;
    const expectedRadius =
      (cell / 2) * (dotDefaults.sizeRange[0] / 100 +
        ((dotDefaults.sizeRange[1] - dotDefaults.sizeRange[0]) / 100) *
          shapeDotFieldValue(0.75, {
            contrast: dotDefaults.contrast,
            invert: false,
          }));
    expect(rendered.dots[0]?.radius).toBeCloseTo(expectedRadius, 5);
  });

  it("pattern scale changes the field frequency", () => {
    const loose = createProceduralFieldSampler("waves", {
      angleDeg: 0,
      aspect: 1,
      scale: 50,
    });
    const tight = createProceduralFieldSampler("waves", {
      angleDeg: 0,
      aspect: 1,
      scale: 200,
    });
    const crossings = (sampler: (u: number, v: number) => number) => {
      let count = 0;
      let previous = sampler(0, 0) - 0.5;
      for (let step = 1; step <= 200; step += 1) {
        const value = sampler(step / 200, 0) - 0.5;
        if (Math.sign(value) !== Math.sign(previous)) count += 1;
        previous = value;
      }
      return count;
    };
    expect(crossings(tight)).toBeGreaterThan(crossings(loose));
  });

  it("pattern angle rotates directional fields", () => {
    const horizontal = createProceduralFieldSampler("gradient", {
      angleDeg: 0,
      aspect: 1,
      scale: 100,
    });
    const vertical = createProceduralFieldSampler("gradient", {
      angleDeg: 90,
      aspect: 1,
      scale: 100,
    });
    expect(horizontal(0.9, 0.5)).toBeGreaterThan(horizontal(0.1, 0.5));
    expect(vertical(0.5, 0.9)).toBeGreaterThan(vertical(0.5, 0.1));
    expect(Math.abs(vertical(0.9, 0.5) - vertical(0.1, 0.5))).toBeLessThan(
      0.01,
    );
  });

  it("pattern contrast remaps field values", () => {
    const flat = shapeDotFieldValue(0.7, { contrast: 0, invert: false });
    const neutral = shapeDotFieldValue(0.7, { contrast: 50, invert: false });
    const punchy = shapeDotFieldValue(0.7, { contrast: 100, invert: false });
    expect(flat).toBeCloseTo(0.5, 5);
    expect(neutral).toBeCloseTo(0.7, 5);
    expect(punchy).toBeGreaterThan(neutral);
  });

  it("image black point deepens halftone shadows", () => {
    // A mid-gray cell (darkness 0.5) grows toward a full dot as the black
    // point rises past its luminance.
    expect(applyDotLevels(0.5, 0, 100)).toBeCloseTo(0.5, 5);
    expect(applyDotLevels(0.5, 40, 100)).toBeCloseTo(1 - 0.1 / 0.6, 5);
    expect(applyDotLevels(0.5, 60, 100)).toBe(1);
    expect(applyDotLevels(0, 40, 100)).toBe(0);
  });

  it("image white point lifts halftone highlights", () => {
    // Lowering the white point clips light tones to paper: their dots shrink
    // and vanish once their luminance passes the point.
    expect(applyDotLevels(0.2, 0, 100)).toBeCloseTo(0.2, 5);
    expect(applyDotLevels(0.2, 0, 60)).toBe(0);
    expect(applyDotLevels(0.4, 0, 70)).toBeLessThan(
      applyDotLevels(0.4, 0, 100),
    );
    expect(applyDotLevels(0.4, 0, 70)).toBeGreaterThan(0);
  });

  it("pattern invert flips the field", () => {
    const plain = shapeDotFieldValue(0.8, { contrast: 50, invert: false });
    const inverted = shapeDotFieldValue(0.8, { contrast: 50, invert: true });
    expect(inverted).toBeCloseTo(1 - plain, 5);
  });

  it("motion style selects the loop modulation", () => {
    const still = renderFrame(
      { motionStyle: "none" },
      { loopProgress: 0.25 },
    );
    const pulsing = renderFrame(
      { motionStyle: "pulse" },
      { loopProgress: 0 },
    );
    const drifting = renderFrame(
      { motionStyle: "drift" },
      { loopProgress: 0.25 },
    );
    const radiiSum = (result: MockFrameResult) =>
      result.dots.reduce((sum, dot) => sum + dot.radius, 0);
    expect(radiiSum(pulsing)).not.toBeCloseTo(radiiSum(still), 3);
    expect(getDotDriftOffset(
      { motionAmount: 40, motionStyle: "drift" },
      0.25,
    )).not.toEqual([0, 0]);
    expect(radiiSum(drifting)).not.toBeCloseTo(radiiSum(still), 3);
  });

  it("motion amount scales the loop modulation", () => {
    const soft = renderFrame(
      { motionAmount: 10, motionStyle: "pulse" },
      { loopProgress: 0 },
    );
    const deep = renderFrame(
      { motionAmount: 90, motionStyle: "pulse" },
      { loopProgress: 0 },
    );
    expect(Math.max(...deep.dots.map((dot) => dot.radius))).toBeGreaterThan(
      Math.max(...soft.dots.map((dot) => dot.radius)),
    );
  });

  it("timeline playback loops the motion seamlessly forward", () => {
    for (const style of ["pulse", "wave", "drift"] as const) {
      const start = renderFrame(
        { motionStyle: style },
        { loopProgress: 0 },
      );
      const seam = renderFrame(
        { motionStyle: style },
        { loopProgress: 1 - 1e-9 },
      );
      const middle = renderFrame(
        { motionStyle: style },
        { loopProgress: 0.37 },
      );
      const signature = (result: MockFrameResult) =>
        result.dots
          .slice(0, 40)
          .map((dot) => dot.radius.toFixed(3))
          .join(",");
      expect(signature(seam)).toBe(signature(start));
      expect(signature(middle)).not.toBe(signature(start));
    }
  });

  it("render scale keeps selected backing pixels", () => {
    expect(getDotBackingSize(1920, 1080, 1, 2)).toEqual({
      height: 2160,
      width: 3840,
    });
    expect(getDotBackingSize(1920, 1080, 2, 1.5)).toEqual({
      height: 3240,
      width: 5760,
    });
    expect(getDotBackingSize(1920, 1080, 1, 99)).toEqual({
      height: 2160,
      width: 3840,
    });
  });

  it("export png delivers the dot pattern artifact", () => {
    expect(appComposition.exportRenderer?.baseFileName).toBe("foci-dots");
    const rendered = renderFrame({}, { includeBackground: false });
    expect(rendered.dots.length).toBeGreaterThan(0);
  });

  it("background switch gates the painted background", () => {
    const withBackground = renderFrame({}, { includeBackground: true });
    const withoutBackground = renderFrame({}, { includeBackground: false });
    expect(withBackground.fillRects).toHaveLength(1);
    expect(withoutBackground.fillRects).toHaveLength(0);
  });

  it("background color fills the pattern frame", () => {
    const rendered = renderFrame(
      { background: "#123456" },
      { includeBackground: true },
    );
    expect(rendered.fillRects[0]).toEqual({
      color: "#123456",
      height: frame.height,
      width: frame.width,
    });
  });

  it("image export format selects the encoded artifact type", () => {
    const section = appSchema.panels.controls?.sections.find(
      (candidate) => candidate.title === "Image Export",
    );
    const format = Object.values(section?.controls ?? {}).find(
      (control) => control.target === "export.image.format",
    );
    expect(format?.options?.map((option) => option.value)).toEqual([
      "png",
      "jpg",
    ]);
    expect(format?.defaultValue).toBe("png");
  });

  it("image export resolution selects the artifact size", () => {
    const section = appSchema.panels.controls?.sections.find(
      (candidate) => candidate.title === "Image Export",
    );
    const resolution = Object.values(section?.controls ?? {}).find(
      (control) => control.target === "export.image.resolution",
    );
    expect(resolution?.options?.map((option) => option.value)).toEqual([
      "2k",
      "4k",
      "8k",
    ]);
    expect(resolution?.defaultValue).toBe("4k");
  });

  it("infinity canvas hides finite sizing and restores it", () => {
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.size).toMatchObject({ height: 1080, width: 1920 });
  });

  it("infinite image export crops to the pattern tile bounds", () => {
    const bounds = appComposition.sceneBoundsProvider?.({
      state: {} as never,
    });
    expect(bounds).toEqual([{ height: 1080, width: 1920, x: -960, y: -540 }]);
  });
});
