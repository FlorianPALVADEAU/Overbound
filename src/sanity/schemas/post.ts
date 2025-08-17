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
    defineField({ name: 'ogImage', title: 'Image OpenGraph (optionnel)', type: 'image' }),
  ],
  preview: {
    select: { title: 'title', media: 'mainImage', author: 'author.name' },
    prepare({ title, media, author }) {
      return { title, media, subtitle: author ? `par ${author}` : '' }
    },
  },
})