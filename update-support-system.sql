-- Update maintenance_requests table to support unified support system
-- Add new columns for category, assignment, and priority

ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'maintenance' CHECK (category IN ('maintenance', 'general_support')),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Update existing records to have default values
UPDATE maintenance_requests 
SET category = 'maintenance', priority = 'medium' 
WHERE category IS NULL OR priority IS NULL;

-- Create index for better performance on category and assigned_to columns
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_category ON maintenance_requests(category);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status_category ON maintenance_requests(status, category);

-- Create a view for support tickets with user details
CREATE OR REPLACE VIEW support_tickets_view AS
SELECT 
    mr.*,
    tenant_profile.email as tenant_email,
    assigned_profile.email as assigned_email,
    assigner_profile.email as assigned_by_email
FROM maintenance_requests mr
LEFT JOIN auth.users tenant_profile ON mr.tenant_id = tenant_profile.id
LEFT JOIN auth.users assigned_profile ON mr.assigned_to = assigned_profile.id
LEFT JOIN auth.users assigner_profile ON mr.assigned_by = assigner_profile.id;

-- Grant permissions for the view
GRANT SELECT ON support_tickets_view TO authenticated;
