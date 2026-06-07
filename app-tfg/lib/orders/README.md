# Dominio de pedidos

Logica de pedidos, borradores, descuentos, estado y trazabilidad.

## Funcion

Apoyar creacion, confirmacion, historial, detalle, promociones aplicables y validacion de entrega.

## Por que existe

Pedidos es un flujo transversal a cliente, comercial y admin. Mantenerlo en `lib/orders` separa reglas de negocio de componentes.
