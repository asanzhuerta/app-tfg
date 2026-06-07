# Scripts de la aplicación

Scripts Node/TypeScript usados para validaciones, smoke tests, mantenimiento y cargas auxiliares.

## Función

Automatizar comprobaciones por módulo, carga de imágenes de catálogo, limpieza de fixtures y tareas operativas.

El proyecto necesita validar flujos sin depender siempre de la interfaz. Mantener scripts aqué permite ejecutarlos con el mismo entorno de la app.

## Scripts destacados

- `upload-product-images.ts`: sube imágenes de catálogo a Cloudinary y actualiza `products.image_url`.
- `m5-*smoke.ts`: comprueba funcionalidades de fichas técnicas y resultado visual.
- `m6-*smoke.ts`: comprueba comunicaciones, promociones y rangos.
- `m7-*smoke.ts`: comprueba auditoría, soporte, operaciones, rate limiting e integraciones.
- `load-env.cjs`: carga variables de entorno para scripts fuera de Next.js.
