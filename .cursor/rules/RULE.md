# Architecture SaaS - Système de Prise de Commande pour Boîtes de Nuit

## Contexte du Projet

**Objectif** : Digitaliser la prise de commande en boîte de nuit via une PWA (Progressive Web App) pour fluidifier le service dans un environnement bruyant et difficile d'accès au bar.

**Stack Technique** :

- **Frontend/Backend** : Next.js 16+ (App Router) avec SSR/ISR pour le SEO et la performance
- **Base de données** : PostgreSQL
- **Cache** : Redis
- **Paiement** : Stripe / Mobile Money
- **Temps réel** : Socket.io ou Pusher
- **Infrastructure** : Docker + Docker Compose sur VPS Ubuntu, prêt pour migration Kubernetes/AWS

---

## Architecture Clean Code (Hexagonale)

### Structure des dossiers (Next.js App Router)

```
/src
  /app                 # Presentation Layer - Next.js
    /[tenantId]        # Gestion dynamique des clubs (ex: /club-miami/menu)
      /menu
      /admin
    /api               # Endpoints REST/GraphQL
  /core                # Domain Layer - Le Cœur pur
    /entities          # Objets métier (Order, Product, Stock)
    /use-cases         # Logique (CreateOrder, UpdateStock, ValidatePayment)
    /repositories      # Interfaces (IOrderRepository) - Contrats
  /infrastructure      # Infrastructure Layer - Implémentation
    /database          # Prisma ou TypeORM + PostgreSQL
    /payment           # Adapters Stripe / Mobile Money
    /realtime          # Socket.io ou Pusher (pour notifier le barman)
  /shared              # Utils, Types partagés
```

### Principes Architecturaux

