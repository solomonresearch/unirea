-- Change profession and domain from text to text[] for multiple selections
alter table public.profiles
  alter column profession type text[] using case when profession is not null then array[profession] else null end,
  alter column domain type text[] using case when domain is not null then array[domain] else null end;
