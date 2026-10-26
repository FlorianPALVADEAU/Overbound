-- Legacy photos in public/images/images are removed from the repo; these four
-- rows still pointed at them. Apply BEFORE deploying the deletion.
-- Idempotent: each UPDATE only matches the old value.

update public.bootcamps
set image_url = 'https://overbound-race.com/images/obstacles/tire-flip.webp'
where image_url = 'https://overbound-race.com/images/images/a-man-flipping-a-tire-with-overbound-headband.avif';

update public.bootcamps
set image_url = 'https://overbound-race.com/images/obstacles/tire-flip2.webp'
where image_url = 'https://overbound-race.com/images/images/a-young-man-lifting-a-tire-from-the-ground.avif';

update public.bootcamps
set image_url = 'https://overbound-race.com/images/obstacles/farmer-carry.webp'
where image_url = 'https://overbound-race.com/images/images/farmer-carry.avif';

update public.races
set logo_url = '/images/obstacles/tire-flip2.webp'
where id = '268458c8-cd0b-449f-981a-dbca0c3ae178'
  and logo_url = '/images/images/a-big-tire-is falling-upside-down-thanks-to-a-young-man.avif';
