-- Fix school lookup RPCs to filter on denumire_lunga_unitate (full school name)
create or replace function public.get_judete()
returns table(judet text) as $$
  select distinct judet_pj as judet
  from public.schools
  where judet_pj is not null
    and (upper(denumire_lunga_unitate) like '%COLEGIU%' or upper(denumire_lunga_unitate) like '%LICEU%')
  order by judet_pj;
$$ language sql stable;

create or replace function public.get_localitati(p_judet text)
returns table(localitate text) as $$
  select distinct localitate_unitate as localitate
  from public.schools
  where judet_pj = p_judet
    and localitate_unitate is not null
    and (upper(denumire_lunga_unitate) like '%COLEGIU%' or upper(denumire_lunga_unitate) like '%LICEU%')
  order by localitate_unitate;
$$ language sql stable;

drop function if exists public.get_scoli(text, text);
create or replace function public.get_scoli(p_judet text, p_localitate text)
returns table(denumire text, top_school boolean) as $$
  select distinct denumire_lunga_unitate as denumire, coalesce(s.top_school, false) as top_school
  from public.schools s
  where s.judet_pj = p_judet
    and s.localitate_unitate = p_localitate
    and s.denumire_lunga_unitate is not null
    and (upper(s.denumire_lunga_unitate) like '%COLEGIU%' or upper(s.denumire_lunga_unitate) like '%LICEU%')
  order by denumire_lunga_unitate;
$$ language sql stable;
