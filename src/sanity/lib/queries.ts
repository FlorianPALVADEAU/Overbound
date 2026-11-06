import { groq } from 'next-sanity'

// Blog post/author/category/settings queries moved to MDX
// (src/lib/blog/*, src/constants/siteSettings.ts). Only the FAQ query
// remains on Sanity: FAQ is cross-cutting and stays on Sanity (CLAUDE.md).

export const FAQsQuery = groq`*[_type == "question"] | order(category asc, coalesce(order, 999) asc, title asc) {
  _id,
  title,
  shortAnswer,
  "answer": coalesce(answer, []),
  category,
  subCategory,
  order,
  audiences,
  keywords,
  relatedLinks
}`
