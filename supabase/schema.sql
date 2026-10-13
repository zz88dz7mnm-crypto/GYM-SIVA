-- GYM · esquema de la base de datos
-- Va en el mismo proyecto de Supabase que FIA. Todas las tablas empiezan con gym_
-- y no tocan nada de FIA. Pegar completo en Supabase → SQL Editor → Run.
-- Se puede correr más de una vez sin romper nada.

-- ───────────────────────── Ajustes ─────────────────────────
create table if not exists public.gym_ajustes (
  usuario_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  inicio_plan date,
  sonido boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ───────────────────────── Sesiones ────────────────────────
-- Un entrenamiento. El id lo genera la app: si un guardado se reintenta, no se duplica.
create table if not exists public.gym_sesiones (
  id uuid primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia text not null check (dia in ('A', 'B', 'C', 'libre')),
  fecha date not null,
  inicio timestamptz not null default now(),
  fin timestamptz,
  estado text not null default 'en_curso' check (estado in ('en_curso', 'completada', 'cancelada')),
  semana smallint check (semana between -52 and 520),
  notas text not null default '' check (char_length(notas) <= 2000),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (fin is null or fin >= inicio)
);

create index if not exists gym_sesiones_usuario_fecha on public.gym_sesiones (usuario_id, fecha desc);
-- Una sola sesión en curso por usuario.
create unique index if not exists gym_sesiones_una_en_curso on public.gym_sesiones (usuario_id) where estado = 'en_curso';

-- ────────────────────────── Series ─────────────────────────
create table if not exists public.gym_series (
  id uuid primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sesion_id uuid not null references public.gym_sesiones (id) on delete cascade,
  ejercicio text not null check (char_length(ejercicio) between 1 and 80),
  ejercicio_nombre text not null check (char_length(ejercicio_nombre) between 1 and 120),
  orden smallint not null default 0,
  numero smallint not null check (numero between 1 and 50),
  kg numeric(6, 2) check (kg >= 0 and kg <= 1000),
  reps smallint check (reps >= 0 and reps <= 500),
  hecha boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists gym_series_sesion on public.gym_series (sesion_id);
create index if not exists gym_series_usuario_ejercicio on public.gym_series (usuario_id, ejercicio);

-- ─────────────────────── Peso corporal ─────────────────────
create table if not exists public.gym_peso_corporal (
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  kg numeric(5, 2) not null check (kg > 20 and kg < 400),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, fecha)
);

-- ──────────────────────── Auditoría ────────────────────────
-- La escribe la base sola cuando se edita o borra una sesión o una serie ya guardada.
-- Desde la app solo se puede leer.
create table if not exists public.gym_auditoria (
  id bigint generated always as identity primary key,
  usuario_id uuid not null,
  entidad text not null,
  entidad_id uuid not null,
  accion text not null,
  cambios jsonb not null default '{}'::jsonb,
  fecha timestamptz not null default now()
);

create index if not exists gym_auditoria_entidad on public.gym_auditoria (entidad, entidad_id);

create or replace function public.gym_tocar_actualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- Guarda qué cambió (antes y después). Las altas no se registran: el registro mismo es la constancia.
create or replace function public.gym_auditar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  diferencias jsonb;
  entidad text := case tg_table_name when 'gym_sesiones' then 'sesion' else 'serie' end;
begin
  if tg_op = 'DELETE' then
    insert into public.gym_auditoria (usuario_id, entidad, entidad_id, accion, cambios)
    values (old.usuario_id, entidad, old.id, 'borrado', to_jsonb(old));
    return null;
  end if;

  select coalesce(jsonb_object_agg(d.key, jsonb_build_object('antes', a.value, 'despues', d.value)), '{}'::jsonb)
  into diferencias
  from jsonb_each(to_jsonb(new)) as d
  join jsonb_each(to_jsonb(old)) as a on a.key = d.key
  where d.value is distinct from a.value
    and d.key <> 'actualizado_en';

  if diferencias <> '{}'::jsonb then
    insert into public.gym_auditoria (usuario_id, entidad, entidad_id, accion, cambios)
    values (new.usuario_id, entidad, new.id, 'edicion', diferencias);
  end if;
  return null;
end;
$$;

drop trigger if exists gym_ajustes_tocar on public.gym_ajustes;
create trigger gym_ajustes_tocar before update on public.gym_ajustes
  for each row execute function public.gym_tocar_actualizado();
drop trigger if exists gym_sesiones_tocar on public.gym_sesiones;
create trigger gym_sesiones_tocar before update on public.gym_sesiones
  for each row execute function public.gym_tocar_actualizado();
drop trigger if exists gym_series_tocar on public.gym_series;
create trigger gym_series_tocar before update on public.gym_series
  for each row execute function public.gym_tocar_actualizado();
drop trigger if exists gym_peso_tocar on public.gym_peso_corporal;
create trigger gym_peso_tocar before update on public.gym_peso_corporal
  for each row execute function public.gym_tocar_actualizado();

-- Solo se auditan las sesiones ya terminadas: mientras se entrena, cada toque no deja rastro.
drop trigger if exists gym_sesiones_auditar on public.gym_sesiones;
create trigger gym_sesiones_auditar after update or delete on public.gym_sesiones
  for each row
  when (old.estado <> 'en_curso')
  execute function public.gym_auditar();

create or replace function public.gym_sesion_terminada(sesion uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.gym_sesiones s where s.id = sesion and s.estado <> 'en_curso');
$$;

drop trigger if exists gym_series_auditar on public.gym_series;
create trigger gym_series_auditar after update or delete on public.gym_series
  for each row
  when (public.gym_sesion_terminada(old.sesion_id))
  execute function public.gym_auditar();

-- ───────────────────────── Permisos ────────────────────────
-- Cada usuario ve y toca solo lo suyo.
alter table public.gym_ajustes enable row level security;
alter table public.gym_sesiones enable row level security;
alter table public.gym_series enable row level security;
alter table public.gym_peso_corporal enable row level security;
alter table public.gym_auditoria enable row level security;

drop policy if exists gym_ajustes_propio on public.gym_ajustes;
create policy gym_ajustes_propio on public.gym_ajustes for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

drop policy if exists gym_sesiones_propio on public.gym_sesiones;
create policy gym_sesiones_propio on public.gym_sesiones for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

-- Una serie solo puede colgar de una sesión propia.
drop policy if exists gym_series_propio on public.gym_series;
create policy gym_series_propio on public.gym_series for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (
    usuario_id = (select auth.uid())
    and exists (select 1 from public.gym_sesiones s where s.id = sesion_id and s.usuario_id = (select auth.uid()))
  );

drop policy if exists gym_peso_propio on public.gym_peso_corporal;
create policy gym_peso_propio on public.gym_peso_corporal for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

drop policy if exists gym_auditoria_ver on public.gym_auditoria;
create policy gym_auditoria_ver on public.gym_auditoria for select to authenticated
  using (usuario_id = (select auth.uid()));

revoke all on public.gym_ajustes, public.gym_sesiones, public.gym_series, public.gym_peso_corporal, public.gym_auditoria
  from anon, authenticated;
grant select, insert, update on public.gym_ajustes to authenticated;
grant select, insert, update, delete on public.gym_sesiones, public.gym_series, public.gym_peso_corporal to authenticated;
grant select on public.gym_auditoria to authenticated;

revoke all on function public.gym_auditar() from public, anon, authenticated;
revoke all on function public.gym_sesion_terminada(uuid) from public, anon;
grant execute on function public.gym_sesion_terminada(uuid) to authenticated;
