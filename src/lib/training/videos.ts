import { DRILL_MAP } from "./drills";
import type { DrillVideo } from "./types";

const HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "mobile.x.com",
]);

export function parseXStatusUrl(raw: string): {
  statusId: string;
  handle: string | null;
  url: string;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let href = trimmed;
  if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return null;
  }
  if (!HOSTS.has(parsed.hostname.toLowerCase())) return null;
  const match = parsed.pathname.match(/\/(?:([^/]+)\/)?status(?:es)?\/(\d+)/);
  if (!match) return null;
  const handle = match[1] && match[1] !== "i" ? match[1] : null;
  const statusId = match[2];
  const url = handle
    ? `https://x.com/${handle}/status/${statusId}`
    : `https://x.com/i/status/${statusId}`;
  return { statusId, handle, url };
}

export function watchUrl(video: Pick<DrillVideo, "url" | "statusId" | "handle">) {
  if (video.handle) return `https://x.com/${video.handle}/status/${video.statusId}`;
  return video.url || `https://x.com/i/status/${video.statusId}`;
}

export function videosForDrill(videos: DrillVideo[], drillId: string) {
  return videos.filter((v) => v.drillIds.includes(drillId));
}

export function drillName(id: string) {
  return DRILL_MAP[id]?.name ?? id;
}
