import { Suspense } from 'react'
import ObstaclesPageContent from './_page-content'

export default function ObstaclesPage() {
  return (
    <Suspense fallback={null}>
      <ObstaclesPageContent />
    </Suspense>
  )
}
