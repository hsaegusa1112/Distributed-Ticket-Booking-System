CREATE TABLE events (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE showings (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id),
  starts_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  showing_id UUID NOT NULL REFERENCES showings(id),
  customer_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX showings_event_id_idx ON showings(event_id);
CREATE INDEX bookings_showing_id_idx ON bookings(showing_id);