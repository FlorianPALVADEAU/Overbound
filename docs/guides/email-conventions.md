# Conventions emails Overbound

Déduit des 3 exemples dans `emails/examples/`.  
Ce document sert de référence à chaque génération d'email HTML pour Overbound.

---

## Structure HTML obligatoire

### DOCTYPE
Les deux fichiers les plus récents utilisent :
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="fr">
```
`code-promo.html` utilise `<!DOCTYPE html>` (HTML5) — incohérence à surveiller.

### Balises `<head>` obligatoires
```html
<meta content="width=device-width" name="viewport" />
<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
<meta name="x-apple-disable-message-reformatting" />
<meta content="IE=edge" http-equiv="X-UA-Compatible" />
<meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
```

### Preheader (texte invisible d'aperçu inbox)
Toujours présent, **toujours en premier** dans le `<body>`, avant tout contenu visible :
```html
<div style="display:none;overflow:hidden;opacity:0;max-height:0;max-width:0;">
  Une phrase de teaser courte (1 ligne max).
</div>
```
`ultra-arena-experience.html` ajoute des caractères de remplissage après le texte (`&nbsp;&zwnj;`) pour empêcher l'aperçu inbox d'aller chercher dans le contenu de l'email — à reproduire si le contenu est court.

### Layout général
- Tout le layout se fait en **tableaux HTML** (`<table>`), jamais en `<div>` flexbox ou CSS grid.
- Les tables ont systématiquement `border="0" cellpadding="0" cellspacing="0" role="presentation"`.
- Le conteneur principal est centré avec `align="center"` sur la `<td>` parente.

---

## Compatibilité clients email

### Pourquoi les règles HTML email sont si contraignantes

Les clients mail n'utilisent pas tous un moteur de navigateur moderne :
- **Outlook 2007–2019 (desktop Windows)** : utilise le moteur de rendu de **Microsoft Word**, pas un navigateur. C'est le client le plus limitant.
- **Gmail (webmail)** : **supprime entièrement le `<head>` et les blocs `<style>`** avant d'afficher l'email.
- **Apple Mail, iOS Mail** : bon support CSS, mais quelques quirks sur les polices et les images.
- **Samsung Mail, clients Android anciens** : support CSS limité et variable.

Toutes les conventions du document découlent de ces contraintes.

---

### Règle absolue : styles inline pour le design

**Gmail supprime le `<head>` et les `<style>`**. Par conséquent :

- Tous les styles de mise en page et de design **doivent être en `style="..."` inline** sur chaque élément.
- Le bloc `<style>` dans le `<head>` ne doit contenir que les **media queries** (pour Apple Mail, Outlook mobile, etc.). Les autres clients qui ne supportent pas les media queries les ignorent silencieusement — ce qui est acceptable.
- Ne jamais mettre de style de layout dans le `<head>` en espérant qu'il s'applique partout : il sera absent chez une partie des destinataires.

---

### Ce qu'Outlook (Word engine) ne supporte pas

Ces propriétés CSS sont **ignorées** par Outlook 2007–2019 :

| Propriété | Comportement Outlook |
|-----------|---------------------|
| `border-radius` | Ignoré → coins carrés |
| `box-shadow` | Ignoré → pas d'ombre |
| `overflow: hidden` | Ignoré |
| `max-width` | Peu fiable — préférer `width` fixe sur `<td>` |
| `position: absolute/relative` | Non fiable pour le layout |
| `float` | Non fiable |
| `display: flex` / `grid` | Non supporté |
| Google Fonts (`@font-face`) | Ignoré → fallback Arial/Helvetica appliqué |
| `background-size`, `background-position` | Ignorés sur les images de fond |

**Conséquence** : `border-radius` et `box-shadow` sont utilisés dans les exemples Overbound mais seront rendus carrés/sans ombre dans Outlook. C'est accepté — la mise en page reste lisible.

---

### Images de fond (background-image)

Outlook ignore `background-image` en CSS. Pour les hero avec image de fond, la double syntaxe est obligatoire :

```html
<td
  background="https://..."
  style="background-image:url('https://...'); background-size:cover; background-position:center;"
