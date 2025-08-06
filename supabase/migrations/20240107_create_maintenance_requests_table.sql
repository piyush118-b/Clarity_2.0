-- Create maintenance_requests table
CREATE TABLE maintenance_requests (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  image_path TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);