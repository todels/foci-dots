import type { Download } from "@playwright/test";

import {
  startProductSession,
} from "./app-product-support";
import {
  exportBackgroundRgba,
  exportDotCenterPixel,
  exportFullFrameBounds,
  waitForDownload,
} from "./app-product-export-support";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import { test } from "./toolcraft-product-test";

test.setTimeout(300_000);

test("browser: export png delivers the dot pattern artifact", async ({
  page,
}) => {
  const session = await startProductSession(page);
  await expectToolcraftImageExportArtifact(
    session.controlAction<Download>(
      "actions.output",
      async (control, currentPage) =>
        waitForDownload(currentPage, () =>
          control.getByRole("button", { name: "Export PNG" }).click(),
        ),
    ),
    {
      backgroundRgba: exportBackgroundRgba,
      expectedBounds: exportFullFrameBounds,
      expectedHeight: 2304,
      expectedMediaType: "image/png",
      expectedPixels: [exportDotCenterPixel],
      expectedWidth: 4096,
      page,
      requirementId: "actions.output",
    },
  );
});
