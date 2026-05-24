/**
 * Role mapping test (FR-3).
 *
 * mapLtiRoles(roles) returns the highest-privilege PSKO role found:
 *   Instructor URN → 'educator'
 *   Learner URN    → 'student'
 *   anything else  → 'student' (safe default)
 *
 * Instructor wins if both present (covers TAs etc).
 */
import { mapLtiRoles } from '../lib/roleMapping';

const INSTRUCTOR = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor';
const LEARNER = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner';

describe('mapLtiRoles', () => {
  it('maps Instructor URN to educator', () => {
    expect(mapLtiRoles([INSTRUCTOR])).toBe('educator');
  });
  it('maps Learner URN to student', () => {
    expect(mapLtiRoles([LEARNER])).toBe('student');
  });
  it('Instructor wins over Learner', () => {
    expect(mapLtiRoles([LEARNER, INSTRUCTOR])).toBe('educator');
  });
  it('unknown roles fall back to student', () => {
    expect(mapLtiRoles(['http://purl.imsglobal.org/vocab/lis/v2/system/person#User'])).toBe('student');
    expect(mapLtiRoles([])).toBe('student');
  });
});
