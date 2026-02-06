/**
 * EXEMPLE D'UTILISATION DU HOC withAppLayout
 * 
 * Ce fichier montre comment migrer une page existante vers le nouveau HOC.
 */

// ============================================
// AVANT (avec withTenant)
// ============================================
/*
import { withTenant } from "@/components/hoc/withTenant";
import type { TenantContext } from "@/components/hoc/withTenant";

function DashboardPage({ tenant }: { tenant: TenantContext }) {
  return <div>Dashboard</div>;
}

export default withTenant(DashboardPage);
*/

// ============================================
// APRÈS (avec withAppLayout)
// ============================================
/*
import { withAppLayout } from "@/components/hoc/withAppLayout";
import type { AppLayoutContext } from "@/components/hoc/withAppLayout";
import { Header } from "@/components/dashboard/Header"; // Plus besoin !

function DashboardPage({ layout }: { layout: AppLayoutContext }) {
  const { user, tenant, tenantId } = layout;
  
  // Le Header et Sidebar sont déjà inclus dans le layout
  // Plus besoin de les importer manuellement !
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1>Dashboard</h1>
      <p>Bienvenue {user.name} de {tenant.name}</p>
    </div>
  );
}

export default withAppLayout(DashboardPage);
*/

// ============================================
// EXEMPLE AVEC OPTIONS
// ============================================
/*
import { withAppLayout } from "@/components/hoc/withAppLayout";
import type { AppLayoutContext } from "@/components/hoc/withAppLayout";

function AdminSettingsPage({ layout }: { layout: AppLayoutContext }) {
  // Cette page nécessite le rôle ADMIN
  const { user, tenant } = layout;
  
  return (
    <div className="p-6">
      <h1>Paramètres Admin</h1>
      <p>Accès réservé aux administrateurs</p>
    </div>
  );
}

export default withAppLayout(AdminSettingsPage, {
  requireAuth: true,
  allowedRoles: ["ADMIN"], // Seuls les ADMIN peuvent accéder
  showLoading: true,
});
*/

// ============================================
// EXEMPLE PAGE PUBLIQUE
// ============================================
/*
import { withAppLayout } from "@/components/hoc/withAppLayout";
import type { AppLayoutContext } from "@/components/hoc/withAppLayout";

function PublicPage({ layout }: { layout: AppLayoutContext }) {
  // Cette page est accessible sans authentification
  // Mais layout.user et layout.tenant peuvent être null
  const { user, tenant } = layout;
  
  return (
    <div className="p-6">
      <h1>Page Publique</h1>
      {user && <p>Connecté en tant que {user.name}</p>}
    </div>
  );
}

export default withAppLayout(PublicPage, {
  requireAuth: false, // Pas besoin d'être authentifié
});
*/
