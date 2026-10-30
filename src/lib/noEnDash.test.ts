import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The en dash is a visible AI tell: never ship it in site copy or e-mails.
const EN_DASH = String.fromCharCode(0x2013)
const ROOTS = ['src', 'emails', 'sanity/blogSeed']
const EXTENSIONS = /\.(tsx?|html|json|mdx?)$/

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

describe('typography', () => {
  it('uses no en dash in source copy, e-mails or blog seed', () => {
    const offenders = ROOTS.flatMap(walk)
      .filter((path) => EXTENSIONS.test(path))
      .filter((path) => readFileSync(path, 'utf8').includes(EN_DASH))
    expect(offenders).toEqual([])
  })
})
