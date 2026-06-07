# Libreria interna

Codigo de dominio, infraestructura y utilidades compartidas por paginas, API handlers y scripts.

## Funcion

Mantener la logica no visual fuera de `app/`: seguridad, contratos, servicios, integraciones, cache, autenticacion y persistencia.

## Por que existe

Separar `lib/` de la capa de UI permite reutilizar logica entre servidor, API y scripts sin acoplarla a componentes React.
