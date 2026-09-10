import {
  proveControlApplicabilityMatrix,
  startProductSession,
} from "./app-product-support";
import { test } from "./toolcraft-product-test";

test.setTimeout(240_000);

test("browser: appearance.background fills the pattern frame", async ({ page }) => {
  const session = await startProductSession(page);
  await proveControlApplicabilityMatrix(session, {
    requirementId: "appearance.background",
    target: "appearance.background",
  });
});
