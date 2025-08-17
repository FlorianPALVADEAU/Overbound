import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'settings',
  title: 'Réglages du site',
  type: 'document',
  fields: [
    defineField({ name: 'siteTitle', title: 'Titre du site', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'ogImage', title: 'Image OpenGraph par défaut', type: 'image' }),
  ],
})