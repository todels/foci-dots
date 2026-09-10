import {
  productCanvasSelector,
  proveControlApplicabilityMatrix,
  startProductSession,
} from "./app-product-support";
import {
  uploadFixtureAction,
} from "./app-product-media-support";
import { getToolcraftBrowserProofPage } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(240_000);

async function ensureSourceImageUploaded(
  session: Awaited<ReturnType<typeof startProductSession>>,
): Promise<void> {
  const uploaded = await getToolcraftBrowserProofPage(session).then(
    (currentPage) =>
      currentPage
        .locator('[data-toolcraft-control-target="source.image"] img[alt]')
        .count(),
  );
  if (uploaded === 0) {
    await expectToolcraftProductObservableToChange(
      session,
      uploadFixtureAction(session, "source.image"),
      { selector: productCanvasSelector },
    );
  }
}

test("browser: pattern.source selects the field family", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "pattern.source",
    target: "pattern.source",
  });
});

test("browser: pattern.text rasterizes into the dot grid", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "pattern.text",
    target: "pattern.text",
  });
});

test("browser: pattern.scale changes the field frequency", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "pattern.scale",
    target: "pattern.scale",
  });
});

test("browser: pattern.angle rotates directional fields", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "pattern.angle",
    target: "pattern.angle",
  });
});

test("browser: pattern.contrast remaps field values", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    prepareVisibleCase: async (applicabilityCase) => {
      // The image branch has no upload, so give the field visible dots by
      // sampling an uploaded fixture before proving the contrast outcome.
      if (
        applicabilityCase.selectorTarget === "pattern.source" &&
        applicabilityCase.selectorValue === "image"
      ) {
        await ensureSourceImageUploaded(session);
      }
    },
    requirementId: "pattern.contrast",
    target: "pattern.contrast",
  });
});

test("browser: pattern.blackPoint deepens halftone shadows", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    prepareVisibleCase: async () => {
      await ensureSourceImageUploaded(session);
    },
    requirementId: "pattern.blackPoint",
    target: "pattern.blackPoint",
  });
});

test("browser: pattern.whitePoint lifts halftone highlights", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    prepareVisibleCase: async () => {
      await ensureSourceImageUploaded(session);
    },
    requirementId: "pattern.whitePoint",
    target: "pattern.whitePoint",
  });
});

test("browser: pattern.invert flips the field", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "pattern.invert",
    target: "pattern.invert",
  });
});
