# TypeORM

Capa de persistencia de la aplicación.

## Qué contiene

- `entities/`: entidades mapeadas a tablas PostgreSQL.
- `services/`: consultas y operaciones de dominio sobre la BBDD.
- `constants/`: valores auxiliares de persistencia.
- `data-source*.ts`: configuración de conexión.

## Función

Centralizar el acceso a PostgreSQL mediante TypeORM.

Permite que API, páginas server-side y scripts usen una misma capa de datos tipada.
