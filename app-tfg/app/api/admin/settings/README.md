# API ajustes admin

Endpoints de configuración.

## Función

Gestionar parámetros persistidos en `system_configurations`, como cargo por agencia, canales automáticos y política de rangos.

`/api/admin/settings/client-tiers` expone la configuración de umbrales Plata/Oro/Platino y la frecuencia/fecha de recálculo.
`/api/admin/settings/client-tiers/recalculate` ejecuta manualmente la reasignación de rangos con la política configurada.
