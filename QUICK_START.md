# 🚀 Démarrage Rapide

## Prérequis

1. **Docker Desktop** doit être **démarré** (icône Docker dans la barre des tâches)
2. **Node.js** et **pnpm** installés

## Étapes de Configuration

### 1. Démarrer Docker Desktop

Assurez-vous que Docker Desktop est en cours d'exécution. Vous devriez voir l'icône Docker dans votre barre des tâches Windows.

### 2. Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet avec ce contenu :

```env
DATABASE_URL="postgresql://bars_user:bars_password@localhost:5432/bars_db?schema=public"
NEXT_PUBLIC_APP_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### 3. Démarrer PostgreSQL et Redis

```bash
pnpm docker:up
```

Cette commande démarre :

- PostgreSQL sur le port 5432
- Redis sur le port 6379

### 4. Générer le client Prisma et appliquer le schéma

```bash
# Option 1 : Tout en une commande
pnpm setup

# Option 2 : Étape par étape
pnpm db:generate
pnpm db:push
```

### 5. Démarrer l'application

```bash
pnpm dev
```

Puis ouvrez : `http://localhost:3000/demo-club/dashboard`

---

## Commandes Utiles

```bash
# Démarrer les services Docker
pnpm docker:up

# Arrêter les services Docker
pnpm docker:down

# Voir les logs
pnpm docker:logs

# Configuration complète (Docker + Prisma)
pnpm setup

# Ouvrir Prisma Studio (interface graphique de la DB)
pnpm db:studio
```

---

## Dépannage

### Erreur : "Docker Desktop is not running"

1. Ouvrez **Docker Desktop** depuis le menu Démarrer
2. Attendez que Docker soit complètement démarré (icône dans la barre des tâches)
3. Réessayez `pnpm docker:up`

### Erreur : "Can't reach database server"

1. Vérifiez que les conteneurs sont démarrés :

   ```bash
   docker ps
   ```

   Vous devriez voir `bars-postgres` et `bars-redis`

2. Si les conteneurs ne sont pas là, redémarrez-les :
   ```bash
   pnpm docker:down
   pnpm docker:up
   ```

### Vérifier que PostgreSQL fonctionne

```bash
docker exec -it bars-postgres psql -U bars_user -d bars_db -c "SELECT 1;"
```

Si cette commande retourne `1`, PostgreSQL fonctionne correctement !

---

## Prochaines Étapes

Une fois la base de données configurée :

1. ✅ Le schéma Prisma est appliqué
2. ⏳ Implémenter les repositories Prisma dans `/infrastructure/database/repositories/`
3. ⏳ Connecter les use cases aux vraies données
4. ⏳ Ajouter l'authentification
5. ⏳ Intégrer Stripe pour les paiements