>
```

- `background="..."` : attribut HTML reconnu par Outlook
- `style="background-image:..."` : CSS pour les autres clients

Sans le `background` attribut, l'image de fond sera absente dans Outlook.

---

### Attributs HTML obligatoires sur les éléments

Certains attributs HTML (pas CSS) sont nécessaires pour la compatibilité avec les vieux clients :

| Élément | Attributs obligatoires |
|---------|----------------------|
| `<table>` | `border="0" cellpadding="0" cellspacing="0" role="presentation"` |
| `<img>` | `width="..."` `height="..."` `alt="..."` `style="display:block"` |
| `<td>` (centrage) | `align="center"` ou `align="left"` selon le cas |
| `<td>` (vertical) | `valign="top"` ou `valign="middle"` |

Le `width` sur `<img>` doit être l'attribut HTML **et** en style inline — les deux ensemble.

---

### Ce qui dégrade gracieusement (acceptable)

Ces éléments sont ignorés par certains clients mais n'empêchent pas la lisibilité :
- `border-radius` → coins carrés dans Outlook ✓
- `box-shadow` → pas d'ombre dans Outlook ✓
- Google Fonts → Arial/Helvetica affiché ✓
- `background-size: cover` → image de fond absente ou mal cadrée sans attribut `background` ✗ (à corriger avec la double syntaxe)
- Media queries → ignorées dans Gmail (email non responsive dans Gmail webmail, mais lisible)

---

## Conteneur et largeur

- Largeur du conteneur : **620px** (`obstacles-presentation.html`, `code-promo.html`) ou **600px** (`ultra-arena-experience.html`) — inconsistance. **620px est à privilégier** car c'est la valeur la plus répandue dans les deux exemples les plus structurés.
- Background extérieur : `#eaf0f6` (ou `#eef2f7` dans `ultra-arena-experience.html`) — utiliser `#eaf0f6` par défaut.
- Container : `background:#ffffff; border-radius:22px; overflow:hidden; box-shadow:0 10px 40px rgba(15,23,42,.10);`
- Classe CSS `.container` définie pour le responsive mobile.

---

## Typographie

