# Constructor de reglas de notificación

Aplicación web para crear y administrar reglas "cuando pase X, si se cumplen estas condiciones, haz estas acciones".

- **Front:** React + Vite + TypeScript, Tailwind, React Router, TanStack Query, react-hook-form.
- **Back:** Node + Hono + SQLite (better-sqlite3).
- **Compartido:** `shared/` contiene el catálogo (disparadores, campos, operadores) y los esquemas Zod, usados por el formulario y por el API.

## Requisitos

Node 20 o 22 LTS.

## Cómo correrlo

```bash
npm install          # desde la raíz, instala los tres workspaces
npm run dev          # API en :3001 y web en :5173
```

Por separado:

```bash
npm run dev -w server    # http://localhost:3001
npm run dev -w web       # http://localhost:5173 (proxy de /api hacia :3001)
```

Otros comandos:

```bash
npm test             # pruebas de server y web
```

Variables del servidor: `PORT` (3001) y `DB_PATH` (`rules.db`). Para empezar de cero, borra `server/rules.db*` con el servidor detenido.

## API

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| GET | `/api/rules` | 200, lista | |
| GET | `/api/rules/:id` | 200 | 404 |
| POST | `/api/rules` | 201 + `Location` | 400 JSON mal formado, 409 nombre repetido, 422 regla inválida |
| PUT | `/api/rules/:id` | 200 | 404, 409, 422 |
| PATCH | `/api/rules/:id/enabled` | 200 | 404, 422 |
| DELETE | `/api/rules/:id` | 204 | 404 |

Formato de error, siempre el mismo:

```json
{ "error": { "code": "validation_error", "message": "...", "fields": [{ "path": "actions.0.to", "message": "Email inválido" }] } }
```

Códigos: `validation_error`, `name_taken`, `not_found`, `bad_request`, `internal_error`. `fields[].path` usa la misma notación de puntos que react-hook-form, así el front los asigna a los campos sin traducir nada.

`enabled` no forma parte del cuerpo de POST/PUT: nace en `true` y solo cambia con PATCH, para que editar una regla no la active ni la desactive por accidente.

## Decisiones

- **Un solo esquema de validación** (`shared/src/schemas.ts`). El formulario y el servidor validan igual, y el servidor sigue siendo la frontera de confianza.
- **Catálogo como fuente de verdad.** Los campos y operadores de la UI se generan desde `shared/src/catalog.ts`, y el esquema valida las condiciones contra él según el disparador.
- **Acciones como unión discriminada por `type`.** Cada tipo tiene sus campos, y TypeScript los estrecha solo.
- **Condiciones y acciones como JSON dentro de la regla** (SQLite). Siempre se leen y escriben junto con la regla y nunca se consultan por separado. Si hiciera falta "reglas que envían SMS", las pasaría a tablas hijas.
- **Nombre único:** `UNIQUE COLLATE NOCASE` en la base de datos, y `409` al violarla. No hay `SELECT` previo, porque tendría una condición de carrera.
- **Estado del editor:** un único `useForm` con `FormProvider`. Los pasos son vistas del mismo borrador, así navegar no pierde datos. El estado del servidor vive en TanStack Query, y no hay estado global.
- **Cambio de disparador con condiciones creadas:** se pide confirmación y se descartan solo las condiciones incompatibles. En este catálogo los campos son disjuntos, así que en la práctica se descartan todas, pero el código ya conserva las compatibles si dos disparadores compartieran un campo.
- **Toggle del listado optimista**, con reversión solo de la fila afectada si el servidor falla.
- **Filtro del listado en el cliente y en la URL.** Sobrevive a recargas y a "atrás".

## Extras incluidos

- Resumen en lenguaje natural antes de guardar.
- Búsqueda por nombre y filtro por estado en el listado.
- Pruebas: API (códigos HTTP y validaciones), `describeRule`, `keepCompatibleConditions`, `filterRules`.
