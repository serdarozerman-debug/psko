/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { requireUser } from '../requireUser'

describe('requireUser', () => {
  test('test_requireUser_withValidSession_returnsUser', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'u1', email: 'test@test.com' } },
          error: null,
        }),
      },
    }

    // Act
    const user = await requireUser(mockSupabase as any)

    // Assert
    assert.equal(user.id, 'u1')
  })

  test('test_requireUser_withNoSession_throws', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: null,
        }),
      },
    }

    // Act + Assert: unauthenticated must throw
    await assert.rejects(
      async () => await requireUser(mockSupabase as any),
    )
  })
})
