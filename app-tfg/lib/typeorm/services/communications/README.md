# Servicios comunicaciones

Operaciones de promociones, segmentos/rangos, avisos, formaciones y recordatorios.

## Funcion

Crear, consultar y segmentar comunicaciones del módulo M6.

Las promociones se modelan con una colección de tipos (`promotion_discount_types`) para separar el texto visible de la regla económica. El servicio valida los campos específicos de cada tipo antes de persistir: porcentaje, umbral de volumen o regalo. La aplicación de descuentos económicos se realiza en `lib/typeorm/services/orders/order.ts`, manteniendo una única promoción por línea y respetando la jerarquía Plata -> Oro -> Platino.
