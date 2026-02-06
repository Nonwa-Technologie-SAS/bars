# Guide de Configuration du Projet

## 📦 Installation des Dépendances

```bash
pnpm install
```

## 🗄️ Configuration de la Base de Données

1. **Créer un fichier `.env` à la racine** avec :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bars_db?schema=public"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **Générer le client Prisma** :
```bash
pnpm db:generate
```

3. **Appliquer le schéma à la base de données** :
```bash
pnpm db:push
```

Ou créer une migration :
```bash
pnpm db:migrate
```

## 🚀 Démarrage

```bash
pnpm dev
```

Puis ouvrir : `http://localhost:3000/demo-club/dashboard`

## 📁 Structure Créée

### Domain Layer (`/src/core`)
- ✅ **Entities** : Tenant, User, Product, Table, Order, OrderItem
- ✅ **Repositories** : Interfaces (IOrderRepository, IProductRepository, etc.)
- ✅ **Use Cases** : CreateOrder, GetProducts, GetOrders, UpdateOrderStatus

### Infrastructure Layer (`/src/infrastructure`)
- ✅ **Database** : PrismaClient (à décommenter après installation)
- ⏳ **Payment** : À implémenter (Stripe/Mobile Money)
- ⏳ **Realtime** : À implémenter (Socket.io/Pusher)

### Presentation Layer (`/src/app`)
- ✅ **Routes** : `/[tenantId]/dashboard`
- ✅ **API Routes** : 
  - `/api/[tenantId]/products`
  - `/api/[tenantId]/orders`
  - `/api/[tenantId]/orders/[orderId]/status`

### Components (`/src/components`)
- ✅ **Dashboard** : Sidebar, TaskCard, TaskList, ProgressBar, MobileNav
- ✅ **UI** : Button (shadcn/ui)

## 🎨 Design

Le dashboard est entièrement responsive avec :
- Sidebar qui se transforme en menu mobile sur petits écrans
- Cartes avec gradients modernes (rose, violet, bleu, vert)
- Interface optimisée pour PWA

## ⚠️ Notes Importantes

1. **Prisma Client** : Le fichier `PrismaClient.ts` est temporairement commenté. Décommenter après avoir installé Prisma et généré le client.

2. **Repositories** : Les routes API utilisent des données mockées. Implémenter les repositories Prisma dans `/infrastructure/database/repositories/` pour connecter aux vraies données.

3. **Multi-tenancy** : Le middleware valide automatiquement le `tenantId` dans les routes API. Toutes les requêtes doivent filtrer par tenant.

4. **PWA** : Le manifest.json est configuré. Ajouter les icônes `/public/icon-192.png` et `/public/icon-512.png` pour compléter la PWA.

## 🔜 Prochaines Étapes

1. Installer Prisma et générer le client
2. Implémenter les repositories Prisma
3. Ajouter l'authentification JWT
4. Intégrer Stripe pour les paiements
5. Configurer WebSockets pour les notifications temps réel
6. Ajouter Redis pour le cache
7. Créer les tests unitaires et E2E
