-- Script to fix database state if migration partially failed
-- Run this BEFORE retrying the migration if it failed partway through

-- Step 1: Check current state of foreign keys
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table_name,
    ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'roles'
ORDER BY tc.table_name, tc.constraint_name;

-- Step 2: Drop ALL foreign key constraints that reference roles.id
-- This will allow the migration to proceed
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    FOR fk_record IN
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'roles'
          AND ccu.column_name = 'id'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I CASCADE', 
                       fk_record.table_name, 
                       fk_record.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: %.%', fk_record.table_name, fk_record.constraint_name;
    END LOOP;
END $$;

-- Step 3: Check if temporary columns exist (from partial migration)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE (table_name = 'roles' AND column_name IN ('id_new', 'id_old'))
   OR (table_name = 'user_roles' AND column_name IN ('role_id_new', 'role_id_old'))
ORDER BY table_name, column_name;

-- Step 4: Clean up temporary columns if they exist (uncomment if needed)
-- ALTER TABLE roles DROP COLUMN IF EXISTS id_new;
-- ALTER TABLE roles DROP COLUMN IF EXISTS id_old;
-- ALTER TABLE user_roles DROP COLUMN IF EXISTS role_id_new;
-- ALTER TABLE user_roles DROP COLUMN IF EXISTS role_id_old;

-- Step 5: Check primary key constraint name
SELECT 
    constraint_name,
    table_name
FROM information_schema.table_constraints
WHERE table_name = 'roles'
  AND constraint_type = 'PRIMARY KEY';

-- Step 6: Verify current data types
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('roles', 'user_roles')
  AND column_name IN ('id', 'role_id')
ORDER BY table_name, column_name;

