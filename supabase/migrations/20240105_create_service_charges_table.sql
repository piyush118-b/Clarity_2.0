-- Create service_charges table
CREATE TABLE service_charges (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);