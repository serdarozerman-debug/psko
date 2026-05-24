-- Educator Features: cohorts, assignments, custom personas, feedback scores
-- Phase 3 educator-features spec

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'EDUCATOR');

-- CreateEnum
CREATE TYPE "PersonaVisibility" AS ENUM ('private', 'institution');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ScoreAssessor" AS ENUM ('ai', 'instructor');

-- AlterTable: users
ALTER TABLE "users"
    ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    ADD COLUMN "institution_id" TEXT;

-- Backfill existing user rows (DEFAULT covers new rows; this is explicit for clarity)
UPDATE "users" SET "role" = 'STUDENT' WHERE "role" IS NULL;

-- AlterTable: personas
ALTER TABLE "personas"
    ADD COLUMN "created_by" TEXT,
    ADD COLUMN "is_custom" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "visibility" "PersonaVisibility" NOT NULL DEFAULT 'private',
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: sessions
ALTER TABLE "sessions"
    ADD COLUMN "assignment_id" TEXT,
    ADD COLUMN "lti_line_item_url" VARCHAR(500),
    ADD COLUMN "lti_user_id" VARCHAR(255),
    ADD COLUMN "instructor_annotation" TEXT,
    ADD COLUMN "overall_score" INTEGER;

-- CreateTable: cohorts
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "join_code" VARCHAR(6) NOT NULL,
    "join_code_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_join_code_key" ON "cohorts"("join_code");

-- CreateTable: cohort_memberships
CREATE TABLE "cohort_memberships" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "cohort_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cohort_memberships_cohort_id_student_id_key" ON "cohort_memberships"("cohort_id", "student_id");

-- CreateTable: assignments
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "approach_id" VARCHAR(50),
    "role_mode" "RoleMode" NOT NULL DEFAULT 'THERAPIST',
    "due_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: session_feedback_scores
CREATE TABLE "session_feedback_scores" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "domain" VARCHAR(100) NOT NULL,
    "score" INTEGER NOT NULL,
    "assessor" "ScoreAssessor" NOT NULL DEFAULT 'ai',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_feedback_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_feedback_scores_session_id_domain_idx" ON "session_feedback_scores"("session_id", "domain");

-- AddForeignKey: personas.created_by -> users.id
ALTER TABLE "personas" ADD CONSTRAINT "personas_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: sessions.assignment_id -> assignments.id
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: cohorts.instructor_id -> users.id
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: cohort_memberships.cohort_id -> cohorts.id
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_cohort_id_fkey"
    FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: cohort_memberships.student_id -> users.id
ALTER TABLE "cohort_memberships" ADD CONSTRAINT "cohort_memberships_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: assignments.cohort_id -> cohorts.id
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_cohort_id_fkey"
    FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: assignments.persona_id -> personas.id
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_persona_id_fkey"
    FOREIGN KEY ("persona_id") REFERENCES "personas"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: assignments.created_by -> users.id
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: session_feedback_scores.session_id -> sessions.id
ALTER TABLE "session_feedback_scores" ADD CONSTRAINT "session_feedback_scores_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
