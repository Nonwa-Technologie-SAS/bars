# Bars - Système de Prise de Commande pour Boîtes de Nuit

PWA Next.js 16+ pour digitaliser la prise de commande en boîte de nuit avec architecture multi-tenant (SaaS) et Clean Architecture.

## 🚀 Stack Technique

- **Frontend/Backend** : Next.js 16+ (App Router) avec SSR/ISR
- **Base de données** : PostgreSQL avec Prisma ORM
- **Cache** : Redis (à venir)
- **Paiement** : Stripe / Mobile Money (à venir)
- **Temps réel** : Socket.io ou Pusher (à venir)
- **UI** : Tailwind CSS v4 + shadcn/ui
- **Validation** : Zod

## 📁 Architecture

Le projet suit une architecture Clean Code (Hexagonale) :

```
/src
  /app                 # Presentation Layer (Next.js routes)
    /[tenantId]        # Multi-tenant routing
    /api               # API endpoints
  /core                # Domain Layer (logique métier pure)
    /entities          # Order, Product, Tenant, Table
    /use-cases         # CreateOrder, UpdateStock, etc.
    /repositories      # Interfaces (IOrderRepository)
  /infrastructure      # Infrastructure Layer
    /database          # Prisma
    /payment           # Stripe/Mobile Money adapters (à venir)
    /realtime          # WebSocket handlers (à venir)
  /shared              # Utils, types
```

## 🛠️ Installation

1. **Installer les dépendances** :

```bash
pnpm install
```

2. **Configurer la base de données** :

```bash
# Créer un fichier .env à la racine
DATABASE_URL="postgresql://user:password@localhost:5432/bars_db?schema=public"
```

3. **Générer le client Prisma** :

```bash
pnpm db:generate
```

4. **Appliquer le schéma à la base de données** :

```bash
pnpm db:push
# ou pour créer une migration
pnpm db:migrate
```

5. **Démarrer le serveur de développement** :

```bash
pnpm dev
```

6. **Ouvrir le dashboard** :

```
http://localhost:3000/demo-club/dashboard
```

## 📋 Fonctionnalités

### ✅ Implémentées

- ✅ Architecture Clean Code complète
- ✅ Entités du domaine (Tenant, User, Product, Table, Order, OrderItem)
- ✅ Use Cases de base (CreateOrder, GetProducts, GetOrders, UpdateOrderStatus)
- ✅ Routes API avec multi-tenancy
- ✅ Dashboard moderne et responsive
- ✅ Configuration PWA (manifest.json)
- ✅ Schéma Prisma complet

### 🚧 À venir

- [ ] Implémentation des repositories Prisma
- [ ] Authentification JWT
- [ ] Intégration Stripe
- [ ] WebSockets pour notifications temps réel
- [ ] Cache Redis
- [ ] Tests unitaires et E2E

## 🎨 Design

Le dashboard est inspiré d'un design moderne avec :

- Sidebar de navigation
- Cartes avec gradients colorés
- Liste de tâches organisée
- Interface responsive pour PWA

## 🔐 Multi-tenancy

**RÈGLE CRITIQUE** : Toutes les requêtes doivent filtrer par `tenantId`. Le middleware valide automatiquement le tenant dans les routes API.

## 📝 Scripts Disponibles

- `pnpm dev` - Démarrer le serveur de développement
- `pnpm build` - Build de production
- `pnpm start` - Démarrer le serveur de production
- `pnpm db:generate` - Générer le client Prisma
- `pnpm db:push` - Appliquer le schéma à la DB
- `pnpm db:migrate` - Créer une migration
- `pnpm db:studio` - Ouvrir Prisma Studio

## 📚 Documentation

Voir `.cursor/rules/RULE.md` pour la documentation complète de l'architecture.

## 🚀 Déploiement

Le projet est prêt pour le déploiement avec Docker. Voir la documentation dans `.cursor/rules/RULE.md` pour la configuration Docker Compose.
