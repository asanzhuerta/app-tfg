# Migraciones

Carpeta de migraciones de base de datos.

## Funcion

Versionar la evolucion del esquema y datos estructurales de PostgreSQL.

## Por que existe

El modelo de datos debe poder reproducirse en local, demo o produccion sin ejecutar cambios manuales.

## Regla del proyecto

Las migraciones nuevas se crean con:

```bash
npm run migration:create -- ./migrations/typeorm/<nombre>
```
