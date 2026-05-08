-- Sugerencias de canciones para futuros eventos
CREATE TABLE suggestions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       text NOT NULL,
  artist      text,
  session_id  text NOT NULL,
  event_id    uuid REFERENCES events(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_suggestions_event_id ON suggestions(event_id);
CREATE INDEX idx_suggestions_created_at ON suggestions(created_at);
