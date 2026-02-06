# User Stories - SaaS Commande QR Multi-tenant

## Vision
Digitaliser la prise de commande dans les restaurants, bars, cafétérias, glaciers, boulangeries, etc. via QRCode, avec un flux complet client → staff, multi-tenant sécurisé.

---

## Rôles
- **Client** : scanne le QRCode, consulte le menu, commande et paie.
- **Staff** (barman/serveur/caissier) : reçoit, prépare, livre.
- **Admin Tenant** : configure le menu, les tables, les équipes et suit l’activité.

---

## Stories Client

1. **Scan & Accès Menu**
   - *En tant que client*, je veux scanner un QRCode de table pour être redirigé automatiquement vers le menu du tenant afin de commander sans assistance.

2. **Menu filtré par tenant**
   - *En tant que client*, je veux voir uniquement les produits disponibles du tenant afin d’éviter les produits hors stock.

3. **Ajout au panier**
   - *En tant que client*, je veux ajouter des produits à mon panier afin de composer ma commande.

4. **Modification du panier**
   - *En tant que client*, je veux modifier la quantité ou supprimer un produit afin d’ajuster ma commande.

5. **Validation de commande**
   - *En tant que client*, je veux valider mon panier afin que ma commande soit prise en compte.

6. **Statut de commande**
   - *En tant que client*, je veux suivre l’état de ma commande (payée, en préparation, prête, livrée) afin d’être informé.

---

## Stories Staff (Opérations)

1. **Réception commande**
   - *En tant que staff*, je veux recevoir les nouvelles commandes en temps réel afin de les traiter rapidement.

2. **Mise à jour statut**
   - *En tant que staff*, je veux mettre à jour le statut d’une commande (PREPARING, READY, DELIVERED) afin de refléter l’avancement réel.

3. **Vue par table**
   - *En tant que staff*, je veux filtrer les commandes par table afin de livrer efficacement.

---

## Stories Admin Tenant

1. **Gestion du menu**
   - *En tant qu’admin*, je veux créer/éditer/désactiver des produits afin de gérer l’offre du tenant.

2. **Gestion des stocks**
   - *En tant qu’admin*, je veux mettre à jour le stock afin d’éviter les commandes impossibles.

3. **Gestion des tables**
   - *En tant qu’admin*, je veux créer les tables et générer leurs QRCodes afin d’activer la prise de commande.

4. **Gestion des équipes**
   - *En tant qu’admin*, je veux assigner des rôles (ADMIN, BARTENDER, WAITER) afin de sécuriser l’accès aux fonctions.

5. **Tableau de bord**
   - *En tant qu’admin*, je veux consulter les commandes et leur statut afin de piloter l’activité.

---

## Stories Plateforme SaaS

1. **Multi-tenancy sécurisé**
   - *En tant que plateforme*, je veux isoler les données par tenant afin d’éviter toute fuite de données.

2. **Validation des entrées**
   - *En tant que plateforme*, je veux valider toutes les entrées afin d’assurer la sécurité et l’intégrité des données.

3. **Audit & Logs**
   - *En tant que plateforme*, je veux tracer les actions critiques afin de pouvoir analyser les incidents.

---

## Critères de base (transverses)

- Toute requête DB est filtrée par `tenantId`.
- Les commandes ne doivent pas dépasser le stock disponible.
- Le workflow commande suit : `PENDING_PAYMENT → PAID → PREPARING → READY → DELIVERED`.
- Les notifications temps réel doivent informer le staff lors d’une nouvelle commande.

