/**
 * LESSON 2: BASIC COMPONENT TESTS
 *
 * This file demonstrates testing React components.
 * We test a simple button to learn the fundamentals.
 *
 * Key Concepts:
 * - render(): Renders a component for testing
 * - screen: Query the rendered component
 * - userEvent: Simulate user interactions
 * - Testing behavior, not implementation
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

/**
 * Testing the Button Component
 *
 * We test:
 * 1. Rendering with text
 * 2. Click events
 * 3. Disabled state
 * 4. Different variants
 */
describe('Button Component', () => {
  /**
   * Test 1: Basic Rendering
   *
   * Checks if button renders with correct text.
   * This is the simplest component test.
   */
  it('renders with text', () => {
    // Arrange: Render the component
    render(<Button>Click me</Button>)

    // Act: Find the button
    const button = screen.getByRole('button', { name: /click me/i })

    // Assert: Check it exists
    expect(button).toBeInTheDocument()
  })

  /**
   * Test 2: Click Handler
   *
   * Tests that clicking the button calls the onClick handler.
   * We use vi.fn() to create a "spy" function that tracks calls.
   */
  it('calls onClick when clicked', async () => {
    // Arrange: Create a mock function
    const handleClick = vi.fn()

    // Arrange: Set up user event (recommended over fireEvent)
    const user = userEvent.setup()

    // Arrange: Render with onClick handler
    render(<Button onClick={handleClick}>Click me</Button>)

    // Act: Click the button
    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    // Assert: Check the function was called
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  /**
   * Test 3: Disabled State
   *
   * Tests that disabled buttons don't respond to clicks.
   */
  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    )

    const button = screen.getByRole('button', { name: /click me/i })

    // Assert: Button is disabled
    expect(button).toBeDisabled()

    // Act: Try to click
    await user.click(button)

    // Assert: onClick was NOT called
    expect(handleClick).not.toHaveBeenCalled()
  })

  /**
   * Test 4: Multiple Clicks
   *
   * Tests that button can be clicked multiple times.
   */
  it('handles multiple clicks', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')

    // Act: Click 3 times
    await user.click(button)
    await user.click(button)
    await user.click(button)

    // Assert: Called 3 times
    expect(handleClick).toHaveBeenCalledTimes(3)
  })

  /**
   * Test 5: Different Variants
   *
   * Tests that different button variants render correctly.
   */
  it('renders different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    // rerender() lets us test the same component with different props
    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  /**
   * Test 6: With Icon
   *
   * Tests button with children (text + icon).
   */
  it('renders with icon', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Icon')
    expect(button).toHaveTextContent('Text')
  })
})

/**
 * SCREEN QUERIES EXPLAINED
 *
 * React Testing Library provides several query methods.
 * Use in this order of preference:
 *
 * 1. getByRole() - BEST (accessibility)
 *    screen.getByRole('button', { name: /click me/i })
 *
 * 2. getByLabelText() - Good for forms
 *    screen.getByLabelText('Email')
 *
 * 3. getByPlaceholderText() - For inputs
 *    screen.getByPlaceholderText('Enter email')
 *
 * 4. getByText() - For non-interactive elements
 *    screen.getByText('Welcome')
 *
 * 5. getByTestId() - LAST RESORT
 *    screen.getByTestId('custom-element')
 *
 * Variants:
 * - getBy: Throws error if not found (use for elements that must exist)
 * - queryBy: Returns null if not found (use for elements that might not exist)
 * - findBy: Returns promise (use for async elements)
 */

/**
 * USER EVENT vs FIRE EVENT
 *
 * Always prefer userEvent over fireEvent:
 *
 * ❌ fireEvent.click(button)
 * ✅ await user.click(button)
 *
 * Why? userEvent simulates real user behavior:
 * - Follows browser event sequence
 * - Includes focus, blur, etc.
 * - More accurate testing
 */

/**
 * WHAT YOU LEARNED:
 *
 * 1. How to render React components for testing
 * 2. How to find elements using screen queries
 * 3. How to simulate user interactions with userEvent
 * 4. How to create mock functions with vi.fn()
 * 5. How to test disabled state
 * 6. How to rerender components with different props
 *
 * NEXT STEPS:
 * 1. Run: npm test button.test.tsx
 * 2. Try modifying the tests
 * 3. Move on to form tests!
 */
