import type { ToolcraftState } from "@/toolcraft/runtime";
import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { DotsCanvas } from "./foci/DotsCanvas";
import { getDotSourceImage } from "./foci/dot-image-cache";
import { drawDotPatternFrame } from "./foci/dot-renderer";
import { buildDotFieldSampler } from "./foci/dot-sampler";
import { dotTargets, readDotPatternValues } from "./foci/dot-values";
import { fociDotsPipeline } from "./foci/renderer-pipeline";

/**
 * In Infinity mode the product renders one fixed origin-centered pattern tile
 * so the workspace and export always have exact world-space bounds.
 */
const infinitePatternTile = {
  height: 1080,
  width: 1920,
  x: -960,
  y: -540,
} as const;

function findExportSourceImage(state: Readonly<ToolcraftState>) {
  const asset = state.mediaAssets.find(
    (candidate) =>
      candidate.assetKind === "image" &&
      candidate.sourceTarget === dotTargets.imageSource &&
      candidate.lifecycle !== "unavailable",
  );
  if (!asset || asset.assetKind !== "image") {
    return { image: null, transform: undefined } as const;
  }
  return {
    image: getDotSourceImage(`${asset.id}:${asset.resourceRef}`) ?? null,
    transform: asset.transform,
  } as const;
}

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <DotsCanvas />,
  exportRenderer: {
    baseFileName: "foci-dots",
    renderFrame: ({ context, frame, state, timelineProgress }) => {
      const values = readDotPatternValues(state.values);
      const source = findExportSourceImage(state);
      const sampler = buildDotFieldSampler({
        height: frame.height,
        image: source.image,
        imageTransform: source.transform,
        values,
        width: frame.width,
      });
      // Runtime composites the selected background before this frame runs, so
      // the export frame draws the dots only.
      drawDotPatternFrame(context, frame, {
        includeBackground: false,
        loopProgress: timelineProgress,
        sampler,
        values,
      });
    },
  },
  modelPresentation: { mode: "runtime" },
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration: fociDotsPipeline,
  sceneBoundsProvider: () => [infinitePatternTile],
  schema: appSchema,
};
