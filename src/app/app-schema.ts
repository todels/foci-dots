import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import {
  dotDefaults,
  dotTargets,
  gridColumnsDomain,
} from "./foci/dot-values";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: true,
    sizing: { mode: "editable-output" },
    upload: true,
  },
  identity: appIdentity,
  panels: {
    controls: {
      sections: [
        {
          controls: {
            includeBackground: {
              applicability: { mode: "always" },
              defaultValue: true,
              description:
                "Off exports transparent PNGs and hides the pattern background.",
              label: "Include",
              performanceReason:
                "Toggling the background repaints the frame at constant per-dot cost.",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              applicability: {
                all: [{ equals: true, target: "export.includeBackground" }],
                mode: "conditional",
              },
              defaultValue: dotDefaults.background,
              label: false,
              performanceReason:
                "Background color changes repaint the frame at constant per-dot cost.",
              performanceRole: "responsiveness",
              target: dotTargets.background,
              type: "color",
            },
          },
          id: "background",
          layoutGroups: [
            {
              columns: 2,
              controls: ["includeBackground", "background"],
              layout: "inline",
            },
          ],
          title: "Background",
        },
        {
          controls: {
            columns: {
              applicability: { mode: "always" },
              defaultValue: dotDefaults.columns,
              label: "Columns",
              max: gridColumnsDomain.max,
              min: gridColumnsDomain.min,
              orderRole: "primary",
              performanceReason:
                "Column count sets the dot lattice density; total dots grow quadratically with it.",
              performanceRole: "workload",
              sliderValueKind: "discrete",
              step: gridColumnsDomain.step,
              target: dotTargets.columns,
              type: "slider",
            },
            arrangement: {
              applicability: { mode: "always" },
              defaultValue: dotDefaults.arrangement,
              label: "Arrangement",
              options: [
                { label: "Square", value: "square" },
                { label: "Hex", value: "hex" },
              ],
              performanceReason:
                "Row packing changes dot placement, not the amount of work per dot.",
              performanceRole: "responsiveness",
              target: dotTargets.arrangement,
              type: "segmented",
            },
            sizeRange: {
              applicability: { mode: "always" },
              defaultValue: [...dotDefaults.sizeRange],
              label: "Dot size",
              max: 100,
              min: 0,
              performanceReason:
                "Size bounds rescale each circle radius at constant per-dot cost.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              target: dotTargets.sizeRange,
              step: 1,
              type: "rangeSlider",
              unit: "%",
            },
            jitter: {
              applicability: { mode: "always" },
              defaultValue: dotDefaults.jitter,
              label: "Jitter",
              max: 100,
              min: 0,
              performanceReason:
                "Jitter offsets dot centers deterministically at constant per-dot cost.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              target: dotTargets.jitter,
              step: 1,
              type: "slider",
              unit: "%",
            },
            dotColor: {
              applicability: { mode: "always" },
              defaultValue: dotDefaults.dotColor,
              label: "Dots color",
              performanceReason:
                "Dot color changes repaint the frame at constant per-dot cost.",
              performanceRole: "responsiveness",
              target: dotTargets.dotColor,
              type: "color",
            },
          },
          id: "dot-grid",
          title: "Dot Grid",
        },
        {
          controls: {
            source: {
              applicability: { mode: "always" },
              defaultValue: dotDefaults.source,
              label: "Source",
              options: [
                { label: "Waves", value: "waves" },
                { label: "Rings", value: "rings" },
                { label: "Noise", value: "noise" },
                { label: "Gradient", value: "gradient" },
                { label: "Burst", value: "burst" },
                { label: "Field", value: "field" },
                { label: "Image", value: "image" },
                { label: "Text", value: "text" },
              ],
              orderRole: "mode",
              performanceReason:
                "The source selects which sampler builds; the dot count still bounds its cost.",
              performanceRole: "responsiveness",
              semanticGroup: "field-source",
              target: dotTargets.source,
              type: "select",
            },
            image: {
              applicability: {
                all: [{ equals: "image", target: dotTargets.source }],
                mode: "conditional",
              },
              assetKind: "image",
              label: "Image",
              performanceReason:
                "The uploaded image is sampled once per grid cell, so the dot lattice bounds its cost.",
              performanceRole: "responsiveness",
              semanticGroup: "field-source",
              target: dotTargets.imageSource,
              type: "fileDrop",
            },
            text: {
              applicability: {
                all: [{ equals: "text", target: dotTargets.source }],
                mode: "conditional",
              },
              commitMode: "content",
              defaultValue: dotDefaults.text,
              label: "Text",
              performanceReason:
                "Text is rasterized once per change into the fixed grid resolution.",
              performanceRole: "responsiveness",
              semanticGroup: "field-source",
              target: dotTargets.text,
              textValueKind: "single-line",
              type: "text",
            },
            scale: {
              applicability: {
                all: [
                  {
                    oneOf: ["waves", "rings", "noise", "gradient"],
                    target: dotTargets.source,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: dotDefaults.scale,
              label: "Scale",
              semanticGroup: "field-shaping",
              max: 300,
              min: 10,
              performanceReason:
                "Field frequency changes sampler math, not the number of sampled dots.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              target: dotTargets.scale,
              step: 1,
              type: "slider",
              unit: "%",
            },
            angle: {
              applicability: {
                all: [
                  {
                    oneOf: ["waves", "gradient"],
                    target: dotTargets.source,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: dotDefaults.angle,
              label: "Angle",
              semanticGroup: "field-shaping",
              max: 360,
              min: 0,
              performanceReason:
                "Field direction rotates sampler coordinates at constant per-dot cost.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              target: dotTargets.angle,
              step: 1,
              type: "slider",
              unit: "°",
            },
            contrast: {
              applicability: { mode: "always" },
              defaultValue: dotDefaults.contrast,
              label: "Contrast",
              semanticGroup: "field-shaping",
              max: 100,
              min: 0,
              performanceReason:
                "Contrast remaps sampled values at constant per-dot cost.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              target: dotTargets.contrast,
              step: 1,
              type: "slider",
            },
            blackPoint: {
              applicability: {
                all: [{ equals: "image", target: dotTargets.source }],
                mode: "conditional",
              },
              defaultValue: dotDefaults.blackPoint,
              label: "Black point",
              max: 99,
              min: 0,
              performanceReason:
                "Levels remap sampled luminance at constant per-cell cost.",
              performanceRole: "responsiveness",
              semanticGroup: "image-levels",
              sliderValueKind: "continuous",
              step: 1,
              target: dotTargets.blackPoint,
              type: "slider",
              unit: "%",
            },
            whitePoint: {
              applicability: {
                all: [{ equals: "image", target: dotTargets.source }],
                mode: "conditional",
              },
              defaultValue: dotDefaults.whitePoint,
              label: "White point",
              max: 100,
              min: 1,
              performanceReason:
                "Levels remap sampled luminance at constant per-cell cost.",
              performanceRole: "responsiveness",
              semanticGroup: "image-levels",
              sliderValueKind: "continuous",
              step: 1,
              target: dotTargets.whitePoint,
              type: "slider",
              unit: "%",
            },
            invert: {
              applicability: { mode: "always" },
              defaultValue: dotDefaults.invert,
              label: "Invert",
              performanceReason:
                "Inversion flips sampled values at constant per-dot cost.",
              performanceRole: "responsiveness",
              semanticGroup: "field-shaping",
              target: dotTargets.invert,
              type: "switch",
            },
          },
          id: "pattern",
          title: "Pattern",
        },
        {
          controls: {
            motionStyle: {
              applicability: { mode: "always" },
              defaultValue: dotDefaults.motionStyle,
              label: "Style",
              options: [
                { label: "None", value: "none" },
                { label: "Pulse", value: "pulse" },
                { label: "Wave", value: "wave" },
                { label: "Drift", value: "drift" },
              ],
              performanceReason:
                "The motion style changes per-frame dot math, not the number of dots.",
              performanceRole: "responsiveness",
              target: dotTargets.motionStyle,
              type: "segmented",
            },
            motionAmount: {
              applicability: {
                all: [{ notEquals: "none", target: dotTargets.motionStyle }],
                mode: "conditional",
              },
              defaultValue: dotDefaults.motionAmount,
              label: "Amount",
              max: 100,
              min: 0,
              performanceReason:
                "Motion amount scales the per-dot modulation at constant cost.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              target: dotTargets.motionAmount,
              step: 1,
              type: "slider",
            },
          },
          id: "motion",
          title: "Motion",
        },
        {
          controls: {
            imageFormat: {
              applicability: { mode: "always" },
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              performanceReason:
                "Encoding format changes the artifact codec, not the rendered workload.",
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              applicability: { mode: "always" },
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              performanceReason:
                "The selected long edge sets the exported backing area, so export work grows with it.",
              performanceRole: "workload",
              target: "export.image.resolution",
              type: "select",
            },
          },
          id: "image-export",
          layoutGroups: [
            {
              columns: 2,
              controls: ["imageFormat", "imageResolution"],
              layout: "inline",
            },
          ],
          title: "Image Export",
        },
        {
          controls: {
            outputActions: {
              actions: [
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  role: "export-image",
                  value: "export.png",
                },
              ],
              applicability: { mode: "always" },
              target: "actions.output",
              type: "panelActions",
            },
          },
          id: "output",
          title: "Output",
        },
      ],
      title: "Controls",
    },
    timeline: {
      defaultDurationSeconds: 6,
      mode: "playback",
    },
  },
  toolbar: {
    history: true,
    radar: true,
    zoom: true,
  },
});
