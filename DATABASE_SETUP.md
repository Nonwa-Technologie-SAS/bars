# 🗄️ Configuration de la Base de Données

## Option 1 : Docker (Recommandé - Plus Simple)

### Étape 1 : Démarrer PostgreSQL et Redis avec Docker

```bash
# Démarrer les conteneurs
pnpm docker:up

# Ou manuellement
docker-compose up -d
```

Cela démarre :

- PostgreSQL sur le port `5432`
- Redis sur le port `6379`

### Étape 2 : Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet avec :

```env
DATABASE_URL="postgresql://bars_user:bars_password@localhost:5432/bars_db?schema=public"
NEXT_PUBLIC_APP_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### Étape 3 : Générer le client Prisma et appliquer le schéma

```bash
# Générer le client Prisma
pnpm db:generate

# Appliquer le schéma à la base de données
pnpm db:push
```

Ou en une seule commande :

```bash
pnpm setup
```

### Vérifier que tout fonctionne

```bash
# Voir les logs des conteneurs
pnpm docker:logs

# Ouvrir Prisma Studio pour voir les données
pnpm db:studio
```

---

## Option 2 : PostgreSQL Local

Si vous avez PostgreSQL installé localement :

### Étape 1 : Créer la base de données

```sql
CREATE DATABASE bars_db;
CREATE USER bars_user WITH PASSWORD 'bars_password';
GRANT ALL PRIVILEGES ON DATABASE bars_db TO bars_user;
```

### Étape 2 : Configurer `.env`

```env
DATABASE_URL="postgresql://bars_user:bars_password@localhost:5432/bars_db?schema=public"
```

### Étape 3 : Appliquer le schéma

```bash
pnpm db:generate
pnpm db:push
```

---

## Commandes Utiles

```bash
# Démarrer les conteneurs Docker
pnpm docker:up

# Arrêter les conteneurs
pnpm docker:down

# Voir les logs
pnpm docker:logs

# Générer le client Prisma
pnpm db:generate

# Appliquer le schéma (sans migration)
pnpm db:push

# Créer une migration
pnpm db:migrate

# Ouvrir Prisma Studio (interface graphique)
pnpm db:studio
```

---

## Dépannage

### Erreur : "Can't reach database server"

1. **Vérifier que Docker est en cours d'exécution** :

   ```bash
   docker ps
   ```

2. **Vérifier que les conteneurs sont démarrés** :

   ```bash
   docker-compose ps
   ```

3. **Redémarrer les conteneurs** :
   ```bash
   pnpm docker:down
   pnpm docker:up
   ```

### Erreur : "Database already exists"

Si la base existe déjà, vous pouvez soit :

- La supprimer et recréer
- Utiliser `pnpm db:migrate` au lieu de `pnpm db:push`

### Vérifier la connexion

```bash
# Tester la connexion PostgreSQL
docker exec -it bars-postgres psql -U bars_user -d bars_db -c "SELECT version();"
```

---

## Structure de la Base de Données

Une fois le schéma appliqué, vous aurez les tables suivantes :

- `Tenant` - Les clubs/boîtes de nuit
- `User` - Les utilisateurs (ADMIN, BARTENDER, WAITER)
- `Product` - Les produits (boissons, etc.)
- `Table` - Les tables avec QR codes
- `Order` - Les commandes
- `OrderItem` - Les articles de commande

Toutes les tables ont des index optimisés pour le multi-tenancy (`tenantId`).
