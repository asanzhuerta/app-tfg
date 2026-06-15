# Componentes de salón

UI para fichas técnicas, clientes internos del salón, servicios, plantillas e imágenes de resultado.

## Función

Gestionar el bloque M5 desde la perspectiva del cliente profesional.

Las fichas técnicas tienen modelo visual y funcional propio: historiales, fórmulas, tonos, productos usados y resultado final.

## Organización de la vista de detalle

`SalonClientDetailView` delega la coordinación en `useSalonClientDetailView` y divide la interfaz en paneles:

- `SalonClientOverviewPanels.tsx`: datos base, métricas y sugerencias.
- `SalonServiceFormPanel.tsx`: alta/edición de servicio técnico y productos usados.
- `SalonServiceHistoryPanel.tsx`: filtros, historial, borrador técnico y acciones sobre servicios.
- `SalonTemplateLibraryPanel.tsx`: guardado, aplicación y borrado de plantillas.
- `salon-client-api.ts`: llamadas HTTP del módulo.
- `salon-client-detail-utils.ts`: helpers de edición y limpieza de imágenes temporales.

Los estilos de formularios y feedback se apoyan en `app/components/ui` para no repetir clases entre pestañas.
