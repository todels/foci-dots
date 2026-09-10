import type { DotFieldSampler } from "./dot-field";

export type DotRasterGrid = {
  columns: number;
  rows: number;
  values: Float32Array;
};

function createSamplingContext(
  columns: number,
  rows: number,
): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = columns;
  canvas.height = rows;
  return canvas.getContext("2d", { willReadFrequently: true });
}

function readAlphaWeightedDarkness(
  context: CanvasRenderingContext2D,
  columns: number,
  rows: number,
): Float32Array {
  const pixels = context.getImageData(0, 0, columns, rows).data;
  const values = new Float32Array(columns * rows);
  for (let index = 0; index < values.length; index += 1) {
    const offset = index * 4;
    const alpha = pixels[offset + 3] / 255;
    const luminance =
      (0.2126 * pixels[offset] +
        0.7152 * pixels[offset + 1] +
        0.0722 * pixels[offset + 2]) /
      255;
    // Dark and opaque source pixels grow dots; transparent stays empty.
    values[index] = (1 - luminance) * alpha;
  }
  return values;
}

export type DotImageTransform = {
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotationDeg?: 0 | 90 | 180 | 270;
};

/**
 * Halftones a decoded source image into one darkness value per grid cell.
 * The image cover-fits the pattern frame: scaled proportionally until the
 * frame is covered, then cropped at the frame bounds. The runtime media
 * transform (rotate/flip) is applied before sampling so preview and export
 * consume `state.mediaAssets[].transform`.
 */
export function rasterizeImageToGrid(
  image: CanvasImageSource & { height: number; width: number },
  columns: number,
  rows: number,
  transform: DotImageTransform = {},
): DotRasterGrid | null {
  const context = createSamplingContext(columns, rows);
  if (!context || image.width <= 0 || image.height <= 0) {
    return null;
  }

  const rotation = transform.rotationDeg ?? 0;
  const rotatedWidth = rotation % 180 === 0 ? image.width : image.height;
  const rotatedHeight = rotation % 180 === 0 ? image.height : image.width;
  const scale = Math.max(columns / rotatedWidth, rows / rotatedHeight);
  context.clearRect(0, 0, columns, rows);
  context.save();
  context.translate(columns / 2, rows / 2);
  context.scale(
    transform.flipHorizontal ? -scale : scale,
    transform.flipVertical ? -scale : scale,
  );
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(
    image,
    -image.width / 2,
    -image.height / 2,
    image.width,
    image.height,
  );
  context.restore();

  return {
    columns,
    rows,
    values: readAlphaWeightedDarkness(context, columns, rows),
  };
}

/**
 * Rasterizes a text string into one coverage value per grid cell. Text is
 * centered and sized to fit the pattern frame width with a bold sans face so
 * short brand words fill the dot grid like the client's reference dot art.
 */
export function rasterizeTextToGrid(
  text: string,
  columns: number,
  rows: number,
): DotRasterGrid | null {
  const context = createSamplingContext(columns, rows);
  if (!context) {
    return null;
  }

  const trimmed = text.trim();
  const values = new Float32Array(columns * rows);
  if (trimmed.length === 0) {
    return { columns, rows, values };
  }

  const fontFamily =
    "'Inter Variable', 'Helvetica Neue', Arial, sans-serif";
  let fontSize = rows;
  context.font = `900 ${fontSize}px ${fontFamily}`;
  const measured = context.measureText(trimmed);
  const measuredWidth = Math.max(measured.width, 1);
  fontSize = Math.min(rows * 0.9, (fontSize * columns * 0.92) / measuredWidth);

  context.clearRect(0, 0, columns, rows);
  context.fillStyle = "#000000";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `900 ${fontSize}px ${fontFamily}`;
  context.fillText(trimmed, columns / 2, rows / 2);

  return {
    columns,
    rows,
    values: readAlphaWeightedDarkness(context, columns, rows),
  };
}

/**
 * Applies black/white point levels to one alpha-weighted darkness value.
 * Points are schema percent values on the luminance axis: luminance at or
 * below the black point maps to a full-size dot, at or above the white point
 * to no dot, with a linear ramp between.
 */
export function applyDotLevels(
  darkness: number,
  blackPoint: number,
  whitePoint: number,
): number {
  const black = Math.min(blackPoint, whitePoint - 1) / 100;
  const white = Math.max(whitePoint, blackPoint + 1) / 100;
  const luminance = 1 - Math.min(1, Math.max(0, darkness));
  const remapped = (luminance - black) / (white - black);
  return 1 - Math.min(1, Math.max(0, remapped));
}

/** Wraps a raster grid in the shared field sampler shape. */
export function createRasterFieldSampler(
  grid: DotRasterGrid,
): DotFieldSampler {
  return (u, v) => {
    const column = Math.min(
      grid.columns - 1,
      Math.max(0, Math.floor(u * grid.columns)),
    );
    const row = Math.min(
      grid.rows - 1,
      Math.max(0, Math.floor(v * grid.rows)),
    );
    return grid.values[row * grid.columns + column];
  };
}
