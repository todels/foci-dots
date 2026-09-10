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

test("browser: grid.columns changes the dot lattice density", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "grid.columns",
    target: "grid.columns",
  });
});

test("browser: grid.arrangement switches square and hex packing", async ({ page }) => {
  const session = await startProductSession(page);
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Arrangement", {
    requirementId: "grid.arrangement",
    target: "grid.arrangement",
  });
  await expectToolcraftProductObservableToChange(
    session,
    changeControlOutcomeAction(session, "grid.arrangement"),
    { requirementId: "grid.arrangement", selector: productCanvasSelector },
  );
});

test("browser: grid.jitter offsets dot centers", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "grid.jitter",
    target: "grid.jitter",
  });
});
