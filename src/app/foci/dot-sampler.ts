import {
  createProceduralFieldSampler,
  type DotFieldSampler,
} from "./dot-field";
import {
  applyDotLevels,
  createRasterFieldSampler,
  rasterizeImageToGrid,
  rasterizeTextToGrid,
  type DotImageTransform,
} from "./dot-raster";
import { getDotGridRows } from "./dot-renderer";
import type { DotPatternValues } from "./dot-values";

const emptyFieldSampler: DotFieldSampler = () => 0;

export type DotSamplerOptions = {
  height: number;
  image: (CanvasImageSource & { height: number; width: number }) | null;
  imageTransform?: DotImageTransform;
  values: DotPatternValues;
  width: number;
};

/**
 * Builds the field sampler for the current pattern source. Shared by the
 * preview `source-field` pass and the export renderer so both surfaces sample
 * the identical field for a given state.
 */
export function buildDotFieldSampler(
  options: DotSamplerOptions,
): DotFieldSampler {
  const { height, image, imageTransform, values, width } = options;
  if (width <= 0 || height <= 0) {
    return emptyFieldSampler;
  }

  const columns = Math.max(1, Math.round(values.columns));
  const rows = getDotGridRows(width, height, columns, values.arrangement);

  switch (values.source) {
    case "image": {
      if (!image) {
        return emptyFieldSampler;
      }
      const grid = rasterizeImageToGrid(image, columns, rows, imageTransform);
      if (!grid) {
        return emptyFieldSampler;
      }
      for (let index = 0; index < grid.values.length; index += 1) {
        grid.values[index] = applyDotLevels(
          grid.values[index],
          values.blackPoint,
          values.whitePoint,
        );
      }
      return createRasterFieldSampler(grid);
    }
    case "text": {
      const grid = rasterizeTextToGrid(values.text, columns, rows);
      return grid ? createRasterFieldSampler(grid) : emptyFieldSampler;
    }
    default:
      return createProceduralFieldSampler(values.source, {
        angleDeg: values.angle,
        aspect: width / height,
        scale: values.scale,
      });
  }
}