### Police
- Police principale : `Arial, Helvetica, sans-serif`
- `ultra-arena-experience.html` charge **Poppins depuis Google Fonts** en plus — à utiliser seulement si explicitement demandé (les polices Google Fonts ne s'affichent pas dans tous les clients mail).

### Hiérarchie de texte observée

| Rôle | Taille | Poids | Couleur light | Couleur dark |
|------|--------|-------|---------------|--------------|
| Étiquette catégorie | 11–13px | 900 | `#2563eb` | `#60a5fa` |
| Titre H1 hero | 42–56px | 900 | `#ffffff` | — |
| Titre H2 section | 28–38px | 900 | `#0f172a` / `#111827` | `#ffffff` |
| Titre H3 carte | 24–28px | 900 | `#0f172a` | `#ffffff` |
| Texte corps | 14–17px | 400 | `#475569` | `#cbd5e1` |
| Texte légal/footer | 12px | 400 | `#94a3b8` | — |

### Règles typographiques
- Toutes les étiquettes de catégorie sont en **UPPERCASE**, `letter-spacing: 1px`, `font-weight: 900`.
- Les titres principaux utilisent systématiquement `font-weight: 900`.
- `line-height` corps de texte : 23–30px.
- Les `<p>` à l'intérieur des `<div>` ont toujours `margin:0; padding:0`.

---

## Palette de couleurs

### Couleurs de marque
| Usage | Valeur |
|-------|--------|
| Vert CTA principal | `#16a34a` |
| Vert secondaire | `#dcfce7` (badge) |
| Bleu accentuation light | `#2563eb` |
| Bleu accentuation dark | `#60a5fa` |
| Rouge urgence/alerte | `#dc2626` |
| Jaune/gold | `#facc15` |

### Fonds de section
| Contexte | Valeur |
|----------|--------|
| Fond page | `#eaf0f6` |
| Conteneur principal | `#ffffff` |
| Section sombre | `#0f172a` ou `#111827` |
| Section claire neutre | `#f8fafc` |
| Carte sombre interne | `#1e293b` |
| Carte rouge/urgence | `#fef2f2` avec bordure `#fecaca` |

### Textes
| Contexte | Valeur |
|----------|--------|
| Titres sur fond blanc | `#0f172a` / `#111827` |
| Corps sur fond blanc | `#475569` / `#334155` / `#374151` |
| Titres sur fond sombre | `#ffffff` |
| Corps sur fond sombre | `#cbd5e1` / `#94a3b8` |
| Liens footer / désabonnement | `#94a3b8` |

---

## Section hero

Structure systématique :
1. **Barre supérieure** (optionnelle) : fond coloré, texte uppercase, 13px, font-weight 900, letter-spacing 1–1.2px
2. **Image de fond** avec double attribut `background` (inline + style pour Outlook)
3. **Overlay gradient** : `linear-gradient(180deg, rgba(0,0,0,.20), rgba(0,0,0,.82))` — varie selon la photo
4. **Logo** : `https://overbound-race.com/images/brand/totem_logo_white.png`, width 84–90px, centré, `display:block; margin:0 auto 12px auto`
5. **Titre** gros, blanc, centré
6. **CTA** vert `#16a34a` toujours présent dans le hero

### Image de fond hero — double syntaxe obligatoire
```html
<td
  background="https://..."
  style="background-image:url('https://...'); background-size:cover; background-position:center;"
>
```
Les deux attributs sont nécessaires : `background` pour Outlook, `style` pour les autres clients.

---

## Boutons CTA

```html
<a
  href="..."
  class="cta"
  rel="noopener noreferrer nofollow"
  target="_blank"
  style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; font-weight:900; font-size:16-18px; padding:14px 26px / 18px 36px; border-radius:10-14px; text-align:center;"
>
  Texte du bouton
</a>
```

- Couleur : toujours `#16a34a` (vert)
- `display:inline-block` → devient `display:block; width:100%; box-sizing:border-box` en mobile via la classe `.cta`
- `font-weight: 900` (ou 800 dans `ultra-arena-experience`)
- `text-decoration: none`
- `target="_blank"` + `rel="noopener noreferrer nofollow"` sur tous les liens

---

## Alternance sections sombres / claires

Schéma observé dans `obstacles-presentation.html` :
- Cartes obstacles : alternance systématique fond clair (`#f8fafc`) / fond sombre (`#0f172a`)
- Image à gauche sur fond clair, image à droite sur fond sombre (pattern zig-zag)
- Étiquette catégorie : `#2563eb` sur fond clair, `#60a5fa` sur fond sombre
- Titre : `#0f172a` sur fond clair, `#ffffff` sur fond sombre
- Badge/pill : fond `#dbeafe` texte `#0f172a` sur fond clair ; fond `#1e293b` texte `#ffffff` sur fond sombre

---

## Séparateurs / dividers

Trois types utilisés :
```html
<!-- Ligne simple -->
<div style="height:1px; background:#e2e8f0; width:88%;"></div>

<!-- Ligne avec fondu -->
<div style="height:1px; background:linear-gradient(to right,transparent,#d1d5db,transparent);">&nbsp;</div>

<!-- Bande de couleur pleine largeur -->
<div style="height:6px; background:linear-gradient(90deg,#dc2626,#f97316,#16a34a); width:100%;"></div>
```

---

## Images

- `display:block` systématiquement pour éviter l'espace blanc sous les images
- Attribut `alt` toujours renseigné (description concrète de l'image)
- `width` explicite en attribut HTML ET en style inline
- Pour les images de contenu : `object-fit:cover; object-position:center`
- URLs des images : domaine `https://overbound-race.com/` ou `https://www.overbound-race.com/` (inconsistance dans les exemples — à harmoniser avec le `www.`)
- Images Resend uploadées : `https://resend-attachments.s3.amazonaws.com/...`
- Preload des images hero dans le `<head>` avec `<link rel="preload" as="image" href="..." />`

---

## Footer (obligatoire)

```html
<tr>
  <td
    align="center"
    style="padding:18px 24px; border-top:1px solid #e5e7eb; font-size:12px; line-height:18px; color:#94a3b8; background:#ffffff;"
  >
    Overbound · contact@overbound-race.com<br />
    12 septembre 2026 · Île de loisirs de Saint-Quentin-en-Yvelines<br />
    <a
      href="{{{RESEND_UNSUBSCRIBE_URL}}}"
      rel="noopener noreferrer nofollow"
      target="_blank"
      style="color:#94a3b8; text-decoration:underline;"
    >Se désinscrire</a>
  </td>
</tr>
```

- `{{{RESEND_UNSUBSCRIBE_URL}}}` : variable triple accolades Resend — **ne jamais omettre**
- Contact email : `contact@overbound-race.com`
- Nom de marque : `Overbound` (sans accent)
- Infos événement : date + lieu toujours présents si l'email concerne l'Ultra Arena 2026

---

## Responsive mobile

Media query **obligatoire** dans le `<head>` (dans `<style>`) :
```css
@media only screen and (max-width: 620px) {
  .container { width: 100% !important; border-radius: 0 !important; }
  .pad { padding: 22px !important; }        /* ou 24px */
  .cta { display: block !important; width: 100% !important; box-sizing: border-box !important; }
  /* Réduire les tailles de titres si nécessaire */
  .h1 { font-size: 38px !important; line-height: 40px !important; }
}
```

Classes `.pad` et `.container` à appliquer sur les `<td>` correspondantes pour que les media queries fonctionnent.

---

## Personnalisation / variables (Resend)

Syntaxe Handlebars de Resend :
- Variable simple : `{{ contact.first_name }}`
- Variable avec valeur par défaut : `{{{ contact.first_name | membre de la tribu }}}` (triple accolades = non-escaped)
- Unsubscribe : `{{{RESEND_UNSUBSCRIBE_URL}}}` — toujours triple accolades

---

## UTM tracking sur les liens

Observé dans `ultra-arena-experience.html`, absent des autres — à utiliser quand un suivi de campagne est demandé :
```
?utm_source=email&utm_medium=marketing&utm_campaign=ultra_arena_2026&utm_id=[id_campagne]&utm_content=[cta_location]
```

---

## Ce qu'il ne faut jamais faire

- Ne pas utiliser `<div>` pour la mise en page principale (flexbox/grid non supportés dans Outlook et iOS Mail)
- Ne pas utiliser `margin` pour centrer des éléments (utiliser `align="center"` sur les `<td>` et `margin:0 auto` sur les `<table>` internes)
- Ne pas omettre le lien `{{{RESEND_UNSUBSCRIBE_URL}}}` dans le footer
- Ne pas utiliser de polices Google Fonts sans fallback Arial/Helvetica (elles ne s'affichent pas dans Outlook)
- Ne pas utiliser CSS grid ou flexbox — tout en tables
- Ne pas mettre `margin` ou `padding` directement sur les `<table>` (mettre sur les `<td>` uniquement)
- Ne pas oublier `display:block` sur les `<img>`
- Ne pas utiliser `<link>` CSS externe pour les styles de mise en page (uniquement pour les polices)
- Ne pas oublier la barre de désinscription dans le footer
- Ne pas oublier le preheader en tout début de body

---

## Inconsistances non résolues entre les exemples

Ces points varient entre les 3 fichiers — **demander** si une valeur standard doit être fixée :

1. **DOCTYPE** : XHTML Transitional vs HTML5
2. **Largeur container** : 620px vs 600px
3. **Police** : Arial seul vs Poppins + Arial
4. **URL logo** : `https://overbound-race.com/` vs `https://www.overbound-race.com/` (le `www.` varie)
5. **Certaines meta tags** absentes de `code-promo.html` (`x-apple-disable-message-reformatting`, `format-detection`, etc.)
