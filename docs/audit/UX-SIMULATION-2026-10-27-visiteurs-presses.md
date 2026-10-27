# Simulation de 50 visiteurs pressés : compréhension et conversion

- **Date** : 2026-10-27
- **Cible testée** : `http://localhost:3000/` (accueil) et `/events/caca` (événement template, 7 février 2027, Saint-Quentin-en-Yvelines). Local à jour avec la prod, mais le slug `caca` est un événement de test.
- **Méthode** : 50 agents Haiku, chacun avec une persona, un appareil, une source de trafic et un budget d'attention imposé.
- **Références** : [FDR-0015](../fdr/FDR-0015-homepage-evergreen-and-conversion-funnel.md), [design-system](../design/design-system.md), [rate-limiting](../security/rate-limiting.md)

> **À lire avant tout : les agents ne scrollent pas un vrai navigateur.** Ils lisent des captures texte, écran par écran, produites par Playwright. Ce rapport est un panel de lecture crédible, pas une mesure. Pour des chiffres réels, il faut les analytics (Meta, GA, profondeur de scroll).

---

## 1. Verdict en une page

1. **Aucun des 50 visiteurs ne clique un CTA.** Compréhension moyenne 3,3/10, intention de conversion 2,3/10. Les visiteurs partent en moyenne à 11 s simulées.
2. **La roue de la fortune est le blocage n°1 confirmé.** Sa campagne a `trigger_rules = {"delay_ms": 0}` : elle s'ouvre à la première frame, avec un champ email, au-dessus du bandeau cookies. Une capture d'écran réelle (375×812) montre qu'elle masque le hero, donc exactement la barre date / lieu / prix / places.
3. **Un résultat des agents est faux : « date, lieu et prix absents ».** Ma première capture ne lisait que `h1/h2/h3/p/li/a/button` et a manqué les `span`. Le hero de l'événement affiche bien `DATE 7 FÉVR. 2027 · LIEU Saint-Quentin · TARIF Dès 1,00 € · 386 PLACES`. Voir section 3.
4. **Reste vrai après correction** : sur l'accueil, le H1 n'a aucun repère concret ; date, lieu, prix et places n'arrivent qu'à l'écran 2 (« Prochaine édition »).
5. **Le titre `caca` et les prix 1 € / 2 € sont des données de test.** 49 agents sur 50 les ont cités comme « peu crédibles ». Ce n'est pas un défaut du site réel, mais cela fausse la lecture de crédibilité. À rejouer avec un événement réaliste.

---

## 2. Protocole

### Budget d'attention (imposé)

| Part | Budget | Agents |
|---|---|---|
| 40 % | 5 s | 20 |
| 34 % | 10 s | 17 |
| 18 % | 20 s | 9 |
| 8 % | 45 s | 4 |

Un écran lu vite coûte 1,5 s, lu pour de vrai 3 s. Chaque overlay (bandeau cookies, roue) coûte 1,5 s à fermer ou ignorer. Ces coûts sont **une hypothèse de simulation**, pas une mesure. Elle pénalise fortement le cohorte à 5 s : 3 s sur 5 partent dans les overlays.

### Panel

- **Appareils** : 37 téléphones (26 en 375 px, 6 en 320 px, 5 en paysage 844×390), 7 tablettes 768 px, 6 bureaux 1440 px, 1 bureau 2560 px (soit 70 % mobile, 15 % tablette, 15 % bureau).
- **Sources** : 35 Meta (pubs diverses), 11 Google (recherches génériques, comparatifs « Spartan Race », « Maize République », SEO classique), 4 directs.
- **Personas** : étudiants, cadres, débutants, trailers, parents, RH, gérant de club, DRH, mineure, utilisateurs de petits téléphones, etc. Liste complète en annexe A.
- **Entrée** : pub Meta vers `/events/caca`, Google et direct vers `/` ou l'événement selon la persona. Les agents pouvaient passer à l'autre page avec la moitié du budget restant, aucun ne l'a fait.
- **Popups** : cookies et roue laissés actifs, comme pour un vrai visiteur.

