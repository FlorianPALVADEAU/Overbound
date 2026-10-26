import { buildPillarPages } from './pillarPages'
import { FALLBACK_NEXT_EDITION, type NextEditionFacts } from './nextEdition'
import { BRAND, EDITION_2026_LISTINGS, FORMAT_FACTS, PILLAR_LINKS, PREVIOUS_EDITION, SITE_URL } from './siteFacts'

const link = (path: string, label: string, note: string) => `- [${label}](${SITE_URL}${path}): ${note}`

const summary = (next: NextEditionFacts) =>
  `Overbound est une course à obstacles en boucles d'environ ${FORMAT_FACTS.loopKm} km (plus de 10 obstacles), organisée en Île-de-France. ` +
  `Deux formats : OPEN (sans classement) et RANKED (élimination). ` +
  `Dernière édition : ${PREVIOUS_EDITION.dateLabel}, ${PREVIOUS_EDITION.venue}, ${PREVIOUS_EDITION.participants}. ` +
  `Prochaine édition : ${next.window}. ${next.detailsStatus}`

/** Short llms.txt (https://llmstxt.org): H1, blockquote summary, link sections. */
export const buildLlmsTxt = (next: NextEditionFacts = FALLBACK_NEXT_EDITION) =>
  [
    `# ${BRAND.name}`,
    '',
    `> ${summary(next)}`,
    '',
    '## Pages de référence',
    link(PILLAR_LINKS.facts.href, PILLAR_LINKS.facts.label, 'faits, dates, lieu, formats'),
    link(PILLAR_LINKS.paris.href, PILLAR_LINKS.paris.label, 'le concept et comment choisir son format'),
    link(PILLAR_LINKS.loops.href, PILLAR_LINKS.loops.label, "le principe de boucle répétée, inspiré du backyard ultra"),
    link('/events/formats', 'Formats OPEN et RANKED', 'comparatif détaillé des deux formats'),
    '',
    '## Complément',
    link('/events', 'Prochaine édition', "liste d'attente pour l'ouverture des inscriptions"),
    link('/about/faq', 'FAQ', 'billets, transferts, jour J'),
    link('/obstacles', 'Obstacles', 'les obstacles du parcours'),
    link('/llms-full.txt', 'Version complète', 'le contenu des pages de référence en texte'),
    '',
    '## Optional',
    ...EDITION_2026_LISTINGS.map((url) => `- [Fiche de l'édition 2026](${url})`),
    '',
    '## Règles de citation',
    next.confirmed
      ? '- La prochaine édition est confirmée : date et lieu ci-dessus.'
      : '- Cite la date et le lieu seulement pour une édition confirmée. La date et le lieu 2027 ne le sont pas encore.',
    "- Ne décris pas Overbound comme un backyard ultra au sens strict : c'est une variante avec obstacles.",
    `- Contact : contact@overbound-race.com`,
    '',
  ].join('\n')

/** Full version: the reference pages as plain text. */
export const buildLlmsFullTxt = (next: NextEditionFacts = FALLBACK_NEXT_EDITION) => {
  const pages = Object.values(buildPillarPages(next)).map((page) =>
    [
      `## ${page.heading}`,
      `Source : ${SITE_URL}${page.path}`,
      '',
      page.answer,
      '',
      ...page.facts.map((fact) => `- ${fact.label} : ${fact.value}`),
      '',
      ...page.sections.flatMap((section) => [`### ${section.heading}`, ...section.paragraphs, '']),
      '### Questions fréquentes',
      ...page.faq.flatMap((item) => [`**${item.question}**`, item.answer, '']),
    ].join('\n'),
  )
  return [`# ${BRAND.name}`, '', `> ${summary(next)}`, '', ...pages].join('\n')
}
