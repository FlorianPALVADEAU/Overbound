import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo/structuredData'
import { JsonLd } from './JsonLd'

export function OrganizationStructuredDataServer() {
  return (
    <>
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebSiteJsonLd()} />
    </>
  )
}
