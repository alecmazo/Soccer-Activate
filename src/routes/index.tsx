import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clapperboard,
  Dumbbell,
  Flame,
  Footprints,
  Target,
  Timer,
  Users,
  UserRound,
  GraduationCap,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, persistIfSignedIn } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PILLAR_LABEL } from "@/lib/training/drills";
import { ACTIVATION_SESSION, QUICK_SESSION } from "@/lib/training/program";
import { nextProgramSession, programCompletion } from "@/lib/training/progress";
import type { TrainingMode } from "@/lib/training/types";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/training-store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const playerName = useTrainingStore((s) => s.playerName);
  const mode = useTrainingStore((s) => s.mode);
  const setMode = useTrainingStore((s) => s.setMode);
  const streak = useTrainingStore((s) => s.streak);
  const logs = useTrainingStore((s) => s.sessionLogs);
  const xp = useTrainingStore((s) => s.pillarXp);
  const onboardingDone = useTrainingStore((s) => s.onboardingDone);
  const next = useMemo(() => nextProgramSession(logs), [logs]);
  const prog = useMemo(() => programCompletion(logs), [logs]);
  const last = logs[0];

  return (
    <AppShell>
      {!onboardingDone ? <Onboarding /> : null}
      <section className="stagger-in">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-muted">
          Elite activation · U13 path
        </p>
        <h1 className="mt-2 max-w-xl font-display text-5xl uppercase leading-[0.92] tracking-tight sm:text-6xl">
          {playerName ? `${playerName}, train` : "Train"} like it counts
        </h1>
        <p className="mt-4 max-w-lg text-muted">
          Timed reps. Honest scores. A 12-week path for ball mastery, finishing,
          passing, speed, agility, and strength — solo, with a teammate, or with
          a trainer.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2 text-sm text-muted shadow-[var(--shadow-border)]">
            <Flame className="size-4 text-good" />
            <span className="tabular text-fg">{streak}</span> day streak
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2 text-sm text-muted shadow-[var(--shadow-border)]">
            <span className="tabular text-fg">
              {prog.done}/{prog.total}
            </span>{" "}
            sessions
          </span>
        </div>

        <ModePicker
          value={mode}
          onChange={(m) => {
            setMode(m);
            persistIfSignedIn();
          }}
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-subtle">
              Up next · Week {next.week}
            </p>
            <h2 className="mt-2 font-display text-4xl uppercase leading-none">
              {next.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{next.subtitle}</p>
            <p className="mt-4 text-sm text-fg">{next.intent}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge>{next.durationMin} min</Badge>
              {next.focus.slice(0, 3).map((f) => (
                <Badge key={f}>{PILLAR_LABEL[f]}</Badge>
              ))}
            </div>
            <Progress
              className="mt-6"
              value={(prog.done / prog.total) * 100}
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="xl" asChild className="flex-1">
                <Link to="/session/$sessionId" params={{ sessionId: next.id }}>
                  Start session
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="xl" variant="secondary" asChild>
                <Link to="/program">Full program</Link>
              </Button>
            </div>
          </article>

          <div className="grid gap-4">
            <QuickCard
              title={QUICK_SESSION.title}
              copy="Twenty minutes. Ball, sprint, finish."
              minutes={QUICK_SESSION.durationMin}
              to={QUICK_SESSION.id}
              icon={Timer}
            />
            <QuickCard
              title={ACTIVATION_SESSION.title}
              copy="Before team practice. Lights on, tank full."
              minutes={ACTIVATION_SESSION.durationMin}
              to={ACTIVATION_SESSION.id}
              icon={Zap}
            />
            <Link
              to="/videos"
              className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <Clapperboard className="size-4 text-muted" />
              <h3 className="mt-3 font-display text-2xl uppercase leading-none">
                X locker
              </h3>
              <p className="mt-2 text-sm text-muted">
                Paste bookmarked X videos. Assign them to drills. Watch mid-session.
              </p>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat icon={Target} label="Shooting XP" value={xp.shooting} />
          <Stat icon={Footprints} label="On-ball XP" value={xp.ball} />
          <Stat icon={Dumbbell} label="Athletic XP" value={xp.speed + xp.agility + xp.strength} />
        </div>

        {last ? (
          <p className="mt-8 text-sm text-subtle">
            Last logged {last.completedOn} · quality {last.quality}/5 · {last.mode}
          </p>
        ) : (
          <p className="mt-8 text-sm text-subtle">
            No sessions logged yet. Start the first block and check it off as you go.
          </p>
        )}
      </section>
    </AppShell>
  );
}

