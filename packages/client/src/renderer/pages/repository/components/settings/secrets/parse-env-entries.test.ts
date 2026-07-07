import { describe, expect, it } from 'vitest'
import { parseEnvEntries } from './parse-env-entries'

describe('parseEnvEntries', () => {
  it('parses KEY=value lines', () => {
    expect(parseEnvEntries('API_TOKEN=abc123\nDB_HOST=localhost')).toEqual([
      { name: 'API_TOKEN', value: 'abc123' },
      { name: 'DB_HOST', value: 'localhost' },
    ])
  })

  it('skips blank lines and comment lines', () => {
    expect(parseEnvEntries('# comment\n\nFOO=bar\n   \n# other')).toEqual([
      { name: 'FOO', value: 'bar' },
    ])
  })

  it('strips an export prefix', () => {
    expect(parseEnvEntries('export FOO=bar')).toEqual([
      { name: 'FOO', value: 'bar' },
    ])
  })

  it('trims whitespace around the separator and value', () => {
    expect(parseEnvEntries('  FOO = bar  ')).toEqual([
      { name: 'FOO', value: 'bar' },
    ])
  })

  it('strips matching surrounding quotes from values', () => {
    expect(parseEnvEntries('A="quoted value"\nB=\'single\'')).toEqual([
      { name: 'A', value: 'quoted value' },
      { name: 'B', value: 'single' },
    ])
  })

  it('cuts unquoted inline comments but keeps # inside quotes', () => {
    expect(parseEnvEntries('A=value # comment\nB="value # kept"')).toEqual([
      { name: 'A', value: 'value' },
      { name: 'B', value: 'value # kept' },
    ])
  })

  it('splits on the first = only', () => {
    expect(parseEnvEntries('URL=postgres://u:p@host/db?x=1')).toEqual([
      { name: 'URL', value: 'postgres://u:p@host/db?x=1' },
    ])
  })

  it('allows empty values', () => {
    expect(parseEnvEntries('EMPTY=')).toEqual([
      { name: 'EMPTY', value: '' },
    ])
  })

  it('skips lines without a valid name', () => {
    expect(parseEnvEntries('not a pair\n1BAD=x\n-ALSO-BAD=y\nGOOD=z')).toEqual([
      { name: 'GOOD', value: 'z' },
    ])
  })

  it('keeps the last value for duplicate names', () => {
    expect(parseEnvEntries('FOO=first\nBAR=b\nFOO=last')).toEqual([
      { name: 'FOO', value: 'last' },
      { name: 'BAR', value: 'b' },
    ])
  })

  it('handles CRLF line endings', () => {
    expect(parseEnvEntries('A=1\r\nB=2')).toEqual([
      { name: 'A', value: '1' },
      { name: 'B', value: '2' },
    ])
  })

  it('returns an empty list for non-env text', () => {
    expect(parseEnvEntries('just some prose')).toEqual([])
    expect(parseEnvEntries('')).toEqual([])
  })
})
