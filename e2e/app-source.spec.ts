import { expect } from "@playwright/test";

import {
  applyDependentBaseline,
  productCanvasSelector,
  proveControlApplicabilityMatrix,
  startProductSession,
} from "./app-product-support";
import {
  observeMediaLifecycle,
  removeUploadAction,
  uploadFixture,
  uploadFixtureAction,
} from "./app-product-media-support";
import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(240_000);

test("browser: source.image drives the halftone field", async ({ page }) => {
  const session = await startProductSession(page);
  const observeLifecycle = observeMediaLifecycle(session, "source.image");

  await proveControlApplicabilityMatrix(session, {
    proveVisibleOutcome: async (applicabilityCase, caseRequirementId) => {
      const currentItems = await page
        .locator('[data-toolcraft-control-target="source.image"] img[alt]')
        .count();
      const inverted =
        applicabilityCase.selectorTarget === "pattern.invert" &&
        applicabilityCase.selectorValue === true;
      if (currentItems === 0) {
        await expectToolcraftMediaLifecycle(
          observeLifecycle,
          uploadFixtureAction(session, "source.image"),
          {
            itemIds: [uploadFixture.fileName],
            outputSignature: "high:1",
          },
          { requirementId: caseRequirementId },
        );
      } else {
        await expectToolcraftMediaLifecycle(
          observeLifecycle,
          removeUploadAction(session, "source.image"),
          {
            itemIds: [],
            outputSignature: inverted ? "high:0" : "low:0",
          },
          { requirementId: caseRequirementId },
        );
      }
    },
    requirementId: "source.image",
    target: "source.image",
  });

  // Transform consumption: rotate and flip must change the halftone output.
  await applyDependentBaseline(session, "source.image");
  const uploaded = await page
    .locator('[data-toolcraft-control-target="source.image"] img[alt]')
    .count();
  if (uploaded === 0) {
    await expectToolcraftProductObservableToChange(
      session,
      uploadFixtureAction(session, "source.image"),
      { selector: productCanvasSelector },
    );
  }
  await expectToolcraftProductObservableToChange(
    session,
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "90°" }).click();
    }),
    { selector: productCanvasSelector },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Flip H" }).click();
    }),
    { selector: productCanvasSelector },
  );

  // Global reset removes the uploaded source (no default assets exist).
  await expectToolcraftProductObservableToChange(
    session,
    session.action(async (currentPage) => {
      await currentPage
        .getByRole("button", { name: /reset controls/i })
        .click();
    }),
    { selector: productCanvasSelector },
  );
  await expect(
    page.locator('[data-toolcraft-control-target="source.image"] img[alt]'),
  ).toHaveCount(0);
});
