'use client'
import { urlFor } from '@/sanity/lib/image'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'

interface ImageValue {
  asset: { _ref: string; _type: string };
  alt?: string;
  caption?: string;
}

const components: PortableTextComponents = {
  types: {
    code: ({ value }) => (
      <pre className="bg-neutral-100 p-4 rounded-xl overflow-x-auto">
        <div className="text-xs opacity-60 mb-2">
          {value?.filename || value?.language?.toUpperCase?.() || 'code'}
        </div>
        <code>{value?.code}</code>
      </pre>
    ),
    image: ({ value }) => {
      const img = value as ImageValue
      const src = urlFor(img).width(1200).height(700).fit('max').url()
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={img?.alt || ''} className="rounded-xl w-full" />
          {img?.caption && <figcaption className="text-sm text-neutral-500 mt-2">{img.caption}</figcaption>}
        </figure>
      )
    },
  },
  block: {
    h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-2">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="border-l-4 pl-4 italic my-4">{children}</blockquote>,
  },
  marks: {
    link: ({ children, value }) => {
      const target = value?.blank ? '_blank' : undefined
      return (
        <a href={value?.href} target={target} rel={target ? 'noopener noreferrer' : undefined} className="underline">
          {children}
        </a>
      )
    },
    code: ({ children }) => <code className="px-1 py-0.5 bg-neutral-100 rounded text-sm">{children}</code>,
  },
}


export default function RichText({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />
}