# Etapa 5.2: perfiles sociales y presencia

## Alcance y contratos nuevos

Los contratos de autenticación/JWT, Study Ledger y `GET/PATCH /api/profile` permanecen intactos. Sin cambios de React Native, producción, AWS o PostgreSQL persistente. No se construye panel social, foro ni mensajería. El chat de salas que ya existía tampoco se modifica.

| Método y ruta | Contrato |
| --- | --- |
| `GET /api/users/{id}/profile` | id, username, presentationName, bio, registrationDate nullable, statistics con sólo los campos autorizados, presence. Sin correo, credenciales, rol ni detalles privados de metas. |
| `GET /api/users/{id}/profile/avatar` | Imagen del almacenamiento privado existente; 404 si falta o no hay acceso. |
| `GET /api/users/{id}/profile/banner` | Mismo control para banner. |
| `GET /api/users/{id}/presence` | status (`ONLINE`, `OFFLINE`, `HIDDEN`), lastSeenAt nullable y serverNow UTC. |
| `GET /api/profile/privacy` | Preferencias propias; valores false cuando no existe fila. |
| `PUT /api/profile/privacy` | Reemplazo completo de cuatro booleanos obligatorios: showPresence, showLastSeen, shareVerifiedMinutes, shareVerifiedSessions. No permite elegir otro propietario. |
| `POST /api/presence/heartbeat` | Cuerpo `{ "sessionId": "UUID" }`; identidad derivada exclusivamente del usuario autenticado. Responde con su presencia autorizada. |

Todas requieren autenticación y usan `Cache-Control: no-store`. Las imágenes además conservan MIME verificado, `nosniff` y CSP restrictiva. Perfil, imágenes y presencia ajenos exigen un Tracking actualmente ACCEPTED en cualquiera de las dos direcciones. El propio usuario tiene acceso a su proyección social. Usuario inexistente, inactivo o sin relación devuelve 404 uniforme. No hay excepción para administradores en estos nuevos endpoints ni permisos implícitos por estar en una sala. No existen métodos de edición de perfiles/imágenes ajenos.

Se reutiliza `User.registrationDate` exactamente como está almacenada; los valores nulos permanecen nulos. No se hace backfill ni se usa la fecha de despliegue. Sólo se ofrecen dos estadísticas públicas, cada una con consentimiento separado: minutos y sesiones de Study Ledger COMPLETE, verified, INDIVIDUAL/GROUP. No se publica ningún dato de metas, evidencias o validaciones ni rachas/estadísticas no autorizadas.

## Presencia y privacidad

`social_preferences`: una fila por usuario con cuatro permisos false por defecto y last_active_at nullable. `presence_session`: clave compuesta (user_id, session_id), last_seen_at del servidor e índice de expiración. Ambas tienen FK con borrado en cascada al eliminar la cuenta. No se modifica el modelo JPA User ni el proceso de eliminación existente.

Cada montaje de sesión web autenticada genera un UUID en memoria. Las pestañas y sesiones no comparten claves, y la presencia no se usa como mecanismo de autenticación. ONLINE significa que al menos una sesión tiene heartbeat posterior a ahora menos 90 segundos; en caso contrario OFFLINE. Sólo se devuelve ese estado si showPresence está activo. lastSeenAt es la última actividad global confirmada por heartbeat, no una supuesta hora de logout; sólo se devuelve con showLastSeen. No se registra IP, dispositivo o historial de conexión.

El navegador envía heartbeat como máximo cada 30 segundos con pestaña visible y alguna actividad local durante los últimos 90 segundos (entrada, teclado, foco o recuperación de visibilidad). Si está inactivo, sólo consulta presencia. Las pestañas ocultas pausan ambas operaciones; al volver revalidan. El servidor limita escrituras por sesión a una cada 25 segundos y hasta 32 sesiones concurrentes por cuenta. Un bloqueo de la fila de preferencias serializa cambios de privacidad y heartbeats. Si se ocultan presencia y última actividad, se borran las sesiones y last_active_at; no se registran heartbeats hasta reactivar alguna opción.

Cerrar una pestaña o salir de la cuenta deja expirar esa sesión; no se envía un evento que desconecte otras pestañas. El estado puede permanecer ONLINE hasta 90 segundos después del último heartbeat. El token no se altera ni se vincula a una nueva lógica de autenticación. Los clientes dejan de emitir heartbeat al desmontarse la sesión. La presencia de Study Rooms conserva su contrato y significado separados.

Los heartbeats eliminan sesiones propias expiradas y hasta 200 filas abandonadas de más de un día por llamada. La limpieza global es oportunista, sin cron ni dependencias; si no hay actividad, las filas antiguas pueden permanecer físicamente, pero jamás cuentan como online. last_active_at se conserva mientras alguna opción de presencia siga habilitada. El perfil social y sus estadísticas se revalidan cada 30 segundos mientras el perfil ajeno está visible; un fallo o pérdida de autorización retira datos e imágenes de la vista. Las imágenes se solicitan inicialmente y al refrescar, evitando descargas cada 30 segundos.

