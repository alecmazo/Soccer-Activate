export type Pillar =
  | "ball"
  | "shooting"
  | "passing"
  | "speed"
  | "agility"
  | "strength";

export type TrainingMode = "solo" | "partner" | "trainer";

export type TimerKind =
  | "interval"
  | "countdown"
  | "reps"
  | "metronome"
  | "emom";

export type ScoreKind = "none" | "makes" | "time" | "reps" | "quality";

export type PreferredFoot = "right" | "left";

export type SessionRole =
  | "warmup"
  | "main"
  | "finisher"
  | "strength"
  | "cooldown";

export type ProgramPhase = "foundation" | "speed" | "pressure";

export type Drill = {
  id: string;
  name: string;
  pillar: Pillar;
  focus: string;
  setup: string;
  equipment: string[];
  cues: string[];
  why: string;
  timer: {
    kind: TimerKind;
    workSec: number;
    restSec: number;
    sets: number;
    bpm?: number;
  };
  score: ScoreKind;
  scoreLabel?: string;
  targetNote: string;
  space: string;
  modes: Record<TrainingMode, { setup: string; cue: string }>;
};

export type SessionBlock = {
  drillId: string;
  role: SessionRole;
  workSec?: number;
  restSec?: number;
  sets?: number;
  bpm?: number;
  targetNote?: string;
};

export type BuiltExercise = {
  key: string;
  drill: Drill;
  role: SessionRole;
  workSec: number;
  restSec: number;
  sets: number;
  bpm?: number;
  targetNote: string;
};

export type TrainingSession = {
  id: string;
  week: number;
  slot: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  kind: "technical" | "athletic" | "final-third" | "combined" | "quick" | "activation";
  phase: ProgramPhase;
  durationMin: number;
  focus: Pillar[];
  intent: string;
  equipment: string[];
  exercises: BuiltExercise[];
};

export type SessionLog = {
  id: string;
  sessionId: string;
  week: number;
  completedOn: string;
  durationSec: number;
  quality: number;
  mode: TrainingMode;
  exerciseKeys: string[];
  scores: Record<string, ScoreEntry>;
};

export type ScoreEntry = {
  kind: ScoreKind;
  makes?: number;
  attempts?: number;
  timeSec?: number;
  reps?: number;
  quality?: number;
};

export type PersonalRecord = {
  metric: string;
  label: string;
  value: number;
  unit: string;
  recordedOn: string;
};

export type PillarXp = Record<Pillar, number>;

export type DrillVideo = {
  id: string;
  statusId: string;
  url: string;
  handle: string | null;
  label: string;
  drillIds: string[];
  addedOn: string;
};
