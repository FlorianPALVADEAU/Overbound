import { defineType } from 'sanity'

export default defineType({
  name: 'question',
  title: 'Question',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'text',
    },
  ],
})