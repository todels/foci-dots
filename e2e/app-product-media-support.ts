import type { Locator } from "@playwright/test";

import type {
  ToolcraftBrowserAction,
  ToolcraftBrowserObservation,
  ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import { productCanvasSelector } from "./app-product-support";

/** Asymmetric upload fixture: left half black, right half white. */
export const uploadFixture = {
  fileName: "foci-fixture.svg",
  mimeType: "image/svg+xml",
  svg:
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="108">' +
    '<rect width="192" height="108" fill="#FFFFFF"/>' +
    '<rect width="96" height="108" fill="#000000"/></svg>',
} as const;

/** Uploads the shared SVG fixture into the image fileDrop control. */
export function uploadFixtureAction(
  session: ToolcraftBrowserProofSession,
  target: string,
): ToolcraftBrowserAction<"interaction"> {
  return session.controlAction(target, async (control) => {
    await control.locator('input[type="file"]').setInputFiles({
      buffer: Buffer.from(uploadFixture.svg, "utf8"),
      mimeType: uploadFixture.mimeType,
      name: uploadFixture.fileName,
    });
  });
}

/** Removes the uploaded source image through the file control's clear button. */
export function removeUploadAction(
  session: ToolcraftBrowserProofSession,
  target: string,
): ToolcraftBrowserAction<"interaction"> {
  return session.controlAction(target, async (control) => {
    await control
      .getByRole("button", { name: /remove|clear|delete/i })
      .first()
      .click();
  });
}

export type ProductMediaLifecycleObservation = {
  itemIds: readonly string[];
  outputSignature: string;
};

/**
 * Observation of the uploaded item list plus a coarse deterministic dot
 * coverage bucket read from the live product canvas.
 */
export function observeMediaLifecycle(
  session: ToolcraftBrowserProofSession,
  target: string,
): ToolcraftBrowserObservation<ProductMediaLifecycleObservation> {
  if (target !== "source.image") {
    throw new Error("observeMediaLifecycle supports the source.image control.");
  }
  return session.observe((root) => {
    const field = root.querySelector(
      '[data-toolcraft-control-target="source.image"]',
    );
    const itemIds = [...(field?.querySelectorAll("img[alt]") ?? [])]
      .map((image) => image.getAttribute("alt") ?? "")
      .filter((alt) => alt.length > 0);
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-toolcraft-product-output="foci-dots"]',
    );
    let coverage: "high" | "low" = "low";
    if (canvas) {
      const context = canvas.getContext("2d");
      const sample = context?.getImageData(0, 0, canvas.width, canvas.height);
      if (sample) {
        let bright = 0;
        const stride = 16 * 4;
        let total = 0;
        for (let index = 0; index < sample.data.length; index += stride) {
          total += 1;
          if (sample.data[index] > 128 && sample.data[index + 3] > 128) {
            bright += 1;
          }
        }
        coverage = total > 0 && bright / total >= 0.1 ? "high" : "low";
      }
    }
    return {
      itemIds,
      outputSignature: `${coverage}:${itemIds.length}`,
    };
  });
}
