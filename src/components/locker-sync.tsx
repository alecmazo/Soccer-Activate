import { Check, Copy, Link2, Share2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  clearLockerToken,
  createLocker,
  decodePayloadAsync,
  encodePayload,
  formatLockerToken,
  loadLockerToken,
  lockerShareUrl,
  lockerTokenFromLocation,
  onLockerChange,
  parseLockerToken,
  pullLocker,
  pushLocker,
  saveLockerToken,
  type LockerToken,
} from "@/lib/training/locker";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/training-store";

export function useLockerSync() {
  const hydrated = useTrainingStore((s) => s.hydrated);
  const videos = useTrainingStore((s) => s.videoLinks);
  const applyRemote = useTrainingStore((s) => s.applyRemote);
  const [connected, setConnected] = useState(() => Boolean(loadLockerToken()));
  const [ready, setReady] = useState(false);
  const [pullOk, setPullOk] = useState(false);

  useEffect(() => {
    const sync = () => setConnected(Boolean(loadLockerToken()));
    sync();
    return onLockerChange(sync);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const boot = async () => {
      const hash = window.location.hash.replace(/^#/, "");
      const encoded =
        new URLSearchParams(hash).get("v") ??
        (hash.startsWith("v=") ? hash.slice(2) : "");
      if (encoded) {
        const fromHash = await decodePayloadAsync(encoded);
        if (!cancelled && fromHash?.length) {
          applyRemote({ videoLinks: fromHash });
        }
      }

      const fromUrl = lockerTokenFromLocation();
      if (fromUrl) saveLockerToken(fromUrl);
      const token = fromUrl ?? loadLockerToken();
      if (token) {
        try {
          const remote = await pullLocker(token);
          if (!cancelled && remote) {
            setPullOk(true);
            applyRemote({ videoLinks: remote.videos });
            const merged = useTrainingStore.getState().videoLinks;
            if (merged.length !== remote.videos.length) {
              await pushLocker(token, merged);
            }
          }
        } catch {
          /* keep local clips if the cloud copy is unreachable */
        }
      }
      if (!cancelled) setReady(true);
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [applyRemote, hydrated]);

  useEffect(() => {
    if (!hydrated || !ready) return;
    const token = loadLockerToken();
    if (!token) return;
    const current = useTrainingStore.getState().videoLinks;
    if (current.length === 0 && !pullOk) return;
    const timer = window.setTimeout(() => {
      void pushLocker(token, useTrainingStore.getState().videoLinks).catch(() => {
        /* next edit retries */
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [hydrated, videos, connected, ready, pullOk]);

  return connected;
}

export function persistLocker() {
  const token = loadLockerToken();
  if (!token) return;
  void pushLocker(token, useTrainingStore.getState().videoLinks).catch(() => {
    /* local store still has the clips */
  });
}

export function LockerSyncCard() {
  const videos = useTrainingStore((s) => s.videoLinks);
  const [token, setToken] = useState<LockerToken | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [join, setJoin] = useState("");
  const [shareHref, setShareHref] = useState("");

  useEffect(() => {
    const sync = () => setToken(loadLockerToken());
    sync();
    return onLockerChange(sync);
  }, []);

  useEffect(() => {
    if (!token) {
      setShareHref("");
      return;
    }
    let cancelled = false;
    void encodePayload(videos).then((encoded) => {
      if (!cancelled) setShareHref(lockerShareUrl(token, encoded ?? undefined));
    });
    return () => {
      cancelled = true;
    };
  }, [token, videos]);

  const connect = async (next: LockerToken) => {
    saveLockerToken(next);
    setToken(next);
    try {
      const remote = await pullLocker(next);
      if (remote) useTrainingStore.getState().applyRemote({ videoLinks: remote.videos });
      await pushLocker(next, useTrainingStore.getState().videoLinks);
    } catch {
      /* still keep the token so later pushes can land */
    }
  };

  const turnOn = async () => {
    setBusy(true);
    try {
      const created = await createLocker(useTrainingStore.getState().videoLinks);
      await connect(created);
      const href = lockerShareUrl(created, (await encodePayload(useTrainingStore.getState().videoLinks)) ?? undefined);
      await copyText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success("Locker link copied — open it on your phone");
    } catch {
      toast.error("Could not start the shared locker. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!shareHref) return;
    await copyText(shareHref);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    toast.success("Locker link copied");
  };

  const shareNative = async () => {
    if (!shareHref) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Activate locker",
          text: "Your X drill clips — open on this device",
          url: shareHref,
        });
        return;
      } catch {
        /* user cancelled or share failed — fall through */
      }
    }
    await copyLink();
  };

  const joinExisting = async () => {
    const parsed = parseLockerToken(join);
    if (!parsed) {
      toast.error("Paste the locker link from your other device.");
      return;
    }
    setBusy(true);
    try {
      await connect(parsed);
      toast.success("Locker loaded on this device");
      setJoin("");
    } catch {
      toast.error("Could not open that locker.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="font-display text-xs uppercase tracking-[0.22em] text-subtle">
        Any device
      </p>
      <h2 className="mt-2 font-display text-2xl uppercase leading-none tracking-tight">
        Same clips everywhere
      </h2>
      <p className="mt-3 text-sm text-muted">
        Clips stay in this browser until you turn on a locker. One link keeps
        the library current on your phone, iPad, and any other computer.
      </p>

      {token ? (
        <div className="mt-4 space-y-3">
          <p className="break-all rounded-md bg-raised px-3 py-3 font-mono text-xs text-fg">
            {shareHref || formatLockerToken(token)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => void copyLink()} disabled={!shareHref}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void shareNative()}
              disabled={!shareHref}
            >
              <Share2 className="size-4" />
              Send to phone
            </Button>
          </div>
          <p className="text-xs text-subtle">
            Open that link once on the other device. New clips you add here
            follow automatically.
          </p>
          <button
            type="button"
            className="text-xs text-subtle hover:text-fg"
            onClick={() => {
              clearLockerToken();
              setToken(null);
              toast.message("This device is local-only again");
            }}
          >
            Stop syncing this device
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={busy}
            onClick={() => void turnOn()}
          >
            <Smartphone className="size-4" />
            {busy ? "Starting locker…" : "Use on other devices"}
          </Button>
          <div className="flex gap-2">
            <input
              value={join}
              onChange={(e) => setJoin(e.target.value)}
              placeholder="Paste locker link from another device"
              className="h-12 min-w-0 flex-1 rounded-md bg-raised px-3 text-sm text-fg placeholder:text-subtle"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={busy || !join.trim()}
              onClick={() => void joinExisting()}
            >
              <Link2 className="size-4" />
              Open
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export function LockerChip({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "hidden text-xs sm:inline",
        connected ? "text-good" : "text-subtle",
      )}
    >
      {connected ? "Locker on every device" : "Saved on this device"}
    </span>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
}
