# Kinestilistas

Aplicacion web B2B desarrollada como Trabajo Fin de Grado para centralizar la operativa entre una distribuidora de productos profesionales de peluqueria, sus comerciales y los salones cliente.

El repositorio agrupa codigo, documentacion academica, base de datos local y material de apoyo usado durante el desarrollo.

## Que contiene este repositorio

- `app-tfg/`: aplicacion principal en Next.js, con frontend por roles, API interna, autenticacion, migraciones y scripts de validacion.
- `docs/`: memoria del TFG en LaTeX, figuras, diagramas, bibliografia y secciones redactadas.
- `db/`: configuracion auxiliar de base de datos local para Docker y scripts SQL de apoyo.
- `examples/`: ficheros de referencia, imagenes de producto, colecciones Postman y material de prueba no productivo.
- `docker-compose.yml`: servicio local de PostgreSQL usado por la aplicacion.

## Estado funcional

La aplicacion ya cubre los bloques operativos principales del TFG:

- `M1`: autenticacion, registro administrado, roles, usuarios, solicitudes, perfil y trazabilidad basica de accesos.
- `M2`: clientes, asignaciones comercial-cliente, visitas, geolocalizacion, rutas, configuracion diaria y estimacion de reparto.
- `M3`: catalogo, categorias, lineas, subcategorias, productos, recursos tecnicos, cartas de color y referencias cromaticas.
- `M4`: pedidos, borradores, confirmacion, historial, reparto integrado, validacion QR y seguimiento operativo.
- `M5`: fichas tecnicas de salon, servicios, plantillas, productos usados, tonos de coloracion e imagenes de resultado.
- `M6`: comunicaciones, promociones, rangos de cliente, descuentos segmentados, avisos y formaciones.
- `M7`: soporte, auditoria, rate limiting, operaciones, reportes e integraciones preparadas para automatizaciones futuras.

## Roles de la aplicacion

- `admin`: administra usuarios, clientes, asignaciones, catalogo, comunicaciones, auditoria, soporte, operaciones e integraciones.
- `commercial`: consulta clientes asignados, rutas, visitas, pedidos, catalogo, coloracion, promociones y formaciones.
- `client`: gestiona perfil, pedidos, catalogo, coloracion, promociones, formaciones y fichas tecnicas de su salon.

## Stack principal

- `Next.js 16` con `App Router`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Auth.js / NextAuth 5 beta`
- `PostgreSQL 16`
- `TypeORM 0.3`
- `Cloudinary`
- `Leaflet` y `OSRM`

## Puesta en marcha local

1. Levantar PostgreSQL desde la raiz:

```bash
docker compose up -d
```

2. Instalar dependencias:

```bash
cd app-tfg
npm install
```

3. Configurar `app-tfg/.env.local`:

```env
DATABASE_URL=postgres://kin:kin@localhost:5432/kin
AUTH_SECRET=cambia-este-valor
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

4. Ejecutar migraciones:

```bash
npm run migration:run
```

5. Arrancar en desarrollo:

```bash
npm run dev
```

La aplicacion queda disponible normalmente en `http://localhost:3000`.

## Scripts habituales

```bash
npm run typecheck
npm run lint
npm run build
npm run migration:create -- ./migrations/typeorm/<nombre>
npm run migration:run
npm run m6:closeout
npm run m7:closeout
npm run catalog:upload-product-images -- --dry-run
```

## Criterio de organizacion

Cada carpeta relevante del repositorio incluye un `README.md` propio para explicar su contenido, su funcion y por que se mantiene separada. Se excluyen carpetas generadas o de dependencias como `.git`, `.next`, `node_modules` y artefactos temporales.

## Autor

Alejandro Sanz Huerta
