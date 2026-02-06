# Gestion des stocks (SaaS multi-tenant)

Ce document décrit la fonctionnalité de gestion des stocks pour les produits d’un tenant dans l’application Bars.

## Objectifs

- Suivre les niveaux de stock par produit et par tenant.
- Identifier rapidement les produits en rupture ou en faible stock.
- Ajuster ou définir la quantité de stock.
- Consulter l’historique des mouvements de stock.

## Multi‑tenant (règle critique)

Toutes les opérations sont **toujours** filtrées par `tenantId`.  
L’interface et les API utilisent la route `/{tenantId}/...` ou `/api/{tenantId}/...`.

## UI/UX (page Stocks)

Chemin: `/{tenantId}/stocks`

Fonctionnalités visibles:

- **KPIs**: nombre de produits, stock total, produits en faible stock, ruptures.
- **Filtres**:
  - recherche texte (nom / catégorie),
  - filtre par catégorie,
  - toggle “Stock faible”.
- **Tableau des stocks**:
  - nom du produit, catégorie, prix, quantité, statut.
  - statut automatique:
    - `Rupture` si stock = 0
    - `Faible` si signalé par l’endpoint low‑stock
    - `OK` sinon
- **Actions par produit**:
  - Ajuster le stock (+/-)
  - Définir le stock (valeur totale)
  - Voir l’historique

## Endpoints utilisés

### 1) Liste produits
`GET /api/{tenantId}/products`

Retourne la liste des produits pour un tenant.

### 2) Produits en faible stock
`GET /api/{tenantId}/products/low-stock`

Retourne les produits dont le stock est sous le seuil défini côté métier.

### 3) Ajuster un stock (delta)
`POST /api/{tenantId}/products/{productId}/stock-adjust`

Payload:
```json
{
  "delta": 5,
  "type": "RESTOCK",
  "note": "Réappro hebdo"
}
```

- `delta` peut être positif ou négatif (mais non nul).
- `type` décrit le mouvement (RESTOCK, SALE, ADJUSTMENT, SPOILAGE, RETURN, INVENTORY_COUNT).

### 4) Définir un stock (valeur totale)
`POST /api/{tenantId}/products/{productId}/stock-set`

Payload:
```json
{
  "quantity": 120,
  "note": "Inventaire mensuel"
}
```

### 5) Historique des mouvements
`GET /api/{tenantId}/products/{productId}/stock-movements?limit=20`

Retourne la liste des mouvements de stock (dernier au plus récent).

## Modèle métier (StockMovement)

Chaque mouvement de stock conserve:

- `type`: type du mouvement (RESTOCK, SALE, …)
- `delta`: variation appliquée
- `previousStock` / `newStock`
- `note` (optionnel)
- `tenantId`, `productId`
- `createdAt`

## Règles de gestion

- La quantité ne doit jamais devenir négative.
- Le statut UI dépend de la quantité et du seuil faible stock.
- Toute requête est scindée par `tenantId` (aucun mélange de données entre tenants).

## Tests manuels recommandés

- Ajuster un stock avec un delta positif puis négatif.
- Définir un stock à zéro et vérifier le statut “Rupture”.
- Vérifier le filtre “Stock faible”.
- Ouvrir l’historique et vérifier l’affichage des mouvements.

