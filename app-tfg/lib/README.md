# Libreria interna

Código de dominio, infraestructura y utilidades compartidas por páginas, API handlers y scripts.

## Función

Mantener la lógica no visual fuera de `app/`: seguridad, contratos, servicios, integraciones, cache, autenticación y persistencia.

Separar `lib/` de la capa de UI permite reutilizar lógica entre servidor, API y scripts sin acoplarla a componentes React.
