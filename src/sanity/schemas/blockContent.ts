import { defineType, defineArrayMember } from 'sanity'

export default defineType({
  name: 'blockContent',
  title: 'Contenu',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'Citation', value: 'blockquote' },
      ],
      lists: [{ title: 'Liste', value: 'bullet' }],
      marks: {
        decorators: [
          { title: 'Gras', value: 'strong' },
          { title: 'Italique', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Lien',
            fields: [
              { name: 'href', type: 'url', title: 'URL' },
              { name: 'blank', type: 'boolean', title: 'Ouvrir dans un nouvel onglet' },
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [
      { name: 'alt', type: 'string', title: 'Texte alternatif' },
      { name: 'caption', type: 'string', title: 'Légende' },
    ]}),
    defineArrayMember({ type: 'code', options: { withFilename: true } }),
  ],
})