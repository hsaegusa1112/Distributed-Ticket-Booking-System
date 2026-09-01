CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (char_length(username) BETWEEN 3 AND 64),
  CHECK (char_length(password_hash) > 0)
);

ALTER TABLE bookings
  ADD CONSTRAINT bookings_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES users(id);

ALTER TABLE events
  ADD COLUMN image_url TEXT NOT NULL DEFAULT '';

INSERT INTO events (id, title, event_type, image_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Afterlight', 'Cinema premiere', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=85'),
  ('22222222-2222-2222-2222-222222222222', 'Echoes at Dusk', 'Live concert', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85'),
  ('33333333-3333-3333-3333-333333333333', 'The Archive', 'Immersive exhibition', 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85');

INSERT INTO showings (id, event_id, starts_at, capacity)
SELECT
  md5(format('%s:%s:%s', event_id, day_number, slot_number))::UUID,
  event_id,
  date '2026-09-01' + (day_number - 1) + slot_time + schedule_offset,
  120
FROM (
  VALUES
    ('11111111-1111-1111-1111-111111111111'::UUID, interval '0 hours'),
    ('22222222-2222-2222-2222-222222222222'::UUID, interval '2 hours'),
    ('33333333-3333-3333-3333-333333333333'::UUID, interval '1 hour')
) AS event_data(event_id, schedule_offset)
CROSS JOIN (VALUES (1), (2), (3)) AS days(day_number)
CROSS JOIN (
  VALUES
    (1, time '11:30'),
    (2, time '14:15'),
    (3, time '17:45'),
    (4, time '20:30')
) AS slots(slot_number, slot_time);