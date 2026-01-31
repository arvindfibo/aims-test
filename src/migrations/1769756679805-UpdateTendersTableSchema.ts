import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTendersTableSchema1769756679805 implements MigrationInterface {
  name = 'UpdateTendersTableSchema1769756679805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create enum types for TenderStatus and EmdStatus
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "tender_status_enum" AS ENUM (
          'Not Filled',
          'On Going',
          'L-1',
          'L-1(work alloted to Us)',
          'L-2',
          'L-3',
          'Quoted',
          'Submitted',
          'Won',
          'Lost',
          'Cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "emd_status_enum" AS ENUM (
          'Pending',
          'Paid',
          'Returned',
          'Not Applicable'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Step 2: Add temporary columns for enum conversion
    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD COLUMN IF NOT EXISTS "tender_status_new" "tender_status_enum",
      ADD COLUMN IF NOT EXISTS "emd_status_new" "emd_status_enum",
      ADD COLUMN IF NOT EXISTS "emd_returned_new" BOOLEAN DEFAULT false
    `);

    // Step 3: Migrate data from old columns to new columns
    // Map existing tender_status values to enum
    await queryRunner.query(`
      UPDATE "tenders"
      SET "tender_status_new" = CASE
        WHEN "tender_status" = 'Not Filled' THEN 'Not Filled'::tender_status_enum
        WHEN "tender_status" = 'On Going' THEN 'On Going'::tender_status_enum
        WHEN "tender_status" LIKE 'L-1%' THEN 'L-1(work alloted to Us)'::tender_status_enum
        WHEN "tender_status" = 'L-1' THEN 'L-1'::tender_status_enum
        WHEN "tender_status" = 'L-2' THEN 'L-2'::tender_status_enum
        WHEN "tender_status" = 'L-3' THEN 'L-3'::tender_status_enum
        WHEN "tender_status" = 'Quoted' THEN 'Quoted'::tender_status_enum
        WHEN "tender_status" = 'Submitted' THEN 'Submitted'::tender_status_enum
        WHEN "tender_status" = 'Won' THEN 'Won'::tender_status_enum
        WHEN "tender_status" = 'Lost' THEN 'Lost'::tender_status_enum
        WHEN "tender_status" = 'Cancelled' THEN 'Cancelled'::tender_status_enum
        ELSE NULL
      END
      WHERE "tender_status" IS NOT NULL
    `);

    // Map existing emd_status values to enum
    await queryRunner.query(`
      UPDATE "tenders"
      SET "emd_status_new" = CASE
        WHEN "emd_status" = 'Pending' THEN 'Pending'::emd_status_enum
        WHEN "emd_status" = 'Paid' THEN 'Paid'::emd_status_enum
        WHEN "emd_status" = 'Returned' THEN 'Returned'::emd_status_enum
        WHEN "emd_status" = 'Not Applicable' OR "emd_status" = 'Not applicable' THEN 'Not Applicable'::emd_status_enum
        ELSE NULL
      END
      WHERE "emd_status" IS NOT NULL
    `);

    // Convert emd_returned from varchar to boolean
    await queryRunner.query(`
      UPDATE "tenders"
      SET "emd_returned_new" = CASE
        WHEN "emd_returned" IS NOT NULL AND "emd_returned" != '' THEN true
        ELSE false
      END
    `);

    // Step 4: Change last_date_of_submission from varchar to timestamp
    // First, add a new timestamp column
    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD COLUMN IF NOT EXISTS "last_date_of_submission_new" TIMESTAMP
    `);

    // Try to parse and migrate existing date strings to timestamp
    // This is a best-effort conversion - some formats may need manual adjustment
    await queryRunner.query(`
      UPDATE "tenders"
      SET "last_date_of_submission_new" = 
        CASE
          WHEN "last_date_of_submission" ~ '^[0-9]{2}-[0-9]{2}-[0-9]{4}' THEN
            TO_TIMESTAMP("last_date_of_submission", 'DD-MM-YYYY HH24:MI')
          WHEN "last_date_of_submission" ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN
            TO_TIMESTAMP("last_date_of_submission", 'DD/MM/YYYY HH24:MI')
          WHEN "last_date_of_submission" ~ '^[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}' THEN
            TO_TIMESTAMP("last_date_of_submission", 'DD.MM.YYYY HH24:MI')
          WHEN "last_date_of_submission" ~ 'Upto [0-9]{2}-[0-9]{2}-[0-9]{4}' THEN
            TO_TIMESTAMP(SUBSTRING("last_date_of_submission" FROM '([0-9]{2}-[0-9]{2}-[0-9]{4})'), 'DD-MM-YYYY')
          ELSE NULL
        END
      WHERE "last_date_of_submission" IS NOT NULL
    `);

    // Step 5: Drop old columns
    await queryRunner.query(`
      ALTER TABLE "tenders"
      DROP COLUMN IF EXISTS "tender_status",
      DROP COLUMN IF EXISTS "emd_status",
      DROP COLUMN IF EXISTS "emd_returned",
      DROP COLUMN IF EXISTS "last_date_of_submission"
    `);

    // Step 6: Rename new columns to original names
    await queryRunner.query(`
      ALTER TABLE "tenders"
      RENAME COLUMN "tender_status_new" TO "tender_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      RENAME COLUMN "emd_status_new" TO "emd_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      RENAME COLUMN "emd_returned_new" TO "emd_returned"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      RENAME COLUMN "last_date_of_submission_new" TO "last_date_of_submission"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add back old varchar columns
    await queryRunner.query(`
      ALTER TABLE "tenders"
      ADD COLUMN IF NOT EXISTS "tender_status_old" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "emd_status_old" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "emd_returned_old" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "last_date_of_submission_old" VARCHAR(255)
    `);

    // Step 2: Convert enum values back to strings
    await queryRunner.query(`
      UPDATE "tenders"
      SET "tender_status_old" = "tender_status"::text,
          "emd_status_old" = "emd_status"::text,
          "emd_returned_old" = CASE WHEN "emd_returned" = true THEN 'Yes' ELSE 'No' END,
          "last_date_of_submission_old" = TO_CHAR("last_date_of_submission", 'DD-MM-YYYY HH24:MI')
      WHERE "tender_status" IS NOT NULL OR "emd_status" IS NOT NULL OR "last_date_of_submission" IS NOT NULL
    `);

    // Step 3: Drop enum columns
    await queryRunner.query(`
      ALTER TABLE "tenders"
      DROP COLUMN IF EXISTS "tender_status",
      DROP COLUMN IF EXISTS "emd_status",
      DROP COLUMN IF EXISTS "emd_returned",
      DROP COLUMN IF EXISTS "last_date_of_submission"
    `);

    // Step 4: Rename old columns back
    await queryRunner.query(`
      ALTER TABLE "tenders"
      RENAME COLUMN "tender_status_old" TO "tender_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      RENAME COLUMN "emd_status_old" TO "emd_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      RENAME COLUMN "emd_returned_old" TO "emd_returned"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenders"
      RENAME COLUMN "last_date_of_submission_old" TO "last_date_of_submission"
    `);

    // Step 5: Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "tender_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "emd_status_enum"`);
  }
}
