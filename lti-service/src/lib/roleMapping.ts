/**
 * LTI v1.3 role-URN → PSKO role mapping.
 *
 * Highest privilege wins (Instructor over Learner) so TAs etc. with both
 * roles still land in the educator surface.
 *
 * Unknown / empty role lists fall back to 'student' — never elevate by accident.
 */

export type PskoRole = 'educator' | 'student';

const INSTRUCTOR_URN = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor';
const LEARNER_URN = 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner';

export function mapLtiRoles(roles: ReadonlyArray<string>): PskoRole {
  if (roles.includes(INSTRUCTOR_URN)) return 'educator';
  if (roles.includes(LEARNER_URN)) return 'student';
  return 'student';
}

export const LTI_ROLE_URNS = {
  INSTRUCTOR: INSTRUCTOR_URN,
  LEARNER: LEARNER_URN,
} as const;
