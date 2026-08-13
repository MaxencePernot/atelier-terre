-- ════════════════════════════════════════════════════════════════════════
--  ATELIER TERRE — Schéma de base de données Supabase (PostgreSQL)
--  À exécuter dans : Supabase → SQL Editor → New query → Run.
--  Idempotent autant que possible : réexécutable sans casser l'existant.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Fonction utilitaire : mise à jour automatique de updated_at ──────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── admin_users : liste des comptes autorisés à administrer la boutique ──
-- Le compte est créé via Supabase Auth ; on référence son id ici pour lui
-- accorder les droits d'admin via la fonction is_admin().
create table if not exists public.admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- Renvoie true si l'utilisateur courant est un administrateur.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

-- ── categories ──────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

-- ── products ────────────────────────────────────────────────────────────
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  description       text,
  making_info       text,                       -- infos sur la fabrication
  price_cents       int  not null check (price_cents >= 0),
  currency          text not null default 'eur',
  category_id       uuid references public.categories (id) on delete set null,
  stock             int  not null default 1 check (stock >= 0),
  max_per_order     int  not null default 1,     -- 1 pour les pièces uniques
  dimensions        text,
  weight_grams      int,
  materials         text,
  colors            text,
  extra_info        text,
  -- 'available' | 'sold' | 'coming_soon' — statut dérivé mais surchargé possible
  status            text not null default 'available'
                    check (status in ('available','sold','coming_soon')),
  is_published      boolean not null default true,
  is_featured       boolean not null default false,
  -- SEO par produit
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_published_idx on public.products (is_published);
create index if not exists products_featured_idx  on public.products (is_featured);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ── product_images ──────────────────────────────────────────────────────
create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,          -- URL publique Supabase Storage
  alt         text,                   -- texte alternatif (SEO / accessibilité)
  position    int not null default 0, -- position 0 = image principale
  created_at  timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id, position);

-- ── customers ───────────────────────────────────────────────────────────
create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  first_name    text,
  last_name     text,
  phone         text,
  created_at    timestamptz not null default now()
);

-- ── orders ──────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  order_number          text not null unique,      -- ex : ATL-20260812-0007
  customer_id           uuid references public.customers (id) on delete set null,
  email                 text not null,
  -- montants figés au moment de la commande (en centimes)
  subtotal_cents        int not null default 0,
  shipping_cents        int not null default 0,
  total_cents           int not null default 0,
  currency              text not null default 'eur',
  -- adresses (JSON pour rester flexible)
  shipping_address      jsonb,
  billing_address       jsonb,
  -- statuts
  payment_status        text not null default 'pending'
                        check (payment_status in ('pending','paid','failed','refunded')),
  fulfillment_status    text not null default 'new'
                        check (fulfillment_status in
                          ('new','preparing','shipped','delivered','cancelled')),
  stripe_session_id     text,
  stripe_payment_intent text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_email_idx on public.orders (email);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ── order_items ─────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  product_name   text not null,        -- copie figée (le produit peut être supprimé)
  unit_price_cents int not null,
  quantity       int not null check (quantity > 0),
  created_at     timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ── contact_messages ────────────────────────────────────────────────────
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── site_settings : contenu éditable (homepage, à propos, légal, livraison)
-- Modèle clé/valeur JSON : une ligne par bloc de contenu.
create table if not exists public.site_settings (
  key         text primary key,       -- ex : 'home', 'about', 'shipping', 'legal_terms'
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
--  DÉCRÉMENT ATOMIQUE DU STOCK  (appelé par le webhook Stripe côté serveur)
--  Empêche la survente et bascule le produit en 'sold' quand stock = 0.
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.decrement_stock(p_product_id uuid, p_qty int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.products
     set stock  = greatest(stock - p_qty, 0),
         status = case when greatest(stock - p_qty, 0) = 0 then 'sold' else status end
   where id = p_product_id;
end $$;

-- ════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Principe : le public (rôle anon) ne lit que le contenu publié.
--  Toute écriture sensible passe soit par un admin authentifié,
--  soit par le rôle service_role (webhook serveur, qui contourne la RLS).
-- ════════════════════════════════════════════════════════════════════════
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.customers        enable row level security;
alter table public.admin_users      enable row level security;
alter table public.site_settings    enable row level security;
alter table public.contact_messages enable row level security;

-- ── Lecture publique du catalogue ───────────────────────────────────────
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);

drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products
  for select using (is_published = true or public.is_admin());

drop policy if exists "public read product images" on public.product_images;
create policy "public read product images" on public.product_images
  for select using (true);

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings
  for select using (true);

-- ── Le public peut envoyer un message de contact ────────────────────────
drop policy if exists "public insert contact" on public.contact_messages;
create policy "public insert contact" on public.contact_messages
  for insert with check (true);

-- ── Admin : accès complet à tout ────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'categories','products','product_images','orders','order_items',
    'customers','admin_users','site_settings','contact_messages'
  ] loop
    execute format('drop policy if exists "admin all %1$s" on public.%1$I;', t);
    execute format(
      'create policy "admin all %1$s" on public.%1$I
         for all using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- NB : orders / order_items / customers n'ont AUCUNE policy publique.
-- Ils sont écrits exclusivement par le webhook (service_role) et lus par
-- l'admin. Un client consulte sa commande via la page de confirmation qui
-- interroge une fonction serverless, jamais la table directement.
