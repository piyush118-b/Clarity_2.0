-- Create agreements table
CREATE TABLE agreements (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP
);