# Guide de Migration vers withAppLayout

Ce guide explique comment migrer vos pages existantes du HOC `withTenant` vers le nouveau HOC `withAppLayout`.

## Avantages du nouveau HOC

✅ **Layout unifié** : Sidebar + Header inclus automatiquement  
✅ **Gestion d'authentification** : Redirection automatique si non authentifié  
✅ **Gestion des rôles** : Contrôle d'accès par rôle  
✅ **États de chargement** : Skeleton automatique pendant le chargement  
✅ **Gestion d'erreurs** : Affichage automatique des erreurs  
✅ **Données centralisées** : Accès direct à user/tenant via le store Zustand  

## Exemple de Migration

### Avant (avec withTenant)

```tsx
"use client";

import { withTenant } from "@/components/hoc/withTenant";
import type { TenantContext } from "@/components/hoc/withTenant";
import { Header } from "@/components/dashboard/Header";

function DashboardPage({ tenant }: { tenant: TenantContext }) {
  const { tenantId } = tenant;
  // ... logique de la page
  
  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        <h1>Dashboard</h1>
      </div>
    </>
  );
}

export default withTenant(DashboardPage);
```

### Après (avec withAppLayout)

```tsx
"use client";

import { withAppLayout } from "@/components/hoc/withAppLayout";
import type { AppLayoutContext } from "@/components/hoc/withAppLayout";

function DashboardPage({ layout }: { layout: AppLayoutContext }) {
  const { user, tenant, tenantId } = layout;
  // ... logique de la page
  
  // Plus besoin d'importer Header, il est déjà inclus !
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1>Dashboard</h1>
      <p>Bienvenue {user.name} de {tenant.name}</p>
    </div>
  );
}

export default withAppLayout(DashboardPage);
```

## Étapes de Migration

1. **Remplacer l'import**
   ```tsx
   // Avant
   import { withTenant } from "@/components/hoc/withTenant";
   import type { TenantContext } from "@/components/hoc/withTenant";
   
   // Après
   import { withAppLayout } from "@/components/hoc/withAppLayout";
   import type { AppLayoutContext } from "@/components/hoc/withAppLayout";
   ```

2. **Supprimer les imports inutiles**
   ```tsx
   // Supprimer ces imports (déjà inclus dans le layout)
   import { Header } from "@/components/dashboard/Header";
   import { Sidebar } from "@/components/dashboard/Sidebar";
   ```

3. **Changer la prop**
   ```tsx
   // Avant
   function MyPage({ tenant }: { tenant: TenantContext }) {
     const { tenantId } = tenant;
   }
   
   // Après
   function MyPage({ layout }: { layout: AppLayoutContext }) {
     const { tenantId, user, tenant } = layout;
   }
   ```

4. **Supprimer le Header du JSX**
   ```tsx
   // Avant
   return (
     <>
       <Header />
       <div>Contenu</div>
     </>
   );
   
   // Après
   return (
     <div>Contenu</div>
   );
   ```

5. **Changer l'export**
   ```tsx
   // Avant
   export default withTenant(MyPage);
   
   // Après
   export default withAppLayout(MyPage);
   ```

## Options Avancées

### Page réservée aux administrateurs

```tsx
export default withAppLayout(AdminPage, {
  requireAuth: true,
  allowedRoles: ["ADMIN"],
});
```

### Page publique (sans authentification)

```tsx
export default withAppLayout(PublicPage, {
  requireAuth: false,
});
```

### Page sans skeleton de chargement

```tsx
export default withAppLayout(MyPage, {
  showLoading: false,
});
```

## Notes Importantes

⚠️ **Le Header est déjà inclus** : Ne pas l'importer ni l'ajouter dans le JSX  
⚠️ **Le Sidebar est déjà inclus** : Ne pas l'importer ni l'ajouter dans le JSX  
⚠️ **Le layout est fourni** : Utiliser `layout.user` et `layout.tenant` au lieu de fetch manuel  
⚠️ **Les classes Tailwind** : Continuer à utiliser les classes Tailwind normalement  
