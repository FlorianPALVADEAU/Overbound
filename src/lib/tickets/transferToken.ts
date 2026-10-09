const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/**
 * Extracts the transfer token (a UUID) from whatever reached the claim endpoint.
 * Share sheets and chat apps sometimes glue message text onto the end of a link,
 * and the database would otherwise answer 500 to a string that is not a UUID.
 */
export const parseTransferToken = (raw: string | null | undefined): string | null =>
  raw?.match(UUID_PATTERN)?.[0].toLowerCase() ?? null
