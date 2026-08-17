import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ExternalLink,
  ListChecks,
  Pause,
  Play,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TimerRing } from "@/components/timer-ring";
import { persistIfSignedIn } from "@/components/app-shell";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { saveProgress } from "@/lib/server/training";
import { PILLAR_LABEL } from "@/lib/training/drills";
import {
  beepCount,
  beepDone,
  beepRest,
  beepWork,
  pulseVibrate,
  tickMetronome,
  unlockAudio,
} from "@/lib/training/audio";
import type {
  BuiltExercise,
  ScoreEntry,
  ScoreKind,
  TrainingSession,
} from "@/lib/training/types";
import { formatPace, todayKey, uid } from "@/lib/utils";
import { videosForDrill, watchUrl } from "@/lib/training/videos";
import { useTrainingStore } from "@/store/training-store";

type Phase = "intro" | "ready" | "work" | "rest" | "score" | "done";

export function SessionRunner({ session }: { session: TrainingSession }) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const mode = useTrainingStore((s) => s.mode);
  const soundOn = useTrainingStore((s) => s.soundOn);
  const setSoundOn = useTrainingStore((s) => s.setSoundOn);
  const preferredFoot = useTrainingStore((s) => s.preferredFoot);
  const completeSession = useTrainingStore((s) => s.completeSession);
  const videoLinks = useTrainingStore((s) => s.videoLinks);

  const [index, setIndex] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [phase, setPhase] = useState<Phase>("intro");
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(1);
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  const [listOpen, setListOpen] = useState(false);
  const [quality, setQuality] = useState(4);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [doneLogId, setDoneLogId] = useState<string | null>(null);

  const exercise = session.exercises[index];
  const lastTick = useRef(0);
  const metroAcc = useRef(0);

  const doneCount = checked.length;
  const progressPct = (doneCount / session.exercises.length) * 100;

  const startWork = useCallback(
    (ex: BuiltExercise) => {
      const work = Math.max(ex.workSec, ex.drill.timer.kind === "reps" ? 0 : 1);
      if (ex.drill.timer.kind === "reps" && ex.workSec === 0) {
        setPhase("work");
        setRemaining(0);
        setTotal(1);
        setRunning(false);
        return;
      }
      setPhase("work");
      setRemaining(work);
      setTotal(work);
      setRunning(true);
      if (soundOn) beepWork();
      pulseVibrate(40);
    },
    [soundOn],
  );

  const goReady = useCallback(
    (nextIndex = index) => {
      const ex = session.exercises[nextIndex];
      if (!ex) return;
      setIndex(nextIndex);
      setSetNo(1);
      setPhase("ready");
      setRunning(false);
      const ready = ex.drill.timer.kind === "countdown" ? 3 : 5;
      setRemaining(ready);
      setTotal(ready);
    },
    [index, session.exercises],
  );

  const finishExercise = useCallback(
    (ex: BuiltExercise) => {
      setRunning(false);
      setChecked((prev) => (prev.includes(ex.key) ? prev : [...prev, ex.key]));
      if (ex.drill.score !== "none") {
        setPhase("score");
        if (soundOn) beepDone();
        return;
      }
      const next = index + 1;
      if (next >= session.exercises.length) {
        setPhase("done");
        if (soundOn) beepDone();
        pulseVibrate([40, 40, 80]);
        return;
      }
      goReady(next);
      setRunning(true);
    },
    [goReady, index, session.exercises.length, soundOn],
  );

  useEffect(() => {
    if (!running || (phase !== "work" && phase !== "rest" && phase !== "ready")) {
      return;
    }
    lastTick.current = performance.now();
    metroAcc.current = 0;
    let frame = 0;
    const loop = (now: number) => {
      const dt = (now - lastTick.current) / 1000;
      lastTick.current = now;
      setRemaining((prev) => {
        const next = prev - dt;
        if (
          phase === "work" &&
          exercise?.drill.timer.kind === "metronome" &&
          exercise.bpm &&
          soundOn
        ) {
          metroAcc.current += dt;
          const interval = 60 / exercise.bpm;
          if (metroAcc.current >= interval) {
            metroAcc.current -= interval;
            tickMetronome();
          }
        }
        if (next <= 0) {
          setRunning(false);
          return 0;
        }
        return next;
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [exercise, phase, running, soundOn]);

  useEffect(() => {
    if (remaining > 0 || running) return;
    if (phase === "ready" && !running && remaining === 0 && startedAt) {
      if (exercise) startWork(exercise);
    }
  }, [exercise, phase, remaining, running, startWork, startedAt]);

  useEffect(() => {
    if (remaining > 0.2 || running) return;
    if (phase === "ready" && startedAt && remaining === 0) {
      /* handled above */
    }
  }, [phase, remaining, running, startedAt]);

  // Phase completion when timer hits 0
  useEffect(() => {
    if (running || remaining > 0 || !exercise) return;
    if (phase === "ready" && startedAt) {
      startWork(exercise);
      return;
    }
    if (phase === "work" && exercise.drill.timer.kind !== "reps") {
      if (exercise.restSec > 0 && setNo <= exercise.sets) {
        setPhase("rest");
        setRemaining(exercise.restSec);
        setTotal(exercise.restSec);
        setRunning(true);
        if (soundOn) beepRest();
        pulseVibrate(20);
      } else if (setNo < exercise.sets) {
        setSetNo((n) => n + 1);
        startWork(exercise);
      } else {
        finishExercise(exercise);
      }
      return;
    }
    if (phase === "rest") {
      if (setNo < exercise.sets) {
        setSetNo((n) => n + 1);
        startWork(exercise);
      } else {
        finishExercise(exercise);
      }
    }
  }, [
    exercise,
    finishExercise,
    phase,
    remaining,
    running,
    setNo,
    soundOn,
    startWork,
    startedAt,
  ]);

  useEffect(() => {
    if (phase === "ready" && running && remaining <= 3 && remaining > 0) {
      const whole = Math.ceil(remaining);
      if (soundOn && whole <= 3) {
        /* light count handled by remaining change */
      }
    }
  }, [phase, remaining, running, soundOn]);

  const lastCount = useRef(0);
  useEffect(() => {
    if (!running || !soundOn) return;
    const whole = Math.ceil(remaining);
    if (phase === "ready" && whole <= 3 && whole !== lastCount.current && whole > 0) {
      lastCount.current = whole;
      beepCount();
    }
  }, [phase, remaining, running, soundOn]);

  useEffect(() => {
    if (phase === "intro" || phase === "done" || phase === "score") return;
    let sentinel: WakeLockSentinel | null = null;
    const lock = async () => {
      try {
        if (navigator.wakeLock) sentinel = await navigator.wakeLock.request("screen");
      } catch {
        /* ignore */
      }
    };
    void lock();
    return () => {
      void sentinel?.release();
    };
  }, [phase]);

  const begin = async () => {
    await unlockAudio();
    setStartedAt(Date.now());
    goReady(0);
    setRunning(true);
  };

  const skip = () => {
    if (!exercise) return;
    const next = index + 1;
    setChecked((prev) => (prev.includes(exercise.key) ? prev : [...prev, exercise.key]));
    if (next >= session.exercises.length) {
      setPhase("done");
      return;
    }
    goReady(next);
    setRunning(true);
  };

  const markSetDone = () => {
    if (!exercise) return;
    if (setNo < exercise.sets) {
      if (exercise.restSec > 0) {
        setPhase("rest");
        setRemaining(exercise.restSec);
        setTotal(exercise.restSec);
        setRunning(true);
        if (soundOn) beepRest();
      } else {
        setSetNo((n) => n + 1);
        startWork(exercise);
      }
      return;
    }
    finishExercise(exercise);
  };

  const saveScore = (entry: ScoreEntry) => {
    if (!exercise) return;
    setScores((prev) => ({ ...prev, [exercise.key]: entry }));
    const next = index + 1;
    if (next >= session.exercises.length) {
      setPhase("done");
      if (soundOn) beepDone();
      return;
    }
    goReady(next);
    setRunning(true);
  };

  const closeOut = () => {
    if (!doneLogId) {
      const durationSec = startedAt
        ? Math.round((Date.now() - startedAt) / 1000)
        : session.durationMin * 60;
      const log = completeSession({
        id: uid(),
        sessionId: session.id,
        week: session.week,
        completedOn: todayKey(),
        durationSec,
        quality,
        mode,
        exerciseKeys: checked.length ? checked : session.exercises.map((e) => e.key),
        scores,
      });
      setDoneLogId(log.id);
      toast.success("Session logged");
      if (user) {
        const state = useTrainingStore.getState();
        saveProgress({
          data: {
            profile: {
              playerName: state.playerName,
              preferredFoot: state.preferredFoot,
              mode: state.mode,
              onboardingDone: state.onboardingDone,
              streak: state.streak,
              lastSessionDate: state.lastSessionDate,
              pillarXp: state.pillarXp,
              records: state.records,
              videoLinks: state.videoLinks,
            },
            log,
          },
        }).catch(() => persistIfSignedIn());
      }
    }
    void navigate({ to: "/tracker" });
  };

  const modeCopy = exercise?.drill.modes[mode];
  const footNote =
    exercise && session.week >= 3
      ? `Start on your ${preferredFoot === "right" ? "left" : "right"} foot this block.`
      : exercise
        ? `Strong foot first, then ${preferredFoot === "right" ? "left" : "right"}.`
        : "";

  const phaseLabel = useMemo(() => {
    if (phase === "ready") return "Get set";
    if (phase === "work") return "Work";
    if (phase === "rest") return "Rest";
    if (phase === "score") return "Log it";
    return "";
  }, [phase]);

  if (phase === "intro") {
    return (
      <section className="stagger-in mx-auto max-w-2xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
        >
          <ChevronLeft className="size-4" />
          Back
        </Link>
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted">
          Week {session.week || "—"} · {session.subtitle}
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-tight">
          {session.title}
        </h1>
        <p className="mt-4 max-w-lg text-muted">{session.intent}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge>{session.durationMin} min</Badge>
          <Badge>{mode}</Badge>
          {session.focus.map((f) => (
            <Badge key={f}>{PILLAR_LABEL[f]}</Badge>
          ))}
        </div>
        <div className="mt-8 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">Session list</p>
          <ol className="mt-4 space-y-3">
            {session.exercises.map((ex, i) => (
              <li key={ex.key} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-fg">
                    <span className="mr-2 text-subtle">{String(i + 1).padStart(2, "0")}</span>
                    {ex.drill.name}
                  </p>
                  <p className="ml-8 text-xs text-subtle">
                    {ex.sets} × {ex.workSec > 0 ? `${ex.workSec}s` : "reps"} ·{" "}
                    {formatPace(ex.workSec || 0, ex.restSec)}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wide text-subtle">{ex.role}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="xl" className="flex-1" onClick={() => void begin()}>
            <Play className="size-4" />
            Start session
          </Button>
          <Button size="xl" variant="secondary" onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            {soundOn ? "Sound on" : "Sound off"}
          </Button>
        </div>
        <p className="mt-4 text-sm text-subtle">
          Put the phone where you can see the timer. Check off each block as you go.
        </p>
      </section>
    );
  }

  if (phase === "done") {
    return (
      <section className="mx-auto max-w-lg text-center">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted">
          Session complete
        </p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none">
          {session.title}
        </h1>
        <p className="mt-4 text-muted">
          {checked.length} blocks done. How clean was the work?
        </p>
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuality(n)}
              className={`press size-12 rounded-md text-sm font-medium ${
                quality === n ? "bg-accent text-accent-fg" : "bg-raised text-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-subtle">
          Session quality
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button size="xl" onClick={closeOut}>
            Log and continue
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link to="/">Back to today</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (!exercise) return null;

  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg"
            aria-label="Exit session"
          >
            <X className="size-5" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate font-display text-xs uppercase tracking-[0.2em] text-muted">
              {session.title} · {index + 1}/{session.exercises.length}
            </p>
            <Progress value={progressPct} className="mt-2" />
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSoundOn(!soundOn)}
              className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg"
              aria-label="Toggle sound"
            >
              {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>
            <button
              type="button"
              onClick={() => setListOpen((v) => !v)}
              className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg lg:hidden"
              aria-label="Session list"
            >
              <ListChecks className="size-5" />
            </button>
          </div>
        </div>

        <p className="font-display text-xs uppercase tracking-[0.2em] text-subtle">
          {PILLAR_LABEL[exercise.drill.pillar]} · Set {setNo}/{exercise.sets}
        </p>
        <h2 className="mt-1 font-display text-4xl uppercase leading-none tracking-tight sm:text-5xl">
          {exercise.drill.name}
        </h2>
        {videosForDrill(videoLinks, exercise.drill.id).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {videosForDrill(videoLinks, exercise.drill.id).map((v) => (
              <a
                key={v.id}
                href={watchUrl(v)}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex h-11 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg"
              >
                Watch{v.label ? ` · ${v.label}` : ""}
                <ExternalLink className="size-3.5" />
              </a>
            ))}
          </div>
        ) : (
          <Link
            to="/videos"
            className="mt-3 inline-flex h-10 items-center text-sm text-subtle hover:text-fg"
          >
            Link an X clip for this drill
          </Link>
        )}
        <p className="mt-3 text-sm text-muted">{exercise.drill.focus}</p>

        {phase !== "score" ? (
          <div className="mt-8">
            <TimerRing
              remainingSec={
                exercise.drill.timer.kind === "reps" && exercise.workSec === 0 && phase === "work"
                  ? setNo
                  : remaining
              }
              totalSec={
                exercise.drill.timer.kind === "reps" && exercise.workSec === 0 && phase === "work"
                  ? exercise.sets
                  : total
              }
              label={
                exercise.drill.timer.kind === "reps" && exercise.workSec === 0 && phase === "work"
                  ? "Set"
                  : phaseLabel
              }
              running={running}
            />
            {exercise.bpm && phase === "work" ? (
              <p className="mt-3 text-center text-sm text-muted">
                Pace {exercise.bpm} bpm · {formatPace(exercise.workSec, exercise.restSec)}
              </p>
            ) : (
              <p className="mt-3 text-center text-sm text-muted">
                Pace {formatPace(exercise.workSec || 20, exercise.restSec)}
              </p>
            )}
          </div>
        ) : (
          <ScorePad
            kind={exercise.drill.score}
            label={exercise.drill.scoreLabel ?? "Score"}
            target={exercise.targetNote}
            onSave={saveScore}
          />
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {phase !== "score" && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                if (phase === "ready" && !running) {
                  setRunning(true);
                  return;
                }
                setRunning((v) => !v);
              }}
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "Pause" : "Go"}
            </Button>
          )}
          {exercise.drill.timer.kind === "reps" && phase === "work" && (
            <Button size="lg" variant="secondary" onClick={markSetDone}>
              Set done
            </Button>
          )}
          {phase !== "score" && (
            <Button size="lg" onClick={() => finishExercise(exercise)}>
              <Check className="size-4" />
              Mark done
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={skip}>
            <SkipForward className="size-4" />
            Skip
          </Button>
        </div>

        <div className="mt-8 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">
            {mode} setup
          </p>
          <p className="mt-2 text-sm text-fg">{modeCopy?.setup}</p>
          <p className="mt-3 text-sm text-muted">{modeCopy?.cue}</p>
          <ul className="mt-4 space-y-2">
            {exercise.drill.cues.map((cue) => (
              <li key={cue} className="text-sm text-fg">
                {cue}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-subtle">{footNote}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-subtle">
            Target · {exercise.targetNote}
          </p>
        </div>
      </div>

      <aside
        className={`rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] lg:sticky lg:top-20 lg:block ${
          listOpen ? "block" : "hidden"
        }`}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-subtle">Check off</p>
        <ul className="mt-3 space-y-1">
          {session.exercises.map((ex, i) => {
            const on = checked.includes(ex.key);
            const current = i === index;
            return (
              <li key={ex.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (on) {
                      setChecked((prev) => prev.filter((k) => k !== ex.key));
                      return;
                    }
                    setChecked((prev) => [...prev, ex.key]);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm ${
                    current ? "bg-raised text-fg" : "text-muted"
                  }`}
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-sm ${
                      on ? "bg-good text-bg" : "shadow-[var(--shadow-border)]"
                    }`}
                  >
                    {on ? <Check className="size-3" /> : null}
                  </span>
                  <span className="min-w-0 truncate">{ex.drill.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </section>
  );
}

function ScorePad({
  kind,
  label,
  target,
  onSave,
}: {
  kind: ScoreKind;
  label: string;
  target: string;
  onSave: (entry: ScoreEntry) => void;
}) {
  const [makes, setMakes] = useState(0);
  const [attempts, setAttempts] = useState(10);
  const [time, setTime] = useState("3.20");
  const [reps, setReps] = useState(8);
  const [quality, setQuality] = useState(4);

  return (
    <div className="mt-8 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="font-display text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-sm text-subtle">{target}</p>
      {kind === "makes" && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <NumberField label="Makes" value={makes} onChange={setMakes} />
          <NumberField label="Attempts" value={attempts} onChange={setAttempts} />
        </div>
      )}
      {kind === "time" && (
        <label className="mt-5 block">
          <span className="text-xs uppercase tracking-wide text-subtle">Seconds</span>
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            inputMode="decimal"
            className="mt-2 h-12 w-full rounded-md bg-raised px-3 text-lg tabular text-fg"
          />
        </label>
      )}
      {kind === "reps" && <div className="mt-5"><NumberField label="Reps" value={reps} onChange={setReps} /></div>}
      {kind === "quality" && (
        <div className="mt-5 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuality(n)}
              className={`press h-12 flex-1 rounded-md ${
                quality === n ? "bg-accent text-accent-fg" : "bg-raised text-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      <Button
        className="mt-6 w-full"
        size="lg"
        onClick={() => {
          if (kind === "makes") onSave({ kind, makes, attempts });
          else if (kind === "time") onSave({ kind, timeSec: Number(time) || 0 });
          else if (kind === "reps") onSave({ kind, reps });
          else if (kind === "quality") onSave({ kind, quality });
          else onSave({ kind: "none" });
        }}
      >
        Save score
      </Button>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-subtle">{label}</span>
      <div className="mt-2 flex h-12 items-center rounded-md bg-raised">
        <button
          type="button"
          className="size-12 text-lg text-muted"
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          −
        </button>
        <span className="flex-1 text-center text-lg tabular">{value}</span>
        <button
          type="button"
          className="size-12 text-lg text-muted"
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </label>
  );
}
