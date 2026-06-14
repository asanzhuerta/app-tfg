# Servicios comunicaciones

Operaciones de promociones, segmentos/rangos, avisos, formaciones y recordatorios.

## Funcion

Crear, consultar y segmentar comunicaciones del modulo M6.

Las promociones se modelan con una coleccion de tipos (`promotion_discount_types`) para separar el texto visible de la regla economica. El servicio valida los campos especificos de cada tipo antes de persistir: porcentaje, umbral de volumen o regalo. La aplicacion de descuentos economicos se realiza en `lib/typeorm/services/orders/order.ts`, manteniendo una unica promocion por linea y respetando la jerarquia Plata -> Oro -> Platino.
