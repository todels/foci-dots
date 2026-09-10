# Implementation Worklog

This file records product decisions and the evidence behind them. Keep it short, factual, and current. Update it after schema, renderer, timeline, layer, export, performance, or acceptance decisions.

## Status

Mode: product

Product: **Foci Dots** — a brand pattern generator for the client Foci. Every output is built from circles on a dot grid: procedural fields (waves, rings, noise, gradient), halftoned uploaded images, and rasterized text, with seamless looping motion and PNG/JPG export.

## Automatic Delivery Lifecycle

Keep this worklog human-shaped. For the first product delivery, record the request, decisions, state/output mapping, reference evidence, rejected alternatives, and known risks; one bare `npm run verify:delivery` derives complete contract proof, one build, full functional acceptance, and no measured performance. For later ordinary edits, record new intent and material decisions, the exact unit/component test, and acceptance IDs passed to `npm run test:feature`; selector expansion is automatic, while explicit `--all` records why the edit could not be bounded. Do not claim or run another aggregate functional delivery.

Classifier output establishes complaint authority only and never path localization. A localized performance complaint adds the domain authority below, then one bare `npm run verify:delivery` runs one targeted iteration. If localization remains unresolved regardless of classifier result, ask one user-facing question naming visible operations and offering targeted diagnosis or a complete review; record neither `performance-iteration` intent nor canonical path authority until the answer supplies exact localization evidence. Never ask the user to choose internal path IDs. A broad or honestly unlocalizable problem may present that single choice with a recommendation for complete review, but the user still chooses. A direct complete-review request needs no further clarification. The full audit remains separate and requires an explicit operator request or accepted offer before `npm run verify:perf` may run. Protected receipts own changed files, plans, checks, reports, measurements, and pass/fail evidence.

When `canvas.renderScale` is enabled, record the renderer decision to preserve selected backing quality and map it to functional `renderScaleCoverage` for interaction and steady state, plus playback when timeline is enabled. The worklog may name the protected `canvas-render-scale-backing` recipe, but it cannot claim its evidence or turn a quality failure into performance authority.

## Performance Iteration Entry Contract

For high-confidence ordinary work, record `Performance intent: ordinary-product-work`. For unresolved localization, whether classification returned high-confidence `performance-iteration` or `needs-agent-judgment`, record the unresolved visible operation but no `Performance intent: performance-iteration` field or `Performance paths` until the user's one clarification provides exact localization. For a localized performance complaint or post-clarification targeted choice, record exactly these domain fields in the latest iteration:

```md
- Performance intent: performance-iteration
- Performance request evidence: "<verbatim exact Request quote>"
- Performance paths: ["performance-path:%5B...%5D"]
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
```

The quoted evidence must be an exact nontrivial raw substring of `Request` with identical whitespace and Unicode code units. `Performance paths` must be a non-empty unique JSON array of canonical path IDs. Do not record command arguments, changed-file inventory, executed checks, reports, or measurements; the protected planner and receipt own that machine evidence. Each localized complaint or post-clarification targeted choice authorizes one bounded iteration; after it passes, return the app and wait for user evaluation. Classifier output or complaint evidence alone never supplies path localization or authorizes full certification. The separate operator command is permitted only after the user explicitly requests a complete audit or explicitly accepts the agent's offer; the user does not need to name the command.

## Decision Trail

### Iteration 1 — Foci Dots first product build

