alter table public.obstacles
  add column if not exists metric_label text,
  add column if not exists metric_value text,
  add column if not exists weight_male text,
  add column if not exists weight_female text,
  add column if not exists penalty text;
