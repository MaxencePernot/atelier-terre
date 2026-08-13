-- ════════════════════════════════════════════════════════════════════════
--  STOCKAGE DES IMAGES — bucket "product-images"
--  À exécuter après schema.sql, dans le SQL Editor Supabase.
--  Alternative sans SQL : Storage → New bucket → nom "product-images",
--  cochez "Public bucket", puis appliquez les policies ci-dessous.
-- ════════════════════════════════════════════════════════════════════════

-- Crée le bucket public (lecture publique des URLs, écriture protégée).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Lecture publique des fichiers du bucket.
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

-- Seuls les administrateurs peuvent uploader / modifier / supprimer.
drop policy if exists "admin write product images" on storage.objects;
create policy "admin write product images" on storage.objects
  for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
