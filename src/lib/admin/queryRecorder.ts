/**
 * Test double for a PostgREST query builder: every call is recorded and returns the builder, and awaiting it
 * gives the next queued result. Lets a route test assert which filters, order and range a query was built with.
 */
export interface RecordedCall {
  method: string
  args: unknown[]
}

export interface QueryResult {
  data?: unknown
  error?: { code?: string; message?: string } | null
  count?: number | null
}

export function createQueryRecorder(results: QueryResult[]) {
  const queries: Array<{ table: string; calls: RecordedCall[] }> = []
  const queue = [...results]

  const from = (table: string) => {
    const entry = { table, calls: [] as RecordedCall[] }
    queries.push(entry)
    const builder: Record<string, unknown> = {
      then: (resolve: (value: Required<QueryResult>) => unknown, reject?: (reason: unknown) => unknown) => {
        const next = queue.shift() ?? {}
        return Promise.resolve({ data: next.data ?? null, error: next.error ?? null, count: next.count ?? null }).then(resolve, reject)
      },
    }
    const proxy: unknown = new Proxy(builder, {
      get: (target, property: string) => {
        if (property in target) return target[property]
        return (...args: unknown[]) => {
          entry.calls.push({ method: property, args })
          return proxy
        }
      },
    })
    return proxy
  }

  return {
    client: { from },
    queries,
    /** Arguments of the first call of `method` on query number `index`. */
    callOf: (index: number, method: string) => queries[index]?.calls.find((call) => call.method === method)?.args,
    /** Every call of `method` on query number `index`. */
    callsOf: (index: number, method: string) => queries[index]?.calls.filter((call) => call.method === method).map((call) => call.args) ?? [],
  }
}
