# Scripts de la aplicación

Scripts Node/TypeScript usados para validaciones funcionales, mantenimiento y cargas auxiliares.

## Función

Automatizar comprobaciones por módulo, carga de imágenes de catálogo, limpieza de fixtures y tareas operativas.

El proyecto necesita validar flujos sin depender siempre de la interfaz. Mantener scripts aquí permite ejecutarlos con el mismo entorno de la app.

## Scripts destacados

- `run-test-suite.mjs`: ejecuta una lista de scripts `npm` en orden y detiene la suite en el primer fallo.
- `business-critical-suite.mjs`: ejecuta la ruta crítica de negocio con rutas, pedidos, repartos, cobros parciales y promociones.
- `m1-m3-foundation-test.ts`: comprueba alta/autorización, gestión comercial básica y catálogo con datos temporales.
- `m2-route-points-test.ts`: valida la selección de puntos de inicio y fin de ruta.
- `m4-orders-delivery-test.ts`: comprueba el ciclo de pedido, reparto, QR/agencia y entrega.
- `m4-payments-test.ts`: comprueba pagos parciales, cierre de cobro e historial de pagos.
- `m4-orders-ui-check.mjs`: comprueba rutas UI críticas de pedidos y repartos.
- `m5-*test.ts`: comprueba funcionalidades de fichas técnicas, plantillas y resultado visual.
- `m6-*test.ts`: comprueba comunicaciones, promociones y rangos.
- `m7-*test.ts`: comprueba auditoría, soporte interno, operaciones técnicas, rate limiting e integraciones.
- `upload-product-images.ts`: sube imágenes de catálogo a Cloudinary y actualiza `products.image_url`.
- `wave-audit.mjs`: prepara una revisión manual gratuita con WAVE. Usa por defecto el dev tunnel `https://5xkm2q9w-3000.uks1.devtunnels.ms/`, comprueba antes si responde y genera una checklist con enlaces directos al informe WAVE de cada ruta. Variables útiles: `WAVE_BASE_URL`, `WAVE_ROUTES`, `WAVE_SKIP_IF_BASE_UNAVAILABLE=false`.
- `backup-data-only.mjs`: exporta solo datos de la base, sin estructura.
- `restore-data-only.mjs`: restaura un backup de datos con confirmación explícita.
- `prepare-demo-data.mjs`: genera backup del estado actual y, opcionalmente, restaura un backup base de demo.
- `load-env.cjs`: carga variables de entorno para scripts fuera de Next.js.

## Comandos npm recomendados

- `npm run test:business`: ruta crítica de negocio.
- `npm run test:static`: comprobación estática con `typecheck`, `lint` y `build`.
- `npm run test:modules`: batería funcional por módulos.
- `npm run test:m2:route-points`: puntos de inicio y fin de ruta comercial.
- `npm run test:m4`: pedidos, repartos y cobros.
- `npm run test:m4:full`: M4 más revisión UI headless.
- `npm run test:m6`: comunicaciones, promociones y rangos.
- `npm run test:m7`: operación, auditoría, soporte e integraciones.
- `npm run quality:react-doctor`: revisión React Doctor sobre componentes de la app.
- `npm run quality:wave`: checklist WAVE manual; si el dev tunnel no responde, deja informe y no bloquea.
- `npm run quality:ui`: agrupa React Doctor y WAVE.
- `npm run test:all`: typecheck, lint, build, migraciones, módulos y auxiliares de calidad UI.
