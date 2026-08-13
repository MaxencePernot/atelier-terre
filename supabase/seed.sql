-- ════════════════════════════════════════════════════════════════════════
--  DONNÉES DE DÉMONSTRATION
--  À exécuter APRÈS schema.sql. Toutes les lignes de démo ont un slug
--  préfixé "demo-" → suppression facile :
--     delete from public.products where slug like 'demo-%';
--     delete from public.categories where slug like 'demo-%';
-- ════════════════════════════════════════════════════════════════════════

-- ── Catégories ──────────────────────────────────────────────────────────
insert into public.categories (name, slug, description, position) values
  ('Vases',            'demo-vases',      'Pièces hautes, tournées à la main.',        1),
  ('Bols',             'demo-bols',       'Pour le quotidien comme pour recevoir.',    2),
  ('Tasses',           'demo-tasses',     'Grès émaillé, agréables en main.',          3),
  ('Assiettes',        'demo-assiettes',  'Formes basses et généreuses.',              4),
  ('Coupelles',        'demo-coupelles',  'Petits contenants du quotidien.',           5),
  ('Objets décoratifs','demo-deco',       'Sculptures et pièces d''ornement.',         6)
on conflict (slug) do nothing;

-- ── Produits ────────────────────────────────────────────────────────────
with c as (select slug, id from public.categories)
insert into public.products
  (name, slug, description, making_info, price_cents, category_id, stock,
   max_per_order, dimensions, weight_grams, materials, colors, status,
   is_published, is_featured, seo_title, seo_description)
values
  ('Vase Onde',        'demo-vase-onde',
   'Un vase élancé au col resserré, émaillé céladon. Chaque ondulation garde la trace des doigts sur le tour.',
   'Tourné en grès, séché trois semaines, cuit à 1260°C. Émail céladon appliqué à la main.',
   8900, (select id from c where slug='demo-vases'), 3, 3,
   'H 28 cm · Ø 14 cm', 1100, 'Grès émaillé', 'Céladon', 'available', true, true,
   'Vase Onde en grès céladon — Atelier Terre',
   'Vase tourné main en grès, émail céladon. Pièce d''atelier, 28 cm.'),

  ('Bol Sillon',       'demo-bol-sillon',
   'Bol large aux sillons marqués, glaçure ocre mate. Idéal pour les petits-déjeuners généreux.',
   'Grès chamotté, tournage puis tournassage. Émail ocre satiné, cuisson oxydation.',
   3400, (select id from c where slug='demo-bols'), 6, 2,
   'H 8 cm · Ø 16 cm', 520, 'Grès chamotté', 'Ocre', 'available', true, true,
   'Bol Sillon ocre — Atelier Terre',
   'Bol en grès chamotté, émail ocre mat. Fait main.'),

  ('Tasse Écorce',     'demo-tasse-ecorce',
   'Tasse à la surface texturée comme une écorce, anse pleine et confortable. Terre brune non émaillée à l''extérieur.',
   'Grès noir texturé à l''éponge, intérieur émaillé transparent, extérieur brut ciré.',
   2600, (select id from c where slug='demo-tasses'), 8, 4,
   'H 9 cm · Ø 8 cm · 25 cl', 320, 'Grès noir', 'Brun terre', 'available', true, false,
   null, null),

  ('Assiette Halo',    'demo-assiette-halo',
   'Assiette de présentation aux cercles concentriques révélés par l''émail céladon qui s''accumule dans les creux.',
   'Grès blanc, tournassage marqué, double couche d''émail céladon.',
   4200, (select id from c where slug='demo-assiettes'), 4, 4,
   'Ø 24 cm', 680, 'Grès blanc', 'Céladon', 'available', true, false,
   null, null),

  ('Coupelle Galet',   'demo-coupelle-galet',
   'Petite coupelle vide-poche à la forme organique, comme un galet ouvert. Émail ocre nuancé.',
   'Façonnée à la main (sans tour), pincée puis lissée. Émail ocre.',
   1900, (select id from c where slug='demo-coupelles'), 10, 6,
   'H 4 cm · Ø 11 cm', 210, 'Grès', 'Ocre nuancé', 'available', true, false,
   null, null),

  ('Sculpture Menhir', 'demo-sculpture-menhir',
   'Pièce unique. Sculpture verticale inspirée des menhirs, émail vert profond. Signée et datée sous la base.',
   'Montée au colombin, creuse. Cuisson unique, émail vert appliqué au pinceau.',
   16500, (select id from c where slug='demo-deco'), 1, 1,
   'H 34 cm · Ø 12 cm', 1900, 'Grès', 'Vert profond', 'available', true, true,
   'Sculpture Menhir — pièce unique — Atelier Terre',
   'Sculpture céramique unique, grès émaillé vert. 34 cm, signée.'),

  ('Vase Argile',      'demo-vase-argile',
   'Pièce unique déjà partie vivre ailleurs. Présentée pour l''exemple d''un article vendu.',
   'Grès roux, terre laissée brute, simple cire de finition.',
   12000, (select id from c where slug='demo-vases'), 0, 1,
   'H 30 cm · Ø 16 cm', 1600, 'Grès roux', 'Terre brute', 'sold', true, false,
   null, null)
