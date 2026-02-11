-- Efficient lookup functions for school dropdowns

create or replace function public.get_judete()
returns table(judet text) as $$
  select distinct judet_pj as judet
  from public.schools
  where judet_pj is not null
  order by judet_pj;
$$ language sql stable;

create or replace function public.get_localitati(p_judet text)
returns table(localitate text) as $$
  select distinct localitate_unitate as localitate
  from public.schools
  where judet_pj = p_judet and localitate_unitate is not null
  order by localitate_unitate;
$$ language sql stable;

create or replace function public.get_scoli(p_judet text, p_localitate text)
returns table(denumire text) as $$
  select distinct denumire_lunga_unitate as denumire
  from public.schools
  where judet_pj = p_judet
    and localitate_unitate = p_localitate
    and denumire_lunga_unitate is not null
  order by denumire_lunga_unitate;
$$ language sql stable;