## Web

- `/users/:userId/profile`: vista de miembro sin controles de edición, redirección a `/profile` si es el usuario propio, validación de dirección, carga, errores recuperables y denegación uniforme.
- `ProfileIdentity`: estructura reutilizada por perfil propio y ajeno con avatar/banner, texto plano, fecha fiable y presencia autorizada. `PresenceStatus` añade punto verde/gris con nombre accesible; no hay punto para HIDDEN ni para estado desconocido por fallo de red.
- `SocialProvider`: estado propio separado por cuenta, preferencias y heartbeat con cancelación. Sidebar y perfil propio consumen la misma presencia; se conserva la microanimación del bloque de usuario.
- `MemberProfileLink`: enlaces desde Tracking activo, compañeros de Validations y tarjetas de participantes de Study Rooms. Desde salas, no tener Tracking aceptado sigue produciendo acceso denegado.
- Settings ofrece cuatro controles de privacidad persistentes en el backend. Cambios fallidos no se confirman visualmente. Se conservan tokens de todos los temas y paletas, controles de teclado y movimiento reducido.

## Actualización posterior del backend local (NO ejecutada aquí)

1. Seleccionar y respaldar explícitamente la base/esquema habitual antes de una futura actualización autorizada. Estos pasos son documentación, no autorización para ejecutarlos ahora.
2. Con el esquema correcto en `search_path`, aplicar **manualmente** `src/main/resources/db/migrations/2026-11-07_social_profiles_presence.sql` con un cliente PostgreSQL y `ON_ERROR_STOP=1`. La migración es aditiva, repetible y no modifica filas/fechas existentes. No requiere reinicializar la base, secuencias ni volúmenes. Requiere la tabla users existente; la migración anterior de Profile debe estar instalada.
3. Compilar y reiniciar únicamente la aplicación backend con su configuración habitual. No hay migración automática de estas tablas al arrancar. No hacen falta servicios adicionales, Redis, WebSockets ni nuevas variables de entorno.
4. Actualizar el frontend después del backend y verificar con dos cuentas sintéticas con Tracking aceptado. Activar sólo los permisos que se quieran compartir. Antes de actualizar backend/migración, el nuevo frontend muestra la indisponibilidad social; el perfil privado existente conserva su contrato.

## Pruebas aisladas y reproducción

Se creó exclusivamente `studystreak-social-disposable-20261107`, PostgreSQL 17 en tmpfs sin volúmenes, puerto 127.0.0.1:55449, base `studystreak_schema_check`, esquema `ss_audit_profile_social`. Los tests comprueban base y esquema antes de escribir. No se leyó ni migró la base habitual.

Para reproducir en un contenedor nuevo y desechable (el nombre debe estar libre):

```sh
docker run -d --name studystreak-social-disposable-20261107 \
  --label studystreak.purpose=social-tests --tmpfs /var/lib/postgresql/data \
  -p 127.0.0.1:55449:5432 \
  -e POSTGRES_DB=studystreak_schema_check -e POSTGRES_USER=studystreak_profile_test \
  -e POSTGRES_PASSWORD=disposable-profile-test-only postgres:17
# Esperar a que pg_isready confirme disponibilidad antes de crear el esquema.
docker exec studystreak-social-disposable-20261107 pg_isready -U studystreak_profile_test
docker exec studystreak-social-disposable-20261107 psql -U studystreak_profile_test \
  -d studystreak_schema_check -v ON_ERROR_STOP=1 -c 'CREATE SCHEMA ss_audit_profile_social;'
bash scripts/test-social-backend.sh -q \
  -Dtest=SocialProfileIntegrationTest,ProfileIntegrationTest,ProfileImageIntegrationTest,ProfileTextTest,ProfileImageStorageTest test
```

Las credenciales del ejemplo son exclusivamente de prueba. El script fija ese puerto/esquema y excluye configuración adicional local; no toma credenciales de archivos privados. SocialProfileIntegrationTest aplica la migración únicamente en ese destino. No ejecutar este script contra una base persistente.

Verificación: 25 pruebas backend relevantes (HTTP real y PostgreSQL desechable), prueba dirigida social con Chrome, suite web completa (60 pruebas de lógica y 33 de UI), ESLint, TypeScript y build. La prueba de navegador usa fixtures REST y cubre perfiles propios/ajenos, privacidad, revocación, imágenes ausentes, errores HTTP, navegación por las tres áreas, teclado, anchuras 320/375/768/1024/1440 y Dark/Light/System con las cuatro paletas. El backend comprueba autorización pendiente/aceptada/revocada, estadísticas con consentimiento por campo, ausencia de datos privados, TTL, múltiples sesiones, limitación de escrituras, última actividad y migración repetible.