on conflict (slug) do nothing;

-- ── Images produit (placeholders SVG on-brand, à remplacer par vos photos)
insert into public.product_images (product_id, url, alt, position)
select p.id, i.url, i.alt, i.position from public.products p
join (values
  ('demo-vase-onde',        '/demo/vase.svg',     'Vase Onde en grès céladon, vue de face', 0),
  ('demo-vase-onde',        '/demo/objet.svg',    'Vase Onde, vue de détail', 1),
  ('demo-bol-sillon',       '/demo/bol.svg',      'Bol Sillon ocre vu de trois quarts', 0),
  ('demo-bol-sillon',       '/demo/coupelle.svg', 'Bol Sillon, détail des sillons', 1),
  ('demo-tasse-ecorce',     '/demo/tasse.svg',    'Tasse Écorce en grès noir', 0),
  ('demo-assiette-halo',    '/demo/assiette.svg', 'Assiette Halo céladon vue de dessus', 0),
  ('demo-coupelle-galet',   '/demo/coupelle.svg', 'Coupelle Galet ocre', 0),
  ('demo-sculpture-menhir', '/demo/objet.svg',    'Sculpture Menhir verte', 0),
  ('demo-vase-argile',      '/demo/vase.svg',     'Vase Argile en grès roux', 0)
) as i(slug, url, alt, position) on p.slug = i.slug
on conflict do nothing;

-- ── Contenu éditable du site (homepage, à propos, livraison, contact) ────
insert into public.site_settings (key, value) values
  ('home', '{
     "hero_eyebrow": "Céramique faite main",
     "hero_title": "La terre, tournée à la main",
     "hero_text": "Des pièces façonnées une à une dans notre atelier, entre le geste du tour et la patience du feu.",
     "story_title": "L''atelier",
     "story_text": "Chaque poterie naît d''une motte de grès et de quelques minutes sur le tour. Nous cherchons des formes simples, des émaux vivants, des objets qui vieillissent bien."
   }'::jsonb),
  ('about', '{
     "title": "À propos",
     "intro": "Un petit atelier de céramique où chaque pièce est pensée, tournée et émaillée à la main.",
     "story": "Tout a commencé par un tour installé dans un coin de garage. Aujourd''hui l''atelier produit de petites séries et des pièces uniques, toujours en grès, toujours cuites ici.",
     "process": "Tournage, séchage lent, première cuisson (biscuit), émaillage, cuisson haute température. Trois à quatre semaines séparent la motte de terre de l''objet fini."
   }'::jsonb),
  ('shipping', '{
     "free_threshold_cents": 12000,
     "flat_rate_cents": 700,
     "delay": "Expédition sous 3 à 5 jours ouvrés, emballage renforcé.",
     "zones": "France métropolitaine et Union européenne."
   }'::jsonb),
  ('contact', '{
     "email": "bonjour@atelier-terre.example",
     "instagram": "https://instagram.com/",
     "address": "Atelier Terre — sur rendez-vous"
   }'::jsonb),
  ('legal', '{
     "terms": "Conditions générales de vente — à personnaliser.",
     "privacy": "Politique de confidentialité — à personnaliser.",
     "returns": "Retour possible sous 14 jours pour les pièces non personnalisées.",
     "mentions": "Mentions légales — à personnaliser."
   }'::jsonb)
on conflict (key) do nothing;
