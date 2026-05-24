/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { requireEducator } from '../requireEducator'

describe('requireEducator', () => {
  test('test_requireEducator_withEducatorRole_returnsUser', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    }
    const mockPrisma = {
      user: {
        findUnique: async () => ({ id: 'user-123', role: 'EDUCATOR' }),
      },
    }

    // Act
    const user = await requireEducator(mockSupabase as any, mockPrisma as any)

    // Assert
    assert.equal(user.id, 'user-123')
  })

  test('test_requireEducator_withStudentRole_throws', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'user-456' } },
          error: null,
        }),
      },
    }
    const mockPrisma = {
      user: {
        findUnique: async () => ({ id: 'user-456', role: 'STUDENT' }),
      },
    }

    // Act + Assert: must throw for non-educator
    await assert.rejects(
      async () => await requireEducator(mockSupabase as any, mockPrisma as any),
    )
  })

  test('test_requireEducator_withNoSession_throws', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: null,
        }),
      },
    }
    const mockPrisma = {
      user: {
        findUnique: async () => null,
      },
    }

    // Act + Assert: no authenticated user must throw
    await assert.rejects(
      async () => await requireEducator(mockSupabase as any, mockPrisma as any),
    )
  })

  test('test_requireEducator_ignoresUserMetadataRole_throwsForStudent', async () => {
    // Arrange: Supabase user has user_metadata.role = 'EDUCATOR'
    // but DB (authoritative source) has role = 'STUDENT'
    const mockSupabase = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'user-789',
              user_metadata: { role: 'EDUCATOR' },
            },
          },
          error: null,
        }),
      },
    }
    const mockPrisma = {
      user: {
        findUnique: async () => ({ id: 'user-789', role: 'STUDENT' }),
      },
    }

    // Act + Assert: DB role = STUDENT must throw regardless of user_metadata
    await assert.rejects(
      async () => await requireEducator(mockSupabase as any, mockPrisma as any),
    )
  })
})
