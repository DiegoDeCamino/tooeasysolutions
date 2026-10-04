-- Too Easy Ops: pricing defaults and stage templates (safe to re-run)

insert into public.settings (id) values (1) on conflict (id) do nothing;

insert into public.clean_types (key, name, description, multiplier, sort) values
  ('regular', 'Regular clean', 'Kitchen, bathrooms, floors, dusting and surfaces.', 1.00, 1),
  ('deep', 'Deep clean', 'Everything in a regular clean plus skirting, doors, inside cupboards and detail work.', 1.40, 2),
  ('end_of_lease', 'End of lease', 'Bond-ready clean to the agent checklist.', 1.70, 3),
  ('move_in', 'Move in', 'Fresh start before the furniture arrives.', 1.30, 4),
  ('airbnb', 'Holiday rental turnover', 'Reset between guests, linen change included.', 0.90, 5),
  ('office', 'Office or commercial', 'Workspaces, kitchens and amenities.', 1.10, 6)
on conflict (key) do nothing;

insert into public.addons (name, kind, value, sort)
select * from (values
  ('Inside oven', 'hours'::public.addon_kind, 0.75, 1),
  ('Inside fridge', 'hours'::public.addon_kind, 0.50, 2),
  ('Interior windows', 'hours'::public.addon_kind, 1.00, 3),
  ('Exterior windows', 'hours'::public.addon_kind, 1.50, 4),
  ('Balcony or patio', 'hours'::public.addon_kind, 0.50, 5),
  ('Walls spot clean', 'hours'::public.addon_kind, 1.00, 6),
  ('Laundry and linen', 'hours'::public.addon_kind, 0.50, 7),
  ('Carpet steam clean', 'fixed'::public.addon_kind, 120.00, 8)
) as v(name, kind, value, sort)
where not exists (select 1 from public.addons);

insert into public.price_presets (name, clean_type_id, bedrooms, bathrooms, max_sqm, fixed_price)
select '2 bed 1 bath regular', id, 2, 1, 110, 260 from public.clean_types where key = 'regular'
  and not exists (select 1 from public.price_presets);

insert into public.stage_templates (name, stages, sort)
select * from (values
  ('Deck', array['Site prep', 'Footings and posts', 'Bearers and joists', 'Decking boards', 'Balustrade and steps', 'Oil and handover'], 1),
  ('Pergola', array['Site prep', 'Posts', 'Beams and rafters', 'Roofing or battens', 'Finish and handover'], 2),
  ('Kitchen', array['Demolition', 'Rough-in', 'Cabinetry', 'Benchtops', 'Splashback and fit-off', 'Handover'], 3),
  ('Bathroom', array['Demolition', 'Waterproofing', 'Tiling', 'Vanity and fixtures', 'Handover'], 4),
  ('General repairs', array['Assess', 'Repair', 'Finish and clean up'], 5)
) as v(name, stages, sort)
where not exists (select 1 from public.stage_templates);
