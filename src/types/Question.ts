import type { PortableTextBlock } from '@portabletext/types'

export type QuestionType = {
  id: string
  title: string
  category: string
  shortAnswer?: string
  answer: PortableTextBlock[]
  relatedLinks?: { label?: string; href?: string }[]
}
