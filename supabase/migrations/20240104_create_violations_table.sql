-- Create violations table
CREATE TABLE violations (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);