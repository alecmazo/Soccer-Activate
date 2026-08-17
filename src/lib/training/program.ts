import { getDrill } from "./drills";
import type {
  BuiltExercise,
  Pillar,
  ProgramPhase,
  SessionBlock,
  TrainingSession,
} from "./types";

export const PROGRAM_WEEKS = 12;
export const SESSIONS_PER_WEEK = 4;

export const WEEK_TITLES = [
  "First-touch standard",
  "Tight spaces",
  "Weak-foot week",
  "Change of pace",
  "Speed of thought",
  "Delivery",
  "Explosive",
  "Pressure box",
  "Final third",
  "Duel ready",
  "Match-week habits",
  "Showcase",
] as const;

const SLOT_META = {
  1: {
    title: "Technical Lab",
    kind: "technical" as const,
    intent: "Own the ball in a phone booth. Both feet. Head up.",
  },
  2: {
    title: "Engine Room",
    kind: "athletic" as const,
    intent: "First step, cuts, and strength that holds up late.",
  },
  3: {
    title: "Final Third",
    kind: "final-third" as const,
    intent: "Clean service. Honest finishing. Weak foot included.",
  },
  4: {
    title: "Combined",
    kind: "combined" as const,
    intent: "Link the skills under a clock. This one should feel like a match.",
  },
};

function phaseFor(week: number): ProgramPhase {
  if (week <= 4) return "foundation";
  if (week <= 8) return "speed";
  return "pressure";
}

function volume(week: number, base: number, cap: number) {
  const extra = Math.floor((week - 1) / 2);
  return Math.min(cap, base + extra);
}

function restFor(week: number, base: number) {
  const phase = phaseFor(week);
  if (phase === "foundation") return base;
  if (phase === "speed") return Math.max(12, Math.round(base * 0.85));
  return Math.max(10, Math.round(base * 0.75));
}

function bpmFor(week: number, base: number) {
  return Math.min(110, base + (week - 1) * 2);
}

function technicalBlocks(week: number): SessionBlock[] {
  const juggleOrBox: SessionBlock =
    week >= 9
      ? { drillId: "fin-rondo-shadow", role: "finisher" }
      : { drillId: "ball-juggle", role: "main" };
  return [
    { drillId: "act-dynamic", role: "warmup", sets: 4 },
    {
      drillId: "ball-foundation",
      role: "main",
      sets: volume(week, 5, 8),
      bpm: bpmFor(week, 76),
    },
    {
      drillId: "ball-cone-weave",
      role: "main",
      sets: volume(week, 6, 10),
    },
    {
      drillId: week >= 5 ? "ball-turn-escape" : "ball-first-touch",
      role: "main",
      sets: volume(week, 5, 8),
    },
    {
      drillId: "ball-1v1-moves",
      role: "main",
      sets: volume(week, 6, 10),
    },
    juggleOrBox,
    { drillId: "str-core", role: "strength", sets: week >= 8 ? 4 : 3 },
    { drillId: "cool-mobility", role: "cooldown", sets: 3 },
  ];
}

function athleticBlocks(week: number): SessionBlock[] {
  const flyOrW: SessionBlock =
    week >= 6
      ? { drillId: "speed-flying", role: "main", sets: week >= 10 ? 5 : 4 }
      : { drillId: "speed-w", role: "main", sets: volume(week, 4, 6) };
  return [
    { drillId: "act-dynamic", role: "warmup", sets: 4 },
    { drillId: "agi-ladder", role: "main", sets: volume(week, 6, 10) },
    { drillId: "speed-10", role: "main", sets: volume(week, 5, 8) },
    flyOrW,
    {
      drillId: week >= 5 ? "agi-reactive" : "agi-5105",
      role: "main",
      sets: volume(week, 5, 7),
    },
    { drillId: "agi-decel", role: "main", sets: 5 },
    { drillId: "str-split", role: "strength", sets: 6 },
    { drillId: "str-hinge", role: "strength", sets: 4 },
    { drillId: "str-pogo", role: "strength", sets: week >= 7 ? 6 : 4 },
    { drillId: "cool-mobility", role: "cooldown", sets: 3 },
  ];
}

