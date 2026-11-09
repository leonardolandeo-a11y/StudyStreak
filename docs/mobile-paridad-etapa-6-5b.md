# Etapa 6.5b — Study Rooms, Resources y Notifications

Alcance: paridad de los tres módulos sobre React Native/Expo existente. Referencias: `auditoria-paridad-web-mobile.md`, páginas Web y servicios actuales. No se modifica Web, backend, PostgreSQL, Docker, AWS, archivos privados ni dependencias. No hay push nativo ni rediseño retro.

## Funcionalidad conservada y ajustes

### Study Rooms

Se conservan lobby de membresías, creación/unión por código, salida/cierre, participantes, roles, avatares y perfiles sujetos a la autorización social existente. El temporizador sigue usando `studyRoomClock`, versiones del servidor, `expectedVersion`, snapshots con reloj monotónico, confirmación/staleness, polling de 4 s y heartbeat de 12 s. No se modifica el cálculo ni la acreditación de estudio, el ledger, el outbox ni la idempotencia de completados.

Se aplican tokens Dark/Light/System y las cuatro paletas al lobby, detalle, chat/reacciones, moderación, selección privada de meta y medios. Las acciones son compactas y las confirmaciones reutilizan el modal nativo con SafeArea/Back/Reduce Motion. Se conserva el + contextual de creación y la distinción entre volver al lobby y abandonar/cerrar la sala. La moderación se sigue autorizando en el servidor. Chat mantiene sus IDs de mensaje al reintentar y dispone de loading/retry explícitos. La selección privada y sus resúmenes dejan de consultar al perder foco; se cancelan las lecturas pendientes sin cambiar las escrituras de selección ni de participación. El resumen integrado evita otra tarjeta anidada.

El listado sigue mostrando las salas que devuelve la API de membresías, no un directorio público nuevo. Los avatares no adquieren permisos por compartir sala. Estado de conexión a la sala y presencia social privada siguen separados.

### Resources

La búsqueda sigue usando únicamente `GET /api/resources/books?q=...` a través de Spring Boot, con 2–80 caracteres y normalización de metadatos/enlaces oficiales HTTPS existente. No hay claves Google ni acceso directo al proveedor desde el servicio móvil. El contrato devuelve una lista, sin parámetros de paginación: no se inventa paginación local/remota.

Formulario único con foco visible, resultados compactos, portada con fallback ante ausencia/error, detalle nativo reutilizable, enlaces externos y mensajes de error conservados. Cancel search aborta la petición y evita resultados tardíos; salir de Resources cancela la búsqueda y volver permite restaurar su consulta. Un nuevo `topic` desde Goals reinicia el contenido correspondiente, como Web. Detalle usa SafeArea, cierre y Back del modal, sin overlay artesanal ni doble ScrollView.

### Notifications

Se conservan filtros All/Unread/por tipo, paginación, lectura, eliminación confirmada y rutas contextuales. En particular, `DAILY_RECORD_CREATED` mantiene goalId/recordId y `review=1`; no cambia el contrato ni la selección de validaciones. Las tarjetas y filtros usan tema, controles táctiles de al menos 48 px y foco visible.

El contador permanece en `NavigationDataProvider`, sin proveedor adicional. Leer, abrir una no leída o eliminar refresca el contador compartido inmediatamente mediante una nueva consulta. Un refresco por mutación cancela un polling anterior para impedir que restaure un valor obsoleto. El polling existente de 30 s sólo inicia consultas en foreground; logout/cambio de cuenta desmonta y cancela el contador. Un fallo de red conserva el último valor confirmado. El drawer mantiene su regla de no mostrar badge cero; no se añaden badges a encabezados que no los tenían.

### Sesiones

Una prueba aislada reprodujo una petición de Rooms encolada justo antes de cambiar de cuenta que podía adoptar la revisión nueva durante el interceptor. Rooms, Books y Notifications capturan ahora la revisión al invocar el servicio, siguiendo el patrón existente en Social/Tags. El cliente JWT/refresh, SecureStore y los endpoints permanecen intactos. Las peticiones encoladas de la cuenta anterior se rechazan antes de enviarse.

## Verificación aislada

