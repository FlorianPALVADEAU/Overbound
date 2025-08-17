import { StructureBuilder } from 'sanity/structure'

const singleton = (S: StructureBuilder, type: string, title: string) =>
  S.listItem().title(title).child(
    S.editor().schemaType(type).documentId(type)
  )

const deskStructure = (S: StructureBuilder) =>
  S.list()
    .title('Contenu')
    .items([
      singleton(S, 'settings', 'Réglages du site'),
      S.divider(),
      S.documentTypeListItem('post').title('Articles'),
      S.documentTypeListItem('category').title('Catégories'),
      S.documentTypeListItem('author').title('Auteurs'),
    ])

export default deskStructure