# HOC withAppLayout

Ce HOC (Higher-Order Component) enveloppe toutes les pages de l'application avec un layout commun incluant Sidebar, Header, et gestion de l'authentification.

## Utilisation

### Exemple basique

```tsx
"use client";

import { withAppLayout } from "@/components/hoc/withAppLayout";
import type { AppLayoutContext } from "@/components/hoc/withAppLayout";

function MyPage({ layout }: { layout: AppLayoutContext }) {
  const { user, tenant, tenantId } = layout;

  return (
    <div className="p-6">
      <h1>Ma Page</h1>
      <p>Bienvenue {user.name} de {tenant.name}</p>
    </div>
  );
}

export default withAppLayout(MyPage);
```

### Avec options

```tsx
"use client";

import { withAppLayout } from "@/components/hoc/withAppLayout";
import type { AppLayoutContext } from "@/components/hoc/withAppLayout";

function AdminPage({ layout }: { layout: AppLayoutContext }) {
  // Cette page nécessite le rôle ADMIN
  return <div>Page Admin</div>;
}

export default withAppLayout(AdminPage, {
  requireAuth: true,
  allowedRoles: ["ADMIN"],
  showLoading: true,
});
```

### Page publique (sans authentification)

```tsx
"use client";

import { withAppLayout } from "@/components/hoc/withAppLayout";
import type { AppLayoutContext } from "@/components/hoc/withAppLayout";

function PublicPage({ layout }: { layout: AppLayoutContext }) {
  return <div>Page publique</div>;
}

export default withAppLayout(PublicPage, {
  requireAuth: false,
});
```

## Options disponibles

- `requireAuth` (default: `true`) : Redirige vers `/auth/login` si non authentifié
- `showLoading` (default: `true`) : Affiche un skeleton pendant le chargement
- `allowedRoles` (default: `[]`) : Liste des rôles autorisés (vide = tous)

## Contexte fourni

Le HOC fournit un objet `layout` avec :
- `tenantId`: string - ID du tenant actuel
- `user`: User - Données de l'utilisateur connecté
- `tenant`: Tenant - Données du tenant
- `isLoading`: boolean - État de chargement
- `error`: string | null - Message d'erreur éventuel
