-- Create notifications table for system-wide notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'info', -- info, warning, alert, success
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- Enable Row Level Security for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can create notifications
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert some sample data for testing
-- Sample notifications
INSERT INTO notifications (user_id, title, content, notification_type) 
SELECT 
  id,
  'Welcome to the Tenant Portal',
  'Welcome! Please complete your profile and review any pending documents.',
  'info'
FROM auth.users 
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'tenant'
)
ON CONFLICT DO NOTHING;

-- Sample warning notifications for tenants with violations
INSERT INTO notifications (user_id, title, content, notification_type)
SELECT 
  v.tenant_id,
  'Violation Notice',
  'You have received a violation: ' || v.description,
  'warning'
FROM violations v
WHERE v.status = 'active'
ON CONFLICT DO NOTHING;