# Scripts de la aplicacion

Scripts Node/TypeScript usados para validaciones, smoke tests, mantenimiento y cargas auxiliares.

## Funcion

Automatizar comprobaciones por modulo, carga de imagenes de catalogo, limpieza de fixtures y tareas operativas.

## Por que existe

El proyecto necesita validar flujos sin depender siempre de la interfaz. Mantener scripts aqui permite ejecutarlos con el mismo entorno de la app.

## Scripts destacados

- `upload-product-images.ts`: sube imagenes de `examples/Uploads de prueba APP/PRODUCTOS` a Cloudinary y actualiza `products.image_url`.
- `m5-*smoke.ts`: comprueba funcionalidades de fichas tecnicas y resultado visual.
- `m6-*smoke.ts`: comprueba comunicaciones, promociones y rangos.
- `m7-*smoke.ts`: comprueba auditoria, soporte, operaciones, rate limiting e integraciones.
- `load-env.cjs`: carga variables de entorno para scripts fuera de Next.js.
