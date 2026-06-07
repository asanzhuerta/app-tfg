# Kinestilistas

Aplicaci?n web B2B desarrollada como Trabajo Fin de Grado para centralizar la operativa entre una distribuidora de productos profesionales de peluquer?a, sus comerciales y los salones cliente.

El repositorio agrupa la aplicaci?n principal, la documentaci?n acad?mica, la configuraci?n de despliegue local y los recursos versionados necesarios para revisar el proyecto.

## Qu? contiene este repositorio

- `app-tfg/`: aplicaci?n principal en Next.js, con frontend por roles, API interna, autenticaci?n, migraciones y scripts de validaci?n.
- `docs/`: memoria del TFG en LaTeX, figuras, diagramas, bibliograf?a y secciones redactadas.
- `docker-compose.yml`: servicio local de PostgreSQL usado por la aplicaci?n.

## Estado funci?nal

La aplicaci?n ya cubre los bloques operativos principales del TFG:

- `M1`: autenticaci?n, registro administrado, roles, usuarios, solicitudes, perfil y trazabilidad b?sica de accesos.
- `M2`: clientes, asignaciones comercial-cliente, visitas, geolocalizaci?n, rutas, configuraci?n diaria y estimaci?n de reparto.
- `M3`: cat?logo, categor?as, l?neas, subcategor?as, productos, recursos t?cnicos, cartas de color y referencias crom?ticas.
- `M4`: pedidos, borradores, confirmación, historial, reparto integrado, validaci?n QR y seguimiento operativo.
- `M5`: fichas t?cnicas de sal?n, servicios, plantillas, productos usados, tonos de coloraci?n e im?genes de resultado.
- `M6`: comunicaci?nes, promoci?nes, rangos de cliente, descuentos segmentados, avisos y formaci?nes.
- `M7`: soporte, auditor?a, rate limiting, operaci?nes, reportes e integraci?nes preparadas para automatizaciones futuras.

## Roles de la aplicaci?n

- `admin`: administra usuarios, clientes, asignaciones, cat?logo, comunicaci?nes, auditor?a, soporte, operaci?nes e integraci?nes.
- `commercial`: consulta clientes asignados, rutas, visitas, pedidos, cat?logo, coloraci?n, promoci?nes y formaci?nes.
- `client`: gesti?na perfil, pedidos, cat?logo, coloraci?n, promoci?nes, formaci?nes y fichas t?cnicas de su sal?n.

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

1. Levantar PostgreSQL desde la ra?z:

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

La aplicaci?n queda disponible normalmente en `http://localhost:3000`.

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

## Criterio de organizaci?n

Cada carpeta versionada relevante incluye un `README.md` propio para explicar su contenido y su funci?n dentro de la aplicaci?n.

## Autor

Alejandro Sanz Huerta
