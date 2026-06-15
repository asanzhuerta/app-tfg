# Servicios TypeORM

Consultas y operaciones de negocio sobre entidades.

## Función

Encapsular lectura, creación, actualización y borrado de datos para cada módulo.

Evita que componentes y API handlers escriban consultas complejas directamente. Esto mantiene el dominio más mantenible.

## Organización interna

Los módulos grandes pueden dividirse en servicios más pequeños por responsabilidad: consultas, persistencia, mapeadores, transiciones, dinero, promociones o notificaciones. El punto de entrada de cada dominio puede reexportar esos helpers si hace falta mantener compatibilidad.

`system-configuration.ts` centraliza el acceso al repositorio `SystemConfiguration`, de modo que ajustes de pedidos, notificaciones y rangos no repitan la misma resolución de `EntityManager` o `DataSource`.

Las utilidades genéricas deben importarse desde `lib/utils/`; los servicios solo añaden validaciones o errores de dominio cuando el contexto lo necesita.
