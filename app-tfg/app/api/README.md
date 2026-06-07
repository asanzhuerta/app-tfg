# API interna

Route Handlers de Next.js usados por la aplicaci?n.

## Funci?n

Exponer endpoints internos para autenticaci?n, perfil, cat?logo, usuarios, clientes, pedidos, visitas, comunicaci?nes, auditor?a e integraci?nes.

La aplicaci?n funci?na como monolito full-stack. Mantener la API dentro de `app/api` permite compartir dominio, contratos y seguridad con el frontend sin crear un backend separado.
