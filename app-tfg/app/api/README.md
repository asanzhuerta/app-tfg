# API interna

Route Handlers de Next.js usados por la aplicación.

## Función

Exponer endpoints internos para autenticación, perfil, catálogo, usuarios, clientes, pedidos, visitas, comunicaciones, auditoría e integraciones.

La aplicación funciona como monolito full-stack. Mantener la API dentro de `app/api` permite compartir dominio, contratos y seguridad con el frontend sin crear un backend separado.
