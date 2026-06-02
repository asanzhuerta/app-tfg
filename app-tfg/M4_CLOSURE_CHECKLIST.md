# M4 Closure Checklist

> Ultima actualizacion: 2026-06-02
> Modulo cubierto: `M4 - Pedidos, entregas y cobros`
> Referencia base: `TFG_STATUS_MASTER_PLAN.md`

## Como usar esta checklist

- Marca cada casilla solo cuando la comprobacion se haya ejecutado de verdad.
- Anade notas cortas cuando detectes un bug, una duda o una limitacion conocida.
- No des `M4` por cerrado si queda algun punto pendiente en `Bloqueantes`.
- Si una funcionalidad se deja fuera de alcance, debe quedar escrita en la memoria y en la defensa.

## Datos de la revision

- Fecha: `2026-06-02`
- Rama: `feat/m4-order-status-flow`
- Base de datos revisada: `si; smoke test funcional a nivel servicio con limpieza final OK`
- Build revisada: `si; typecheck, lint y build OK`
- Responsable de la revision: `usuario + Codex`

## Validacion automatizada de hoy

- [x] Smoke test funcional de `M4` ejecutado a nivel de servicio y dominio: `19/19` comprobaciones OK.
- [x] El smoke test cubrio migraciones `029` a `034`, preflight de roles y datos, borradores cliente/comercial, creacion, listado, detalle, limite de `2` pedidos abiertos, reparto, validacion QR, entrega, cobro, vuelta a `pending` y visibilidad cruzada.
- [x] El smoke test limpio sus datos temporales al final: `5` pedidos y `2` visitas de reparto eliminados.
- [x] Smoke test de cierre `M4` ejecutado para `cancelled`, `postponed`, `ETA` y reglas limite: `12/12` comprobaciones OK con limpieza final.
- [x] Se corrigio un problema de infraestructura en desarrollo en [data-source.ts](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/lib/typeorm/data-source.ts) que estaba recreando conexiones y provocando `53300 too many clients already`.

## Preparacion

- [x] La base de datos tiene aplicadas las migraciones `029` a `034`.
- [x] El entorno tiene datos demo suficientes para probar `borrador`, `confirmado`, `entregado`, `cancelado` y `cobrado`.
- [x] Existe al menos un usuario `client`, uno `commercial` y uno `admin` operativos.
- [x] Existe al menos un cliente asignado a un comercial con productos pedidos y con visitas de reparto posibles.
- [x] Queda claro por escrito que `M4` incluye `pedidos + entregas/repartos + cobros minimos`.
- [x] Existe un guion corto de defensa con credenciales y casos reales en [M4_DEMO_SCRIPT.md](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/M4_DEMO_SCRIPT.md).

## Bloqueantes

- [x] Un pedido puede nacer como `draft` y mantenerse editable sin romper el historial.
- [x] Un pedido puede pasar de `draft/created` a `confirmed` de forma coherente.
- [x] Un pedido puede pasar de `created/confirmed` a `cancelled` sin dejar estados raros.
- [x] Un pedido `confirmed` puede vincularse a una visita de reparto valida del cliente correcto.
- [x] Una visita de reparto no puede completarse sin los pedidos que le corresponden.
- [x] Completar una visita de reparto marca los pedidos vinculados como `delivered`.
- [x] Un pedido `delivered` puede pasar a `paid` desde el subflujo de cobro.
- [x] El subflujo inverso a `pending` solo se permite si tu regla de negocio actual lo contempla y lo deja consistente.
- [x] Cancelar o aplazar una visita no deja pedidos enlazados en estado contradictorio.
- [x] La ETA del cliente solo aparece cuando existe un reparto real con pedidos reales vinculados.
- [x] La regla de maximo `2` pedidos abiertos sin cobrar por cliente se cumple siempre.

## QA Cliente

Rutas principales:

- `/clients/orders`
- `/clients/orders/[id]`

Checklist:

