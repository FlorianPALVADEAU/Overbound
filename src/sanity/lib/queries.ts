import { groq } from 'next-sanity'

export const postsQuery = groq`
*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...20]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  mainImage,
  "author": author->{name, "slug": slug.current},
  "categories": categories[]->{title, slug}
}`

export const paginatedPostsQuery = groq`
  {
    "items": *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[$offset...$end]{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      mainImage,
      "author": author->{name, "slug": slug.current},
      "categories": categories[]->{title, "slug": slug.current}
    },
    "total": count(*[_type == "post" && defined(slug.current)])
  }
`

export const postsSearchQuery = groq`
  {
    "items": *[_type == "post" && defined(slug.current) && (
      title match $q || excerpt match $q || pt::text(body) match $q
    )] | order(publishedAt desc)[$offset...$end]{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      mainImage,
      "author": author->{name, "slug": slug.current},
      "categories": categories[]->{title, "slug": slug.current}
    },
    "total": count(*[_type == "post" && defined(slug.current) && (
      title match $q || excerpt match $q || pt::text(body) match $q
    )])
  }
`

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
  "author": author->{name, "slug": slug.current, avatar},
  "categories": categories[]->{title, "slug": slug.current}
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

export const postsByCategorySlugQuery = groq`
{
  "category": *[_type == "category" && slug.current == $slug][0]{title, "slug": slug.current},
  "items": *[_type == "post" && $slug in categories[]->slug.current] | order(publishedAt desc)[$offset...$end]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    mainImage,
    "author": author->{name, "slug": slug.current}
  },
  "total": count(*[_type == "post" && $slug in categories[]->slug.current])
}`

export const postsByAuthorSlugQuery = groq`
{
  "author": *[_type == "author" && slug.current == $slug][0]{name, "slug": slug.current, avatar},
  "items": *[_type == "post" && author->slug.current == $slug] | order(publishedAt desc)[$offset...$end]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    mainImage,
    "categories": categories[]->{title, "slug": slug.current}
  },
  "total": count(*[_type == "post" && author->slug.current == $slug])
}`

export const recentPostsQuery = groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...6]{_id,title,"slug":slug.current,mainImage}`

export const relatedPostsQuery = groq`
  *[_type == "post" && defined(slug.current) && slug.current != $slug && count(categories[@->slug.current in $categorySlugs]) > 0]
  | order(publishedAt desc)[0...3]{
    _id,
    title,
    "slug": slug.current,
    mainImage
  }
`

export const categoriesWithCountsQuery = groq`
  *[_type == "category"] | order(title asc){
    title,
    "slug": slug.current,
    "count": count(*[_type == "post" && references(^._id)])
  }
`

export const authorsWithCountsQuery = groq`
  *[_type == "author"] | order(name asc){
    name,
    "slug": slug.current,
    avatar,
    "count": count(*[_type == "post" && references(^._id)])
  }
`