function finalThirdBlocks(week: number): SessionBlock[] {
  return [
    { drillId: "act-dynamic", role: "warmup", sets: 3 },
    {
      drillId: "pass-wall-rhythm",
      role: "main",
      sets: volume(week, 5, 8),
      bpm: bpmFor(week, 68),
    },
    {
      drillId: week % 2 === 0 ? "pass-weak-foot" : "pass-driven",
      role: "main",
      sets: volume(week, 6, 10),
    },
    { drillId: "pass-combo", role: "main", sets: volume(week, 5, 8) },
    { drillId: "shot-placement", role: "main", sets: volume(week, 8, 12) },
    {
      drillId: week >= 5 ? "shot-weak" : "shot-driven",
      role: "main",
      sets: volume(week, 6, 10),
    },
    {
      drillId: week >= 8 ? "shot-one-touch" : "shot-cut-in",
      role: "main",
      sets: volume(week, 6, 10),
    },
    { drillId: "fin-shoot-game", role: "finisher", sets: 10 },
    { drillId: "cool-mobility", role: "cooldown", sets: 3 },
  ];
}

function combinedBlocks(week: number): SessionBlock[] {
  return [
    { drillId: "act-dynamic", role: "warmup", sets: 3 },
    { drillId: "ball-foundation", role: "main", sets: 4, bpm: bpmFor(week, 80) },
    { drillId: "ball-cone-weave", role: "main", sets: 5 },
    { drillId: "pass-combo", role: "main", sets: 5 },
    {
      drillId: week >= 9 ? "agi-reactive" : "agi-5105",
      role: "main",
      sets: 5,
    },
    { drillId: "speed-10", role: "main", sets: 4 },
    {
      drillId: week >= 6 ? "shot-cut-in" : "shot-placement",
      role: "main",
      sets: 6,
    },
    { drillId: "fin-rondo-shadow", role: "finisher", sets: 4 },
    { drillId: "fin-shoot-game", role: "finisher", sets: 10 },
    { drillId: "str-core", role: "strength", sets: 3 },
    { drillId: "cool-mobility", role: "cooldown", sets: 3 },
  ];
}

function buildExercises(week: number, blocks: SessionBlock[]): BuiltExercise[] {
  return blocks.map((block, index) => {
    const drill = getDrill(block.drillId);
    const sets = block.sets ?? drill.timer.sets;
    const workSec = block.workSec ?? drill.timer.workSec;
    const restSec = restFor(week, block.restSec ?? drill.timer.restSec);
    const bpm = block.bpm ?? drill.timer.bpm;
    const targetNote = block.targetNote ?? drill.targetNote;
    return {
      key: `${block.drillId}-${index}`,
      drill,
      role: block.role,
      workSec,
      restSec,
      sets,
      bpm,
      targetNote,
    };
  });
}

function estimateMinutes(exercises: BuiltExercise[]) {
  const sec = exercises.reduce((sum, ex) => {
    const work = ex.workSec > 0 ? ex.workSec : 18;
    return sum + ex.sets * (work + ex.restSec) + 20;
  }, 0);
  return Math.round(sec / 60);
}

function uniqueEquipment(exercises: BuiltExercise[]) {
  const set = new Set<string>();
  for (const ex of exercises) {
    for (const item of ex.drill.equipment) set.add(item);
  }
  return [...set];
}

function uniqueFocus(exercises: BuiltExercise[]): Pillar[] {
  const set = new Set<Pillar>();
  for (const ex of exercises) {
    if (ex.role !== "warmup" && ex.role !== "cooldown") set.add(ex.drill.pillar);
  }
  return [...set];
}

export function sessionIdFor(week: number, slot: 1 | 2 | 3 | 4) {
  return `w${week}-s${slot}`;
}