- [x] El cliente puede entrar en `Pedidos` y ver su historial.
- [x] El cliente puede crear o recuperar un `draft` sin errores.
- [x] El cliente puede anadir productos y cantidades al borrador.
- [x] El cliente puede guardar el borrador y volver a encontrarlo despues.
- [x] El cliente puede convertir el borrador en pedido real.
- [x] El cliente ve correctamente el estado del pedido: `draft`, `created`, `confirmed`, `delivered`, `cancelled`.
- [x] El cliente puede abrir el detalle del pedido.
- [x] El cliente solo ve pedidos propios.
- [x] La ETA solo aparece cuando el pedido esta asociado a un reparto con sentido de negocio.
- [x] Si el pedido todavia no tiene reparto, la UI no inventa una fecha de entrega.

Notas:

- Validado a nivel servicio: borrador cliente, guardado, recuperacion, creacion de pedido real, listado propio, detalle y limite de `2` pedidos abiertos.
- Validado por smoke de cierre `M4`: sin reparto vinculado no aparece ETA; con reparto real planificado si aparece; con reparto aplazado desaparece la ETA exacta.
- Validado en sesion autenticada de cliente: `/clients/orders` responde `200` y `/clients/orders/[id]` tambien responde `200`.
- Sesion de prueba: cliente `Lucy`. Historial visible con `2` pedidos y estados `confirmed` y `cancelled`, ambos con cobro `pending`.
- `GET /api/clients/orders/[id]`: pedido del cliente `Salon de belleza Lucy`, con lineas presentes y visita vinculada `0a650fea-1ab3-4353-9e78-2d3ea26b4f60`.
- Verificacion visual adicional en `/clients/orders`: el HTML renderizado contiene etiquetas de estado `Entregado`, `Confirmado` y `Cancelado`.
- Verificacion visual adicional en `/clients/orders/2ba93afe-01dd-4621-9e1d-5f9b81fcc8f2`: el detalle carga con estado `Entregado` y referencia a la visita vinculada `2bfecabf-6992-4c72-89c0-485555e53ff7`.
- Verificacion adicional de estados en sesion de cliente `lucy@email.com / lucy123$`: con fixtures temporales y limpieza posterior, `/clients/orders` renderiza `Borrador`, `Creado`, `Confirmado`, `Entregado` y `Cancelado` al mismo tiempo.
- Verificacion adicional de pedido sin reparto: un pedido temporal pasado a `confirmed` sin visita vinculada muestra el mensaje de que todavia no se ha vinculado a un reparto, sin inventar fecha prevista.
- Verificacion visual hidratada ejecutada con `Chrome --headless`: `/clients` renderiza la tarjeta `Reparto de hoy`, mantiene el mensaje `No hay reparto planificado para hoy en tu ficha.` y muestra `Pendiente de ruta` sin inventar una ETA.

## QA Comercial

Rutas principales:

- `/commercials/orders`
- `/commercials/orders/[id]`
- `/commercials/visits`
- `/commercials/visits/[id]`
- `/commercials/cobros`

Checklist de pedidos:

- [x] El comercial puede ver los pedidos de sus clientes asignados.
- [x] El comercial puede crear un pedido para un cliente asignado.
- [x] El comercial no puede crear pedidos para clientes no asignados.
- [x] El comercial puede recuperar y continuar un `draft` por cliente.
- [x] El comercial ve los estados y el estado de cobro de cada pedido.
- [x] El detalle del pedido muestra correctamente el QR del paquete.

Checklist de reparto:

- [x] En `Visitas` aparece la bandeja de pedidos confirmados pendientes de reparto.
- [x] Al crear un reparto, solo se pueden seleccionar pedidos confirmados y del cliente correcto.
- [x] No se puede crear un reparto sin pedidos vinculados.
- [x] El detalle de la visita muestra claramente que pedidos estan vinculados.
- [x] Para completar un reparto, el comercial debe escanear o pegar los QR requeridos.
- [x] Si faltan QR o no coinciden, el reparto no se completa.
- [x] Si los QR coinciden, la visita se completa y los pedidos quedan `delivered`.

Checklist de cobros:

