import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { PILLAR_LABEL } from "@/lib/training/drills";
import type { Pillar, PillarXp } from "@/lib/training/types";

const ORDER: Pillar[] = [
  "ball",
  "passing",
  "shooting",
  "speed",
  "agility",
  "strength",
];

export function SkillRadar({ xp }: { xp: PillarXp }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const max = Math.max(40, ...ORDER.map((k) => xp[k]));
  const data = ORDER.map((key) => ({
    pillar: PILLAR_LABEL[key],
    value: xp[key],
  }));
  if (!ready) return <div className="radar-box" />;
  return (
    <div className="radar-box">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="var(--color-line)" />
          <PolarAngleAxis
            dataKey="pillar"
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, max]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
