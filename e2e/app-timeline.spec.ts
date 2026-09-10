import {
  productCanvasSelector,
  startProductSession,
} from "./app-product-support";
import { expectToolcraftStandardTimelinePlayback } from "./browser-standard-timeline-evidence";
import { test } from "./toolcraft-product-test";

test.setTimeout(240_000);

test("browser: timeline playback loops the motion seamlessly forward", async ({
  page,
}) => {
  const session = await startProductSession(page);
  await expectToolcraftStandardTimelinePlayback(session, {
    markerSelector: productCanvasSelector,
    requirementId: "timeline.playback",
  });
});
