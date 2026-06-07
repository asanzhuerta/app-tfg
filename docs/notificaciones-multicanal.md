# Notificaciones multicanal

## Objetivo

Las notificaciones internas de M6 se mantienen como fuente principal en `app_notifications`.
Cuando administración publica una promoción o una formación, ahora puede marcar canales
externos adicionales:

- `email`: envia un correo al `users.email` del destinatario.
- `push`: envia una Web Push Notification a los dispositivos/PWA que el usuario haya activado.

Si un canal externo no está configurado o el usuario no tiene destino válido, la operación no
falla: el aviso interno se crea igualmente.

## Flujo técnico

1. Administración crea o edita una promoción activa o una formación publicada.
2. El formulario envia `deliveryChannels`, por ejemplo `["in_app", "email", "push"]`.
3. El backend crea los registros internos en `app_notifications`.
4. Si se solicito `email`, se envia un correo con Nodemailer mediante SMTP.
5. Si se solicito `push`, se buscan suscripciones activas en `user_push_subscriptions` y se envia
   Web Push con VAPID.
6. Si un proveedor push responde `404` o `410`, la suscripcion se marca como revocada.

## Variables de entorno

Correo SMTP:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario@example.com
SMTP_PASSWORD=super-secreto
SMTP_FROM="Kinestilistas <usuario@example.com>"
```

Push PWA:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com
APP_BASE_URL=https://app.example.com
```

`APP_BASE_URL` permite que los correos incluyan enlaces absolutos. Si no existe, se usa
`NEXTAUTH_URL` o una ruta relativa.

Las claves VAPID se pueden generar con:

```powershell
cd app-tfg
node .\node_modules\web-push\src\cli.js generate-vapid-keys
```

## Activacion por usuario

Clientes y comerciales ven un bloque `Push PWA` en su pantalla de avisos. Desde ahi pueden activar
o desactivar las notificaciones del dispositivo.

Requisitos del navegador:

- HTTPS en produccion, o `localhost` en desarrollo.
- Service worker registrado desde `public/sw.js`.
- Permiso de notificaciones concedido por el usuario.
- En iOS/iPadOS, las Web Push de Safari requieren la app instalada en pantalla de inicio como PWA.

## Cambios de base de datos

La migracion `1780612000000-042-m7-notification-delivery-channels.ts` crea:

- `user_push_subscriptions`
  - `user_id`
  - `endpoint`
  - `p256dh`
  - `auth`
  - `expiration_time`
  - `user_agent`
  - `last_used_at`
  - `revoked_at`

También registra en `external_integrations` las integraciones `SMTP transaccional` y
`Web Push PWA` como `messaging`.

## Pruebas recomendadas

1. Ejecutar migraciones.
2. Configurar SMTP y VAPID en `.env.local`.
3. Abrir la app en HTTPS o localhost.
4. Entrar como cliente o comercial y activar `Push PWA` en avisos.
5. Entrar como admin, crear una promoción activa o una formación publicada y marcar correo/push.
6. Verificar:
   - aviso interno en `/clients/notifications` o `/commercials/notifications`;
   - correo recibido en `users.email`;
   - notificación del sistema en el dispositivo suscrito.

## Visitas comerciales

Las visitas comerciales generan avisos automaticos en tres casos:

- Al crear una visita, el cliente recibe un aviso interno y, si estan configurados, email y push.
- Si una visita planificada se aplaza automáticamente porque ya pasó su día o se ha superado la
  ventana horaria del cliente, el comercial recibe un aviso operativo para reubicarla.
- Al consultar la bandeja de avisos, los clientes reciben un recordatorio interno de las visitas
  planificadas para el mismo día, evitando duplicados por visita y día.

El recordatorio de mismo día no es todavía un proceso en segundo plano: se sincroniza al listar
notificaciones. Para que llegue como push/email aunque el usuario no abra la app, debe ejecutarse
periódicamente un job/cron server-side que reutilice la misma lógica y dispare los canales externos.
