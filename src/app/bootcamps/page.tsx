import { BootcampsView } from './BootcampsView'
import { BootcampsSeed } from './BootcampsSeed'
import { loadPublicBootcamps } from '@/lib/bootcamps/loadPublicBootcamps'

// Rendered on the server so the sessions are in the HTML; regenerated at
// most every minute.
export const revalidate = 60

export default async function BootcampsPage() {
  // A failed read falls back to the browser fetch.
  const bootcamps = await loadPublicBootcamps().catch(() => null)

  return bootcamps ? (
    <BootcampsSeed data={bootcamps}>
      <BootcampsView />
    </BootcampsSeed>
  ) : (
    <BootcampsView />
  )
}
