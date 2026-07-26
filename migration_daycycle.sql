-- Ejecuta esto en el SQL Editor de Neon si ya tenías la base de datos de una versión anterior.
-- Agrega la hora de despertar (para que "el día" se reinicie cuando tú te levantas, no a medianoche)
-- y una columna app_date en cada tabla para agrupar los registros por "tu día", no por el calendario UTC.

alter table profiles add column if not exists wake_time text default '07:00';

alter table meals add column if not exists app_date date;
update meals set app_date = created_at::date where app_date is null;

alter table water_logs add column if not exists app_date date;
update water_logs set app_date = created_at::date where app_date is null;

alter table weight_logs add column if not exists app_date date;
update weight_logs set app_date = created_at::date where app_date is null;

create index if not exists idx_meals_user_date on meals (user_id, app_date);
create index if not exists idx_water_user_date on water_logs (user_id, app_date);
create index if not exists idx_weight_user_date on weight_logs (user_id, app_date);
