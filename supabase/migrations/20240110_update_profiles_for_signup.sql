-- Update profiles table to support direct role assignment during signup
-- Remove the trigger that sets role to 'pending' since we'll set it directly

DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_profile_for_new_user();

-- Update existing profiles table structure if needed
ALTER TABLE profiles ALTER COLUMN role TYPE VARCHAR(50);

-- Add constraint to ensure valid roles
ALTER TABLE profiles ADD CONSTRAINT valid_roles CHECK (role IN ('admin', 'tenant', 'service_provider'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update maintenance_requests table to support assignment to service providers
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;

-- Add index for assigned maintenance requests
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned_to ON maintenance_requests(assigned_to);

-- Create a view for easier role-based queries
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  p.role,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

-- Insert sample service provider if not exists for testing
DO $$
DECLARE
  service_user_id uuid;
BEGIN
  -- Check if service provider user exists
  SELECT id INTO service_user_id FROM auth.users WHERE email = 'service@example.com';
  
  IF service_user_id IS NOT NULL THEN
    -- Update or insert profile for service provider
    INSERT INTO profiles (id, role) 
    VALUES (service_user_id, 'service_provider')
    ON CONFLICT (id) DO UPDATE SET role = 'service_provider';
  END IF;
END $$;