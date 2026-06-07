# App TFG

Aplicaci?n principal de Kinestilistas. Esta carpeta contiene el producto software desarrollado para el TFG: interfaz, API, autenticaci?n, persistencia, migraciones, assets p?blicos y scripts de comprobaci?n.

## Funci?n de esta carpeta

- Centralizar el c?digo ejecutable de la aplicaci?n.
- Separar la app de la memoria LaTeX, la configuraci?n de Docker.
- Mantener una estructura compatible con Next.js App Router y TypeORM.

## Estructura principal

- `app/`: rutas, layouts, p?ginas, API handlers y componentes de UI.
- `lib/`: l?gica de dominio, contratos, servicios, seguridad, integraci?nes y acceso a datos.
- `migrations/`: migraciones versionadas de TypeORM.
- `public/`: im?genes, iconos, fondos y manifest PWA.
- `scripts/`: scripts de smoke test, carga de im?genes y t?reas auxiliares.

## Archivos de entrada relevantes

- `auth.ts`: configuraci?n de Auth.js, credenciales, sesi?nes y trazabilidad de acceso.
- `proxy.ts`: middleware de protecci?n de rutas, compatibilidad de navegador y rate limiting.
- `next.config.ts`: configuraci?n de Next.js.
- `package.json`: scripts, dependencias y comandos de desarrollo.
- `tsconfig.typeorm.json`: configuraci?n TypeScript espec?fica para TypeORM y migraciones.

## Scripts recomendados

```bash
npm run typecheck
npm run lint
npm run build
npm run migration:run
npm run m5:sal?n-visual-smoke
npm run m6:closeout
npm run m7:closeout
npm run catalog:upload-product-images -- --dry-run
```

## Notas de trabajo

- Las migraciones se crean con `npm run migration:create`.
- El puerto local esperado para desarrollo es `3000`.
