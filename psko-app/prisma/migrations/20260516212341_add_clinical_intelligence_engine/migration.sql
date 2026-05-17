-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "current_phase" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "intake_responses" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "formulation" JSONB NOT NULL,
    "recommended_approach" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intake_responses_session_id_key" ON "intake_responses"("session_id");

-- AddForeignKey
ALTER TABLE "intake_responses" ADD CONSTRAINT "intake_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
