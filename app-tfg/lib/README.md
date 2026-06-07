# Libreria interna

Codigo de dominio, infraestructura y utilidades compartidas por p?ginas, API handlers y scripts.

## Funci?n

Mantener la l?gica no visual fuera de `app/`: seguridad, contratos, servicios, integraci?nes, cache, autenticaci?n y persistencia.

Separar `lib/` de la capa de UI permite reutilizar l?gica entre servidor, API y scripts sin acoplarla a componentes React.
