export interface OrderRegistrationSummaryRow {
  race_format?: string | null
  start_time?: string | null
}

export interface OrderSummary {
  count: number
  /** Shared by every registration of the order, otherwise null (mixed). */
  raceFormat: string | null
  /** Shared by every registration of the order, otherwise null (mixed or unset). */
  startTime: string | null
}

const commonValue = (values: Array<string | null | undefined>): string | null => {
  const first = values[0] ?? null
  return first !== null && values.every((value) => value === first) ? first : null
}

// A multi-participant order yields one shareable card: show format and
// departure only when they are the same for the whole team.
export const summarizeOrderRegistrations = (rows: OrderRegistrationSummaryRow[]): OrderSummary => ({
  count: rows.length,
  raceFormat: commonValue(rows.map((row) => row.race_format)),
  startTime: commonValue(rows.map((row) => row.start_time)),
})
