-- Danish Storefront QA: scan log for abuse limits + product metrics.
-- Only a daily-rotating salted IP hash is stored; rows are deleted after 30 days.
create table if not exists public.dsqa_scan_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null,
  host text not null
);
create index if not exists dsqa_scan_events_ip_time on public.dsqa_scan_events (ip_hash, created_at);
create index if not exists dsqa_scan_events_time on public.dsqa_scan_events (created_at);

alter table public.dsqa_scan_events enable row level security;
-- No policies: anon/authenticated roles cannot read or write. Only service_role (edge function).
revoke all on public.dsqa_scan_events from anon, authenticated;

create or replace function public.dsqa_register_scan(p_ip_hash text, p_host text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  per_ip int;
  global_day int;
begin
  -- serialise concurrent registrations so limits cannot be overshot
  perform pg_advisory_xact_lock(724001);
  delete from public.dsqa_scan_events where created_at < now() - interval '30 days';
  select count(*) into per_ip from public.dsqa_scan_events
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
  if per_ip >= 10 then
    return json_build_object('allowed', false, 'reason', 'per_ip_hour');
  end if;
  select count(*) into global_day from public.dsqa_scan_events
    where created_at > now() - interval '24 hours';
  if global_day >= 300 then
    return json_build_object('allowed', false, 'reason', 'global_day');
  end if;
  insert into public.dsqa_scan_events (ip_hash, host) values (left(p_ip_hash, 64), left(p_host, 253));
  return json_build_object('allowed', true);
end;
$$;

revoke all on function public.dsqa_register_scan(text, text) from public, anon, authenticated;
grant execute on function public.dsqa_register_scan(text, text) to service_role;
