-- =============================================================================
-- Livefy — Migración incremental para bases Supabase existentes
-- Fecha: 2026-05-19
-- =============================================================================
-- Ejecutar en Supabase SQL Editor si la base ya existía antes de la revisión.
-- Es idempotente en lo posible y no borra datos de negocio.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Songs: columnas actuales usadas por la app
-- -----------------------------------------------------------------------------
ALTER TABLE songs ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS artwork_url text;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics text;

-- La app actual no usa la columna key. No se borra aquí para evitar pérdida de
-- datos accidental; si quieres eliminarla, hazlo manualmente tras exportar datos.

-- -----------------------------------------------------------------------------
-- Suggestions: tabla y RLS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suggestions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       text NOT NULL,
  artist      text,
  session_id  text NOT NULL,
  event_id    uuid REFERENCES events(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_event_id ON suggestions(event_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suggestions_service" ON suggestions;
CREATE POLICY "suggestions_service"
  ON suggestions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- Setlist: evitar entradas duplicadas por evento/canción
-- -----------------------------------------------------------------------------
-- Si esta sentencia falla por duplicados existentes, revisa primero:
-- SELECT event_id, song_id, count(*)
-- FROM setlist_entries
-- GROUP BY event_id, song_id
-- HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS idx_setlist_entries_event_song_unique
  ON setlist_entries(event_id, song_id);

-- -----------------------------------------------------------------------------
-- Votes: cerrar escritura/lectura directa y forzar uso de /api/votes
-- -----------------------------------------------------------------------------
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "votes_read_public" ON votes;
DROP POLICY IF EXISTS "votes_insert_public" ON votes;
DROP POLICY IF EXISTS "votes_write_service" ON votes;
DROP POLICY IF EXISTS "votes_service" ON votes;

CREATE POLICY "votes_service"
  ON votes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RPC: reordenar setlist al confirmar Bizum
-- -----------------------------------------------------------------------------
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
  SELECT event_id INTO v_event_id
  FROM setlist_entries
  WHERE id = p_entry_id;

  SELECT position INTO v_playing_pos
  FROM setlist_entries
  WHERE event_id = v_event_id
    AND status = 'playing'
  LIMIT 1;

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

  UPDATE setlist_entries
  SET position = position + 1
  WHERE event_id = v_event_id
    AND id <> p_entry_id
    AND position >= v_target_position;

  UPDATE setlist_entries
  SET position = v_target_position,
      tier     = p_new_tier
  WHERE id = p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Storage manual requerido
-- -----------------------------------------------------------------------------
-- En Supabase Dashboard > Storage:
-- 1. Crear bucket "song-images"
-- 2. Marcarlo como PUBLIC
-- 3. Allowed MIME types: image/jpeg, image/png, image/webp
-- 4. Max file size: 5MB
