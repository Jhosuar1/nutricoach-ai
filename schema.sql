-- NutriCoach AI — esquema de base de datos para Neon (Postgres)
-- Copia y pega todo este archivo en el "SQL Editor" de tu proyecto Neon y ejecútalo una vez.

create extension if not exists "pgcrypto";

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  created_at    timestamptz default now()
);

create table if not exists profiles (
  user_id       uuid primary key references users(id) on delete cascade,
  name          text,
  sex           text,
  age           integer,
  height        numeric,
  weight        numeric,
  target_weight numeric,
  activity      text,
  goal          text,
  place         text,
  train_days    integer,
  equipment     jsonb default '[]',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists meals (
  id         serial primary key,
  user_id    uuid references profiles(user_id) on delete cascade,
  type       text,
  items      jsonb,
  totals     jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_meals_user_date on meals (user_id, created_at);

create table if not exists water_logs (
  id         serial primary key,
  user_id    uuid references profiles(user_id) on delete cascade,
  amount_ml  integer,
  created_at timestamptz default now()
);
create index if not exists idx_water_user_date on water_logs (user_id, created_at);

create table if not exists weight_logs (
  id         serial primary key,
  user_id    uuid references profiles(user_id) on delete cascade,
  weight     numeric,
  created_at timestamptz default now()
);
create index if not exists idx_weight_user_date on weight_logs (user_id, created_at);

create table if not exists workout_completions (
  user_id       uuid references profiles(user_id) on delete cascade,
  exercise_key  text,
  completed_at  date default current_date,
  primary key (user_id, exercise_key, completed_at)
);