- Request: "lets create a new tool for a client Foci. its a client tool … a shader or graphic tool that can generate visual elements for this client … black or whtie background doesnt matter. needs to be able to create visual patterns like this. always circles. animated, interactive in a lot of different ways. think of ways to create a lot of varying illustrations. everything from tools to dot art."
- Task type: First product assembly — schema, controls, Canvas 2D renderer, playback timeline animation, image export, acceptance, and performance model.
- User-visible result: A dot-matrix pattern generator. A square or hex grid of circles is sized by a scalar field: procedural Waves / Rings / Noise / Gradient fields, halftoned uploaded images, or rasterized text. Dot color, size range, jitter, invert, field shaping (scale, angle, contrast), and looping motion styles (Pulse, Wave, Drift) are editable; output exports as PNG/JPG.
- Source/reference checked: Three user-supplied reference images (white-on-black dot wall, black halftone skier dot art, blue halftone horse) reviewed visually as style direction only.
- Reference inputs: None registered — the images are static style direction, not motion references, so `referenceInputs: []` and no reference study ran.
- Docs/contracts read: `workflow.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `core/timeline-animation.md`, `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, `decision-contract.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `controls-product-coverage`, `controls-section-inventory-required`, `output-export-required`, `timeline-mode-choice`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`.
- View interaction intent: `non-spatial` — the product is a two-dimensional dot pattern with no visible 3D scene or model.
- Interaction ownership: All product operations are panel-owned (property edits, mode selects, source upload); the canvas owns only runtime pan/zoom/upload-drop. No operation plausibly lives on both surfaces, so `interactionOwnership` declares the panel property-edit surface for the pattern source select, the one operation with a plausible canvas alternative (clicking the canvas to cycle sources), rejected for discoverability and accidental-trigger reasons.
- Animation Intent Inventory: playback timeline. Motion styles are product animation with user-facing play/pause and scrub, so the top Toolcraft timeline is required; no keyframes (no per-property authored animation), no video export (not requested). Loop duration: `panels.timeline.defaultDurationSeconds: 6` — the product motion phase is defined as exactly one full cycle (2π) per loop, so 6 s is the product-derived cycle period; all motion styles complete integer cycles per loop, making the first/last frames stitch seamlessly and forward-only.
- Export intent: image `toolcraft-default` (PNG primary with Image Export format/resolution selects); SVG `not-requested`; video `not-requested` — neither was explicitly requested.
- Decision: Build a Canvas 2D custom renderer with a memoized field pass plus a per-frame composite pass, schema-declared entity sections, a playback timeline, and runtime-owned PNG/JPG export through the shared frame callback.
- Renderer choice: Canvas 2D preview and export (`rendererStrategy: "canvas-2d"`), `canvas.renderScale: true`. Source representation: procedural data plus optional image media and text; product representation: pixel. Why not alternatives: DOM/SVG nodes per dot would create thousands of retained elements with worse animation cost; WebGL adds shader/resource complexity without need at ≤ ~10k circles per frame. Layers: one product-foreground dense-pattern layer, export composited through the shared `exportRenderer` frame callback.
- Renderer pipeline: two passes. `source-field` (preprocess, memoized per source/grid/shaping/media inputs, main thread) builds the scalar field sampler — procedural closures, or image/text rasterized to per-cell luminance. `draw-dots` (rasterize, per-frame during playback, uncached, main thread) draws circles into the backing canvas. Viewport drag/zoom must not invalidate either pass (transform-only); timeline playback must not invalidate `source-field`.
- Workload envelope: one dimension `grid-columns` (schema target `grid.columns`, boundary `maximum`, mapping `quadratic` — dot count grows with columns × derived rows). All other visible controls are `responsiveness` (constant per-dot cost factors).
- Controls plan (entity-first): `Background` authored source pair (consumed into Setup); `Dot Grid` (columns, arrangement, size range, jitter, color); `Pattern` (source select; conditional scale/angle/contrast shaping; conditional text input; conditional image upload); `Motion` (style segmented, conditional amount); `Image Export` (format/resolution pair); sticky `Export PNG` panel action.
- Alternatives rejected: spacing-in-px workload control (inverse boundary is harder to reason about than a direct column count); a canvas paint/erase draw mode (persistent painted state, undo, and canvas-vs-panel ownership would expand v1 scope — recorded as follow-up); pointer-hover ripple effects (transient output cannot satisfy persistent-observable acceptance evidence — follow-up); SVG export (not requested; circles would qualify if the client asks).
- State/output mapping: every control target lives in runtime schema state; `source-field` consumes pattern/grid/media/text targets; `draw-dots` consumes field output, dot targets, background pair, canvas size, render scale, and timeline loop progress via `getToolcraftTimelineLoopProgress`; the shared `exportRenderer.renderFrame` draws the identical frame at export scale; `sceneBoundsProvider` returns one fixed 1920×1080 origin-centered pattern tile in infinite mode.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Image halftone quality depends on uploaded image contrast (contrast control mitigates); hex arrangement approximates row offset rather than true hex packing; draw-dots is main-thread Canvas 2D — the derived render-plan assessment may leave a pending kernel benchmark requirement, which first delivery defers per the deferred coverage policy.

### Iteration 2 — Depth pattern sources and image levels

