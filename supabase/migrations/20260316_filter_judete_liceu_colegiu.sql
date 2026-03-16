-- Filter get_judete to only return counties that have at least one liceu or colegiu
create or replace function public.get_judete()
returns table(judet text) as $$
  select distinct judet_pj as judet
  from public.schools
  where judet_pj is not null
    and (upper(denumire_lunga_unitate) like '%COLEGIU%' or upper(denumire_lunga_unitate) like '%LICEU%')
  order by judet_pj;
$$ language sql stable;
