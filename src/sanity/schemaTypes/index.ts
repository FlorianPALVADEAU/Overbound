import type { SchemaTypeDefinition } from 'sanity'
import question from '../schemas/question'

// Blog schemas (post, author, category, blockContent) and settings moved
// to MDX/plain TS constants. Studio now only edits FAQ questions.
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [question],
}
