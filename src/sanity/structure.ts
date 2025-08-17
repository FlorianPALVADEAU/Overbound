import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Singleton "settings" tout en haut
      S.listItem()
        .title('Réglages du site')
        .child(S.editor().schemaType('settings').documentId('settings')),
      S.divider(),
      // Tous les autres types sauf "settings"
      ...S.documentTypeListItems().filter((li) => String(li.getId()) !== 'settings'),
    ])