1. **Multi-tenant (SaaS)** : Tout repose sur le `tenantId` (l'identifiant du club). Chaque requête base de données doit filtrer par `WHERE club_id = X`.

2. **Indépendance** : Si demain vous changez de base de données ou de système de paiement, vous ne touchez que le dossier `/infrastructure`, pas le cœur du métier.

3. **Séparation des responsabilités** :
   - **Domain Layer** (`/core`) : Logique métier pure, sans dépendances externes
   - **Infrastructure Layer** (`/infrastructure`) : Implémentations concrètes (DB, APIs externes)
   - **Presentation Layer** (`/app`) : Interface utilisateur et API routes

---

## Modèle de Données (Diagramme de Classe)

### Entités Principales

```
Tenant (Club)
├── id: UUID
├── name: String
├── slug: String (ex: "club-le-miami")
├── logoUrl: String
└── settings: JSON

User (Utilisateur)
├── id: UUID
├── role: Enum (ADMIN, BARTENDER, WAITER)
├── email: String
└── tenantId: UUID (FK -> Tenant)

Product (Produit)
├── id: UUID
├── name: String
├── price: Float
├── stockQuantity: Int
├── isAvailable: Boolean
└── tenantId: UUID (FK -> Tenant)

Table (Table)
├── id: UUID
├── label: String (ex: "Table 12")
├── qrCodeUrl: String
└── tenantId: UUID (FK -> Tenant)

Order (Commande)
├── id: UUID
├── status: Enum (PENDING_PAYMENT, PAID, PREPARING, READY, DELIVERED)
├── totalAmount: Float
├── createdAt: Timestamp
├── tableId: UUID (FK -> Table)
└── tenantId: UUID (FK -> Tenant)

OrderItem (Article de Commande)
├── id: UUID
├── quantity: Int
├── unitPrice: Float
├── orderId: UUID (FK -> Order)
└── productId: UUID (FK -> Product)
```

### Relations

- Tenant "1" -- "\*" User : employs
- Tenant "1" -- "\*" Product : offers
- Tenant "1" -- "\*" Table : owns
- Tenant "1" -- "\*" Order : manages
- Table "1" -- "\*" Order : initiates
- Order "1" -- "\*" OrderItem : contains
- Product "1" -- "\*" OrderItem : describes

**⚠️ RÈGLE CRITIQUE** : La relation Tenant est partout. C'est la clé de voûte du SaaS. Une requête ne doit jamais oublier de filtrer par Tenant.

---

## Workflow de Traitement des Données

### 1. Le Scan (Entrée)

**URL générée** : `https://app.mon-saas.com/club-le-miami?table=12`

**Processus** :

- Le client scanne le QR Code
- Le système identifie le **Tenant** (`club-le-miami`) et la **Table** (`12`)
- Redirection vers la page menu avec contexte tenant + table

### 2. Affichage & Vérification (Lecture)

**Frontend** : Demande le menu à l'API

**Backend** :

```sql
SELECT * FROM products
WHERE tenant_id = 'miami'
AND stock > 0
AND is_available = true
```

**Résultat** : Le client voit uniquement les produits disponibles

### 3. La Commande (Écriture - Transaction Critique)

**Backend (Début Transaction)** :

1. **Vérifier à nouveau le stock** (pour éviter les commandes simultanées sur la dernière bouteille)
2. **Réserver le stock** (décrémentation temporaire ou "hold")
3. **Créer l'objet Order** avec statut `PENDING_PAYMENT`

**Paiement (Externe)** :

- Redirection vers Stripe ou Mobile Money
- Webhook de confirmation reçu par le serveur

### 4. Notification Temps Réel (WebSockets)

**Si paiement OK** :

- Statut Order → `PAID`
- Le serveur envoie un événement WebSocket au canal `club-miami-bar`
- La tablette du barman sonne et affiche la commande : "Table 12 : 2 Vodkas, 1 Coca"

### 5. Service & Clôture

1. Le barman prépare, clique sur "Prêt" → Statut `READY`
2. Le serveur notifie le client "Votre commande arrive"
3. Le serveur (serveuse) livre et scanne/valide la commande → Statut `DELIVERED`

---

## Infrastructure DevOps (VPS Ubuntu)

### Stack Technique

- **OS** : Ubuntu LTS (22.04 ou 24.04)
- **Containerisation** : Docker + Docker Compose
- **Proxy Inverse** : Nginx (ou Traefik pour SSL automatique)
- **Base de données** : PostgreSQL 15+
- **Cache** : Redis (sessions et rapidité des menus)

### Structure docker-compose.yml (Production)

```yaml
version: '3.8'
services:
  app:
    image: ghcr.io/votre-repo/nightclub-saas:latest
    restart: always
    env_file: .env.prod
    ports:
      - '3000:3000'
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: saas_db
      POSTGRES_PASSWORD: ${DB_PASS}

  redis:
    image: redis:alpine

  nginx:
    image: nginx:stable-alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - app
```

**Évolution future** : Quand vous aurez 50 clubs, séparer la DB sur un serveur géré (ex: AWS RDS) et l'application sur un cluster Kubernetes.

---

## Règles de Développement à Respecter

### 1. Multi-tenancy

- **TOUJOURS** filtrer par `tenantId` dans les requêtes DB
- **JAMAIS** exposer des données d'un tenant à un autre
- Utiliser des middlewares pour valider le `tenantId` dans les routes API

### 2. Transactions et Concurrence

- Utiliser des transactions DB pour les opérations critiques (création de commande, mise à jour de stock)
- Implémenter un système de "hold" ou de verrouillage pour éviter les doubles commandes
- Vérifier le stock **avant** et **pendant** la création de la commande

### 3. Sécurité

- Valider toutes les entrées utilisateur
- Utiliser des tokens JWT pour l'authentification
- Implémenter des rôles et permissions (ADMIN, BARTENDER, WAITER)
- Chiffrer les données sensibles (paiements, informations clients)

### 4. Performance

- Utiliser Redis pour le cache des menus (évite les requêtes DB répétées)
- Implémenter de la pagination pour les listes
- Optimiser les requêtes SQL (index sur `tenant_id`, `table_id`, `status`)
- Utiliser Next.js ISR pour les pages publiques (menus)

### 5. Temps Réel

- Utiliser WebSockets (Socket.io ou Pusher) pour les notifications barman
- Implémenter un système de reconnexion automatique
- Gérer les déconnexions gracieusement

### 6. Tests

- Tests unitaires pour la logique métier (`/core`)
- Tests d'intégration pour les API routes
- Tests E2E pour les workflows critiques (scan → commande → paiement → livraison)

---

## Conventions de Code

### Nommage

- **Entités** : PascalCase (`Order`, `Product`, `Tenant`)
- **Use Cases** : PascalCase avec verbe (`CreateOrder`, `UpdateStock`)
- **Repositories** : Interface avec préfixe `I` (`IOrderRepository`)
- **Routes API** : kebab-case (`/api/orders/create-order`)

### Structure des Use Cases

```typescript
// /core/use-cases/CreateOrder.ts
export class CreateOrder {
  constructor(
    private orderRepository: IOrderRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(
    tenantId: string,
    tableId: string,
    items: OrderItem[]
  ): Promise<Order> {
    // 1. Valider le stock
    // 2. Réserver le stock
    // 3. Créer la commande
    // 4. Retourner la commande
  }
}
```

### Structure des API Routes

```typescript
// /app/api/[tenantId]/orders/route.ts
export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } }
) {
  // 1. Valider le tenantId
  // 2. Parser le body
  // 3. Appeler le use case
  // 4. Retourner la réponse
}
```

---

## Évolutivité

### Phase 1 (MVP)

- Un seul tenant (un club)
- Paiement Stripe uniquement
- Notifications simples (WebSockets basiques)

### Phase 2 (SaaS Multi-tenant)

- Gestion de plusieurs clubs
- Dashboard d'administration par tenant
- Analytics par club

### Phase 3 (Scale)

- Migration vers Kubernetes
- Base de données gérée (AWS RDS)
- CDN pour les assets statiques
- Monitoring (Sentry, DataDog)

---

## Notes Importantes

- **Next.js** : Utiliser l'App Router, pas le Pages Router
- **TypeScript** : Strict mode activé, types explicites
- **Prisma** : ORM recommandé pour PostgreSQL
- **Zod** : Validation des schémas (API routes, formulaires)
- **Tailwind CSS + shadcn/ui** : UI components (déjà configuré dans le projet)
