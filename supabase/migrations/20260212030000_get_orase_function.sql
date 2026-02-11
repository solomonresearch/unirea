-- RPC function to get all distinct Romanian cities from schools table
create or replace function public.get_orase()
returns table(oras text) as $$
  select distinct localitate_unitate as oras
  from public.schools
  where localitate_unitate is not null
  order by localitate_unitate;
$$ language sql stable;
