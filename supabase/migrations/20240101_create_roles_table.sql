-- Create roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert roles
INSERT INTO roles (name) VALUES ('admin'), ('tenant'), ('service_provider');