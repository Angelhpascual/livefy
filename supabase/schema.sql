-- =============================================================================
-- Livefy — Esquema de base de datos para Supabase (PostgreSQL)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONES
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ---------------------------------------------------------------------------
-- TABLAS
-- ---------------------------------------------------------------------------

CREATE TABLE songs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      text NOT NULL,
  artist     text NOT NULL,
  key        text,
  lyrics     text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE events (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           text,
  date           date,
  active         boolean DEFAULT false,
  bizum_number   text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE setlist_entries (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id           uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  song_id            uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position           integer NOT NULL,
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'playing', 'played')),
  tier               text NOT NULL DEFAULT 'free'    CHECK (tier   IN ('free', 'priority', 'next')),
  votes              integer DEFAULT 0,
  dedication         text,
  bizum_confirmed    boolean DEFAULT false,
  requester_session  text,
  created_at         timestamptz DEFAULT now()
);

CREATE TABLE votes (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setlist_entry_id  uuid NOT NULL REFERENCES setlist_entries(id) ON DELETE CASCADE,
  session_id        text NOT NULL,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (setlist_entry_id, session_id)
);


-- ---------------------------------------------------------------------------
-- ÍNDICES
-- ---------------------------------------------------------------------------
CREATE INDEX idx_setlist_entries_event_id  ON setlist_entries(event_id);
CREATE INDEX idx_setlist_entries_status    ON setlist_entries(status);
CREATE INDEX idx_setlist_entries_position  ON setlist_entries(position);
CREATE INDEX idx_votes_setlist_entry_id    ON votes(setlist_entry_id);


-- ---------------------------------------------------------------------------
-- TRIGGER — sincronizar votes count en setlist_entries
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE setlist_entries
    SET votes = votes + 1
    WHERE id = NEW.setlist_entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE setlist_entries
    SET votes = votes - 1
    WHERE id = OLD.setlist_entry_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_votes_count
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION sync_votes_count();


-- ---------------------------------------------------------------------------
-- FUNCIÓN — reordenar setlist al confirmar un pago (tier upgrade)
--
-- Reglas:
--   tier = 'next'     → position = playing_position + 1
--   tier = 'priority' → position = playing_position + 2
--
-- El resto de entries con posición >= destino se desplazan +1.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reorder_on_tier_upgrade(
  p_entry_id  uuid,
  p_new_tier  text
)
RETURNS void AS $$
DECLARE
  v_event_id        uuid;
  v_playing_pos     integer;
  v_target_position integer;
BEGIN
  -- Obtener event_id de la entry
  SELECT event_id INTO v_event_id
  FROM setlist_entries
  WHERE id = p_entry_id;

  -- Posición de la canción que está sonando
  SELECT position INTO v_playing_pos
  FROM setlist_entries
  WHERE event_id = v_event_id
    AND status = 'playing'
  LIMIT 1;

  -- Si no hay canción en playing, no reordenamos
  IF v_playing_pos IS NULL THEN
    RETURN;
  END IF;

  IF p_new_tier = 'next' THEN
    v_target_position := v_playing_pos + 1;
  ELSIF p_new_tier = 'priority' THEN
    v_target_position := v_playing_pos + 2;
  ELSE
    RETURN;
  END IF;

  -- Desplazar las entries que ocupan la posición destino en adelante
  UPDATE setlist_entries
  SET position = position + 1
  WHERE event_id = v_event_id
    AND id <> p_entry_id
    AND position >= v_target_position;

  -- Mover la entry al destino y actualizar su tier
  UPDATE setlist_entries
  SET position = v_target_position,
      tier     = p_new_tier
  WHERE id = p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE songs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes            ENABLE ROW LEVEL SECURITY;

-- songs: lectura pública, escritura solo service_role
CREATE POLICY "songs_read_public"
  ON songs FOR SELECT
  USING (true);

CREATE POLICY "songs_write_service"
  ON songs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- events: lectura pública (todos los eventos), escritura solo service_role
CREATE POLICY "events_read_public"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "events_write_service"
  ON events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- setlist_entries: lectura pública, escritura solo service_role
CREATE POLICY "setlist_entries_read_public"
  ON setlist_entries FOR SELECT
  USING (true);

CREATE POLICY "setlist_entries_write_service"
  ON setlist_entries FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- votes: lectura pública, inserción pública (la constraint UNIQUE evita duplicados),
--        borrado/actualización solo service_role
CREATE POLICY "votes_read_public"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "votes_insert_public"
  ON votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "votes_write_service"
  ON votes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- ---------------------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE setlist_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