- Request: "there should be another mode completely where i can create these 3d dot patterns … one is agressive (always one in the middle btw) and one which is more chill" and "it should create dots based on the differnet lights in that images. i should be able to ofc adjust the dots from there including the contrast, black point etfc"
- Task type: Later feature work — two new pattern sources with their own renderers, plus image-levels controls; focused checks only.
- User-visible result: The Source select gains **Burst** (perspective rays of circles streaming from a scattered core to a dotted square frame, always one circle dead center) and **Field** (center-facing circle trails on the lattice, length growing with radial distance, one dot at the exact center). Image mode gains **Black point** and **White point** sliders that remap sampled luminance before dot sizing.
- Source/reference checked: Two user-supplied reference images — an aggressive radial burst plate and a chill center-facing dash field — used as style direction only.
- Reference inputs: None registered; static style direction, so `referenceInputs` stays `[]`.
- Docs/contracts read: Contracts internalized this project from `workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `core/timeline-animation.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `controls-component-layout-invariants`, `acceptance-product-observable`, `performance-coverage-levels`, `timeline-enabled-behavior`.
- View interaction intent: unchanged `non-spatial` — the depth sources are two-dimensional projections, not an editable 3D scene.
- Interaction ownership: unchanged — both new sources are panel-selected options of the existing `pattern.source` property edit.
- Decision: Model both references as one radial-depth family dispatched from the shared frame renderer: Burst is polar (spokes with `t^1.6` perspective easing, hash-scattered core, dotted frame, wave motion streams depth `(t + progress) mod 1`), Field is cartesian (lattice cells render 5-circle trails angled at the center, length from radial distance). Levels are one pure `applyDotLevels` remap on sampled luminance applied inside the memoized `source-field` pass; both new sliders join that pass's inputs, cache key, and control-drag invalidation.
- Alternatives rejected: A separate top-level mode switch (would multiply applicability cases across every pattern control for no extra capability); drawing Field dashes as line strokes (breaks the circles-only system — trails of overlapping circles render identically); new burst-specific density controls (Columns, Dot size, Jitter, Contrast, and Invert already parameterize both variants).
- State/output mapping: `pattern.source` gains `burst`/`field` options consumed by the shared preview and export frame renderer; `pattern.blackPoint`/`pattern.whitePoint` feed the image sampler through the `source-field` cache; all motion styles keep integer-cycle phase terms so loops stay seamless and forward-only.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` remains the initial receipt; this edit ran the focused unit suite (`dot-product.test.ts`, 25 tests) and the pattern-entity browser scenarios (pattern.source, pattern.contrast, pattern.invert, pattern.blackPoint, pattern.whitePoint, pattern.scale, pattern.angle, pattern.text, source.image) plus `npm run test:feature -- pattern.source pattern.contrast pattern.invert pattern.blackPoint pattern.whitePoint`.
- Risks: Field mode at maximum Columns draws ~47k circles per frame on the main thread (within the declared quadratic envelope); Burst ignores Arrangement by design since its geometry is polar.

## Decisions

### Renderer

- Decision: Canvas 2D custom renderer for preview and export with `canvas.renderScale: true`.
- Reason: Dense circle field (up to ~10k dots) with per-frame animation; Canvas 2D preserves fidelity at low complexity, and raster preview requires render-scale backing proof.
- Evidence: `rendererTechnique` and the `foci-dots` pipeline registration in `src/app/app-performance.ts` and `src/app/foci/renderer-pipeline.ts`.

### Timeline

- Decision: Playback timeline (no keyframes), `defaultDurationSeconds: 6`.
- Reason: Motion styles are product animation with user transport; the phase completes integer 2π cycles per loop so the seam stitches; 6 s is the product cycle period.
- Evidence: `panels.timeline` in `app-schema.ts`; loop math in `src/app/foci/dot-renderer.ts` uses `getToolcraftTimelineLoopProgress`.

### Layers

- Decision: No layers.
- Reason: Single-output pattern app; no multiple editable objects.
- Evidence: `panels.layers` is omitted.

### Controls

- Decision: Entity-first sections — Background (Setup pair), Dot Grid, Pattern, Motion, Image Export, sticky Export PNG.
- Reason: Each section edits one product entity; conditional applicability hides non-matching source/motion branches.
- Evidence: `appControlSectionInventory` in `app-acceptance-data.ts`.

### View Interaction

- Decision: `non-spatial`.
- Reason: Two-dimensional dot pattern; no visible 3D scene or model.
- Evidence: `appProductReadiness.viewInteraction`.

### Interaction Ownership

- Decision: Panel owns all product property edits; canvas owns runtime pan/zoom/drop only.
- Reason: No product operation benefits from canvas chrome; direct manipulation would obscure output.
- Evidence: `appProductReadiness.interactionOwnership`.

### Export

- Decision: Image export only (PNG/JPG, 2K/4K/8K) through runtime-owned `export-image` and the shared `exportRenderer`.
- Reason: Image is the default intent; SVG/video were not explicitly requested.
- Evidence: `productReadiness.exportIntent`, Image Export section, sticky `Export PNG` action.

### Performance

- Decision: One `grid-columns` quadratic workload dimension; all other controls responsiveness; two-pass pipeline with viewport interactions invalidating nothing.
- Reason: Dot count is the only magnitude that scales renderer cost; everything else is a constant per-dot factor.
- Evidence: `workloadEnvelope`, `rendererPipeline`, and derived-path scenarios in `app-performance.ts`.

## Evidence

- Source reviewed: local Toolcraft docs, runtime schema/performance/pipeline/export type definitions, and the three client reference images (style direction only).
- Contract applied: product controls are schema-declared and runtime-rendered; `canvasContent` holds only product output; export is runtime-owned via the shared frame renderer.

## Verification

Protected receipts own changed files, the derived plan, commands, selectors, reports, measurements, and pass/fail evidence. Decision Trail iterations record only one bare `npm run verify:delivery` narrative.

## Risks

- Risk: Hover/pointer-reactive canvas effects and a paint/erase dot mode were deferred from v1 (transient observables and canvas-ownership scope); both are natural follow-ups.
- Risk: The render-plan assessment may report a pending kernel benchmark requirement for the per-frame rasterize pass; first delivery defers it under the deferred coverage policy.
