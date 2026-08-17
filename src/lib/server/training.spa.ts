/** Local-only stubs — GitHub Pages has no API. */

export async function loadProgress(): Promise<never> {
  throw new Error("local-only");
}

export async function saveProgress() {
  return { ok: true as const };
}
