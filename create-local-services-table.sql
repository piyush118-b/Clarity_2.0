-- Create local_services table for admin-managed local services
CREATE TABLE local_services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  service_link VARCHAR(500),
  location VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_local_services_created_by ON local_services(created_by);
CREATE INDEX idx_local_services_service_type ON local_services(service_type);
CREATE INDEX idx_local_services_location ON local_services(location);

-- Enable RLS (Row Level Security)
ALTER TABLE local_services ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow admins to insert, update, delete local services
CREATE POLICY "Admins can manage local services" ON local_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role_id = (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- Allow all authenticated users to view local services
CREATE POLICY "All users can view local services" ON local_services
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_local_services_updated_at 
    BEFORE UPDATE ON local_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
