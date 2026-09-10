import type { Download } from "@playwright/test";

import {
  getProductApplicabilityCases,
  getToolcraftApplicabilityRequirementId,
  setControlValueAction,
  startProductSession,
} from "./app-product-support";
import {
  decodeDownloadedImage,
  exportBackgroundRgba,
  exportDotCenterPixel,
  exportDownloadAction,
  exportFullFrameBounds,
  toggleInfinityCanvas,
  waitForDownload,
} from "./app-product-export-support";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { expectToolcraftInfinityCanvasBackgroundEvidence } from "./browser-infinity-canvas-evidence";
import { observeInfinityCanvasBackground } from "./browser-infinity-canvas-evidence";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { runToolcraftBrowserAction } from "./browser-proof-session";
import { test } from "./toolcraft-product-test";

test.setTimeout(300_000);

test("browser: export.includeBackground gates the painted background", async ({
  page,
}) => {
  const session = await startProductSession(page);
  // Sample a backing pixel at a cell corner that no circle can reach.
  const observePreview = session.observe((root) => {
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-toolcraft-product-output="foci-dots"]',
    );
    if (!canvas) {
      return { backgroundVisible: false, outputSignature: "missing" };
    }
    const cell = canvas.width / 48;
    const context = canvas.getContext("2d");
    const pixel = context?.getImageData(
      Math.round(cell),
      Math.round(cell),
      1,
      1,
    ).data;
    if (!pixel) {
      return { backgroundVisible: false, outputSignature: "missing" };
    }
    const signature = `${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]}`;
    return {
      backgroundVisible: pixel[3] > 0,
      outputSignature: signature,
    };
  });

  await expectToolcraftBackgroundOutputSemantics(
    observePreview,
    setControlValueAction(session, "export.includeBackground", false),
    { backgroundVisible: false, outputSignature: "0,0,0,0" },
    exportDownloadAction(session, "export.includeBackground"),
    (download) => decodeDownloadedImage(page, download),
    { requirementId: "export.includeBackground" },
  );

  // Infinity viewport background: runtime paints the selected color while
  // Background stays the Infinity prerequisite.
  const enableBackground = await getToolcraftControlFieldByTarget(
    page,
    "export.includeBackground",
  );
  const backgroundSwitch = enableBackground.getByRole("switch");
  if ((await backgroundSwitch.getAttribute("aria-checked")) !== "true") {
    await backgroundSwitch.click();
  }
  await toggleInfinityCanvas(page);
  const infinite = await observeInfinityCanvasBackground(page);
  await backgroundSwitch.click();
  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await backgroundSwitch.click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    { backgroundExcluded, backgroundRestored, infinite },
    {
      expectedBackgroundColor: "#0A0A0A",
      requirementId: "export.includeBackground",
      target: "export.includeBackground",
    },
  );
});

test("browser: export.image.format selects the encoded artifact type", async ({
  page,
}) => {
  const session = await startProductSession(page);
  const cases = getProductApplicabilityCases("export.image.format");

  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      setControlValueAction(
        session,
        applicabilityCase.selectorTarget,
        applicabilityCase.selectorValue,
      ),
      applicabilityCase,
      { baseRequirementId: "export.image.format" },
    );
    if (applicabilityCase.expectation !== "visible") continue;

    const caseRequirementId = getToolcraftApplicabilityRequirementId(
      "export.image.format",
      applicabilityCase,
    );
    const useJpg = applicabilityCase.selectorValue === "2k";
    await runToolcraftBrowserAction(
      setControlValueAction(
        session,
        "export.image.format",
        useJpg ? "jpg" : "png",
      ),
    );
    const longEdge =
      applicabilityCase.selectorValue === "2k"
        ? 2048
        : applicabilityCase.selectorValue === "4k"
          ? 4096
          : 8192;
    await expectToolcraftImageExportArtifact(
      session.targetAction<Download>("export.image.format", async (currentPage) =>
        waitForDownload(currentPage, () =>
          currentPage.getByRole("button", { name: "Export PNG" }).click(),
        ),
      ),
      {
        additionalArtifactRequirements: [
          { requirementId: caseRequirementId, target: "export.image.format" },
        ],
        backgroundRgba: exportBackgroundRgba,
        expectedBounds: exportFullFrameBounds,
        expectedHeight: (longEdge * 1080) / 1920,
        expectedMediaType: useJpg ? "image/jpeg" : "image/png",
        expectedPixels: [exportDotCenterPixel],
        expectedWidth: longEdge,
        page,
        requirementId: "export.image.format",
      },
    );
  }
});

test("browser: export.image.resolution selects the artifact size", async ({
  page,
}) => {
  const session = await startProductSession(page);
  const cases = getProductApplicabilityCases("export.image.resolution");

  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      setControlValueAction(
        session,
        applicabilityCase.selectorTarget,
        applicabilityCase.selectorValue,
      ),
      applicabilityCase,
      { baseRequirementId: "export.image.resolution" },
    );
    if (applicabilityCase.expectation !== "visible") continue;

    const caseRequirementId = getToolcraftApplicabilityRequirementId(
      "export.image.resolution",
      applicabilityCase,
    );
    const resolution = applicabilityCase.selectorValue === "jpg" ? "2k" : "4k";
    await runToolcraftBrowserAction(
      setControlValueAction(session, "export.image.resolution", resolution),
    );
    const longEdge = resolution === "2k" ? 2048 : 4096;
    await expectToolcraftImageExportArtifact(
      session.targetAction<Download>(
        "export.image.resolution",
        async (currentPage) =>
          waitForDownload(currentPage, () =>
            currentPage.getByRole("button", { name: "Export PNG" }).click(),
          ),
      ),
      {
        additionalArtifactRequirements: [
          {
            requirementId: caseRequirementId,
            target: "export.image.resolution",
          },
        ],
        backgroundRgba: exportBackgroundRgba,
        expectedBounds: exportFullFrameBounds,
        expectedHeight: (longEdge * 1080) / 1920,
        expectedMediaType:
          applicabilityCase.selectorValue === "jpg"
            ? "image/jpeg"
            : "image/png",
        expectedPixels: [exportDotCenterPixel],
        expectedWidth: longEdge,
        page,
        requirementId: "export.image.resolution",
      },
    );
  }
});
