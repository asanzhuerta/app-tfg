# TypeORM

Capa de persistencia de la aplicacion.

## Que contiene

- `entities/`: entidades mapeadas a tablas PostgreSQL.
- `services/`: consultas y operaciones de dominio sobre la BBDD.
- `constants/`: valores auxiliares de persistencia.
- `data-source*.ts`: configuracion de conexion.

## Funcion

Centralizar el acceso a PostgreSQL mediante TypeORM.

## Por que existe

Permite que API, paginas server-side y scripts usen una misma capa de datos tipada.
