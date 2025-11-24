import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Titre', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', maxLength: 96 }, validation: r => r.required() }),
    defineField({ name: 'excerpt', title: 'Extrait', type: 'text' }),
    defineField({ name: 'mainImage', title: 'Image à la une', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'author', title: 'Auteur', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'categories', title: 'Catégories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }] }),
    defineField({ name: 'publishedAt', title: 'Publié le', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'body', title: 'Contenu', type: 'blockContent' }),
    defineField({
      name: 'sections',
      title: 'Sections personnalisées',
      description: 'Construis ton article par blocs (texte, image, mise en avant, etc.)',
      type: 'array',
      of: [
        {
          name: 'articleSection',
          title: 'Section',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Titre de la section',
              type: 'string',
            }),
            defineField({
              name: 'layout',
              title: 'Type de section',
              type: 'string',
              options: {
                list: [
                  { title: 'Texte plein', value: 'text' },
                  { title: 'Texte + image (gauche)', value: 'imageLeft' },
                  { title: 'Texte + image (droite)', value: 'imageRight' },
                  { title: 'Bloc mis en avant', value: 'highlight' },
                  { title: 'Citation / témoignage', value: 'quote' },
                ],
                layout: 'dropdown',
              },
              initialValue: 'text',
            }),
            defineField({
              name: 'accent',
              title: 'Accent de couleur',
              type: 'string',
              options: {
                list: [
                  { title: 'Vert OverBound', value: 'emerald' },
                  { title: 'Orange', value: 'orange' },
                  { title: 'Gris neutre', value: 'neutral' },
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
              initialValue: 'emerald',
            }),
            defineField({
              name: 'body',
              title: 'Contenu',
              type: 'blockContent',
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({ name: 'alt', type: 'string', title: 'Texte alternatif' }),
                defineField({ name: 'caption', type: 'string', title: 'Légende' }),
              ],
            }),
          ],
          preview: {
            select: { title: 'title', layout: 'layout' },
            prepare({ title, layout }) {
              let layoutLabel = 'Section'
              if (layout === 'highlight') layoutLabel = 'Bloc mis en avant'
              else if (layout === 'imageLeft' || layout === 'imageRight') layoutLabel = 'Texte + image'
              else if (layout === 'quote') layoutLabel = 'Citation / témoignage'
              else if (layout === 'text') layoutLabel = 'Texte'

              return {
                title: title || 'Section sans titre',
                subtitle: layoutLabel,
              }
            },
          },
        },
      ],
    }),
    defineField({ name: 'ogImage', title: 'Image OpenGraph (optionnel)', type: 'image' }),
  ],
  preview: {
    select: { title: 'title', media: 'mainImage', author: 'author.name' },
    prepare({ title, media, author }) {
      return { title, media, subtitle: author ? `par ${author}` : '' }
    },
  },
})
