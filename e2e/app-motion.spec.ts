import {
  changeControlOutcomeAction,
  productCanvasSelector,
  proveControlApplicabilityMatrix,
  startProductSession,
} from "./app-product-support";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(240_000);

test("browser: motion.style selects the loop modulation", async ({ page }) => {
  const session = await startProductSession(page);
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Style", {
    requirementId: "motion.style",
    target: "motion.style",
  });
  await expectToolcraftProductObservableToChange(
    session,
    changeControlOutcomeAction(session, "motion.style"),
    { requirementId: "motion.style", selector: productCanvasSelector },
  );
});

test("browser: motion.amount scales the loop modulation", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "motion.amount",
    target: "motion.amount",
  });
});
