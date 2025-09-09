import type { SchemaTypeDefinition } from 'sanity'
import author from '../schemas/author'
import blockContent from '../schemas/blockContent'
import category from '../schemas/category'
import post from '../schemas/post'
import settings from '../schemas/settings'
import question from '../schemas/question'


export const schema: { types: SchemaTypeDefinition[] } = {
  types: [settings, author, category, post, blockContent, question],
}
