import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { dotTargets } from "./foci/dot-values";

const productPersistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence:
        "The motion phase is defined as exactly one full 2π cycle per timeline loop; 6 seconds is the product cycle period, so every motion style stitches its first and last frames.",
      seconds: 6,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "Cycling sources by clicking the canvas would be undiscoverable and easy to trigger accidentally while panning.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "A usability comparison keeps the six-source choice labeled and discoverable in the panel without covering the pattern output.",
        source: "usability-analysis",
      },
      id: "pattern-source-select",
      selectionScope: { mode: "global" },
      reason:
        "The panel select names every field source and keeps the canvas free for output.",
      surface: "panel",
      target: dotTargets.source,
    },
  ],
  mode: "product",
  productName: "Foci Dots",
  productSummary:
    "A brand pattern generator that builds every illustration from circles on a dot grid: procedural fields, halftoned images, and rasterized text with seamless looping motion.",
  requestedBehavior:
    "Generate animated, always-circular dot patterns for the client Foci — procedural fields, image halftones, and dot text — with editable grid, colors, motion, and PNG export.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The product renders a two-dimensional dot pattern with no visible three-dimensional scene or model.",
  },
};

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Pattern background",
      entityId: "pattern-background",
      groupingReason:
        "The switch and color form the one standard background output pair that runtime consumes into Setup.",
      id: "background",
      targets: ["export.includeBackground", dotTargets.background],
      title: "Background",
    },
    {
      entity: "Dot grid",
      entityId: "dot-grid",
      groupingReason:
        "Columns, arrangement, size range, jitter, and color all configure the circle lattice every source renders through.",
      id: "dot-grid",
      targets: [
        dotTargets.columns,
        dotTargets.arrangement,
        dotTargets.sizeRange,
        dotTargets.jitter,
        dotTargets.dotColor,
      ],
      title: "Dot Grid",
    },
    {
      entity: "Pattern field",
      entityId: "pattern-field",
      groupingReason:
        "The source select, its conditional source material (image, text), and the shared field shaping controls define the scalar field that sizes every dot.",
      id: "pattern",
      targets: [
        dotTargets.source,
        dotTargets.imageSource,
        dotTargets.text,
        dotTargets.scale,
        dotTargets.angle,
        dotTargets.contrast,
        dotTargets.blackPoint,
        dotTargets.whitePoint,
        dotTargets.invert,
      ],
      title: "Pattern",
    },
    {
      entity: "Loop motion",
      entityId: "loop-motion",
      groupingReason:
        "Style and amount configure the seamless loop modulation applied to the dot radii during playback.",
      id: "motion",
      targets: [dotTargets.motionStyle, dotTargets.motionAmount],
      title: "Motion",
    },
    {
      entity: "Image export settings",
      entityId: "image-export",
      groupingReason:
        "Format and resolution configure the exported image artifact.",
      id: "image-export",
      targets: ["export.image.format", "export.image.resolution"],
      title: "Image Export",
    },
  ];

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "grid columns change the dot lattice density",
    browser: true,
    browserTestName: "browser: grid.columns changes the dot lattice density",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising Columns increases the number of rendered circles, visibly changing the dot lattice.",
    fixture: "default waves pattern",
    id: "grid.columns",
    kind: "control",
    target: dotTargets.columns,
    userAction: "Drag the Columns slider to a higher value.",
  },
  {
    automated: true,
    automatedTestName: "grid arrangement switches square and hex packing",
    browser: true,
    browserTestName:
      "browser: grid.arrangement switches square and hex packing",
    componentType: "segmented",
    evidence: "rendered-pixels",
    expectedObservable:
      "Switching Arrangement to Hex offsets alternate rows and compacts row spacing, changing the rendered lattice.",
    fixture: "default waves pattern",
    id: "grid.arrangement",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: dotTargets.arrangement,
    userAction: "Select the Hex arrangement option.",
  },
  {
    automated: true,
    automatedTestName: "dot size range rescales circle radii",
    browser: true,
    browserTestName: "browser: dots.sizeRange rescales circle radii",
    componentType: "rangeSlider",
    controlPartCoverage: "all-visible-parts",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising the lower bound grows the smallest circles and lowering the upper bound shrinks the largest ones.",
    fixture: "default waves pattern",
    id: "dots.sizeRange",
    kind: "control",
    target: dotTargets.sizeRange,
    userAction: "Drag the Dot size lower and upper thumbs.",
  },
  {
    automated: true,
    automatedTestName: "grid jitter offsets dot centers",
    browser: true,
    browserTestName: "browser: grid.jitter offsets dot centers",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising Jitter displaces circles from the regular lattice deterministically.",
    fixture: "default waves pattern",
    id: "grid.jitter",
    kind: "control",
    target: dotTargets.jitter,
    userAction: "Drag the Jitter slider up from zero.",
  },
  {
    automated: true,
    automatedTestName: "dot color fills every circle",
    browser: true,
    browserTestName: "browser: dots.color fills every circle",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing the dot color repaints every rendered circle in the selected color.",
    fixture: "default waves pattern",
    id: "dots.color",
    kind: "control",
    target: dotTargets.dotColor,
    userAction: "Pick a different dot color.",
  },
  {
    automated: true,
    automatedTestName: "pattern source selects the field family",
    browser: true,
    browserTestName: "browser: pattern.source selects the field family",
    componentType: "select",
    evidence: "rendered-pixels",
    expectedObservable:
      "Each source option renders a distinct circle pattern: waves, rings, noise, or gradient dot-size fields; burst's perspective rays with a scattered core and center dot; field's center-facing circle trails; image halftone; or rasterized text.",
    fixture: "default waves pattern",
    id: "pattern.source",
    interactionId: "pattern-source-select",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: dotTargets.source,
    userAction: "Select each pattern source option.",
  },
  {
    automated: true,
    automatedTestName: "uploaded image drives the halftone field",
    browser: true,
    browserTestName: "browser: source.image drives the halftone field",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "Uploading an image in Image mode renders its dark regions as larger circles; removing it clears the halftone dots.",
    fixture: "image source with a high-contrast upload",
    id: "source.image",
    kind: "control",
    mediaLifecycleCoverage: [
      "upload",
      "remove",
      "reset",
      "rotate",
      "flip",
      "transform-output",
    ],
    target: dotTargets.imageSource,
    userAction:
      "Upload an image into the Pattern Image slot, rotate and flip it, remove it, and reset controls.",
  },
  {
    automated: true,
    automatedTestName: "pattern text rasterizes into the dot grid",
    browser: true,
    browserTestName: "browser: pattern.text rasterizes into the dot grid",
    componentType: "text",
    evidence: "rendered-pixels",
    expectedObservable:
      "Typing a different word in Text mode renders that word as large circles in the grid.",
    fixture: "text source with the default FOCI string",
    id: "pattern.text",
    kind: "control",
    target: dotTargets.text,
    userAction: "Edit the Text value while the Text source is selected.",
  },
  {
    automated: true,
    automatedTestName: "pattern scale changes the field frequency",
    browser: true,
    browserTestName: "browser: pattern.scale changes the field frequency",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising Scale tightens the procedural field so bands, rings, or noise cells repeat more often across the grid.",
    fixture: "default waves pattern",
    id: "pattern.scale",
    kind: "control",
    target: dotTargets.scale,
    userAction: "Drag the Scale slider while a procedural source is active.",
  },
  {
    automated: true,
    automatedTestName: "pattern angle rotates directional fields",
    browser: true,
    browserTestName: "browser: pattern.angle rotates directional fields",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing Angle rotates the wave bands or gradient direction across the grid.",
    fixture: "default waves pattern",
    id: "pattern.angle",
    kind: "control",
    target: dotTargets.angle,
    userAction: "Drag the Angle slider while Waves or Gradient is active.",
  },
  {
    automated: true,
    automatedTestName: "pattern contrast remaps field values",
    browser: true,
    browserTestName: "browser: pattern.contrast remaps field values",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising Contrast pushes dot sizes toward their extremes; lowering it flattens the field toward mid-size dots.",
    fixture: "default waves pattern",
    id: "pattern.contrast",
    kind: "control",
    target: dotTargets.contrast,
    userAction: "Drag the Contrast slider.",
  },
  {
    automated: true,
    automatedTestName: "image black point deepens halftone shadows",
    browser: true,
    browserTestName: "browser: pattern.blackPoint deepens halftone shadows",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising Black point maps more of the uploaded image's dark and mid tones to full-size dots.",
    fixture: "image source with a gray-ramp upload",
    id: "pattern.blackPoint",
    kind: "control",
    target: dotTargets.blackPoint,
    userAction: "Drag the Black point slider while the Image source is active.",
  },
  {
    automated: true,
    automatedTestName: "image white point lifts halftone highlights",
    browser: true,
    browserTestName: "browser: pattern.whitePoint lifts halftone highlights",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Lowering White point clips the uploaded image's light tones to paper, shrinking their dots.",
    fixture: "image source with a gray-ramp upload",
    id: "pattern.whitePoint",
    kind: "control",
    target: dotTargets.whitePoint,
    userAction: "Drag the White point slider while the Image source is active.",
  },
  {
    automated: true,
    automatedTestName: "pattern invert flips the field",
    browser: true,
    browserTestName: "browser: pattern.invert flips the field",
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Turning Invert on makes previously large dots small and small dots large.",
    fixture: "default waves pattern",
    id: "pattern.invert",
    kind: "control",
    target: dotTargets.invert,
    userAction: "Toggle the Invert switch.",
  },
  {
    automated: true,
    automatedTestName: "motion style selects the loop modulation",
    browser: true,
    browserTestName: "browser: motion.style selects the loop modulation",
    componentType: "segmented",
    evidence: "rendered-pixels",
    expectedObservable:
      "Pulse breathes all dots together, Wave sweeps a size band across the grid, Drift orbits the field sample offset, and None freezes the pattern.",
    fixture: "default waves pattern",
    id: "motion.style",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: dotTargets.motionStyle,
    userAction: "Select each motion style option.",
  },
  {
    automated: true,
    automatedTestName: "motion amount scales the loop modulation",
    browser: true,
    browserTestName: "browser: motion.amount scales the loop modulation",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Raising Amount deepens the animated size modulation at a fixed timeline position.",
    fixture: "wave motion at half loop progress",
    id: "motion.amount",
    kind: "control",
    target: dotTargets.motionAmount,
    userAction: "Drag the Amount slider while a motion style is active.",
  },
  {
    automated: true,
    automatedTestName: "timeline playback loops the motion seamlessly forward",
    browser: true,
    browserTestName:
      "browser: timeline playback loops the motion seamlessly forward",
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Playing the timeline animates dot radii forward-only; the frame at loop end matches the frame at loop start, including after a duration edit.",
    fixture: "wave motion playback",
    id: "timeline.playback",
    kind: "runtime",
    timelineCoverage: "playback",
    timelineLoopProof: {
      direction: "forward-only",
      durationChange: "reproved-after-edit",
      reversePlayback: "forbidden",
      seam: "first-last-match",
    },
    timelinePlaybackCoverage: "all-playback-behavior",
    userAction:
      "Press play on the top timeline, scrub across the loop seam, and edit the loop duration.",
  },
  {
    automated: true,
    automatedTestName: "render scale keeps selected backing pixels",
    browser: true,
    browserTestName:
      "browser: canvas render scale keeps selected backing pixels",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "The preview canvas backing equals CSS size × devicePixelRatio × selected scale during interaction, steady state, and playback without changing visible CSS size.",
    fixture: "default waves pattern",
    id: "canvas.renderScale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states: ["interaction", "playback", "steady"],
    },
    target: "canvas.renderScale",
    userAction:
      "Change Resolution scale, interact with a slider, and play the timeline.",
  },
  {
    actionCoverage: ["export.png"],
    automated: true,
    automatedTestName: "export png delivers the dot pattern artifact",
    browser: true,
    browserTestName: "browser: export png delivers the dot pattern artifact",
    componentType: "panelActions",
    evidence: "exported-bytes",
    exportArtifactCoverage: "all-required-image-export-behavior",
    expectedObservable:
      "Export PNG downloads an image whose pixels contain the rendered dot pattern at the selected format and resolution.",
    fixture: "default waves pattern",
    id: "actions.output",
    kind: "control",
    target: "actions.output",
    userAction: "Click Export PNG.",
  },
  {
    automated: true,
    automatedTestName: "background switch gates the painted background",
    browser: true,
    browserTestName: "browser: export.includeBackground gates the painted background",
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Turning the Setup Background switch off removes the painted background behind the dots.",
    fixture: "default waves pattern",
    backgroundOutputCoverage: [
      "preview-hidden-when-excluded",
      "image-transparent-when-excluded",
      "infinity-viewport-color-and-dependency",
    ],
    id: "export.includeBackground",
    kind: "control",
    target: "export.includeBackground",
    userAction: "Toggle the Setup Background switch.",
  },
  {
    automated: true,
    automatedTestName: "background color fills the pattern frame",
    browser: true,
    browserTestName: "browser: appearance.background fills the pattern frame",
    componentType: "color",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing the Background color repaints the area behind the dots in the selected color.",
    fixture: "default waves pattern",
    id: "appearance.background",
    kind: "control",
    target: "appearance.background",
    userAction: "Pick a different Background color in Setup.",
  },
  {
    automated: true,
    automatedTestName: "image export format selects the encoded artifact type",
    browser: true,
    browserTestName:
      "browser: export.image.format selects the encoded artifact type",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "Selecting JPG downloads a JPEG artifact; PNG downloads a PNG artifact.",
    fixture: "default waves pattern",
    id: "export.image.format",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "export.image.format",
    userAction: "Change the Image Export format and export.",
  },
  {
    automated: true,
    automatedTestName: "image export resolution selects the artifact size",
    browser: true,
    browserTestName:
      "browser: export.image.resolution selects the artifact size",
    componentType: "select",
    evidence: "exported-bytes",
    expectedObservable:
      "Selecting 2K, 4K, or 8K downloads an artifact with the matching long-edge pixel size.",
    fixture: "default waves pattern",
    id: "export.image.resolution",
    kind: "control",
    optionCoverage: "each-visible-item",
    target: "export.image.resolution",
    userAction: "Change the Image Export resolution and export.",
  },
  {
    automated: true,
    automatedTestName: "infinity canvas hides finite sizing and restores it",
    browser: true,
    browserTestName:
      "browser: infinity canvas hides finite sizing and restores the dormant size",
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Enabling Infinity canvas removes the finite artboard and sizing controls; disabling it restores the exact previous finite size and controls.",
    fixture: "default waves pattern",
    id: "canvas.infinity.mode",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.size.width",
    userAction:
      "Toggle Infinity canvas on and off in Setup and observe sizing controls and the artboard.",
  },
  {
    automated: true,
    automatedTestName: "infinite image export crops to the pattern tile bounds",
    browser: true,
    browserTestName:
      "browser: infinite image export crops to the pattern tile bounds",
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "In Infinity mode, Export PNG crops to the union of visible scene bounds supplied by sceneBoundsProvider.",
    fixture: "infinity mode with the default waves pattern",
    id: "canvas.infinity.export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.size.width",
    userAction: "Enable Infinity canvas and click Export PNG.",
  },
  {
    automated: true,
    automatedTestName: "declares production reload coverage for the product schema",
    browser: true,
    browserTestName:
      "browser: app restores exact canvas, values, and panel workspace slices after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size and zoom, edited pattern values, and the moved and collapsed Controls workspace remain visibly restored after a real browser reload.",
    fixture: "product runtime persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices: productPersistenceSlices,
    target: "canvas.size.width",
    userAction:
      "Edit Canvas width and zoom, move and collapse Controls, wait for persistence, and reload the page.",
  },
];
