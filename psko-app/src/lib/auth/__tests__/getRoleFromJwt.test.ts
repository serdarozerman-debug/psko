import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { getRoleFromJwt } from '../getRoleFromJwt'

describe('getRoleFromJwt', () => {
  test('test_getRoleFromJwt_withEducatorInAppMetadata_returnsEducator', () => {
    const payload = {
      app_metadata: { role: 'EDUCATOR' },
      user_metadata: { role: 'STUDENT' },
    }
    const result = getRoleFromJwt(payload)
    assert.equal(result, 'EDUCATOR')
  })

  test('test_getRoleFromJwt_withStudentInAppMetadata_returnsStudent', () => {
    const payload = { app_metadata: { role: 'STUDENT' } }
    const result = getRoleFromJwt(payload)
    assert.equal(result, 'STUDENT')
  })

  test('test_getRoleFromJwt_withNoAppMetadata_returnsStudent', () => {
    const payload = {}
    const result = getRoleFromJwt(payload)
    assert.equal(result, 'STUDENT')
  })

  test('test_getRoleFromJwt_withOnlyUserMetadata_returnsStudent', () => {
    // user_metadata MUST NEVER be trusted for authorization
    const payload = { user_metadata: { role: 'EDUCATOR' } }
    const result = getRoleFromJwt(payload)
    assert.equal(result, 'STUDENT')
  })

  test('test_getRoleFromJwt_withNullPayload_returnsStudent', () => {
    const result = getRoleFromJwt(null)
    assert.equal(result, 'STUDENT')
  })
})
