# API interna

Route Handlers de Next.js usados por la aplicacion.

## Funcion

Exponer endpoints internos para autenticacion, perfil, catalogo, usuarios, clientes, pedidos, visitas, comunicaciones, auditoria e integraciones.

## Por que existe

La aplicacion funciona como monolito full-stack. Mantener la API dentro de `app/api` permite compartir dominio, contratos y seguridad con el frontend sin crear un backend separado.