export function parseSessionId(id: string): { week: number; slot: 1 | 2 | 3 | 4 } | null {
  const m = /^w(\d+)-s([1-4])$/.exec(id);
  if (!m) return null;
  return { week: Number(m[1]), slot: Number(m[2]) as 1 | 2 | 3 | 4 };
}

export function getProgramSession(week: number, slot: 1 | 2 | 3 | 4): TrainingSession {
  const blocks =
    slot === 1
      ? technicalBlocks(week)
      : slot === 2
        ? athleticBlocks(week)
        : slot === 3
          ? finalThirdBlocks(week)
          : combinedBlocks(week);
  const exercises = buildExercises(week, blocks);
  const meta = SLOT_META[slot];
  const phase = phaseFor(week);
  return {
    id: sessionIdFor(week, slot),
    week,
    slot,
    title: meta.title,
    subtitle: WEEK_TITLES[week - 1] ?? `Week ${week}`,
    kind: meta.kind,
    phase,
    durationMin: estimateMinutes(exercises),
    focus: uniqueFocus(exercises),
    intent: meta.intent,
    equipment: uniqueEquipment(exercises),
    exercises,
  };
}

export function getAllProgramSessions(): TrainingSession[] {
  const list: TrainingSession[] = [];
  for (let week = 1; week <= PROGRAM_WEEKS; week += 1) {
    for (const slot of [1, 2, 3, 4] as const) {
      list.push(getProgramSession(week, slot));
    }
  }
  return list;
}

function fromIds(
  id: string,
  title: string,
  subtitle: string,
  kind: TrainingSession["kind"],
  intent: string,
  ids: { drillId: string; role: BuiltExercise["role"]; sets?: number }[],
): TrainingSession {
  const exercises = buildExercises(
    1,
    ids.map((x) => ({ drillId: x.drillId, role: x.role, sets: x.sets })),
  );
  return {
    id,
    week: 0,
    slot: 1,
    title,
    subtitle,
    kind,
    phase: "foundation",
    durationMin: estimateMinutes(exercises),
    focus: uniqueFocus(exercises),
    intent,
    equipment: uniqueEquipment(exercises),
    exercises,
  };
}

export const QUICK_SESSION = fromIds(
  "quick-20",
  "Quick 20",
  "When you only have a window",
  "quick",
  "Hit the ball, hit a sprint, hit a finish. Leave sharper.",
  [
    { drillId: "act-dynamic", role: "warmup", sets: 3 },
    { drillId: "ball-foundation", role: "main", sets: 4 },
    { drillId: "ball-cone-weave", role: "main", sets: 4 },
    { drillId: "pass-wall-rhythm", role: "main", sets: 3 },
    { drillId: "shot-placement", role: "main", sets: 6 },
    { drillId: "speed-10", role: "main", sets: 4 },
    { drillId: "cool-mobility", role: "cooldown", sets: 2 },
  ],
);

export const ACTIVATION_SESSION = fromIds(
  "activation-12",
  "Activation 12",
  "Before team practice",
  "activation",
  "Turn the lights on. Do not empty the tank.",
  [
    { drillId: "act-dynamic", role: "warmup", sets: 4 },
    { drillId: "ball-foundation", role: "main", sets: 3 },
    { drillId: "ball-first-touch", role: "main", sets: 3 },
    { drillId: "agi-ladder", role: "main", sets: 4 },
    { drillId: "str-pogo", role: "strength", sets: 3 },
  ],
);

export function getSessionById(id: string): TrainingSession | null {
  if (id === QUICK_SESSION.id) return QUICK_SESSION;
  if (id === ACTIVATION_SESSION.id) return ACTIVATION_SESSION;
  const parsed = parseSessionId(id);
  if (!parsed) return null;
  if (parsed.week < 1 || parsed.week > PROGRAM_WEEKS) return null;
  return getProgramSession(parsed.week, parsed.slot);
}

export function phaseLabel(phase: ProgramPhase) {
  if (phase === "foundation") return "Foundation";
  if (phase === "speed") return "Speed of play";
  return "Pressure";
}
