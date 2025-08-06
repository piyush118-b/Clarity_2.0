-- Create payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  charge_id INTEGER REFERENCES service_charges(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'completed'
);