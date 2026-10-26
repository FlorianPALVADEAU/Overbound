import { PillarPage, pillarMetadata } from '@/components/seo/PillarPage'
import { loadNextEdition } from '@/lib/seo/loadNextEdition'
import { buildPillarPages } from '@/lib/seo/pillarPages'

export const revalidate = 60

const loadContent = async () => buildPillarPages(await loadNextEdition()).loops

export async function generateMetadata() {
  return pillarMetadata(await loadContent())
}

export default async function Page() {
  return <PillarPage content={await loadContent()} />
}
