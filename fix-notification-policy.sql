-- Fix notification creation policy to allow any authenticated user to create notifications
-- This allows tenants to notify admins about maintenance requests, payments, etc.

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- Create a new policy that allows any authenticated user to create notifications
CREATE POLICY "Authenticated users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;