-- Add full_name column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update existing profiles with default names based on their role
UPDATE profiles 
SET full_name = CASE 
  WHEN role = 'admin' THEN 'Admin User'
  WHEN role = 'tenant' THEN 'John Tenant'
  WHEN role = 'service_provider' THEN 'Service Provider Co.'
  ELSE 'Unknown User'
END
WHERE full_name IS NULL;