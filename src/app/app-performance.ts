import {
  defineToolcraftFixtureAdapter,
  defineToolcraftPerformance,
  defineToolcraftSchemaDiscreteFixtureAdapter,
  type ToolcraftEnvelopePerformanceConfig,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { gridColumnsDomain } from "./foci/dot-values";
import { fociDotsPipeline } from "./foci/renderer-pipeline";

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    fixtureAdapters: {
      dimensions: {
        "export-width": defineToolcraftSchemaDiscreteFixtureAdapter(appSchema, {
          dimensionId: "export-width",
          entries: [
            { appliedValue: "2k", value: 2048 },
            { appliedValue: "4k", value: 4096 },
            { appliedValue: "8k", value: 8192 },
          ],
          target: "export.image.resolution",
        }),
        "grid-columns": defineToolcraftFixtureAdapter<number>({
          apply: (value) => value,
          dimensionId: "grid-columns",
          observe: (value) => value,
        }),
      },
    },
    rendererPipeline: fociDotsPipeline,
    rendererStrategy: "canvas-2d",
    rendererTechnique: {
      exportRenderer: "canvas-2d",
      fidelityRisks: [
        "Image halftone quality depends on uploaded image contrast; the contrast control remaps flat sources.",
        "Hex arrangement approximates hex packing with offset rows rather than exact hexagonal distances at frame edges.",
      ],
      intentionalRasterizationReason:
        "The product output is a raster dot pattern: circles are rasterized at the selected backing scale for preview and at the selected resolution for export.",
      layers: [
        {
          content: ["dense-pattern"],
          exportMode: "composited",
          id: "dot-pattern",
          kind: "product-foreground",
          primitiveCount: "high",
          renderer: "canvas-2d",
          uiSelector: '[data-toolcraft-product-output="foci-dots"]',
        },
      ],
      performanceRisks: [
        "Dot count grows quadratically with the Columns slider; the per-frame rasterize pass is main-thread Canvas 2D.",
        "8K export rasterizes the full dot field at a 8192px long edge in one batch pass.",
      ],
      previewRenderer: "canvas-2d",
      productRepresentation: "pixel",
      rendererStrategy: "canvas-2d",
      sourceRepresentation: "mixed",
      whyNotAlternativeStrategies: [
        "DOM or SVG would retain thousands of circle nodes and re-layout them every animation frame.",
        "WebGL adds shader and resource lifecycle complexity without need at the enforced maximum of ~10k circles per frame.",
      ],
    },
    scenarios: [
      {
        actionValue: "export.png",
        automated: true,
        automatedTestName: "perf: export path renders the export frame",
        browser: true,
        browserTestName: "browser perf: export png completes at workload",
        completionEvidence: "download",
        controlLabel: "Export PNG",
        coversTargets: ["actions.output"],
        expectedObservable:
          "Export PNG downloads a decoded non-empty artifact at the selected resolution.",
        fixture: "maximum columns with 8K resolution",
        id: "perf.export",
        interaction: "export",
        pathId:
          "performance-path:%5B%22batch-responsive%22%2C%22export%22%2C%5B%22export-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22export-width%22%2C%22grid-columns%22%5D%5D",
      },
      {
        automated: true,
        automatedTestName: "perf: media import rebuilds the halftone field",
        browser: true,
        browserTestName: "browser perf: image import rebuilds the field",
        coversTargets: ["source.image"],
        expectedObservable:
          "Uploading a source image in Image mode renders halftone dots from its pixels.",
        fixture: "image source at maximum columns",
        id: "perf.media-import",
        interaction: "media-import",
        pathId:
          "performance-path:%5B%22batch-responsive%22%2C%22media-import%22%2C%5B%22draw-dots%22%2C%22source-field%22%5D%2C%5B%22main%22%5D%2C%5B%22grid-columns%22%5D%5D",
        target: "source.image",
      },
      {
        automated: true,
        automatedTestName: "perf: initial render draws the default pattern",
        browser: true,
        browserTestName: "browser perf: initial render draws the pattern",
        coversTargets: ["canvas.size.height", "canvas.size.width"],
        expectedObservable:
          "The default waves pattern renders visible dots on first load.",
        fixture: "default state at maximum columns",
        id: "perf.initial-render",
        interaction: "initial-render",
        pathId:
          "performance-path:%5B%22initial-render%22%2C%22initial-render%22%2C%5B%22draw-dots%22%2C%22source-field%22%5D%2C%5B%22main%22%5D%2C%5B%22grid-columns%22%5D%5D",
        uiSelector: '[data-toolcraft-product-output="foci-dots"]',
      },
      {
        automated: true,
        automatedTestName:
          "perf: field-shaping drags rebuild the sampler live",
        browser: true,
        browserTestName: "browser perf: field slider drag stays live",
        controlLabel: "Columns",
        coversTargets: ["grid.columns", "pattern.angle", "pattern.scale"],
        expectedObservable:
          "Dragging Columns, Scale, or Angle updates the rendered lattice during the gesture.",
        fixture: "default waves pattern at maximum columns",
        id: "perf.control-drag.field",
        interaction: "control-drag",
        pathId:
          "performance-path:%5B%22interactive-continuous%22%2C%22control-drag%22%2C%5B%22draw-dots%22%2C%22source-field%22%5D%2C%5B%22main%22%5D%2C%5B%22grid-columns%22%5D%5D",
        target: "grid.columns",
      },
      {
        automated: true,
        automatedTestName: "perf: draw-only drags repaint live",
        browser: true,
        browserTestName: "browser perf: draw slider drag stays live",
        controlLabel: "Dot size",
        coversTargets: [
          "dots.sizeRange",
          "grid.jitter",
          "motion.amount",
          "pattern.contrast",
        ],
        expectedObservable:
          "Dragging Dot size, Jitter, Contrast, or Amount repaints the dots during the gesture.",
        fixture: "default waves pattern at maximum columns",
        id: "perf.control-drag.draw",
        interaction: "control-drag",
        pathId:
          "performance-path:%5B%22interactive-continuous%22%2C%22control-drag%22%2C%5B%22draw-dots%22%5D%2C%5B%22main%22%5D%2C%5B%22grid-columns%22%5D%5D",
        target: "dots.sizeRange",
      },
      {
        automated: true,
        automatedTestName: "perf: playback repaints each frame",
        browser: true,
        browserTestName: "browser perf: playback repaints each frame",
        coversTargets: ["timeline.currentTime"],
        expectedObservable:
          "Playing the timeline animates the dot radii continuously without invalidating the field sampler.",
        uiSelector: '[data-toolcraft-product-output="foci-dots"]',
        fixture: "wave motion playback at maximum columns",
        id: "perf.timeline-playback",
        interaction: "timeline-playback",
        pathId:
          "performance-path:%5B%22interactive-continuous%22%2C%22timeline-playback%22%2C%5B%22draw-dots%22%5D%2C%5B%22main%22%5D%2C%5B%22grid-columns%22%5D%5D",
      },
      {
        automated: true,
        automatedTestName: "perf: viewport drag avoids renderer work",
        browser: true,
        browserTestName: "browser perf: viewport drag avoids renderer work",
        coversTargets: ["canvas.viewport.offset"],
        expectedObservable:
          "Panning the canvas moves the viewport transform without re-rendering the dot pattern.",
        fixture: "default waves pattern at maximum columns",
        id: "perf.viewport-drag",
        interaction: "viewport-drag",
        pathId:
          "performance-path:%5B%22interactive-continuous%22%2C%22viewport-drag%22%2C%5B%5D%2C%5B%5D%2C%5B%5D%5D",
      },
      {
        automated: true,
        automatedTestName: "perf: viewport zoom avoids renderer work",
        browser: true,
        browserTestName: "browser perf: viewport zoom avoids renderer work",
        coversTargets: ["canvas.viewport.zoom"],
        expectedObservable:
          "Zooming the canvas scales the viewport transform without re-rendering the dot pattern.",
        fixture: "default waves pattern at maximum columns",
        id: "perf.viewport-zoom",
        interaction: "viewport-zoom",
        pathId:
          "performance-path:%5B%22interactive-continuous%22%2C%22viewport-zoom%22%2C%5B%5D%2C%5B%5D%2C%5B%5D%5D",
      },
      {
        automated: true,
        automatedTestName:
          "perf: source selections rebuild the sampler once",
        browser: true,
        browserTestName: "browser perf: source change rebuilds the field",
        controlLabel: "Source",
        coversTargets: ["grid.arrangement", "pattern.source", "pattern.text"],
        expectedObservable:
          "Changing the source, arrangement, or text renders the new field within one interaction.",
        fixture: "default waves pattern at maximum columns",
        id: "perf.control-change.field",
        interaction: "control-change",
        pathId:
          "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22draw-dots%22%2C%22source-field%22%5D%2C%5B%22main%22%5D%2C%5B%22grid-columns%22%5D%5D",
        target: "pattern.source",
      },
      {
        automated: true,
        automatedTestName: "perf: appearance changes repaint once",
        browser: true,
        browserTestName: "browser perf: appearance change repaints",
        controlLabel: "Color",
        coversTargets: [
          "appearance.background",
          "dots.color",
          "export.includeBackground",
          "motion.style",
          "pattern.invert",
        ],
        expectedObservable:
          "Changing dot color, background, invert, or motion style repaints the pattern within one interaction.",
        fixture: "default waves pattern at maximum columns",
        id: "perf.control-change.draw",
        interaction: "control-change",
        pathId:
          "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22draw-dots%22%5D%2C%5B%22main%22%5D%2C%5B%22grid-columns%22%5D%5D",
        target: "dots.color",
      },
      {
        automated: true,
        automatedTestName: "perf: export settings avoid renderer work",
        browser: true,
        browserTestName: "browser perf: export settings avoid renderer work",
        controlLabel: "Resolution",
        coversTargets: ["export.image.format", "export.image.resolution"],
        expectedObservable:
          "Changing export format or resolution updates the setting without re-rendering the pattern.",
        fixture: "default waves pattern",
        id: "perf.control-change.export-settings",
        interaction: "control-change",
        pathId:
          "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%5D%2C%5B%5D%2C%5B%5D%5D",
        target: "export.image.resolution",
      },
    ],
    usesCustomRenderer: true,
    workloadEnvelope: {
      dimensions: [
        {
          batchMax: gridColumnsDomain.max,
          defaultValue: 48,
          id: "grid-columns",
          interactiveMax: gridColumnsDomain.max,
          mapping: "quadratic",
          source: {
            kind: "schema-target",
            target: "grid.columns",
            workloadBoundary: "maximum",
          },
          unit: "columns",
        },
        {
          batchMax: 8192,
          defaultValue: 4096,
          id: "export-width",
          mapping: "quadratic",
          source: {
            kind: "schema-target",
            target: "export.image.resolution",
          },
          unit: "px",
        },
      ],
    },
  });
