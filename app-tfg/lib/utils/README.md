# Utilidades generales

Funciones auxiliares reutilizables que no pertenecen a un dominio concreto.

## Función

Centralizar helpers de formato, fechas, normalizacion o transformaciones pequeñas.

Mantiene el código común en un lugar único sin convertirlo en dependencia circular entre dominios.

## Utilidades compartidas principales

- `date-format.ts`: formateo de fechas para interfaz, fecha/hora local de inputs y formatos específicos como fecha larga UTC o fecha/hora de Madrid.
- `date-serialization.ts`: serialización estable de fechas para contratos y DTOs.
- `time.ts`: utilidades de hora, zona horaria de Madrid y reloj/fecha local reutilizable para visitas y rutas.
- `money.ts`: parseo de importes, céntimos, porcentajes, descuentos y formato monetario.
- `csv.ts`: generación y escapado de CSV para auditoría e informes operativos.
- `validation.ts`: normalización de espacios, textos opcionales/requeridos y enteros positivos.
- `text.ts`: normalización de texto, correo y búsqueda sin diacríticos.

## Criterio de uso

Si una función no pertenece a un dominio concreto y aparece en más de un módulo, debe moverse aquí antes de duplicarla. Los servicios pueden envolver estas utilidades para lanzar errores de dominio propios, pero el parseo o formateo base debe seguir viviendo en esta carpeta.
