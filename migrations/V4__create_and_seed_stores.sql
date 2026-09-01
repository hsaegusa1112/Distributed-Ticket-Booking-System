CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stores (id, name, address, city, phone) VALUES
  ('44444444-4444-4444-4444-444444444441', 'Midtown Box Office', '123 Market Street', 'San Francisco', '+1-415-555-0141'),
  ('44444444-4444-4444-4444-444444444442', 'Harbor Tickets', '47 Pier Avenue', 'Oakland', '+1-510-555-0187'),
  ('44444444-4444-4444-4444-444444444443', 'Northside Events', '808 Linden Road', 'Berkeley', '+1-510-555-0124');
