import { expect } from "@playwright/test";

import {
  pausePlayback,
  productCanvasSelector,
  startProductSession,
} from "./app-product-support";
import {
  decodeDownloadedImage,
  toggleInfinityCanvas,
  waitForDownload,
  waitForPersistenceSuccess,
} from "./app-product-export-support";
import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(300_000);

test("browser: canvas render scale keeps selected backing pixels", async ({
  page,
}) => {
  await startProductSession(page);
  await expectToolcraftDiscreteSliderMarkers(page, "canvas.renderScale");
  await expectToolcraftCanvasRenderScaleEvidence(page, {
    canvasSelector: productCanvasSelector,
    requirementId: "canvas.renderScale",
    selectedScale: 2,
    stateTransitions: [
      {
        run: async () => {
          const field = await getToolcraftControlFieldByTarget(
            page,
            "grid.jitter",
          );
          await field.evaluate((element) =>
            element.scrollIntoView({ behavior: "instant", block: "center" }),
          );
          await dragToolcraftSliderByTarget(page, "grid.jitter", 0.35);
        },
        state: "interaction",
      },
      {
        run: async () => {
          await page.getByRole("button", { name: "Play playback" }).click();
          await page.waitForTimeout(400);
        },
        state: "playback",
      },
      {
        run: async () => {
          await page.getByRole("button", { name: "Pause playback" }).click();
          await page.waitForTimeout(400);
        },
        state: "steady",
      },
    ],
    target: "canvas.renderScale",
  });
});

test("browser: infinity canvas hides finite sizing and restores the dormant size", async ({
  page,
}) => {
  await startProductSession(page);
  const expectedSceneRect = { height: 1080, width: 1920, x: -960, y: -540 };

  const before = await observeInfinityCanvas(page);
  await toggleInfinityCanvas(page);
  const enabled = await observeInfinityCanvas(page);

  const viewport = page.locator('[data-slot="toolcraft-runtime-canvas"]');
  const bounds = await viewport.boundingBox();
  if (!bounds) throw new Error("Canvas viewport must have layout bounds.");
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 140,
    bounds.y + bounds.height / 2 + 90,
    { steps: 6 },
  );
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page);

  await waitForPersistenceSuccess(page);
  await page.reload();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  await pausePlayback(page);
  const afterReload = await observeInfinityCanvas(page);

  await toggleInfinityCanvas(page);
  const restored = await observeInfinityCanvas(page);
  await page.keyboard.press("ControlOrMeta+z");
  const undone = await observeInfinityCanvas(page);
  await page.keyboard.press("ControlOrMeta+Shift+z");
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      expectedSceneRect,
      requirementId: "canvas.infinity.mode",
      target: "canvas.size.width",
    },
  );
});

test("browser: infinite image export crops to the pattern tile bounds", async ({
  page,
}) => {
  await startProductSession(page);
  const heightField = await getToolcraftControlFieldByTarget(
    page,
    "canvas.size.height",
  );
  const heightInput = heightField.locator("input");
  await heightInput.fill("900");
  await heightInput.press("Enter");

  const finiteDownload = await waitForDownload(page, () =>
    page.getByRole("button", { name: "Export PNG" }).click(),
  );
  const finite = await decodeDownloadedImage(page, finiteDownload);

  await toggleInfinityCanvas(page);
  const infiniteDownload = await waitForDownload(page, () =>
    page.getByRole("button", { name: "Export PNG" }).click(),
  );
  const infinite = await decodeDownloadedImage(page, infiniteDownload);

  await expectToolcraftInfinityCanvasImageExportEvidence(
    {
      finite: {
        byteLength: finite.byteLength,
        height: finite.height,
        width: finite.width,
      },
      infinite: {
        byteLength: infinite.byteLength,
        height: infinite.height,
        width: infinite.width,
      },
    },
    {
      expectedFiniteSize: { height: 1920, width: 4096 },
      expectedInfiniteSize: { height: 2304, width: 4096 },
      requirementId: "canvas.infinity.export",
      target: "canvas.size.width",
    },
  );
});
