# Tests - OverBound

Ce document explique comment utiliser et écrire des tests pour le projet OverBound.

## Stack de test

- **Vitest** - Framework de test rapide et moderne
- **@testing-library/react** - Pour tester les composants React
- **happy-dom** - Environnement DOM léger pour les tests

## Commandes

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch (redémarre à chaque modification)
npm test -- --watch

# Lancer les tests avec UI interactive
npm run test:ui

# Générer un rapport de couverture
npm run test:coverage
```

## Tests actuels

### 1. Calculs de paiement (25 tests)
**Fichier:** `src/app/api/stripe/create-payment-intent/utils.test.ts`

Tests pour la logique critique de calcul des prix et paiements :
- `getCurrentTicketPriceFromRow()` - Calcul du prix actuel avec tiers
- `getTicketSubtotal()` - Sous-total des billets
- `getUpsellSubtotal()` - Sous-total des options
- `calcPromo()` - Application des codes promo (validation dates, limites d'usage)

**Scénarios couverts :**
- Réductions en pourcentage et montant fixe
- Validation des dates de validité
- Limites d'utilisation des codes promo
- Calculs avec plusieurs billets/options
- Cas limites (prix à zéro, réductions > 100%, etc.)

### 2. Paliers de prix (31 tests)
**Fichier:** `src/types/EventPriceTier.test.ts`

Tests pour la logique des paliers de tarification dynamique :
- `getCurrentPriceTier()` - Détection du palier actif
- `getNextPriceTier()` - Prochain changement de prix
- `isPriceTierActive()` - Validation de l'activité d'un palier
- `calculateCurrentPrice()` - Calcul du prix avec réduction
- `sortPriceTiersByDate()` - Tri chronologique

**Scénarios couverts :**
- Paliers avec dates nulles (toujours actifs)
- Chevauchements de paliers
- Transitions de prix
- Calculs de réductions (0%, 20%, 50%, 100%)

### 3. Utilitaires de tarification (34 tests)
**Fichier:** `src/lib/pricing.test.ts`

Tests pour les fonctions d'affichage et validation des prix :
- `formatPrice()` - Formatage EUR/USD/GBP
- `getStartingPrice()` - Prix le plus bas (early bird)
- `validatePriceTiers()` - Validation des paliers (chevauchements, dates invalides)
- `isPriceChangeImminent()` - Détection d'augmentation imminente
- `getNextPriceChange()` - Prochaine modification de prix

**Scénarios couverts :**
- Formatage multi-devises
- Validation de cohérence des dates
- Détection de chevauchements
- Seuils d'urgence personnalisables

## Total : 90 tests ✅

## CI/CD

Les tests sont lancés automatiquement sur chaque PR via GitHub Actions :

- ✅ Tests unitaires (Vitest)
- ✅ Type checking (TypeScript)
- ✅ Linting (ESLint)
- ✅ Build Next.js

Le workflow se trouve dans `.github/workflows/ci.yml`

## Écrire de nouveaux tests

### Structure d'un test

```typescript
import { describe, it, expect } from 'vitest'

describe('Ma fonctionnalité', () => {
  it('should faire quelque chose', () => {
    const result = maFonction(input)
    expect(result).toBe(expectedValue)
  })
})
```

### Bonnes pratiques

1. **Tester les cas limites** : valeurs nulles, zéro, nombres négatifs
2. **Un test = un scénario** : tests courts et focalisés
3. **Noms descriptifs** : `should apply 20% discount when tier is active`
4. **Isoler les tests** : pas de dépendances entre tests
5. **Utiliser des helpers** : créer des fonctions pour générer des données de test

### Exemple de helper

```typescript
const createTier = (
  id: string,
  availableFrom: Date | null,
  availableUntil: Date | null,
  discountPercentage = 0
): EventPriceTier => ({
  id,
  event_id: 'event1',
  name: `Tier ${id}`,
  discount_percentage: discountPercentage,
  available_from: availableFrom?.toISOString() || null,
  available_until: availableUntil?.toISOString() || null,
  display_order: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})
```

## Couverture de code

Pour voir quelles parties du code sont testées :

```bash
npm run test:coverage
```

Le rapport HTML sera généré dans `coverage/index.html`

## À tester ensuite

- [ ] Tests d'intégration pour les endpoints API
- [ ] Tests E2E avec Playwright (parcours utilisateur complet)
- [ ] Tests de composants React critiques (formulaires, checkout)
- [ ] Tests de validation des emails
- [ ] Tests de génération de PDF

## Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Guide Next.js Testing](https://nextjs.org/docs/testing)
