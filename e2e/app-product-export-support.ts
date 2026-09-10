import { expect, type Download, type Page } from "@playwright/test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import type {
  ToolcraftBrowserAction,
  ToolcraftBrowserProofSession,
} from "./browser-proof-session";
export const exportBackgroundRgba = [10, 10, 10, 255] as const;
export const exportFullFrameBounds = {
  height: 1,
  width: 1,
  x: 0,
  y: 0,
} as const;
// A mid-grid dot center: column 24 of 48, row 13 of 27 square rows.
export const exportDotCenterPixel = {
  rgba: [255, 255, 255, 255] as const,
  xRatio: 24.5 / 48,
  yRatio: 0.5,
};

async function readDownloadBytes(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Decodes a downloaded image artifact and samples its top-left corner. */
export async function decodeDownloadedImage(
  page: Page,
  download: Download,
): Promise<{
  backgroundAlpha: number;
  byteLength: number;
  height: number;
  mediaType: string;
  width: number;
}> {
  const bytes = await readDownloadBytes(download);
  const mediaType =
    bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : "image/jpeg";
  const decoded = await page.evaluate(async (base64) => {
    const raw = atob(base64);
    const buffer = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) {
      buffer[index] = raw.charCodeAt(index);
    }
    const bitmap = await createImageBitmap(new Blob([buffer]));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Decode canvas context unavailable.");
    context.drawImage(bitmap, 0, 0);
    const corner = context.getImageData(0, 0, 1, 1).data;
    bitmap.close();
    return {
      cornerAlpha: corner[3],
      height: canvas.height,
      width: canvas.width,
    };
  }, bytes.toString("base64"));
  return {
    backgroundAlpha: decoded.cornerAlpha,
    byteLength: bytes.byteLength,
    height: decoded.height,
    mediaType,
    width: decoded.width,
  };
}

/** Target-scoped action that clicks Export PNG and returns the download. */
export function exportDownloadAction(
  session: ToolcraftBrowserProofSession,
  target: string,
): ToolcraftBrowserAction<"interaction", Download> {
  return session.targetAction<Download>(target, async (page) =>
    waitForDownload(page, () =>
      page.getByRole("button", { name: "Export PNG" }).click(),
    ),
  );
}

/** Toggles the runtime Infinity canvas switch in Setup. */
export async function toggleInfinityCanvas(page: Page): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, "canvas.infinity");
  await field.getByRole("switch").click();
}

/** Waits until the runtime reports a successful persistence write. */
export async function waitForPersistenceSuccess(page: Page): Promise<void> {
  await expect(
    page.locator('[data-slot="toolcraft-runtime-app"]'),
  ).toHaveAttribute("data-toolcraft-persistence-status", "success", {
    timeout: 15_000,
  });
}

export async function waitForDownload(
  page: Page,
  trigger: () => Promise<void>,
): Promise<Download> {
  const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
  await trigger();
  return downloadPromise;
}
