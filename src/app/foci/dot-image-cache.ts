/**
 * Decoded source images shared between the live preview and the runtime-owned
 * export renderer. The preview decodes each uploaded image once and stores it
 * here so the deterministic export frame can sample the same pixels without a
 * second decode path.
 */
const decodedSourceImages = new Map<string, HTMLImageElement>();

export function setDotSourceImage(
  key: string,
  image: HTMLImageElement,
): void {
  decodedSourceImages.set(key, image);
  // Keep the cache bounded: only the most recent few decodes matter.
  if (decodedSourceImages.size > 8) {
    const oldestKey = decodedSourceImages.keys().next().value;
    if (oldestKey !== undefined && oldestKey !== key) {
      decodedSourceImages.delete(oldestKey);
    }
  }
}

export function getDotSourceImage(
  key: string,
): HTMLImageElement | undefined {
  return decodedSourceImages.get(key);
}
