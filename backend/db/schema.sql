CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_role AS ENUM ('provider', 'recipient', 'volunteer', 'admin');
CREATE TYPE listing_status AS ENUM ('active', 'claimed', 'completed', 'expired');
CREATE TYPE claim_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  name TEXT NOT NULL,
  phone_hash TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT,
  location GEOGRAPHY (Point, 4326),
  rating_avg NUMERIC(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  food_type TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  quantity_kg NUMERIC(10, 2),
  servings_est INT,
  pickup_window_start TIMESTAMPTZ NOT NULL,
  pickup_window_end TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status listing_status NOT NULL DEFAULT 'active',
  location GEOGRAPHY (Point, 4326) NOT NULL,
  allergen_flags TEXT[] NOT NULL DEFAULT '{}',
  safety_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX listings_location_gix ON listings USING GIST (location);
CREATE INDEX listings_status_expires_idx ON listings (status, expires_at);

CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  otp_hash TEXT,
  qr_token TEXT UNIQUE,
  confirmed_at TIMESTAMPTZ,
  status claim_status NOT NULL DEFAULT 'pending',
  UNIQUE (listing_id)
);

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, rater_id)
);
