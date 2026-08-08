-- Esquema del trivial. Ejecutar una sola vez en el SQL Editor de Supabase.
--
-- La partida entera cabe en una fila: un JSON con marcador, turno, historial y
-- preguntas ya usadas. No hace falta más porque solo jugáis vosotros dos.

create table if not exists public.partidas (
  id text primary key,
  estado jsonb not null,
  actualizado timestamptz not null default now()
);

-- RLS activado y sin ninguna política: nadie puede tocar la tabla con la clave
-- pública. El acceso va exclusivamente por las Server Actions de Next.js, que
-- usan la service role key y viven solo en el servidor.
alter table public.partidas enable row level security;

comment on table public.partidas is
  'Una fila por partida. Se accede únicamente desde el servidor con la service role key.';

-- Confirmación visible al ejecutarlo desde el panel de Supabase.
select
  'Tabla partidas lista' as resultado,
  (select count(*) from public.partidas) as partidas_guardadas,
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.partidas'::regclass
  ) as rls_activado;
