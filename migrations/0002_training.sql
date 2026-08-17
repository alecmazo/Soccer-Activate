-- Activate training progress (per-user)
create table if not exists player_profiles (
  user_id text primary key,
  player_name text not null default '',
  preferred_foot text not null default 'right',
  training_mode text not null default 'solo',
  onboarding_done boolean not null default false,
  streak int not null default 0,
  last_session_date text,
  pillar_ball int not null default 0,
  pillar_shooting int not null default 0,
  pillar_passing int not null default 0,
  pillar_speed int not null default 0,
  pillar_agility int not null default 0,
  pillar_strength int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists session_logs (
  id text primary key,
  user_id text not null,
  session_id text not null,
  week int not null default 0,
  completed_on text not null,
  duration_sec int not null default 0,
  quality int not null default 3,
  mode text not null default 'solo',
  exercise_keys text not null default '[]',
  scores text not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists session_logs_user_id_idx on session_logs (user_id);
create index if not exists session_logs_user_completed_idx on session_logs (user_id, completed_on desc);

create table if not exists personal_records (
  user_id text not null,
  metric text not null,
  label text not null,
  value double precision not null,
  unit text not null,
  recorded_on text not null,
  primary key (user_id, metric)
);
