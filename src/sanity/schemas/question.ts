import { defineArrayMember, defineField, defineType } from 'sanity'

const categoryOptions = [
  { title: 'Général', value: 'general' },
  { title: 'Inscriptions & billetterie', value: 'inscriptions' },
  { title: 'Documents & validation', value: 'documents' },
  { title: 'Préparation & entraînement', value: 'preparation' },
  { title: 'Logistique & jour J', value: 'logistique' },
  { title: 'Après course & communauté', value: 'apres-course' },
  { title: 'Volontaires & staff', value: 'volunteers' },
  { title: 'Partenariats & presse', value: 'presse' },
]

const audienceOptions = [
  { title: 'Nouveaux participants', value: 'first-timers' },
  { title: 'Participants confirmés', value: 'experienced' },
  { title: 'Entreprises / Groupes', value: 'corporate' },
  { title: 'Bénévoles', value: 'volunteers' },
  { title: 'Presse / Médias', value: 'press' },
]

export default defineType({
  name: 'question',
  title: 'FAQ Overbound',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu' },
    { name: 'meta', title: 'Métadonnées' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Question',
      type: 'string',
      validation: (rule) => rule.required().min(10).max(200),
      group: 'content',
    }),
    defineField({
      name: 'shortAnswer',
      title: 'Résumé court',
      description: 'Une phrase clé qui résume la réponse (utilisée dans les aperçus).',
      type: 'text',
      rows: 2,
      group: 'content',
    }),
    defineField({
      name: 'answer',
      title: 'Réponse détaillée',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Lien',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' },
                  { name: 'label', type: 'string', title: 'Texte du lien' },
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', type: 'string', title: 'Texte alternatif' }],
        }),
      ],
      group: 'content',
    }),
    defineField({
      name: 'category',
      title: 'Catégorie principale',
      type: 'string',
      options: {
        list: categoryOptions,
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
      group: 'meta',
    }),
    defineField({
      name: 'subCategory',
      title: 'Sous-catégorie',
      type: 'string',
      description: 'Ex : Tarifs, Transfert de billet, Entraînement, Consigne…',
      group: 'meta',
    }),
    defineField({
      name: 'order',
      title: 'Ordre d’affichage',
      type: 'number',
      description: 'Permet de prioriser certaines questions dans une catégorie.',
      group: 'meta',
    }),
    defineField({
      name: 'audiences',
      title: 'Publics concernés',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: audienceOptions,
        layout: 'tags',
      },
      group: 'meta',
    }),
    defineField({
      name: 'relatedLinks',
      title: 'Liens utiles',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: 'Label' },
            { name: 'href', type: 'url', title: 'URL' },
          ],
        }),
      ],
      group: 'meta',
    }),
    defineField({
      name: 'keywords',
      title: 'Mots-clés internes',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'meta',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
    },
    prepare({ title, subtitle }) {
      const categoryTitle = categoryOptions.find((option) => option.value === subtitle)?.title || subtitle
      return {
        title,
        subtitle: categoryTitle,
      }
    },
  },
})
