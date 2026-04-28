# TdT — Torneos de Truco

Sistema de gestión de torneos de Truco argentino.

## Stack

- **Monorepo**: Turborepo
- **Web**: Next.js 14 + Tailwind CSS + NextAuth.js
- **Mobile**: Expo (React Native)
- **Base de datos**: PostgreSQL + Prisma ORM
- **Tipado compartido**: packages/types

## Estructura

```
tdt/
├── apps/
│   ├── web/        Next.js — admin + player web
│   └── mobile/     Expo — player mobile
└── packages/
    ├── db/         Prisma schema + cliente
    └── types/      Tipos TypeScript compartidos
```

## Setup inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp apps/web/.env.example apps/web/.env
```

Editar `apps/web/.env`:
```
DATABASE_URL="postgresql://usuario:password@localhost:5432/tdt"
NEXTAUTH_SECRET="un-secret-largo-y-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas (primera vez)
cd packages/db && npx prisma migrate dev --name init
```

### 4. Correr en desarrollo

```bash
# Web
npm run dev:web

# Mobile
npm run dev:mobile
```

## Roles

| Rol | Permisos |
|-----|---------|
| ADMIN | Crear/editar torneos, equipos, jugadores, registrar resultados |
| PLAYER | Ver torneos, posiciones, resultados |

## Formatos de torneo

- **Grupos + Eliminatoria**: fase de grupos seguida de bracket eliminatorio
- **Eliminación directa**: bracket desde la primera ronda

## Tamaño de equipos

Los equipos pueden tener 1, 2 o 3 jugadores.
"# torneodetruco" 
