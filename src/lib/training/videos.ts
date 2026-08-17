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

export type ParsedXStatus = {
  statusId: string;
  handle: string | null;
  url: string;
};

export const X_BOOKMARKS_URL = "https://x.com/i/bookmarks";

export function canonicalXUrl(statusId: string, handle: string | null) {
  return handle
    ? `https://x.com/${handle}/status/${statusId}`
    : `https://x.com/i/status/${statusId}`;
}

function fromParts(statusId: string, handle: string | null | undefined): ParsedXStatus {
  const cleanHandle = handle && handle !== "i" ? handle : null;
  return {
    statusId,
    handle: cleanHandle,
    url: canonicalXUrl(statusId, cleanHandle),
  };
}

export function parseXStatusUrl(raw: string): ParsedXStatus | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^\d{10,20}$/.test(trimmed)) {
    return fromParts(trimmed, null);
  }

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
  return fromParts(match[2], match[1]);
}

/** Pull every X status URL / bare status id out of a paste (one or many). */
export function extractXStatusUrls(raw: string): ParsedXStatus[] {
  const seen = new Set<string>();
  const out: ParsedXStatus[] = [];

  const push = (parsed: ParsedXStatus | null) => {
    if (!parsed || seen.has(parsed.statusId)) return;
    seen.add(parsed.statusId);
    out.push(parsed);
  };

  const urlRe =
    /https?:\/\/(?:www\.|mobile\.)?(?:x\.com|twitter\.com)\/(?:([^/\s]+)\/)?status(?:es)?\/(\d+)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRe.exec(raw))) {
    push(fromParts(match[2], match[1]));
  }

  for (const token of raw.split(/[\s,;]+/)) {
    push(parseXStatusUrl(token));
  }

  return out;
}

export function watchUrl(video: Pick<DrillVideo, "url" | "statusId" | "handle">) {
  if (video.handle) return canonicalXUrl(video.statusId, video.handle);
  return video.url || canonicalXUrl(video.statusId, null);
}

export function embedUrl(statusId: string) {
  return `https://platform.twitter.com/embed/Tweet.html?id=${encodeURIComponent(statusId)}&theme=dark&dnt=true`;
}

export function videosForDrill(videos: DrillVideo[], drillId: string) {
  return videos.filter((v) => v.drillIds.includes(drillId));
}

export function drillName(id: string) {
  return DRILL_MAP[id]?.name ?? id;
}
