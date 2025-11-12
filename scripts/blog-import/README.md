Mass Import Blog Posts

Overview
- Import Markdown/CSV/JSON posts into Sanity `post` documents.
- Maps fields: title, slug, excerpt, body (Portable Text), mainImage (by URL), author, categories, publishedAt.

Prepare
- Set env vars: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN` (Write token).
- Install dev deps locally (outside CI): `npm i -D @sanity/client @sanity/image-url gray-matter unified remark-parse remark-sanitize remark-rehype rehype-stringify @portabletext/to-html`.

Input Formats
- Markdown folder: each `.md` file with frontmatter (title, slug, excerpt, date, image, categories, author).
- CSV: headers: title,slug,excerpt,date,image,author,categories,body.
- JSON: array of objects with same fields.

Run
- Markdown: `ts-node scripts/blog-import/importFromMarkdown.ts ./content`
- CSV: `ts-node scripts/blog-import/importFromCsv.ts ./posts.csv`
- JSON: `ts-node scripts/blog-import/importFromJson.ts ./posts.json`

Notes
- Images by URL are uploaded to Sanity assets; failures fall back to no image.
- Authors/categories are upserted by slug.
- Idempotent: uses slug as unique key; re-run updates existing posts.

