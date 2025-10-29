import { groq } from 'next-sanity'

export const postsQuery = groq`
*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...20]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  mainImage,
  "author": author->{name, slug},
  "categories": categories[]->{title, slug}
}`

export const postBySlugQuery = groq`
*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  mainImage,
  body,
  ogImage,
  "author": author->{name, slug, avatar},
  "categories": categories[]->{title, slug}
}`

export const settingsQuery = groq`*[_type == "settings"][0]{siteTitle, description, ogImage}`

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
