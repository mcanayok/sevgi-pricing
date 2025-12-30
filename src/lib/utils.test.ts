/**
 * LESSON 1: BASIC UNIT TESTS
 *
 * This file demonstrates testing simple utility functions.
 * These are the easiest tests to write and understand.
 *
 * Key Concepts:
 * - describe(): Groups related tests together
 * - it/test(): Defines a single test case
 * - expect(): Makes assertions about values
 */

import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate, formatDateShort, cn } from './utils'

/**
 * Testing formatPrice()
 *
 * This function formats numbers as Turkish Lira.
 * We test various scenarios: normal, null, undefined, edge cases
 */
describe('formatPrice', () => {
  // Test 1: Normal case
  it('formats positive numbers as Turkish Lira', () => {
    const result = formatPrice(1234.56)
    expect(result).toBe('₺1.234,56')
  })

  // Test 2: Zero
  it('formats zero correctly', () => {
    const result = formatPrice(0)
    expect(result).toBe('₺0,00')
  })

  // Test 3: Large numbers
  it('formats large numbers with thousands separators', () => {
    const result = formatPrice(1000000)
    expect(result).toBe('₺1.000.000,00')
  })

  // Test 4: Small decimals
  it('formats decimal numbers correctly', () => {
    const result = formatPrice(10.99)
    expect(result).toBe('₺10,99')
  })

  // Test 5: Null handling
  it('returns dash for null', () => {
    const result = formatPrice(null)
    expect(result).toBe('—')
  })

  // Test 6: Undefined handling
  it('returns dash for undefined', () => {
    const result = formatPrice(undefined)
    expect(result).toBe('—')
  })

  // Test 7: Edge case - very small number
  it('formats very small numbers', () => {
    const result = formatPrice(0.01)
    expect(result).toBe('₺0,01')
  })
})

/**
 * Testing formatDate()
 *
 * This function formats dates in Turkish format with time.
 * We test different input types and edge cases.
 */
describe('formatDate', () => {
  // Test 1: Date object
  it('formats Date object correctly', () => {
    const date = new Date('2024-01-15T14:30:00')
    const result = formatDate(date)
    // Note: Exact format depends on locale, so we check for components
    expect(result).toContain('Oca')  // "Oca" = January in Turkish
    expect(result).toContain('2024')
    expect(result).toContain('14')
    expect(result).toContain('30')
  })

  // Test 2: ISO string
  it('formats ISO date string correctly', () => {
    const result = formatDate('2024-01-15T14:30:00Z')
    expect(result).toContain('Oca')
    expect(result).toContain('2024')
  })

  // Test 3: Null handling
  it('returns dash for null', () => {
    const result = formatDate(null)
    expect(result).toBe('—')
  })

  // Test 4: Undefined handling
  it('returns dash for undefined', () => {
    const result = formatDate(undefined)
    expect(result).toBe('—')
  })
})

/**
 * Testing formatDateShort()
 *
 * Similar to formatDate but without time.
 */
describe('formatDateShort', () => {
  it('formats date without time', () => {
    const date = new Date('2024-01-15T14:30:00')
    const result = formatDateShort(date)
    // Should contain day and month, but NOT time
    expect(result).toContain('15')
    expect(result).toContain('Oca')
    expect(result).not.toContain('14:30')
  })

  it('returns dash for null', () => {
    expect(formatDateShort(null)).toBe('—')
  })
})

/**
 * Testing cn() - className merger
 *
 * This is a utility for merging Tailwind classes.
 * We test that it properly combines class names.
 */
describe('cn', () => {
  it('merges multiple class names', () => {
    const result = cn('px-2', 'py-1', 'bg-blue-500')
    expect(result).toContain('px-2')
    expect(result).toContain('py-1')
    expect(result).toContain('bg-blue-500')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  it('handles arrays and objects', () => {
    const result = cn(['class1', 'class2'], { class3: true, class4: false })
    expect(result).toContain('class1')
    expect(result).toContain('class2')
    expect(result).toContain('class3')
    expect(result).not.toContain('class4')
  })

  it('deduplicates conflicting Tailwind classes', () => {
    // tailwind-merge should keep the last class
    const result = cn('p-2', 'p-4')
    expect(result).toBe('p-4')
  })
})

/**
 * WHAT YOU LEARNED:
 *
 * 1. How to structure tests with describe/it
 * 2. The AAA pattern (Arrange, Act, Assert)
 * 3. Testing different input types (normal, null, undefined)
 * 4. Testing edge cases
 * 5. Using expect() with various matchers (toBe, toContain, etc.)
 *
 * NEXT STEPS:
 * 1. Run these tests: npm test utils.test.ts
 * 2. Try breaking a function and watch tests fail
 * 3. Fix it and watch tests pass
 * 4. Move on to component tests!
 */