- [x] En `/commercials/cobros` solo aparecen pedidos entregados.
- [x] La lista distingue entre `pending` y `paid`.
- [x] El comercial puede registrar metodo de cobro, fecha y notas.
- [x] El detalle del pedido refleja el nuevo estado de cobro inmediatamente.
- [x] Un pedido ya cobrado deja de comportarse como pendiente.

Notas:

- Validado a nivel servicio: borrador comercial, creacion de pedido para cliente asignado, bloqueo de cobro antes de entrega, reparto sin pedidos bloqueado, QR obligatorio, entrega correcta, cobro y vuelta a `pending`.
- Validado en sesion autenticada `comercial@email.com / comercial123$`: `/commercials/orders`, `/commercials/visits` y `/commercials/cobros` responden `200` y cargan con sesion `commercial`.
- `GET /api/commercial/clients`: `8` clientes asignados al comercial.
- `GET /api/commercial/orders`: `2` pedidos visibles para el comercial, con estados `confirmed` y `cancelled`, ambos con cobro `pending`.
- `GET /api/commercial/visits?dateFrom=2026-06-01&dateTo=2026-06-01`: `2` visitas del dia. El detalle `0a650fea-1ab3-4353-9e78-2d3ea26b4f60` es una visita `delivery` en estado `planned` para `Salon de belleza Lucy` con `1` pedido vinculado.
- `/commercials/cobros` ya muestra seguimiento real de cobro para el pedido entregado `2ba93afe-01dd-4621-9e1d-5f9b81fcc8f2`.
- Verificacion visual adicional en `/commercials/cobros`: la pagina renderiza los bloques `Pendientes de cobro` y `Cobrados`, y contiene el pedido entregado `2ba93afe-01dd-4621-9e1d-5f9b81fcc8f2`.
- Verificacion visual adicional en `/commercials/orders/2ba93afe-01dd-4621-9e1d-5f9b81fcc8f2`: el detalle renderiza `Entregado`, `Pendiente`, enlace a `Ver visita de reparto` y el bloque `Metodo de cobro`.
- Prueba real del subflujo de cobro: al pasar el pedido `2ba93afe-01dd-4621-9e1d-5f9b81fcc8f2` de `pending` a `paid`, `/commercials/cobros` cambia de `1/0` a `0/1` en los contadores `Pendientes/Cobrados`, el detalle muestra `Cobrado`, y al revertir vuelve a `1/0`.
- El smoke de cierre `M4` valida ademas que un reparto solo acepte pedidos `confirmed` del cliente correcto y rechace pedidos `cancelled`, `delivered` o de otro cliente.
- Verificacion adicional en sesion autenticada `comercial@email.com / comercial123$`: `POST /api/commercial/orders` contra un cliente no asignado devuelve `403`, confirmando el bloqueo por asignacion.
- Verificacion adicional en `/commercials/orders/[id]`: un pedido temporal renderiza `QR del paquete` y `Codigo QR` correctamente.
- Verificacion visual hidratada ejecutada con `Chrome --headless`: `/commercials/visits` muestra la bandeja `Pedidos confirmados sin reparto asignado`, el CTA `Crear reparto manual` y la zona de filtros.
- Verificacion visual hidratada ejecutada con `Chrome --headless`: `/commercials/visits/2bfecabf-6992-4c72-89c0-485555e53ff7` muestra `Pedidos vinculados al reparto`, evidencia de pedidos asociados y el formulario `Actualizar visita`.

## QA Admin

Rutas principales:

- `/admin/orders`
- `/admin/orders/[id]`

Checklist:

- [x] El admin puede ver el historial global de pedidos.
- [x] El admin puede abrir el detalle de pedidos de distintos clientes.
- [x] El admin puede revisar y avanzar estados solo siguiendo las reglas permitidas.
- [x] El admin ve correctamente estado de pedido, estado de cobro, visita vinculada y QR si aplica.
- [x] El admin no deja el sistema en un estado contradictorio al cancelar o actualizar un pedido.

Notas:

