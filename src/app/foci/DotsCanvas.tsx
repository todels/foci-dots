"use client";

import * as React from "react";

import {
  getToolcraftTimelineLoopProgress,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftImageAsset,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  useToolcraftMediaPresentationUrls,
  useToolcraftPipeline,
  useToolcraftPipelinePass,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import { setDotSourceImage } from "./dot-image-cache";
import { drawDotPatternFrame, getDotBackingSize } from "./dot-renderer";
import { buildDotFieldSampler } from "./dot-sampler";
import { dotTargets, readDotPatternValues } from "./dot-values";
import { drawDotsPass, sourceFieldPass } from "./renderer-pipeline";
import styles from "./dots-canvas.module.css";

function findDotSourceImageAsset(
  mediaAssets: ToolcraftState["mediaAssets"],
): ToolcraftImageAsset | undefined {
  return mediaAssets.find(
    (asset): asset is ToolcraftImageAsset =>
      asset.assetKind === "image" &&
      asset.sourceTarget === dotTargets.imageSource &&
      asset.lifecycle !== "unavailable",
  );
}

function useDecodedSourceImage(
  asset: ToolcraftImageAsset | undefined,
  url: string | undefined,
): { image: HTMLImageElement | null; imageKey: string } {
  const [decoded, setDecoded] = React.useState<{
    image: HTMLImageElement | null;
    key: string;
  }>({ image: null, key: "none" });

  React.useEffect(() => {
    if (!asset || !url) {
      setDecoded({ image: null, key: "none" });
      return;
    }

    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) {
        return;
      }
      const key = `${asset.id}:${asset.resourceRef}`;
      setDotSourceImage(key, image);
      setDecoded({ image, key });
    };
    image.onerror = () => {
      if (active) {
        setDecoded({ image: null, key: "none" });
      }
    };
    image.src = url;

    return () => {
      active = false;
    };
  }, [asset, url]);

  return { image: decoded.image, imageKey: decoded.key };
}

/**
 * The Foci Dots product preview: one Canvas 2D surface that renders the dot
 * pattern for the active scene frame and timeline loop progress.
 */
export function DotsCanvas(): React.JSX.Element | null {
  const frame = useToolcraftProductSceneFrame();
  const pipeline = useToolcraftPipeline();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const values = useToolcraftSelector((state) => state.values);
  const mediaAssets = useToolcraftSelector((state) => state.mediaAssets);
  const canvasMode = useToolcraftSelector((state) => state.canvas.mode);
  const timelineLoop = useToolcraftSelector(
    (state) => ({
      currentTimeSeconds: state.timeline.currentTimeSeconds,
      durationSeconds: state.timeline.durationSeconds,
    }),
    (previous, next) =>
      previous.currentTimeSeconds === next.currentTimeSeconds &&
      previous.durationSeconds === next.durationSeconds,
  );

  const patternValues = React.useMemo(
    () => readDotPatternValues(values),
    [values],
  );
  const sourceImageAsset = findDotSourceImageAsset(mediaAssets);
  const presentationUrls = useToolcraftMediaPresentationUrls(mediaAssets);
  const { image, imageKey } = useDecodedSourceImage(
    sourceImageAsset,
    sourceImageAsset ? presentationUrls.get(sourceImageAsset.id) : undefined,
  );

  const rect = frame.rect;
  const frameWidth = rect?.width ?? 0;
  const frameHeight = rect?.height ?? 0;

  const imageTransform = sourceImageAsset?.transform;
  const imageCacheKey = imageTransform
    ? `${imageKey}:${imageTransform.rotationDeg ?? 0}:${
        imageTransform.flipHorizontal ? "h" : "-"
      }${imageTransform.flipVertical ? "v" : "-"}`
    : imageKey;
  const samplerState = useToolcraftPipelinePass(
    sourceFieldPass,
    {
      angle: patternValues.angle,
      arrangement: patternValues.arrangement,
      blackPoint: patternValues.blackPoint,
      columns: patternValues.columns,
      frameHeight,
      frameWidth,
      imageKey: imageCacheKey,
      scale: patternValues.scale,
      source: patternValues.source,
      text: patternValues.text,
      whitePoint: patternValues.whitePoint,
    },
    () =>
      buildDotFieldSampler({
        height: frameHeight,
        image,
        imageTransform,
        values: patternValues,
        width: frameWidth,
      }),
  );

  const renderScaleValue = values["canvas.renderScale"];
  const renderScale =
    typeof renderScaleValue === "number" && Number.isFinite(renderScaleValue)
      ? Math.min(2, Math.max(1, renderScaleValue))
      : 2;
  const includeBackground =
    canvasMode !== "infinite" &&
    shouldIncludeToolcraftPreviewBackground({
      state: { canvas: { mode: canvasMode }, values } as ToolcraftState,
    });
  const loopProgress = getToolcraftTimelineLoopProgress(timelineLoop);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rect || frameWidth <= 0 || frameHeight <= 0) {
      return;
    }
    if (samplerState.status !== "success") {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const backingScale = devicePixelRatio * renderScale;
    const backing = getDotBackingSize(
      frameWidth,
      frameHeight,
      devicePixelRatio,
      renderScale,
    );
    if (canvas.width !== backing.width) {
      canvas.width = backing.width;
    }
    if (canvas.height !== backing.height) {
      canvas.height = backing.height;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const draw = () => {
      context.setTransform(backingScale, 0, 0, backingScale, 0, 0);
      context.translate(-rect.x, -rect.y);
      context.clearRect(rect.x, rect.y, frameWidth, frameHeight);
      drawDotPatternFrame(context, rect, {
        includeBackground,
        loopProgress,
        sampler: samplerState.result,
        values: patternValues,
      });
    };

    if (pipeline) {
      void pipeline.runPass(drawDotsPass, undefined, draw);
    } else {
      draw();
    }
  }, [
    frameHeight,
    frameWidth,
    includeBackground,
    loopProgress,
    patternValues,
    pipeline,
    rect,
    renderScale,
    samplerState,
  ]);

  if (!rect) {
    return null;
  }

  return (
    <canvas
      className={styles.canvas}
      data-dot-size-max={String(Math.round(patternValues.sizeMax))}
      data-dot-size-min={String(Math.round(patternValues.sizeMin))}
      data-timeline-progress={loopProgress.toFixed(4)}
      data-toolcraft-product-output="foci-dots"
      ref={canvasRef}
    />
  );
}