- ESLint sin errores ni advertencias y TypeScript (`tsc --noEmit`).
- Suite Mobile completa: 31 archivos `tests/*.test.mjs`.
- Siete escenarios nuevos en `roomsResourcesNotifications.test.mjs`: contratos de salas/versiones/heartbeat, permisos y aislamiento de cuenta, Books/normalización/cancelación/errores, filtros y mutaciones de notificaciones, contador frente a carreras/red/logout y renderizado de primitivas en ocho temas.
- Prueba existente de Reduce Motion actualizada: Resources delega su animación a CreationModal, que conserva el ajuste global/dispositivo.
- Exportaciones Expo offline de web y Android, sin instalar paquetes ni ejecutar builds nativos.
- Chrome con exportación web de Expo y todas las peticiones externas interceptadas por fixtures: creación/cierre y unión/salida, host/member, temporizador, estado studying, selección privada de meta y resumen, chat con fallo/reintento con el mismo UUID, mano/reacción, eliminación de mensaje, error/cambio de permiso, confirmación de expulsión cancelada y fallback de medios. También Books con portada ausente/fallida, empty/error/retry/cancelación, detalle/enlaces; notificaciones con filtros, badge 2→1→ausente, lectura, eliminación, error/retry y destinos Goal/Validation con Back. Light/Purple y anchos 320/390/768/1440.
- Regresiones Chrome: `mobilePolish.browser.mjs`, `mobileSocial.browser.mjs`, `mobilePartners.browser.mjs` (navegación, validación desde Notifications, privacidad, revocación, cuentas, temas y movimiento reducido).
- Inspección de imágenes de Chrome de sala, Resources, Notifications y Light. No se usa PostgreSQL persistente en pruebas.

## Límites y comprobaciones manuales pendientes

Chrome ejecuta React Native Web; mocks y exportación no equivalen a operar Android físico. No se ha controlado el teléfono desde las herramientas.

**Expo Go / Android:**

1. En cuentas/salas de prueba, crear, unir y salir; comprobar cancelación de cada confirmación, Back al lobby, selector + y drawer. Verificar controles de host/miembro, transferencia, regeneración de código y expulsión confirmada con autorización real. La prueba Chrome cancela la expulsión para conservar el participante de su fixture.
2. Con dos dispositivos de prueba, arrancar/pausar/reanudar y comparar reloj; bloquear/poner en background, desconectar/reconectar y recibir una versión antigua. Comprobar que los controles se bloquean cuando el estado está stale. Validar el ledger real sólo en entorno desechable: pausas/gaps no se acreditan, reset/salida cancelan el round según las reglas existentes.
3. Seleccionar una meta propia, marcar studying y comprobar el progreso privado confirmado. Probar chat, reacciones y moderación con roles distintos, errores y permisos revocados. Salir/cerrar sesión mientras llegan respuestas y confirmar aislamiento de cuentas.
4. Buscar libros desde Resources y desde una meta; cancelar, reintentar sin red, abrir/cerrar detalle con teclado y Back. Verificar portadas y apertura de enlaces mediante Android y mensaje de error si ningún handler puede abrirlos.
5. Recorrer filtros de Notifications con varias páginas, leer/borrar/abrir y comprobar contador del drawer sin cero. Verificar retorno desde Goals/Validations y que no cambian IDs ni permisos. No se generan notificaciones en la base habitual para probar.
6. Revisar ocho combinaciones de tema/paleta, System con cambio del dispositivo, Reduce Motion, tamaño de fuente, TalkBack, foco externo y teclado en pantallas pequeñas.

**Medios / development build:**

- Expo Go y web muestran fallback explícito. El SDK nativo se importa perezosamente sólo en un entorno compatible y tras solicitar abrir el visor; no se presenta como disponible en Go.
- Development build compatible con los módulos LiveKit ya instalados y servidor configurado: probar recepción de pantalla, estados conexión/vacío/error, selección/maximización, SafeArea en landscape, disconnect/background, logout y revocación de permisos/epoch.
- El visor existente es sólo recepción: no publica cámara, micrófono o pantalla ni graba. No se afirma haber probado transporte LiveKit real ni un development build físico. El temporizador continúa siendo independiente de los medios.

## Archivos de esta etapa

Pantallas `study-rooms.tsx`, `resources/index.tsx`, `notifications/index.tsx`; componentes `StudyRoomGoal`, `RecordedSummary`, `RoomCollaboration`, `RoomModeration`, `RoomMedia`, `NativeRoomMedia`, `NotificationCard`, nuevo `BookCover`; `NavigationDataContext`, `useRoomCollaboration`, nuevo `unreadCounter`; servicios `studyRoomService`, `googleBooksService`, `notificationService`; dos archivos de pruebas nuevos, ajuste de `mobileAppearanceRendering.test.mjs` y este documento.

Se termina 6.5b; no se inicia auditoría final ni rediseño retro.