- Validado a nivel servicio: listado global, detalle administrativo y visibilidad cruzada del estado final del pedido.
- Validado en sesion autenticada de admin: `/admin/orders` responde `200` y el detalle `/admin/orders/b81d7797-f488-4972-856b-3d8b2c5230c4` tambien responde `200`.
- `GET /api/admin/orders/b81d7797-f488-4972-856b-3d8b2c5230c4`: cliente `Salon de belleza Lucy`, estado `confirmed`, cobro `pending`, visita vinculada `0a650fea-1ab3-4353-9e78-2d3ea26b4f60` y lineas de pedido presentes.
- Verificacion visual adicional en `/admin/orders/2ba93afe-01dd-4621-9e1d-5f9b81fcc8f2`: el detalle renderiza `Entregado`, `Pendiente` y la visita vinculada `2bfecabf-6992-4c72-89c0-485555e53ff7`.
- Verificacion adicional actualizada en sesion de admin `admin@email.com / admin123$`: el detalle del pedido entregado `2ba93afe-01dd-4621-9e1d-5f9b81fcc8f2` muestra estado del pedido, estado de cobro `Cobrado`, bloque `Estado de reparto` y `QR del paquete`.
- Verificacion adicional por API de admin: un pedido temporal `created` puede pasar a `confirmed`, la transicion inversa queda rechazada con `400`, y al cancelar desde admin un pedido ya vinculado a un reparto la visita asociada pasa a `cancelled` y queda con `0` pedidos vinculados.

## Casos limite

- [x] No se puede guardar un pedido vacio o con lineas invalidas.
- [x] No se puede confirmar un pedido en un estado no permitido.
- [x] No se puede cobrar un pedido que no este `delivered`.
- [x] No se puede vincular a reparto un pedido `cancelled`.
- [x] No se puede vincular a reparto un pedido ya `delivered`.
- [x] No se puede vincular a reparto un pedido de otro cliente.
- [x] Si se cancela un pedido ya vinculado, el sistema responde de forma coherente y sin enlaces huerfanos.
- [x] Si falla autenticacion o sesion, la UI no entra en bucles de carga.
- [x] Si falla la base de datos o un endpoint, la UI muestra error entendible y no deja acciones a medias.
- [x] Si no hay coordenadas o ruta valida, el sistema degrada bien y no muestra ETA ficticia.

Notas:

- Validado a nivel servicio y smoke de cierre: rechazo de pedido vacio, rechazo de transicion invalida sobre pedido entregado, rechazo de vincular pedidos `cancelled`, `delivered` o de otro cliente, y cancelacion coherente del ultimo pedido vinculado.
- Se corrigio en [order.ts](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/lib/typeorm/services/orders/order.ts) la cancelacion automatica de visitas de reparto que se quedaban sin pedidos confirmados al cancelar el ultimo pedido vinculado.
- Verificacion visual hidratada ejecutada con `Chrome --headless`: al limpiar sesion y entrar en `/commercials/orders`, la app redirige a `/login` sin reproducir bucles de carga.
- Verificacion visual hidratada ejecutada con `Chrome --headless`: `/commercials/visits/00000000-0000-0000-0000-000000000000` muestra un error entendible ante fallo de obtencion de datos.
- Verificacion visual hidratada ejecutada con `Chrome --headless`: `/clients` muestra el estado `Pendiente de ruta` y el mensaje `No hay reparto planificado para hoy en tu ficha.`, sin inventar una ETA.

## Verificacion tecnica

- [x] `tsc --noEmit` pasa.
- [x] `eslint .` pasa.
- [x] `next build --webpack` pasa.
- [x] No hay errores de runtime al entrar en:
  - `/clients/orders`
  - `/commercials/orders`
  - `/commercials/visits`
  - `/commercials/cobros`
  - `/admin/orders`
- [x] No aparecen bucles de render, tormentas de peticiones ni errores de sesion al navegar por el flujo de `M4`.
- [x] La base de datos no acumula estados inconsistentes tras la prueba manual completa.

Notas:

