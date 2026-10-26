/** Which participant form to open next: the first incomplete one after `currentId`, wrapping around. */
export const nextIncompleteParticipantId = (
  ids: readonly string[],
  completeById: Readonly<Record<string, boolean>>,
  currentId: string | null,
): string | null => {
  const start = currentId ? ids.indexOf(currentId) + 1 : 0
  const ordered = [...ids.slice(start), ...ids.slice(0, start)]
  return ordered.find((id) => id !== currentId && completeById[id] !== true) ?? null
}

export const countComplete = (ids: readonly string[], completeById: Readonly<Record<string, boolean>>): number =>
  ids.filter((id) => completeById[id] === true).length