---

## 3. Limites et validité des résultats

| Constat des agents | Validité | Pourquoi |
|---|---|---|
| Aucune date / lieu / prix / places sur l'événement | **Faux (artefact de capture)** | Le hero les affiche à l'écran 1 (vérifié par recapture et par `innerText`). La capture n'incluait pas les `span`. La roue les masque en plus, voir ci-dessous. |
| Aucune date / lieu / prix sur l'accueil dans les premiers écrans | **Vrai pour l'écran 1, faux pour l'écran 2** | Écran 1 : H1 + CTA, rien de concret. Écran 2 : « Prochaine édition » avec date, lieu, prix, places. |
| Roue + cookies à fermer dès l'arrivée, masquent le contenu | **Vrai** | `delay_ms: 0` confirmé par l'API ; capture d'écran du modal ouvert sur le hero. |
| Titre `caca`, prix 1 € / 2 € incohérents | **Vrai mais donnée de test** | L'événement est un template. |
| Cibles tactiles < 44 px (toggle, « En savoir plus », « Non merci ») | **Vrai** | Détecté par mesure de boîte, pas par jugement. |
| Contradictions : « Ultra Arena 2026 s'est tenue » vs « prochaine édition » ; « des centaines » vs « plus de 300 » | **Vrai** | Texte réellement présent sur l'accueil. |
| La roue « reste fixe sur chaque écran » | **À nuancer** | La capture ne fermait jamais le modal. Un vrai visiteur le ferme (ou il se rouvre selon le cooldown). |

**Conséquence** : les scores de compréhension (« quand = ? » chez 49 agents sur 50) sont sous-estimés. L'ordre de grandeur reste utile pour comparer les blocages entre eux, pas pour fixer un score. Une fois les corrections de la section 7 faites, il faut rejouer le panel avec la capture corrigée.

---

## 4. Résultats

### 4.1 Scores par segment

| Segment | n | Compréhension /10 | Intention /10 |
|---|---|---|---|
| Budget 5 s | 20 | 1,3 | 1,4 |
| Budget 10 s | 17 | 4,1 | 2,7 |
| Budget 20 s | 9 | 5,0 | 3,1 |
| Budget 45 s | 4 | 5,8 | 3,5 |
| Téléphone portrait | 32 | 2,9 | 2,3 |
| Téléphone paysage | 5 | 2,6 | 1,8 |
| Tablette | 7 | 4,6 | 2,4 |
| Bureau | 6 | 4,2 | 2,8 |
| Source Meta | 35 | 2,8 | 2,2 |
| Source Google | 11 | 4,3 | 2,6 |
| Source directe | 4 | 4,3 | 2,8 |
| Entrée événement | 35 | 2,8 | 2,2 |
| Entrée accueil | 15 | 4,3 | 2,7 |

Lecture : le trafic Meta qui atterrit sur l'événement est le segment le plus fragile. Les visiteurs à 5 s ne comprennent presque rien (1,3/10). Le paysage téléphone est le pire appareil.

### 4.2 Ce que les visiteurs ont compris (avant correction de la capture)

