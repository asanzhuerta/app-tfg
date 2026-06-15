# Componentes de comunicaciones

UI para promociones, avisos, formaciones y segmentos/rangos.

## Funcion

Gestionar comunicaciones desde administración y mostrar contenidos activos a cliente/comercial.

El módulo M6 tiene reglas propias de segmentación, vigencia, estado, tipos de promoción y adjuntos. `AdminCommunicationsWorkspace` crea promociones con campos condicionales por tipo, mientras `PromotionsOverview` muestra imagen/PDF cuando existen.

## Organización de componentes

El workspace administrativo se divide en formularios, listas, resumen y hook de orquestación:

- `useAdminCommunicationsWorkspace.ts`: estado, handlers y coordinación con API.
- `AdminCommunicationForms.tsx` y formularios específicos: edición y alta por tipo de contenido.
- `AdminCommunicationLists.tsx` y listas específicas: tablas/tarjetas de promociones, formaciones, segmentos y asignaciones.
- `admin-communications-api.ts`: llamadas HTTP del módulo apoyadas en `requestJson`.
- `promotion-attachments.ts`: resolución compartida de adjuntos de promoción.

Esta separación evita que la pantalla principal vuelva a concentrar toda la lógica de estado, serialización y presentación.
