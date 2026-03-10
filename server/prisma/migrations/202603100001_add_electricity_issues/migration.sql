-- Create enums for electricity issues
CREATE TYPE "issue_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE "issue_priority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "issue_category" AS ENUM ('billing', 'meter', 'connection', 'other');

-- CreateTable
CREATE TABLE "electricity_issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "issue_category" NOT NULL DEFAULT 'other',
    "status" "issue_status" NOT NULL DEFAULT 'open',
    "priority" "issue_priority" NOT NULL DEFAULT 'medium',
    "assigned_to" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "electricity_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_electricity_issues_subscriber_id"
    ON "electricity_issues"("subscriber_id");

-- CreateIndex
CREATE INDEX "idx_electricity_issues_client_id"
    ON "electricity_issues"("client_id");

-- CreateIndex
CREATE INDEX "idx_electricity_issues_assigned_to"
    ON "electricity_issues"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_electricity_issues_status"
    ON "electricity_issues"("status");

-- AddForeignKey
ALTER TABLE "electricity_issues"
    ADD CONSTRAINT "electricity_issues_subscriber_id_fkey"
    FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "electricity_issues"
    ADD CONSTRAINT "electricity_issues_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "electricity_issues"
    ADD CONSTRAINT "electricity_issues_assigned_to_fkey"
    FOREIGN KEY ("assigned_to") REFERENCES "employees"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