| Question | « ? » (non compris) sur 50 |
|---|---|
| Quoi (c'est une course à obstacles) | 19 |
| Quand | 49 |
| Où | 42 |
| Combien | 32 |
| Pour qui | 33 |
| Comment s'inscrire | 10 |

Ce que les visiteurs qui lisent assez longtemps retiennent : « course à obstacles », « boucle de 2 km », formats OPEN et RANKED, bouton « Je m'inscris ». Le comparatif OPEN / RANKED est le seul bloc qui retient spontanément l'attention sur l'accueil.

### 4.3 Où ils quittent

| Écran de sortie | Agents |
|---|---|
| Écran 1 | 18 |
| Écran 2 | 5 |
| Écran 3 | 3 |
| Écran 4 | 12 |
| Écran 5 | 5 |
| Écran 9 et plus | 6 |

36 % partent à l'écran 1, 70 % au plus tard à l'écran 4. Raison de sortie dominante : budget épuisé après les deux overlays, sans information exploitable.

---

## 5. Points d'arrêt, points de blocage, causes de sortie

### 5.1 Points d'arrêt (ce qui retient l'œil)

| Élément | Page | Remarque |
|---|---|---|
| Comparatif OPEN / RANKED (« ce format est pour toi si… ») | Accueil, écran 4 à 5 | Seul bloc cité comme clair par les lecteurs de 20 s et plus |
| « Créer mon groupe / Tu pars avec tes potes ? » | Événement, écran 3 | Retient les personas groupe (Emma, Paul, Élodie), mais sans tarif groupe |
| Bouton « Je m'inscris » | Les deux | Compris comme action, sans contexte pour les visiteurs à 5 s |
| Prix « Dès X € » | Événement, écran 2 | Vu seulement par ceux qui dépassent 4 écrans |
| Boucle de 2 km, tours illimités, 10 obstacles | Accueil, écrans 3 à 4 | Explique le concept, mais loin dans la page |

### 5.2 Points de blocage

Classés par fréquence (nombre d'agents sur 50 qui le citent) :

1. **Roue + cookies à fermer avant de lire** : 50. Confirmé. C'est le coût d'entrée de tous les visiteurs.
2. **Date, lieu, prix perçus comme absents** : 45 à 48. Artefact de capture sur l'événement ; réel en partie sur l'accueil (écran 1).
3. **Titre `caca` jugé placeholder** : 49. Donnée de test.
4. **Cibles tactiles < 44 px** : 30. Réel.
5. **Prix 1 € / 2 € jugés incohérents** : 17. Donnée de test (et OPEN plus cher que RANKED, à vérifier sur le vrai événement).
6. **Pas d'offre groupe entreprise (devis, facture CE, tarif par équipe)** : 22 mentions « groupe ». Réel : « Créer mon groupe » est présenté entre amis, « Devenir partenaire » seulement dans le footer.
7. **Contradictions de contenu** : 9. Réel (voir section 3).
8. **Jargon non expliqué** (« backyard », « OPEN », « RANKED », « SAS », « WALL OVER ») : plusieurs débutants. Réel.
9. **Aucune règle d'âge ni accompagnement des mineurs** : 5 (parents, mineure). Réel.
10. **Aucune distance en km / tours ni durée RANKED lisible au début** : 3 (marathonienne, comparateurs). Réel.
11. **Texte RANKED coupé (« Tu termines dans les… »)** sur l'accueil : 2. À vérifier sur le DOM.
12. **Roue en paysage téléphone** : couvre la page et le CTA. Réel (844×390).

### 5.3 Ce qui les fait quitter

- **Budget consommé par les overlays** : la cause n°1 chez les 5 s et 10 s.
- **Aucun repère concret au-dessus de la ligne de flottaison sur l'accueil** : H1 + CTA seulement.
- **Doute de crédibilité** : titre `caca`, prix de test, texte au passé (« s'est tenue »).
- **Pression commerciale perçue** : la roue demande un email avant tout contenu. Une persona sceptique (trailer) et une influenceuse la jugent « racoleuse ».
- **Question persona-spécifique sans réponse** : tarif groupe (DRH, RH, club), âge (parents), distance (marathonienne), comparaison avec Mud Day / Spartan / Maize République (aucune mention de concurrent ou de positionnement).

### 5.4 Ce qu'ils ont compris, page par page

**Événement `/events/caca`** (35 entrées)
- Compris par la majorité : « course à obstacles, formats OPEN et RANKED, bouton Je m'inscris ».
- Compris seulement après 4 écrans ou plus : prix de départ, choix du créneau, groupe.
- Non compris (surtout à cause de la roue qui masque le hero) : date, lieu, places restantes.

**Accueil `/`** (15 entrées)
- Compris : « course d'obstacles format backyard, boucle de 2 km, tours illimités », modes OPEN (débutants, entre amis) et RANKED (compétition).
- Non compris dans les 3 premiers écrans : date, lieu, prix. Raison : ils sont à l'écran 2 sous le titre « Prochaine édition `CACA` », que les agents jugent suspect.
- Contradiction perçue : « Ultra Arena 2026 s'est tenue » vs « prochaine édition » 2027.

---

## 6. Topo : fait, possible, à faire

### 6.1 Déjà fait (d'après FDR-0015, l'historique git et les captures)

- Hero événement avec barre de faits (date, lieu, tarif, disponibilité) et CTA.
- Accueil réorganisé : bloc « Prochaine édition » alimenté par l'événement vedette, schéma du concept, comparatif OPEN / RANKED, obstacles.
- Lucky Wheel global avec arbitre de popups (`PopupArbiterProvider`), liste blanche de routes, cooldown après fermeture, fermeture au clic sur le fond, accessibilité (`a11y`).
- Image de partage générée, séries de photos à jour, audit SEO/GEO (lots A à D).
- Checkout : prix unique, remise groupe sur les billets OPEN, menu déroulant de quantité, accordéon participants, cibles tactiles revues, test e2e de groupe.
- Contrat responsive vérifié par Playwright (`e2e/responsive.spec.ts`, 12 fenêtres).

### 6.2 Peut être fait (gain probable, effort modéré)

- Variante de H1 d'accueil avec un repère concret (date · lieu · « dès X € »).
- Test A/B sur le déclencheur de la roue (scroll, intention de sortie, délai).
- Bloc « Équipes et CE » avec demande de devis, séparé de « Créer mon groupe ».
- Section « Pour qui / niveau requis » : distance, durée, « sans expérience, marche possible », âge minimum.
- Bloc de comparaison / positionnement face aux courses connues (réponse aux recherches Google « alternative », « vs »).
- Preuve sociale chiffrée et sourcée (avis vérifiés, nombre de finishers 2026), en remplacement de « des centaines ».

### 6.3 Doit être fait (priorisé)

| Priorité | Action | Effet attendu | Fichiers / lieu |
|---|---|---|---|
| **P0** | Retarder la roue : `trigger_rules` en scroll ≥ 40 % ou intention de sortie, ou délai ≥ 10 s ; jamais avant le bandeau cookies. Ne pas ouvrir sur le trafic pub à froid. | Le hero (date, lieu, prix) redevient visible pour tous. Supprime 1,5 s de coût par visite. | Campagne « Lets go ! » (admin), `LuckyWheelWidget.tsx`, `PopupArbiterProvider.tsx` |
| **P0** | Faire passer le bandeau cookies dans l'arbitre : un seul overlay à la fois, cookies d'abord, roue après la décision. | Fin de l'empilement cookies + roue. | `src/components/consent/*`, `PopupArbiterProvider.tsx` |
| **P0** | Rejouer la simulation avec la capture corrigée et un événement réaliste (vrai titre, vrais prix). | Valide ou invalide les scores de cette page. | Voir annexe B |
| **P1** | Ajouter date · lieu · « dès X € » sous le H1 de l'accueil (écran 1). | Compréhension dès 5 s. | `HeroHeader`, `FeaturedEventBar` (FDR-0015 §4) |
| **P1** | Corriger les contradictions : « s'est tenue » vs « prochaine édition » ; « des centaines » vs « plus de 300 ». | Crédibilité. | Textes accueil, `UltraArenaProjection` / social proof |
| **P1** | Cibles tactiles ≥ 44 px dans la roue (toggle, « En savoir plus », « Non merci »). | Conforme au design system, moins de friction mobile. | `LuckyWheelEntryForm.tsx` |
| **P1** | Roue en paysage téléphone : hauteur maximale, bouton de fermeture visible sans scroll. | Plus de CTA masqué en 844×390. | `LuckyWheelWidget.tsx` |
| **P2** | Expliquer le jargon au premier contact (backyard, OPEN, RANKED, SAS) en une phrase. | Débutants. | Hero événement, comparatif |
| **P2** | Bloc Équipes / CE avec devis. | Segment B2B (RH, DRH, clubs). | Page événement, accueil |
| **P2** | Règles d'âge et mineurs visibles hors FAQ. | Parents. | Infos pratiques |
| **P2** | Vérifier le texte RANKED coupé sur l'accueil (« Tu termines dans les… »). | Clarté du format compétitif. | Composant de comparatif |

---

## 7. Mesurer pour de vrai

La simulation oriente, elle ne mesure pas. À suivre sur les vrais visiteurs :

- **Taux d'ouverture et de fermeture de la roue** (`wheel_impression`, événements de fermeture) rapporté au rebond dans les 10 premières secondes, par source (Meta vs Google).
- **Profondeur de scroll** de l'accueil et de l'événement ; part des visites qui voient la barre de faits.
- **Rebond mobile Meta sur `/events/<slug>`** avant / après retard de la roue.
- **Test A/B** : roue immédiate vs roue à 40 % de scroll, sur un échantillon limité.
- **Rejeu du panel** (20 agents suffisent) après les P0 et P1, avec la capture corrigée.

---

## Annexe A. Panel (50 personas)

Format : `id | appareil | source | budget | persona`.

```
01|phone-375|Meta pub vidéo obstacles|5|Lucas 24, étudiant, scroll Insta compulsif, jamais couru
02|phone-375|Meta pub prix|5|Sarah 31, cadre, salle de sport, défi entre amis
03|phone-375|Meta pub TikTok-like|5|Mehdi 19, lycéen, vidéos OCR, budget nul
04|phone-375|Meta pub entreprise|5|Claire 38, RH, team building
05|phone-375|Meta pub|5|Julien 28, crossfitteur, connaît Spartan Race
06|phone-375|Meta pub|5|Nadia 42, mère de famille, débutante, santé
07|phone-375|Meta pub|5|Thomas 35, trailer expérimenté, sceptique pubs
08|phone-375|Meta pub|5|Inès 22, étudiante, budget serré
09|phone-375|Meta pub|5|Antoine 45, sédentaire curieux
10|phone-375|Meta pub influenceuse|5|Camille 27, influenceuse fitness, juge le visuel
11|phone-375|Meta pub|5|Karim 33, livreur, lit dans le métro
12|phone-375|Meta pub|5|Léa 26, kiné, événement pour ses patients
13|phone-375|Meta pub|10|Hugo 29, coureur du dimanche, compare Mud Day
14|phone-375|Meta pub|10|Emma 34, prof, sortie entre copines
15|phone-375|Meta pub|10|Paul 40, manager, inscrire son équipe
16|phone-375|Meta pub|10|Yasmine 23, danseuse, anxieuse du niveau
17|phone-375|Meta pub|10|Romain 31, réserviste, cherche du challenge
18|phone-375|Meta pub|20|Sophie 37, marathonienne, veut détails (temps, distance, règles)
19|phone-375|Meta pub|20|Damien 30, papa, enfants / famille
20|phone-375|Meta pub|45|Élodie 36, organise un groupe de 12 collègues
21|phone-375|Google "course à obstacles ile de france 2027"|10|Vincent 32, date et lieu
22|phone-375|Google "Spartan Race alternative"|20|Maxime 29, comparateur prix et formats
23|phone-375|Google "meilleure course à obstacles France"|10|Aurélie 41, avis et classements
24|phone-375|Google|5|Bruno 50, veut juste la date
25|phone-375|Direct|20|Chloé 25, bouche-à-oreille
26|phone-375|Meta pub|45|Nicolas 38, motivé, 5 OCR, lit tout
27|phone-320|Meta pub|5|Anaïs 21, petit téléphone
28|phone-320|Meta pub|10|Michel 55, petit téléphone, grosse police
29|phone-320|Meta pub|5|Jordan 20, entrée de gamme, réseau lent
30|phone-320|Google "course obstacles débutant"|10|Fatou 33, débutante, craint le ridicule
31|phone-320|Meta pub|20|Pierre 27, infos pratiques (accès, horaires)
32|phone-320|Meta pub|5|Manon 18, scroll ultra-rapide
33|phone-land|Meta pub|5|Gabriel 25, paysage dans les transports
34|phone-land|Meta pub|10|Lisa 30, paysage sur canapé
35|phone-land|Google "Maize République course"|10|Théo 28, course type Maize République
36|phone-land|Meta pub|5|Océane 24, paysage par erreur
37|phone-land|Direct|20|Samuel 35, revient vérifier une info
38|tablet-768|Meta pub|10|Brigitte 52, pas fan de technologie
39|tablet-768|Google "course à obstacles"|20|Alain 48, compare plusieurs courses
40|tablet-768|Meta pub|5|Zoé 16, tablette familiale, mineure
41|tablet-768|Meta pub|10|Franck 44, parent, conditions d'âge
42|tablet-768|Google (SEO classique)|20|Isabelle 39, lit chaque section
43|tablet-768|Meta pub|45|Olivier 46, gérant d'un club de sport
44|tablet-768|Direct|10|Mélanie 29, lien reçu par WhatsApp
45|desk-1440|Google "course à obstacles 2027"|10|Sébastien 34, 10 onglets
46|desk-1440|Meta pub|5|Valérie 43, fil Facebook sur PC
47|desk-1440|Google "Spartan Race vs"|20|Adrien 31, compare en détail
48|desk-1440|Direct|10|Julie 37, lien reçu au bureau
49|desk-1440|Meta pub|45|Laurent 49, DRH, 40 salariés
50|desk-2560|Google|10|Kévin 30, grand écran 27", gamer sportif
```

## Annexe B. Rejouer la simulation

1. Lancer le site : `npm run dev` (port 3000 ici).
2. Capturer chaque page à 6 tailles (375×812, 320×568, 844×390, 768×1024, 1440×900, 2560×1440) avec Playwright : défilement par pas de 85 % de la hauteur, texte visible de **tous** les éléments qui portent du texte direct (pas seulement `h1/p/a/button`), et drapeaux `[FIXED]` (overlay fixe) et `[tap<44]` (cible tactile trop petite).
3. Donner à chaque agent sa persona, son budget et ses fichiers, avec la règle « lire uniquement les N premiers écrans autorisés ».
4. Agréger les JSON de sortie (clés : `understood`, `exit`, `stops`, `blocks`, `overlay_effect`, `understanding_0_10`, `conversion_intent_0_10`, `one_fix`).

Limite d'exécution constatée : 20 sous-agents en parallèle au maximum (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`). Les 50 agents ont donc été lancés par vagues.


---

## 8. Rejeu après correctifs P0 / P1 (2026-10-27)

**Protocole.** 20 agents Haiku, mêmes règles de budget que le premier panel. Capture corrigée (le texte des `span`, `dt` et `dd` est lu). Événement réaliste : `ultra-arena-2027`, « Overbound - Backyard à Obstacles 2027 », 7 février 2027, Saint-Quentin-en-Yvelines, OPEN 59,99 € et RANKED 69,99 €, 386 places. Code : roue retardée (10 s minimum), cookies avant tout popup, cibles tactiles de la roue ≥ 44 px, hero d'accueil avec « Plus de 300 participants ». Panel de 20 profils choisis dans les 50 (mobiles 375 / 320, paysage, tablette, bureau ; Meta, Google, direct).

### Résultats

| Mesure | Panel 1 (50, capture défectueuse) | Panel 2 (20, capture corrigée) |
|---|---|---|
| Compréhension moyenne | 3,3 / 10 | **6,5 / 10** |
| Intention de conversion | 2,3 / 10 | **3,75 / 10** |
| Clics sur un CTA | 0 / 50 | 0 / 20 |
| « Date, lieu, prix » compris | 2 à 5 agents sur 50 | **20 / 20** |
| « Pour qui » compris | non mesuré | 9 / 20 |

Les deux panels ne se comparent pas strictement : le premier a subi le défaut de capture (§3), le second n'a pas la roue ouverte au premier écran. La hausse de compréhension vient en grande partie de la capture corrigée. Ce qui est établi : **la roue ne figure plus parmi les blocages cités** et les faits clés sont lus par tous les agents qui atteignent l'écran 1 ou 2.

### Nouveaux blocages, par fréquence

1. **OPEN vs RANKED sans explication au moment du choix** (9 agents sur 20). Les débutants ne savent pas quel billet prendre ni pourquoi RANKED coûte 10 € de plus. Correctif demandé : une ligne sous les cartes (« OPEN : à ton rythme, sans chrono. RANKED : chrono, départ unique à 08:00 ») et « Première course ? Prends OPEN ».
2. **Pas de distance, de nombre d'obstacles ou de niveau sur les premiers écrans de la page événement** (6 agents). Question de base d'un coureur d'OCR.
3. **Bandeau cookies** (15 agents, 1,5 s à chaque visite) : il couvre le bas de l'écran et le CTA fixe, surtout à 320 px et en paysage. Il ne bloque plus la roue, mais il reste le premier coût.
4. **Cibles tactiles sous 44 px** : bouton fixe « Je m'inscris » en tablette et en paysage, liens « Tous les faits » du pied d'accueil.
5. **Incohérences de textes** : « Backyard » dans le titre contre « Ultra Arena » sur les billets ; « Ultra Arena 2026 » encore dans le bloc « En bref » et « Paris 2026 » dans le pied de page.
6. **Chiffres de places** : 2 et 10 places par créneau OPEN contre 386 en tête, et pas de compte pour 12:30.
7. **« Tous les prix plus bas »** : renvoi vers une section déjà passée ou sans ancre.
8. **Prérequis tardifs** : PPS FFA / licence et 18 ans et plus n'apparaissent qu'à l'écran 7 à 10.
9. **FAQ repliée** : les réponses ne sont pas lues.
10. **Groupe et entreprise** (2 agents : groupe de 12, DRH de 40 salariés) : pas de total groupe, pas de règle de paiement, pas de devis. Décision du propriétaire : pas de bloc entreprise pour l'instant.

### Points notés par des agents, à ne pas retenir
- **Date, lieu et prix dans le hero de l'accueil** : demandé par 3 agents Google (21, 35, 45). Décision du propriétaire : refusé, ces informations sont à une demi-page de scroll. À réévaluer par la mesure réelle (§7).
- **« Tu termines dans les » coupé** : troncature de la capture (déjà vérifié dans le code).
- **Texte `<<ccr:...>>` signalé par l'agent 30** : absent des captures et du code, sans doute une erreur de l'agent.
- **Lien « Course à obstacles à Paris » incohérent avec le lieu** (agent 39) : à vérifier, la page pilier cible l'Île-de-France.

### Reste à faire, par priorité
| Priorité | Action | Lieu probable |
|---|---|---|
| P1 | Une phrase d'aide au choix OPEN / RANKED sous les cartes de la page événement, avec « Première course ? Prends OPEN » | `UltraArenaFormats.tsx`, section inscription de la page événement |
| P1 | Distance de boucle (2 km), nombre d'obstacles et niveau dans la rangée de faits ou sous le hero événement | `EventHero.tsx` |
| P1 | Bandeau cookies plus compact sur mobile et en paysage ; ne pas couvrir le CTA fixe | `CookieConsentBanner.tsx` |
| P2 | Cibles ≥ 44 px : bouton fixe d'inscription, liens du pied de la landing | `EventStickyCta.tsx`, `EditionFacts.tsx` |
| P2 | Harmoniser les noms (« Backyard » / « Ultra Arena ») et retirer « 2026 » périmé (« En bref », pied de page) | `siteFacts.ts`, `Footer.tsx`, billets en base |
| P2 | Remonter PPS FFA / licence et 18+ près du prix | `UltraArenaReassurance.tsx` |
| P2 | Clarifier les places par créneau (total, créneau complet) et l'ancre « tarifs » | `EventTicketDepartures.tsx` |