function QuickCard({
  title,
  copy,
  minutes,
  to,
  icon: Icon,
}: {
  title: string;
  copy: string;
  minutes: number;
  to: string;
  icon: typeof Timer;
}) {
  return (
    <Link
      to="/session/$sessionId"
      params={{ sessionId: to }}
      className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <Icon className="size-4 text-muted" />
      <h3 className="mt-3 font-display text-2xl uppercase leading-none">{title}</h3>
      <p className="mt-2 text-sm text-muted">{copy}</p>
      <p className="mt-4 text-xs uppercase tracking-wide text-subtle">{minutes} min</p>
    </Link>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <Icon className="size-4 text-muted" />
      <p className="mt-3 font-display text-3xl tabular leading-none">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-subtle">{label}</p>
    </div>
  );
}

function ModePicker({
  value,
  onChange,
}: {
  value: TrainingMode;
  onChange: (m: TrainingMode) => void;
}) {
  const options: { id: TrainingMode; label: string; copy: string; icon: typeof Users }[] = [
    { id: "solo", label: "Solo", copy: "Wall, cones, honest reps", icon: UserRound },
    { id: "partner", label: "Partner", copy: "Serve, 1v1, swap roles", icon: Users },
    { id: "trainer", label: "Trainer", copy: "Quality scored live", icon: GraduationCap },
  ];
  return (
    <div className="mt-8 grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const on = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "press min-h-20 rounded-xl px-2 py-3 text-left sm:px-4",
              on ? "bg-accent text-accent-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]",
            )}
          >
            <Icon className="size-4" />
            <p className="mt-2 font-display text-sm uppercase leading-none">{opt.label}</p>
            <p className={cn("mt-1 hidden text-xs sm:block", on ? "text-accent-fg/70" : "text-subtle")}>
              {opt.copy}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function Onboarding() {
  const setPlayerName = useTrainingStore((s) => s.setPlayerName);
  const setPreferredFoot = useTrainingStore((s) => s.setPreferredFoot);
  const setOnboardingDone = useTrainingStore((s) => s.setOnboardingDone);
  const preferredFoot = useTrainingStore((s) => s.preferredFoot);
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-bg/80 p-4 sm:place-items-center">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-[var(--shadow-border)]">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-muted">
          First session setup
        </p>
        <h2 className="mt-2 font-display text-3xl uppercase leading-none">
          Who is training?
        </h2>
        <label className="mt-6 block">
          <span className="text-xs uppercase tracking-wide text-subtle">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name"
            className="mt-2 h-12 w-full rounded-md bg-raised px-3 text-fg placeholder:text-subtle"
          />
        </label>
        <p className="mt-5 text-xs uppercase tracking-wide text-subtle">Preferred foot</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["right", "left"] as const).map((foot) => (
            <button
              key={foot}
              type="button"
              onClick={() => setPreferredFoot(foot)}
              className={cn(
                "h-12 rounded-md capitalize",
                preferredFoot === foot
                  ? "bg-accent text-accent-fg"
                  : "bg-raised text-muted",
              )}
            >
              {foot}
            </button>
          ))}
        </div>
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => {
            setPlayerName(name.trim());
            setOnboardingDone(true);
            persistIfSignedIn();
          }}
        >
          Let's train
        </Button>
      </div>
    </div>
  );
}
