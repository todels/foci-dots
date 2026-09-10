import {
  applicabilityCaseSuffix,
  changeControlOutcomeAction,
  productCanvasSelector,
  proveControlApplicabilityMatrix,
  startProductSession,
} from "./app-product-support";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(240_000);

test("browser: dots.sizeRange rescales circle radii", async ({ page }) => {
  const session = await startProductSession(page);
  const observeSizeMetrics = session.observe((root) => {
    const canvas = root.querySelector<HTMLElement>(
      '[data-toolcraft-product-output="foci-dots"]',
    );
    return {
      max: canvas?.dataset.dotSizeMax ?? "missing",
      min: canvas?.dataset.dotSizeMin ?? "missing",
    };
  });

  await proveControlApplicabilityMatrix(session, {
    proveVisibleOutcome: async (applicabilityCase, caseRequirementId) => {
      await expectToolcraftProductObservableToChange(
        session,
        changeControlOutcomeAction(session, "dots.sizeRange"),
        { requirementId: caseRequirementId, selector: productCanvasSelector },
      );
      const current = await page
        .locator(productCanvasSelector)
        .evaluate((element) => ({
          max: Number((element as HTMLElement).dataset.dotSizeMax),
          min: Number((element as HTMLElement).dataset.dotSizeMin),
        }));
      const lowerDelta = current.min + 5 <= current.max ? 5 : -5;
      await expectToolcraftCompoundControlPartOutcome(
        observeSizeMetrics,
        session.controlAction("dots.sizeRange", async (control, currentPage) => {
          const thumb = control.getByRole("slider").first();
          await thumb.evaluate((element) => (element as HTMLElement).focus());
          for (let press = 0; press < Math.abs(lowerDelta); press += 1) {
            await currentPage.keyboard.press(
              lowerDelta > 0 ? "ArrowRight" : "ArrowLeft",
            );
          }
        }),
        {
          max: String(current.max),
          min: String(current.min + lowerDelta),
        },
        {
          part: `rangeSlider.lower#${applicabilityCaseSuffix(applicabilityCase)}`,
          requirementId: "dots.sizeRange",
        },
      );
      const upperDelta = current.max - 5 >= current.min + lowerDelta ? -5 : 5;
      await expectToolcraftCompoundControlPartOutcome(
        observeSizeMetrics,
        session.controlAction("dots.sizeRange", async (control, currentPage) => {
          const thumb = control.getByRole("slider").nth(1);
          await thumb.evaluate((element) => (element as HTMLElement).focus());
          for (let press = 0; press < Math.abs(upperDelta); press += 1) {
            await currentPage.keyboard.press(
              upperDelta > 0 ? "ArrowRight" : "ArrowLeft",
            );
          }
        }),
        {
          max: String(current.max + upperDelta),
          min: String(current.min + lowerDelta),
        },
        {
          part: `rangeSlider.upper#${applicabilityCaseSuffix(applicabilityCase)}`,
          requirementId: "dots.sizeRange",
        },
      );
    },
    requirementId: "dots.sizeRange",
    target: "dots.sizeRange",
  });
});

test("browser: dots.color fills every circle", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "dots.color",
    target: "dots.color",
  });
});
