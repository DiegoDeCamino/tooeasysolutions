-- Cleans go out with at least two people; deep cleans with three.
alter table public.clean_types
  add column min_crew int not null default 2 check (min_crew between 1 and 8);

update public.clean_types set min_crew = 3 where key = 'deep';
