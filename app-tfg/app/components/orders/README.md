# Componentes de pedidos

UI de borradores, historiales, detalle, líneas de pedido, preparación de repartos y cobros.

## Función

Permitir crear, revisar, filtrar y consultar pedidos desde cliente, comercial o admin.

También concentra la interfaz de preparación logística: selección de líneas que entran en cada reparto, número manual de bultos, etiqueta QR o etiqueta de agencia, historial de pagos y saldo pendiente.

El módulo M4 comparte lógica entre roles pero cambia el punto de vista. Esta carpeta agrupa esa interfaz común.

## Organización de lógica cliente

- `order-workspace-api.ts`: llamadas HTTP para borradores, productos disponibles y envío de pedidos.
- `useOrderWorkspaceRemoteState.ts`: carga de borrador y promociones/productos por cliente sin inflar el componente principal.
- `order-detail-api.ts`: mutaciones de estado y pagos del detalle de pedido.
- `order-ui.ts`: helpers visuales y de formato propios de pedidos.

Los cálculos monetarios base se delegan en `lib/utils/money.ts`; este módulo conserva solo helpers de presentación o reglas visuales específicas de pedidos.
