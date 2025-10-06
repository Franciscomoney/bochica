-- Check the constraint on lockup_period
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'commitments'::regclass 
  AND conname LIKE '%lockup%';
