# Livefy

PWA para músicos en directo que permite a los clientes de un local votar el repertorio en tiempo real y enviar dedicatorias vía Bizum.

---

## Índice

- [Cómo funciona](#cómo-funciona)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación local](#instalación-local)
- [Configuración de Supabase](#configuración-de-supabase)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo de uso](#flujo-de-uso)
- [Panel de administración](#panel-de-administración)
- [Tests](#tests)

---

## Cómo funciona

1. El músico crea un evento y activa su sesión desde el panel admin.
2. Los clientes del local escanean un QR y acceden a la app con su móvil.
3. Cada cliente tiene **3 votos** para distribuir entre las canciones del repertorio.
4. Las canciones con más votos suben en la lista — el setlist se construye en comunidad.
5. Si un cliente quiere una dedicatoria, paga **1 € por Bizum** y el músico la confirma manualmente.
6. El músico ve en tiempo real el estado del setlist, puede marcar canciones como "tocando" o "tocada" y consultar las letras/partituras desde el admin.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL + Realtime) |
| Autenticación admin | Contraseña simple vía cookie |
| Imágenes | Sharp (conversión WebP) |
| Gráficas | Recharts |
| Notificaciones | Sonner |
| Tests unitarios | Jest + React Testing Library |
| Tests e2e | Playwright |
| Despliegue | Vercel |

---

## Requisitos previos

- Node.js 20+
- npm 10+
- Cuenta en [Supabase](https://supabase.com) (plan gratuito suficiente)
- Cuenta en [Vercel](https://vercel.com) (plan gratuito suficiente)

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/Angelhpascual/livefy.git
cd livefy

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales (ver sección siguiente)

# 4. Arrancar el servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

---

## Configuración de Supabase

### 1. Crear proyecto

Crea un nuevo proyecto en [supabase.com](https://supabase.com) y anota:
- Project URL
- Anon key (public)
- Service role key (secret)

### 2. Ejecutar el esquema

En el **SQL Editor** de Supabase, ejecuta el contenido de `supabase/schema.sql`. Esto crea:

- `songs` — repertorio del músico
- `events` — sesiones/actuaciones
- `setlist_entries` — canciones activas en un evento con su estado y votos
- `votes` — votos individuales por sesión (unique por entrada + sesión)
- Trigger `sync_votes_count` — actualiza automáticamente el contador de votos

### 3. Activar Realtime

En Supabase → **Database → Replication**, activa Realtime para las tablas:
- `events`
- `setlist_entries`

### 4. Añadir columna de artwork (opcional)

Si partes de un esquema existente, ejecuta también `supabase/add_images.sql` para añadir las columnas `image_urls` y `artwork_url` a la tabla `songs`.

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase — claves disponibles en Settings > API de tu proyecto
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Contraseña del panel de administración
ADMIN_PASSWORD=tu_contraseña_segura

# Last.fm (opcional, para artwork de artistas como fallback)
NEXT_PUBLIC_LASTFM_API_KEY=tu_api_key
```

> **Nota:** `SUPABASE_SERVICE_ROLE_KEY` nunca se expone al cliente — solo se usa en las rutas de API del servidor.

---

## Despliegue en Vercel

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Vincular y desplegar
vercel link --scope tu-equipo
vercel deploy --prod --scope tu-equipo
```

Las variables de entorno se añaden desde el dashboard de Vercel en **Settings → Environment Variables** o con:

```bash
vercel env add NOMBRE_VARIABLE production --scope tu-equipo
```

Tras el primer despliegue, cada `git push` a `main` dispara un nuevo despliegue automáticamente.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                  # Vista cliente (votación)
│   ├── admin/
│   │   ├── page.tsx              # Panel principal (setlist en directo)
│   │   ├── login/                # Login admin
│   │   ├── events/               # Gestión de eventos
│   │   ├── songs/                # Gestión del repertorio
│   │   └── stats/                # Estadísticas
│   └── api/
│       ├── votes/                # POST votos
│       ├── songs/                # CRUD canciones
│       ├── repertoire/           # GET repertorio completo (real + virtual)
│       ├── artist-image/         # Artwork desde iTunes/Wikipedia
│       └── admin/
│           ├── events/           # CRUD eventos
│           ├── setlist/          # CRUD setlist entries
│           ├── login/            # Autenticación
│           └── stats/            # Datos de estadísticas
├── features/
│   ├── voting/                   # Componentes y hooks del cliente
│   ├── songs/                    # Componentes de canciones (admin)
│   ├── admin/                    # Componentes del panel admin
│   └── realtime/                 # Hooks de Supabase Realtime
├── lib/
│   └── supabase/                 # Clientes anon y service role
└── types/                        # Tipos TypeScript compartidos
supabase/
├── schema.sql                    # Esquema completo de la base de datos
└── add_images.sql                # Migración para columnas de artwork
```

---

## Flujo de uso

### Como músico

1. Accede a `/admin` con tu contraseña.
2. Crea un **evento** nuevo (nombre, fecha, número de Bizum opcional).
3. Activa el evento — los clientes ya pueden acceder a la app.
4. El repertorio completo aparece automáticamente a los clientes como setlist virtual.
5. Durante la actuación, desde el admin puedes:
   - Marcar una canción como **▶ Tocando** — aparece en el banner superior del cliente.
   - Marcarla como **✓ Tocada** — pasa al historial.
   - Añadir canciones extra al setlist manualmente.
   - Ver las **letras/partituras** de lo que estás tocando.
6. Al terminar, consulta las **estadísticas** del evento.

### Como cliente

1. Escanea el QR del local o accede a la URL directamente.
2. Ves el repertorio completo ordenado por votos.
3. Tienes **3 votos** para distribuir como quieras.
4. Para una **dedicatoria** (canción con mensaje personal), selecciona la opción de pago y haz el Bizum al número indicado.
5. El músico confirma la dedicatoria desde su panel.

---

## Panel de administración

| Ruta | Descripción |
|---|---|
| `/admin` | Setlist en directo — gestiona el orden y estado de las canciones |
| `/admin/songs` | Repertorio — añade, edita, sube letras e imágenes de partituras |
| `/admin/events` | Historial de eventos — activa/desactiva sesiones |
| `/admin/stats` | Estadísticas globales y por evento |

### Viewer de letras/partituras

Desde el panel admin, cuando hay una canción tocando, se muestra automáticamente el visor. Soporta:

- **Imágenes** (fotos de partituras) — navegación con flechas del teclado, swipe táctil o pedal MIDI/Bluetooth (PageUp/PageDown).
- **Letras** en texto con acordes.
- Si la canción tiene ambos, aparecen como pestañas.

---

## Tests

```bash
# Tests unitarios
npm test

# Tests en modo watch
npm run test:watch

# Tests e2e (requiere servidor corriendo en localhost:3000)
npx playwright test
```

Cobertura actual:

| Módulo | Tests |
|---|---|
| `useVoting` | Votos, persistencia localStorage, límite de votos, 409 duplicado |
| `POST /api/votes` | Free tier, priority tier, duplicado 409 |
| `GET/POST/PUT/DELETE /api/songs` | CRUD completo |
| `GET/POST/PATCH/DELETE /api/admin/setlist` | Gestión del setlist |
| `POST/PATCH/DELETE /api/admin/events` | Gestión de eventos |
| `getSessionId` | Generación y persistencia de sesión |
| `ScoreViewer` | Renderizado, navegación por teclado, Escape |
