/**
 * LESSON 3: FORM TESTING
 *
 * This file demonstrates testing form inputs and user interactions.
 * Forms are one of the most common things you'll test.
 *
 * Key Concepts:
 * - Testing input changes
 * - Testing form validation
 * - Testing form submission
 * - Async testing with waitFor()
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

/**
 * Simple Form Component for Testing
 *
 * This is a basic form we'll use to demonstrate testing concepts.
 */
function SimpleForm({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simple validation
    if (!email || !password) {
      setError('All fields are required')
      return
    }

    if (!email.includes('@')) {
      setError('Invalid email')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError('')
    onSubmit({ email, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>

      {error && <div role="alert">{error}</div>}

      <Button type="submit">Submit</Button>
    </form>
  )
}

/**
 * Testing the Form Component
 */
describe('SimpleForm', () => {
  /**
   * Test 1: Form Renders
   *
   * Basic test to ensure all form fields render correctly.
   */
  it('renders all form fields', () => {
    render(<SimpleForm onSubmit={vi.fn()} />)

    // Check for labels (good for accessibility)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()

    // Check for submit button
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  /**
   * Test 2: Typing in Inputs
   *
   * Tests that users can type in input fields.
   * This tests the onChange handlers work correctly.
   */
  it('allows typing in input fields', async () => {
    const user = userEvent.setup()

    render(<SimpleForm onSubmit={vi.fn()} />)

    // Find inputs
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // Type in email
    await user.type(emailInput, 'test@example.com')
    expect(emailInput).toHaveValue('test@example.com')

    // Type in password
    await user.type(passwordInput, 'password123')
    expect(passwordInput).toHaveValue('password123')
  })

  /**
   * Test 3: Form Submission with Valid Data
   *
   * Tests the happy path - user fills form correctly and submits.
   */
  it('calls onSubmit with form data when valid', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<SimpleForm onSubmit={handleSubmit} />)

    // Fill out the form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    // Submit the form
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Assert: onSubmit was called with correct data
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  /**
   * Test 4: Validation - Empty Fields
   *
   * Tests that form shows error when fields are empty.
   */
  it('shows error when fields are empty', async () => {
    const user = userEvent.setup()

    render(<SimpleForm onSubmit={vi.fn()} />)

    // Submit without filling anything
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Check for error message
    expect(screen.getByRole('alert')).toHaveTextContent('All fields are required')
  })

  /**
   * Test 5: Validation - Invalid Email
   *
   * Tests email validation.
   */
  it('shows error when email is invalid', async () => {
    const user = userEvent.setup()

    render(<SimpleForm onSubmit={vi.fn()} />)

    // Fill with invalid email
    await user.type(screen.getByLabelText(/email/i), 'notanemail')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Check for error
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email')
  })

  /**
   * Test 6: Validation - Short Password
   *
   * Tests password length validation.
   */
  it('shows error when password is too short', async () => {
    const user = userEvent.setup()

    render(<SimpleForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), '12345') // Too short

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Password must be at least 6 characters'
    )
  })

  /**
   * Test 7: Error Clears on Valid Submission
   *
   * Tests that error message disappears when form becomes valid.
   */
  it('clears error message on valid submission', async () => {
    const user = userEvent.setup()

    render(<SimpleForm onSubmit={vi.fn()} />)

    // First, cause an error
    await user.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Now fix it
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Error should be gone
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  /**
   * Test 8: Submit Prevented on Invalid Data
   *
   * Ensures onSubmit is NOT called when data is invalid.
   */
  it('does not call onSubmit when validation fails', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<SimpleForm onSubmit={handleSubmit} />)

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // onSubmit should NOT be called
    expect(handleSubmit).not.toHaveBeenCalled()
  })
})

/**
 * TESTING FORMS BEST PRACTICES
 *
 * 1. Find inputs by their label (accessibility)
 *    screen.getByLabelText('Email')
 *
 * 2. Use userEvent.type() for realistic typing
 *    await user.type(input, 'text')
 *
 * 3. Test the happy path AND error cases
 *    - Valid submission ✅
 *    - Empty fields ❌
 *    - Invalid data ❌
 *
 * 4. Test that errors clear when fixed
 *
 * 5. Use role="alert" for error messages
 *    Makes them easy to find and accessible
 */

/**
 * WHAT YOU LEARNED:
 *
 * 1. How to test form inputs and typing
 * 2. How to test form submission
 * 3. How to test validation (errors)
 * 4. How to test that errors clear
 * 5. Using queryBy vs getBy (queryBy returns null if not found)
 * 6. Testing user flows (type -> submit -> check result)
 *
 * NEXT STEPS:
 * 1. Run: npm test form-input.test.tsx
 * 2. Try adding more validation scenarios
 * 3. Move on to React Query tests!
 */
