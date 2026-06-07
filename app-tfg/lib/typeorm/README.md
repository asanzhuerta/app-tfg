# TypeORM

Capa de persistencia de la aplicaci?n.

## Qu? contiene

- `entities/`: entidades mapeadas a tablas PostgreSQL.
- `services/`: consultas y operaci?nes de dominio sobre la BBDD.
- `constants/`: valores auxiliares de persistencia.
- `data-source*.ts`: configuraci?n de conexion.

## Funci?n

Centralizar el acceso a PostgreSQL mediante TypeORM.

Permite que API, p?ginas server-side y scripts usen una misma capa de datos tipada.