- `.\node_modules\.bin\tsc.cmd --noEmit` OK.
- `.\node_modules\.bin\eslint.cmd .` OK.
- `node -r ./scripts/load-env.cjs -r ts-node/register -r tsconfig-paths/register ./scripts/m4-closeout-smoke.ts` OK (`12/12` comprobaciones y limpieza final).
- Script reusable disponible en [scripts/m4-closeout-smoke.ts](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/scripts/m4-closeout-smoke.ts) y comando `npm run m4:closeout`.
- Eliminado un warning deprecado de `pg` al quitar `Promise.all` sobre el mismo `manager` transaccional en [order.ts](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/lib/typeorm/services/orders/order.ts) y [commercial-visit.ts](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/lib/typeorm/services/commercial/commercial-visit.ts).
- Se elimino la dependencia de `next/font/google` en [layout.tsx](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/app/layout.tsx) para que el `build` no dependa de descargar `Geist` y `Geist Mono`.
- `.\node_modules\.bin\next.cmd build --webpack` OK tras el ajuste del layout raiz.
- Smoke test de servicios `M4`: `19/19` OK con limpieza final de datos temporales.
- Corregido el leak de conexiones en desarrollo en [data-source.ts](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/lib/typeorm/data-source.ts), que estaba disparando `53300 too many clients already`.
- Comprobacion autenticada de rutas comerciales por HTTP: `/commercials/orders`, `/commercials/visits` y `/commercials/cobros` responden `200` con sesion valida de comercial.
- Comprobacion autenticada de rutas cliente y admin por HTTP: `/clients/orders`, `/clients/orders/[id]`, `/admin/orders` y `/admin/orders/[id]` responden `200` con sesiones validas.
- Verificacion de UI hidratada reusable disponible en [m4-ui-headless-check.mjs](/C:/Users/MADAO/Desktop/TFG-AlejandroSanzHuerta/app-tfg/scripts/m4-ui-headless-check.mjs) y comando `npm run m4:ui-check`, con capturas generadas en `.codex-artifacts/m4-ui-evidence/`.
- La pasada hidratada completa sobre cliente, comercial y admin finalizo sin reproducir los antiguos errores `Maximum update depth exceeded` ni `JWTSessionError`.
- Tras la pasada de UI se reejecuto el smoke de cierre `M4` y volvio a terminar `12/12` OK, confirmando que la base de datos quedo consistente.

## Evidencias para memoria y cierre

- [x] Tienes una captura del flujo de pedido en cliente.
- [x] Tienes una captura del flujo de pedido en comercial.
- [x] Tienes una captura de la bandeja de repartos o pedidos pendientes de reparto.
- [x] Tienes una captura del detalle de visita con pedidos vinculados.
- [x] Dispones de evidencia del cierre de reparto con validacion QR.
- [x] Tienes una captura del detalle de pedido entregado.
- [x] Tienes una captura del subflujo de cobro en `/commercials/cobros`.
- [x] Queda resumido por escrito el flujo completo `pedido -> reparto -> entrega -> cobro`.
- [x] Queda explicitado por escrito que no cubre el flujo minimo de cobros: pagos parciales, facturacion, conciliacion, etc.

## Criterio final de cierre

Marca una sola opcion:

- [x] `M4 cerrado`: no quedan pendientes en `Bloqueantes`, el QA por rol esta hecho, el build pasa y la evidencia funcional queda trazada.
- [ ] `M4 casi cerrado`: funciona el flujo principal, pero quedan bugs o validaciones pendientes antes de darlo por terminado.
- [ ] `M4 no cerrado`: aun hay incoherencias funcionales, huecos de negocio o validaciones tecnicas sin resolver.

## Observaciones residuales

1. El script `m4-ui-headless-check.mjs` queda como evidencia reusable de cierre visual para futuras regresiones de `M4`.
2. La memoria en LaTeX debe reflejar expresamente que el alcance de cobros en `M4` es minimo y no cubre pagos parciales ni conciliacion.

## Decision de salida

- Veredicto: `M4 cerrado`
- Riesgo principal: `no hay bloqueantes funcionales abiertos; el siguiente riesgo es de desalineacion documental si la memoria no se actualiza`
- Siguiente accion recomendada: `trasladar ahora el alcance real, el modelo de datos final y la evidencia de verificacion a la memoria en LaTeX`
