# Migraciones

Carpeta de migraciones de base de datos.

## Función

Versionar la evolución del esquema y datos estructurales de PostgreSQL.

El modelo de datos debe poder reproducirse en local, demo o producción sin ejecutar cambios manuales.

## Regla del proyecto

Las migraciones nuevas se crean con:

```bash
npm run migration:create -- ./migrations/typeorm/<nombre>
```
