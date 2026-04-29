# TdT — Torneos de Truco

Sistema de gestión de torneos del juego de cartas argentino Truco. Permite a administradores crear torneos, registrar equipos y generar llaves/grupos; los jugadores pueden consultar resultados y standings.

## Monorepo structure

```
apps/
  web/      # Next.js 14 — panel admin + vista jugador (App Router)
  mobile/   # Expo 51 / React Native — app móvil (en desarrollo temprano)
packages/
  db/       # Prisma schema + singleton PrismaClient (@tdt/db)
  types/    # Tipos TypeScript compartidos y enums (@tdt/types)
  ui/       # Librería de componentes compartida (vacía por ahora)
```

## Tech stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | Turborepo 2, npm workspaces |
| Web frontend | Next.js 14 (App Router), React 18, Tailwind CSS 3.4 |
| Auth | NextAuth.js 4 (JWT, credentials email/password) |
| Mobile | Expo 51, React Native 0.74, Expo Router 3.5 |
| ORM | Prisma 5.14 |
| Base de datos | PostgreSQL 16 (Docker) |
| Validación | Zod |
| Lenguaje | TypeScript 5.4 (strict mode) |

## Setup local

### 1. Base de datos (Docker)

```bash
docker compose up -d
```

Levanta PostgreSQL en `localhost:5433`. Los datos persisten en el volumen `postgres_data`.

### 2. Variables de entorno

```bash
copy apps\web\.env.example apps\web\.env
```

El `.env.example` ya tiene los valores correctos para el docker-compose:

```
DATABASE_URL="postgresql://tdt:tdt1234@localhost:5433/tdt"
NEXTAUTH_SECRET="cambiar-por-un-secret-seguro"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Instalar dependencias y preparar DB

```bash
npm install
npm run db:migrate   # crea las tablas
npm run db:seed      # crea usuario admin + datos de ejemplo
```

### 4. Levantar el servidor

```bash
npm run dev:web      # localhost:3000
```

**Credenciales del seed:**
- Admin: `admin@tdt.com` / `admin1234`
- Jugador: `jugador@tdt.com` / `jugador123`

## Development commands

```bash
npm install               # instalar dependencias (desde raíz)

npm run dev               # levantar todos los apps
npm run dev:web           # solo Next.js (localhost:3000)
npm run dev:mobile        # solo Expo

npm run build             # build de todos los apps
npm run lint              # lint del monorepo

npm run db:generate       # generar Prisma Client tras cambios en schema
npm run db:migrate        # correr migraciones (dev)
npm run db:seed           # poblar DB con usuario admin y datos de ejemplo
npm run db:studio         # abrir Prisma Studio
```

## Architecture

### API REST (Next.js Route Handlers)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/torneos` | Listar / crear torneos |
| GET/PUT/DELETE | `/api/torneos/[id]` | Detalle / editar / eliminar torneo |
| POST | `/api/torneos/[id]/generar-bracket` | Generar llave eliminatoria |
| POST | `/api/torneos/[id]/generar-grupos` | Generar fase de grupos |
| GET/POST | `/api/equipos` | Listar / crear equipos |
| GET/POST | `/api/jugadores` | Listar / crear jugadores |
| GET/PUT/DELETE | `/api/jugadores/[id]` | Detalle / editar / eliminar jugador |
| PATCH | `/api/partidos/[id]/resultado` | Cargar resultado de un partido |

### Auth y roles

- Autenticación vía NextAuth con credentials (email + password hasheado con bcrypt)
- Dos roles: `ADMIN` (gestiona torneos) y `PLAYER` (solo lectura)
- Rutas protegidas bajo `(dashboard)/` con guard de sesión en layout

### Routing web

```
(auth)/login                        # página de login
(dashboard)/
  torneos/                          # lista de torneos
  torneos/nuevo/                    # crear torneo
  torneos/[id]/?tab=equipos         # equipos del torneo
  torneos/[id]/?tab=grupos          # fase de grupos (si aplica)
  torneos/[id]/?tab=llave           # bracket eliminatorio
  torneos/[id]/equipos/nuevo/       # agregar equipo al torneo
  jugadores/                        # lista de jugadores
  jugadores/nuevo/                  # crear jugador
  jugadores/[id]/editar/            # editar jugador
```

## Database (Prisma schema)

### Enums clave

```prisma
TournamentFormat  GROUPS_AND_KNOCKOUT | SINGLE_ELIMINATION
TournamentStatus  DRAFT | REGISTRATION | IN_PROGRESS | FINISHED
MatchStatus       PENDING | IN_PROGRESS | FINISHED
Phase             GROUP | ROUND_OF_16 | QUARTERFINAL | SEMIFINAL | FINAL
Role              ADMIN | PLAYER
```

### Modelos y relaciones

- **User** → rol ADMIN o PLAYER, vinculado opcionalmente a Player
- **Player** → entidad jugador, puede tener User asociado
- **Tournament** → creado por un User (admin), contiene Teams y Matches
- **Team** → pertenece a un Tournament, tiene 1–3 jugadores via TeamPlayer
- **TeamPlayer** → tabla de unión Team ↔ Player (máx 3 por equipo)
- **Group** → fase de grupos (solo formato GROUPS_AND_KNOCKOUT)
- **GroupStanding** → puntos, victorias, derrotas, empates por equipo en grupo
- **Match** → partido con equipo local/visitante, puntajes, fase y estado

## Tournament logic

### Formatos

- **GROUPS_AND_KNOCKOUT**: fase de grupos round-robin → llave eliminatoria con los clasificados (top 2 por grupo)
- **SINGLE_ELIMINATION**: llave eliminatoria directa desde la primera ronda

### Lifecycle

`DRAFT` → `REGISTRATION` → `IN_PROGRESS` → `FINISHED`

### Generación de bracket/grupos

- `generar-grupos`: crea Groups y GroupStandings, distribuye equipos en grupos por sorteo
- `generar-bracket`: genera los Matches de eliminación directa barajando equipos aleatoriamente

### Carga de resultados

- `PATCH /api/partidos/[id]/resultado` con `{ homeScore, awayScore }`
- Partido de grupo: recalcula GroupStanding (G/E/P/Pts/GF/GC) automáticamente
- Partido de eliminatoria: al terminar toda la fase, crea los partidos de la siguiente (RO16 → QF → SF → Final)
- Al cargar el resultado de la Final: marca el torneo como `FINISHED`
- No se permiten empates en eliminatoria

## Conventions

- **Naming en español**: rutas, componentes, variables y campos de DB usan español (torneos, jugadores, equipos, partidos)
- **TypeScript strict**: no `any`, tipos explícitos; tipos compartidos en `@tdt/types`
- **Shared packages**: importar tipos desde `@tdt/types`, PrismaClient desde `@tdt/db`
- **Tailwind CSS**: estilos directamente en JSX, sin CSS modules salvo `globals.css`
- **App Router**: usar Server Components por defecto; Client Components solo cuando necesario (`"use client"`)
