# Componentes UI transversales

Piezas visuales pequeñas que no pertenecen a un módulo de negocio concreto.

## Función

Centralizar patrones repetidos de interfaz para mantener consistencia entre administración, clientes y comerciales.

## Contenido

- `FeedbackMessage.tsx`: renderiza mensajes de éxito o error con las clases comunes definidas para formularios.
- `form-styles.ts`: agrupa clases reutilizables de inputs, textareas, botones y feedback.

## Criterio de uso

Usar esta carpeta cuando el componente o estilo sea transversal. Si el aspecto depende de un estado de negocio específico, como badges de pedido, visita o integración, debe permanecer en el módulo correspondiente.
