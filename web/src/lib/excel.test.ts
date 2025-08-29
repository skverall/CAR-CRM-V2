import { describe, it, expect } from 'vitest'
import { parseNumber, parseDate } from './excel'

describe('parseNumber', () => {
  it('parses simple numbers', () => {
    expect(parseNumber('123')).toBe(123)
    expect(parseNumber('1,234.56')).toBe(1234.56)
    expect(parseNumber('1.234,56')).toBe(1234.56)
    expect(parseNumber('-99')).toBe(-99)
  })
})

describe('parseDate', () => {
  it('parses ISO', () => {
    const d = parseDate('2024-01-31')!
    expect(d.toISOString().startsWith('2024-01-31')).toBe(true)
  })
  it('parses dot format', () => {
    const d = parseDate('31.01.2024')!
    expect(d.toISOString().startsWith('2024-01-31')).toBe(true)
  })
})

