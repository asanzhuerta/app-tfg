# Migraciones

Carpeta de migraciones de base de datos.

## Funci?n

Versionar la evolucion del esquema y datos estructurales de PostgreSQL.

El modelo de datos debe poder reproducirse en local, demo o producci?n sin ejecutar cambios manuales.

## Regla del proyecto

Las migraciones nuevas se crean con:

```bash
npm run migration:create -- ./migrations/typeorm/<nombre>
```
