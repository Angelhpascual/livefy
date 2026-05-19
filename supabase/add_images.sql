-- Añadir columna de imágenes a songs (array de URLs, máximo 2)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- Artwork de portada usado en tarjetas y banners
ALTER TABLE songs ADD COLUMN IF NOT EXISTS artwork_url text;

-- Eliminar tono (viene en las imágenes)
ALTER TABLE songs DROP COLUMN IF EXISTS key;

-- Mantener lyrics para canciones donde se conocen los acordes de memoria
ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics text;

-- EJECUTAR EN SUPABASE DASHBOARD > STORAGE:
-- 1. Crear bucket llamado "song-images"
-- 2. Marcar como PUBLIC
-- 3. Allowed MIME types: image/jpeg, image/png, image/webp
-- 4. Max file size: 5MB
