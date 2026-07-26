-- Ejecuta esto en el SQL Editor de Neon SOLO SI ya habías corrido schema.sql antes
-- (o sea, si tu proyecto ya tenía las tablas profiles, meals, etc. sin login).
-- Si vas a crear la base de datos desde cero, ignora este archivo y usa solo schema.sql.

create extension if not exists "pgcrypto";

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  created_at    timestamptz default now()
);

-- Vincula la tabla de perfiles con cuentas reales.
-- Si tu tabla profiles ya tiene filas de pruebas (sesiones anónimas viejas),
-- bórralas primero con: delete from profiles;
-- porque esos user_id anónimos no van a coincidir con ningún usuario real.
alter table profiles
  add constraint profiles_user_id_fkey foreign key (user_id) references users(id) on delete cascade;
