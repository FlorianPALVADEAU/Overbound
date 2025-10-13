import type { ReactElement } from 'react'

export const renderEmail = async (element: ReactElement) => {
  const { renderToStaticMarkup } = await import('react-dom/server')
  return '<!DOCTYPE html>' + renderToStaticMarkup(element)
}
