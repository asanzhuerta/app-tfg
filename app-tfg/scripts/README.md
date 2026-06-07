# Scripts de la aplicaci?n

Scripts Node/TypeScript usados para validaci?nes, smoke tests, mantenimiento y cargas auxiliares.

## Funci?n

Automatizar comprobaciones por m?dulo, carga de im?genes de cat?logo, limpieza de fixtures y t?reas operativas.

El proyecto necesita validar flujos sin depender siempre de la interfaz. Mantener scripts aqu? permite ejecutarlos con el mismo entorno de la app.

## Scripts destacados

- `upload-product-images.ts`: sube im?genes de cat?logo a Cloudinary y actualiza `products.image_url`.
- `m5-*smoke.ts`: comprueba funci?nalidades de fichas t?cnicas y resultado visual.
- `m6-*smoke.ts`: comprueba comunicaci?nes, promoci?nes y rangos.
- `m7-*smoke.ts`: comprueba auditor?a, soporte, operaci?nes, rate limiting e integraci?nes.
- `load-env.cjs`: carga variables de entorno para scripts fuera de Next.js.
