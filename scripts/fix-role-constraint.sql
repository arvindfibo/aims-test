-- Script to fix the role constraint issue
-- Run this in your PostgreSQL database if you're experiencing constraint errors

-- Step 1: Check current foreign key constraints on user_roles table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'user_roles'
  AND ccu.table_name = 'roles';

-- Step 2: Drop the foreign key constraint if it exists
-- Replace 'FK_b23c65e50a758245a33ee35fda1' with the actual constraint name from Step 1
DO $$
DECLARE
    fk_constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name
    SELECT constraint_name INTO fk_constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'user_roles'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%role%';
    
    IF fk_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS %I', fk_constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: %', fk_constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found';
    END IF;
END $$;

-- Step 3: Check the primary key on roles table
SELECT 
    constraint_name,
    table_name,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'roles'
  AND tc.constraint_type = 'PRIMARY KEY';

-- Step 4: Verify the data types
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('roles', 'user_roles')
  AND column_name IN ('id', 'role_id')
ORDER BY table_name, column_name;

