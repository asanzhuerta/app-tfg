# Ajustes admin

Configuración visible del sistema.

## Función

Gestionar parámetros operativos que forman parte del trabajo ordinario del administrador:

- cargo por entrega mediante agencia;
- umbrales de compra para rangos Plata, Oro y Platino;
- frecuencia, fecha y ejecución manual del recálculo de rangos;
- canales automáticos de comunicación.

La configuración de rate limiting queda implementada en backend y cubierta por scripts de diagnóstico, pero no se expone en esta pantalla. Si fuese necesario revisarla en una implantación real, debe hacerse como operación técnica controlada, habilitando explícitamente `ADMIN_RATE_LIMIT_SETTINGS_ENABLED=true`, no como acción normal del rol `admin`.
