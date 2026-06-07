# App TFG

Aplicacion principal de Kinestilistas. Esta carpeta contiene el producto software desarrollado para el TFG: interfaz, API, autenticacion, persistencia, migraciones, assets publicos y scripts de comprobacion.

## Funcion de esta carpeta

- Centralizar el codigo ejecutable de la aplicacion.
- Separar la app de la memoria LaTeX, los datos de ejemplo y la configuracion de Docker.
- Mantener una estructura compatible con Next.js App Router y TypeORM.

## Estructura principal

- `app/`: rutas, layouts, paginas, API handlers y componentes de UI.
- `lib/`: logica de dominio, contratos, servicios, seguridad, integraciones y acceso a datos.
- `migrations/`: migraciones versionadas de TypeORM.
- `public/`: imagenes, iconos, fondos y manifest PWA.
- `scripts/`: scripts de smoke test, carga de imagenes y tareas auxiliares.

## Archivos de entrada relevantes

- `auth.ts`: configuracion de Auth.js, credenciales, sesiones y trazabilidad de acceso.
- `proxy.ts`: middleware de proteccion de rutas, compatibilidad de navegador y rate limiting.
- `next.config.ts`: configuracion de Next.js.
- `package.json`: scripts, dependencias y comandos de desarrollo.
- `tsconfig.typeorm.json`: configuracion TypeScript especifica para TypeORM y migraciones.

## Scripts recomendados

```bash
npm run typecheck
npm run lint
npm run build
npm run migration:run
npm run m5:salon-visual-smoke
npm run m6:closeout
npm run m7:closeout
npm run catalog:upload-product-images -- --dry-run
```

## Notas de trabajo

- Las migraciones se crean con `npm run migration:create`.
- El puerto local esperado para desarrollo es `3000`.
- No se deben versionar `.next`, `node_modules`, logs temporales ni ficheros `.env`.
- El estado funcional global se documenta en `TFG_STATUS_MASTER_PLAN.md`.
