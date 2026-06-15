# Componentes de UI

Componentes reutilizables de la aplicación.

## Función

Centralizar piezas visuales y de interacción compartidas entre roles: tablas, formularios, navegación, catálogo, pedidos, mapas, usuarios y comunicaciones.

Evita duplicar interfaces por rol y ayuda a mantener consistencia visual en toda la app.

## Componentes transversales

- `ui/FeedbackMessage.tsx`: mensaje común para estados de éxito y error en formularios y acciones cliente.
- `ui/form-styles.ts`: clases base de inputs, textareas, botones y feedback reutilizables.
- Los componentes de dominio deben importar estas piezas cuando el patrón visual sea compartido, en lugar de repetir bloques de clases Tailwind.
