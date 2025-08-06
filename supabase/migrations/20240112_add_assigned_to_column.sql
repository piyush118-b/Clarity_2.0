-- Add assigned_to column to maintenance_requests table for service provider assignment
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Add index for better performance on assigned maintenance requests
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned_to ON maintenance_requests(assigned_to);

-- Update any existing maintenance requests to have null assigned_to (they will remain unassigned)
-- This is safe as the column will be nullable by default