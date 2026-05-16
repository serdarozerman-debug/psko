-- CreateEnum
CREATE TYPE "RoleMode" AS ENUM ('THERAPIST', 'CLIENT');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "role_mode" "RoleMode" NOT NULL DEFAULT 'THERAPIST';
