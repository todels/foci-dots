import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import type { DotFieldSampler } from "./dot-field";
import { dotTargets } from "./dot-values";

type FociDotsPassContracts = {
  "source-field": ToolcraftRendererPipelinePassContract<DotFieldSampler>;
  "draw-dots": ToolcraftRendererPipelinePassContract<void>;
  "export-frame": ToolcraftRendererPipelinePassContract<void>;
};

/**
 * One compiled pipeline shared by the live preview, runtime evidence, and
 * performance assessment. `source-field` builds the scalar field sampler
 * (procedural closures, or image/text rasterized to per-cell values) and is
 * memoized per source inputs; `draw-dots` rasterizes the circles each frame.
 */
export const fociDotsPipeline = registerToolcraftRendererPipeline<
  FociDotsPassContracts
>()({
  interactionInvalidation: [
    {
      interaction: "initial-render",
      invalidates: ["source-field", "draw-dots"],
      targets: ["canvas.size.width", "canvas.size.height"],
    },
    {
      interaction: "control-change",
      invalidates: ["source-field", "draw-dots"],
      targets: [dotTargets.source, dotTargets.text, dotTargets.arrangement],
    },
    {
      interaction: "control-drag",
      invalidates: ["source-field", "draw-dots"],
      targets: [dotTargets.columns, dotTargets.scale, dotTargets.angle],
    },
    {
      interaction: "control-change",
      invalidates: ["draw-dots"],
      mustNotInvalidate: ["source-field"],
      targets: [
        dotTargets.dotColor,
        dotTargets.background,
        "export.includeBackground",
        dotTargets.invert,
        dotTargets.motionStyle,
      ],
    },
    {
      interaction: "control-drag",
      invalidates: ["draw-dots"],
      mustNotInvalidate: ["source-field"],
      targets: [
        dotTargets.sizeRange,
        dotTargets.jitter,
        dotTargets.contrast,
        dotTargets.motionAmount,
      ],
    },
    {
      interaction: "control-change",
      invalidates: [],
      mustNotInvalidate: ["source-field", "draw-dots"],
      targets: ["export.image.format", "export.image.resolution"],
    },
    {
      interaction: "media-import",
      invalidates: ["source-field", "draw-dots"],
      targets: [dotTargets.imageSource],
    },
    {
      interaction: "timeline-playback",
      invalidates: ["draw-dots"],
      mustNotInvalidate: ["source-field"],
      targets: ["timeline.currentTime"],
    },
    {
      interaction: "viewport-drag",
      invalidates: [],
      mustNotInvalidate: ["source-field", "draw-dots"],
      targets: ["canvas.viewport.offset"],
    },
    {
      interaction: "viewport-zoom",
      invalidates: [],
      mustNotInvalidate: ["source-field", "draw-dots"],
      targets: ["canvas.viewport.zoom"],
    },
    {
      interaction: "export",
      invalidates: ["export-frame"],
      mustNotInvalidate: ["source-field"],
      targets: ["actions.output"],
    },
  ],
  passes: [
    {
      cacheKey: [
        "source",
        "scale",
        "angle",
        "columns",
        "arrangement",
        "text",
        "imageKey",
        "frameWidth",
        "frameHeight",
      ],
      cost: {
        dimensions: ["grid-columns"],
        frequency: "discrete",
        relationship: "quadratic",
      },
      id: "source-field",
      inputs: [
        dotTargets.source,
        dotTargets.scale,
        dotTargets.angle,
        dotTargets.text,
        dotTargets.imageSource,
        dotTargets.columns,
        dotTargets.arrangement,
      ],
      invalidatedBy: [
        "control-change",
        "control-drag",
        "media-import",
        "initial-render",
      ],
      kind: "preprocess",
      lifecycle: { cache: "memoized", resourceScope: "renderer" },
      output: "intermediate",
      quality: "full",
      runsOn: "main",
    },
    {
      cost: {
        dimensions: ["grid-columns"],
        frequency: "frame",
        relationship: "quadratic",
      },
      id: "draw-dots",
      inputs: [
        dotTargets.dotColor,
        dotTargets.sizeRange,
        dotTargets.jitter,
        dotTargets.contrast,
        dotTargets.invert,
        dotTargets.background,
        dotTargets.motionStyle,
        dotTargets.motionAmount,
      ],
      invalidatedBy: [
        "control-change",
        "control-drag",
        "media-import",
        "timeline-playback",
        "initial-render",
      ],
      kind: "composite",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "preview",
      quality: "retina",
      runsOn: "main",
    },
    {
      cost: {
        dimensions: ["grid-columns", "export-width"],
        frequency: "batch",
        relationship: "product",
      },
      id: "export-frame",
      inputs: ["export.image.format", "export.image.resolution"],
      invalidatedBy: ["export"],
      kind: "export",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "export",
      quality: "export",
      runsOn: "main",
    },
  ],
  runtimeId: "foci-dots",
});

export const sourceFieldPass = fociDotsPipeline.getPass("source-field");
export const drawDotsPass = fociDotsPipeline.getPass("draw-dots");
