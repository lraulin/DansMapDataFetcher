-- Table: public.incident_reports

-- DROP TABLE public.incident_reports;

CREATE OR REPLACE FUNCTION update_changetimestamp_column
()
RETURNS TRIGGER AS $$
BEGIN
   NEW.changetimestamp = now
();
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE incident_reports
(
    incident_id SERIAL NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created INTEGER,
    injuries INTEGER,
    fatalities INTEGER,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    type VARCHAR(50),
    crisis_type VARCHAR(50),
    incident_type VARCHAR(50),
    tweet_id BIGINT,
    user_id VARCHAR(50),
    description VARCHAR(500)
);

CREATE TRIGGER set_timestamp
BEFORE
UPDATE ON incident_reports
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp
();