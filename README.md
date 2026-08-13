# Atelier Terre — boutique de poteries artisanales

Boutique e-commerce complète : **React + Vite + TypeScript + Tailwind + Supabase + Stripe**, hébergée sur **Netlify**.

Vitrine, fiches produit, panier persistant, tunnel de commande, paiement Stripe, mise à jour automatique des stocks, et une administration protégée (produits, commandes, tableau de bord).

> **Aucun logiciel à installer sur votre ordinateur.** Tout se fait depuis le navigateur, via quatre services en ligne. **Netlify se charge de compiler le site pour vous, dans le cloud** — vous n'avez jamais à toucher à Node.js, npm, ou une ligne de commande. Comptez ~30–45 min la première fois.

---

## 0. Ce dont vous avez besoin

Quatre comptes gratuits — rien d'autre :

- **GitHub** ([github.com](https://github.com)) — pour héberger le code
- **Supabase** ([supabase.com](https://supabase.com)) — base de données, comptes admin, stockage des photos
- **Stripe** ([stripe.com](https://stripe.com)) — paiements
- **Netlify** ([netlify.com](https://netlify.com)) — met le site en ligne et le **compile automatiquement** à chaque mise à jour

Vous n'installez rien : Netlify exécute la compilation sur ses propres serveurs.

---

## 1. Mettre le code sur GitHub

1. Décompressez le fichier `atelier-terre.zip` sur votre ordinateur (double‑clic).
2. Sur GitHub : bouton **New** (nouveau dépôt) → donnez-lui un nom (ex. `atelier-terre`) → **Create repository**.
3. Sur la page du dépôt vide, cliquez **« uploading an existing file »**.
4. Faites **glisser le contenu** du dossier décompressé (tous les fichiers et dossiers) dans la zone d'upload, puis **Commit changes**.

Le code est maintenant en ligne. Vous n'y toucherez plus, sauf pour de futures évolutions.

---

## 2. Supabase — base de données

1. Créez un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor → New query** : collez puis exécutez (bouton *Run*), dans cet ordre :
   - le contenu de `supabase/schema.sql` — tables, sécurité, fonctions
   - le contenu de `supabase/storage.sql` — stockage des images
   - le contenu de `supabase/seed.sql` — *(optionnel)* produits de démonstration
3. **Project Settings → API** : gardez cette page ouverte, vous y copierez trois valeurs à l'étape 4
   (`Project URL`, clé `anon public`, clé `service_role`).

### Créer votre compte administrateur

1. **Authentication → Users → Add user** : créez un utilisateur (e‑mail + mot de passe). Notez son `User UID`.
2. **SQL Editor**, exécutez (en remplaçant les valeurs) :

```sql
insert into public.admin_users (id, email, full_name)
values ('COLLEZ_LE_USER_UID', 'vous@exemple.com', 'Votre nom');
```

Vous vous connecterez ensuite sur `/admin/connexion`.

---

## 3. Stripe — clés de paiement

Tableau de bord Stripe → **Developers → API keys**. Gardez cette page ouverte : vous copierez la clé **Publishable** et la clé **Secret** à l'étape 4. Le webhook se règle à l'étape 5, une fois le site en ligne.

Carte de test Stripe : `4242 4242 4242 4242`, date future, CVC au choix.

---

## 4. Déployer sur Netlify

1. Sur [netlify.com](https://netlify.com) : **Add new site → Import an existing project → GitHub**, puis choisissez votre dépôt.
2. Netlify lit automatiquement le fichier `netlify.toml` (commande de build et compilation dans le cloud). Vous n'avez rien à configurer ici.
3. Avant de valider, ou ensuite dans **Site settings → Environment variables**, ajoutez ces variables :

   | Variable | Valeur (depuis…) |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase → Project URL |
   | `SUPABASE_URL` | la même Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase → clé `anon public` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → clé `service_role` *(secrète)* |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe → clé Publishable |
   | `STRIPE_SECRET_KEY` | Stripe → clé Secret *(secrète)* |
   | `STRIPE_WEBHOOK_SECRET` | fournie à l'étape 5 |
   | `VITE_SITE_URL` | l'URL Netlify de votre site (ex. `https://atelier-terre.netlify.app`) |

4. **Deploy**. Netlify installe les dépendances et compile le site tout seul. Au bout de quelques minutes, votre boutique est en ligne.

---

## 5. Webhook Stripe (une fois le site en ligne)

Indispensable pour valider les paiements et décrémenter le stock.

1. Stripe → **Developers → Webhooks → Add endpoint**.
2. URL : `https://VOTRE-SITE.netlify.app/.netlify/functions/stripe-webhook`
3. Événement à écouter : `checkout.session.completed`.
4. Copiez le **Signing secret** (`whsec_…`) → variable `STRIPE_WEBHOOK_SECRET` sur Netlify.
5. Netlify → **Deploys → Trigger deploy** pour reprendre en compte la variable.

Sans cette étape, le paiement aboutit chez Stripe mais la commande ne passe pas en « payé » et le stock ne bouge pas.

---

## 6. E‑mails transactionnels (à brancher plus tard)

Le webhook prévoit un emplacement pour envoyer les e‑mails (confirmation client + notification admin) : voir `netlify/functions/stripe-webhook.ts`, commentaire « Notifications e‑mail ». Branchez le fournisseur de votre choix (Resend, Postmark, SendGrid) via sa clé API en variable d'environnement. Tout le reste fonctionne sans cela.

---

## Gérer la boutique

Une fois en ligne, connectez-vous sur `https://VOTRE-SITE.netlify.app/admin/connexion` :

- **Produits** — créer, modifier, dupliquer, supprimer, publier, mettre en avant, gérer les photos (upload, réordonner, image principale) et le stock.
- **Commandes** — détail et changement de statut (nouvelle → en préparation → expédiée → livrée / annulée).
- **Tableau de bord** — chiffre d'affaires, commandes, panier moyen, meilleures ventes, avec filtres de période.
- **Catégories & contenu éditable** (accueil, à propos, livraison, mentions légales) vivent dans les tables `categories` et `site_settings` de Supabase ; modifiables directement dans l'éditeur Supabase.

---

## Architecture

```
src/
  components/      layout (header, footer), ui (RingMark, badges), product (carte)
  context/         CartContext (panier persistant), AuthContext (admin)
  lib/             supabase, types, queries (accès données), format, seo
  pages/           Home, Boutique, ProductPage, CartPage, Checkout, Confirmation,
                   About, Contact, LegalPage, NotFound
  pages/admin/     Login, AdminLayout, Dashboard, ProductsAdmin, ProductEdit, OrdersAdmin
netlify/functions/ create-checkout-session, stripe-webhook, order-status
supabase/          schema.sql, storage.sql, seed.sql
```

### Choix de sécurité

- **Row Level Security** activée partout : le public ne lit que le catalogue publié ; commandes, clients et réglages ne sont accessibles qu'aux admins ou au serveur.
- **Prix & stock recalculés côté serveur** lors du paiement — le navigateur n'envoie que des identifiants et des quantités.
- **Le paiement n'est validé que par le webhook Stripe signé**, jamais par le front.
- **Aucune donnée bancaire** ne transite ni n'est stockée : tout se passe sur la page sécurisée hébergée par Stripe.
- Les **clés secrètes** ne vivent que dans les fonctions serverless, jamais dans le navigateur.

---

## Données de démonstration

`supabase/seed.sql` insère 7 pièces et 6 catégories (slugs préfixés `demo-`). Pour tout retirer, dans le SQL Editor Supabase :

```sql
delete from public.products where slug like 'demo-%';
delete from public.categories where slug like 'demo-%';
```

Les images de démo sont des placeholders dans `public/demo/`. Remplacez‑les par vos photos via l'admin (elles seront stockées dans Supabase).

---

## Annexe — développement local *(facultatif, pour développeurs)*

Cette section **n'est pas nécessaire** pour mettre la boutique en ligne. Elle ne concerne que ceux qui souhaitent modifier le code sur leur propre machine. Elle requiert alors Node.js 18+ et npm :

```bash
npm install
cp .env.example .env      # renseignez les mêmes valeurs qu'à l'étape 4
npm run dev               # http://localhost:5173
npm run build             # compilation de production
```

Pour tester les fonctions serverless et les paiements en local : `npm i -g netlify-cli` puis `netlify dev`, et le [Stripe CLI](https://stripe.com/docs/stripe-cli) pour rediriger le webhook.
