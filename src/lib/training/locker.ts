import type { DrillVideo } from "./types";

const RENTRY = "https://rentry.co";
const TOKEN_KEY = "activate-locker-token";
const TOKEN_RE = /^([A-Za-z0-9_-]{4,40})[.:]([A-Za-z0-9_-]{4,40})$/;
const lockerListeners = new Set<() => void>();

export function onLockerChange(fn: () => void) {
  lockerListeners.add(fn);
  return () => {
    lockerListeners.delete(fn);
  };
}

function notifyLockerChange() {
  for (const fn of lockerListeners) fn();
}

export type LockerToken = { id: string; key: string };

export type LockerPayload = {
  v: 1;
  updatedAt: string;
  videos: DrillVideo[];
};

export function formatLockerToken(token: LockerToken) {
  return `${token.id}.${token.key}`;
}

export function parseLockerToken(raw: string): LockerToken | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const q = url.searchParams.get("locker");
    if (q) return parseLockerToken(q);
  } catch {
    /* not a URL */
  }

  const match = trimmed.match(TOKEN_RE);
  if (!match) return null;
  return { id: match[1], key: match[2] };
}

export function loadLockerToken(): LockerToken | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return parseLockerToken(localStorage.getItem(TOKEN_KEY) ?? "");
  } catch {
    return null;
  }
}

export function saveLockerToken(token: LockerToken) {
  localStorage.setItem(TOKEN_KEY, formatLockerToken(token));
  notifyLockerChange();
}

export function clearLockerToken() {
  localStorage.removeItem(TOKEN_KEY);
  notifyLockerChange();
}

export function lockerTokenFromLocation(): LockerToken | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return parseLockerToken(url.searchParams.get("locker") ?? "");
}

export function payloadFromLocation(): DrillVideo[] | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const raw = params.get("v") ?? (hash.startsWith("v=") ? hash.slice(2) : "");
  if (!raw) return null;
  return decodePayload(raw);
}

export function videosPagePath() {
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}videos`;
}

export function lockerShareUrl(token: LockerToken, encoded?: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://alecmazo.github.io";
  const url = new URL(`${origin}${videosPagePath()}`);
  url.searchParams.set("locker", formatLockerToken(token));
  if (encoded) url.hash = `v=${encoded}`;
  return url.toString();
}

export async function createLocker(videos: DrillVideo[]): Promise<LockerToken> {
  const text = JSON.stringify(pack(videos));
  const data = await rentryForm("/api/new", { text });
  if (data.status !== "200" || !data.url_short || !data.edit_code) {
    throw new Error(typeof data.content === "string" ? data.content : "Could not create locker");
  }
  return { id: String(data.url_short), key: String(data.edit_code) };
}

export async function pullLocker(token: LockerToken): Promise<LockerPayload | null> {
  const data = await rentryForm(`/api/fetch/${token.id}`, {
    edit_code: token.key,
  });
  if (data.status !== "200") return null;
  const text = data.content && typeof data.content === "object" ? data.content.text : "";
  if (!text) return { v: 1, updatedAt: new Date().toISOString(), videos: [] };
  try {
    const parsed = JSON.parse(text) as Partial<LockerPayload>;
    if (!Array.isArray(parsed.videos)) return null;
    return {
      v: 1,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      videos: parsed.videos.filter(isVideo),
    };
  } catch {
    return null;
  }
}

export async function pushLocker(token: LockerToken, videos: DrillVideo[]) {
  const data = await rentryForm(`/api/edit/${token.id}`, {
    edit_code: token.key,
    text: JSON.stringify(pack(videos)),
  });
  if (data.status !== "200") {
    throw new Error(typeof data.content === "string" ? data.content : "Could not update locker");
  }
}

export async function encodePayload(videos: DrillVideo[]): Promise<string | null> {
  const json = JSON.stringify(pack(videos));
  try {
    if (typeof CompressionStream === "undefined") {
      return `0.${toB64url(new TextEncoder().encode(json))}`;
    }
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const buf = await new Response(stream).arrayBuffer();
    const encoded = `1.${toB64url(new Uint8Array(buf))}`;
    if (encoded.length > 6000) return null;
    return encoded;
  } catch {
    return null;
  }
}

export function decodePayload(raw: string): DrillVideo[] | null {
  try {
    const [kind, data] = raw.includes(".") ? [raw.slice(0, 1), raw.slice(2)] : ["0", raw];
    const bytes = fromB64url(data);
    if (kind === "1") {
      return null;
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Partial<LockerPayload>;
    if (!Array.isArray(parsed.videos)) return null;
    return parsed.videos.filter(isVideo);
  } catch {
    return null;
  }
}

export async function decodePayloadAsync(raw: string): Promise<DrillVideo[] | null> {
  try {
    const kind = raw.includes(".") ? raw.slice(0, 1) : "0";
    const data = raw.includes(".") ? raw.slice(2) : raw;
    const bytes = fromB64url(data);
    let json: string;
    if (kind === "1" && typeof DecompressionStream !== "undefined") {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      json = await new Response(stream).text();
    } else {
      json = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(json) as Partial<LockerPayload>;
    if (!Array.isArray(parsed.videos)) return null;
    return parsed.videos.filter(isVideo);
  } catch {
    return decodePayload(raw);
  }
}

function pack(videos: DrillVideo[]): LockerPayload {
  return { v: 1, updatedAt: new Date().toISOString(), videos };
}

function isVideo(value: unknown): value is DrillVideo {
  if (!value || typeof value !== "object") return false;
  const v = value as DrillVideo;
  return Boolean(v.statusId && v.url && Array.isArray(v.drillIds));
}

type RentryResponse = {
  status: string;
  content?: string | { text?: string };
  url_short?: string;
  edit_code?: string;
};

async function rentryForm(path: string, fields: Record<string, string>): Promise<RentryResponse> {
  const res = await fetch(`${RENTRY}${path}`, {
    method: "POST",
    body: new URLSearchParams(fields),
  });
  return (await res.json()) as RentryResponse;
}

function toB64url(bytes: Uint8Array) {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(raw: string) {
  const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
