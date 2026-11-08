# Profile, Sidebar y siguiente etapa social

Fecha: 2026-11-07. Alcance: refinamiento web y propuesta; sin cambios de backend.

## Cambios visuales

El editor agrupa banner y avatar en una única previsualización; sólo el banner recorta la imagen. `ProfileImagePicker` oculta el input nativo, ofrece selección y eliminación en una fila de controles de 44 px, muestra el nombre truncado con título completo y conserva deshacer. El selector tiene icono, iluminación y foco; eliminar usa los tokens destructivos. Se mantiene el idioma inglés de la interfaz existente.

Edit profile y Change banner son controles de icono con título y nombre accesible. El panel de usuario conserva avatar, nombre, correo, Profile, Settings y Sign out; el avatar responde discretamente a hover/foco. Los siete iconos de navegación tienen animaciones de 300 ms, también activadas por foco de teclado. Las preferencias del sistema y Settings desactivan movimiento. Sin dependencias nuevas ni cambios en endpoints, validación o secuencia de guardado.

## Soporte existente y dependencias

- `ProfileController`, `ProfileService` y `ProfileImageController`: `/api/profile` y sus imágenes operan sobre el usuario autenticado. El DTO contiene identidad, biografía y estadísticas propias; no fecha de ingreso ni presencia. No existe consulta equivalente para otro usuario.
- `User.registrationDate` ya persiste una fecha real. `UserResponseDTO` la expone, pero `UserService.getUserById` permite acceso sólo al propietario o administrador y ese DTO incluye correo. No debe reutilizarse como perfil público. Para el perfil propio se propone añadir una fecha nullable al DTO de Profile en una tarea de backend; hasta entonces no se muestra.
- Tracking expone requesterId/receiverId y sus nombres; Validations obtiene sus compañeros de esos vínculos. Son puntos de entrada futuros para consultar perfiles, sin necesitar exponer datos privados de cuentas.
- `StudyRoomSnapshot.Member` ya expone userId, username y online. `StudyRoomMember.lastSeenAt` y el heartbeat determinan presencia dentro de la sala. Esa señal no representa conexión global ni última conexión de la cuenta y no debe trasladarse al perfil o sidebar.
- No existe contrato de presencia global, privacidad de perfil/presencia, consulta de estadísticas públicas ni listado de compañeros conectados. No se incorporan etiquetas, fechas o puntos de estado inventados.

## Contrato mínimo propuesto (no implementado)

| Endpoint | Responsabilidad y respuesta |
| --- | --- |
| `GET /api/users/{id}/profile` | Proyección social explícita: id, username, presentationName, bio, registrationDate nullable, disponibilidad/versiones de avatar/banner, estadísticas permitidas. Omitir campos privados; sin email, rol o zona horaria. |
| `GET /api/users/{id}/profile/{avatar\|banner}` | Servir imagen autorizada con el mismo control de acceso del perfil y almacenamiento existente; no exponer rutas internas. |
| `GET /api/profile/privacy` y `PATCH /api/profile/privacy` | Leer/editar visibilidad propia de perfil, estadísticas, presencia y última conexión. Validación del lado servidor. |
| `POST /api/presence/heartbeat` | Señal autenticada de actividad global con limitación de frecuencia; devolver hora del servidor y expiración. |
| `GET /api/users/{id}/presence` | Estado y lastSeenAt sólo cuando su política lo permita; devolver estado desconocido y omitir última conexión si están ocultos. |
| `GET /api/companions?online=true&cursor=…` | Lista paginada de compañeros autorizados desde vínculos aceptados; proyección mínima para el futuro panel. Evitar consultas por miembro y filtraciones por contadores. |

Autorización: derivar al solicitante del token; jamás confiar en un userId enviado como identidad. Proponer visibilidad inicial privada y habilitación explícita para compañeros. Permitir la proyección a contactos con Tracking aceptado o, si la política del titular lo autoriza, miembros de una sala compartida con membresía vigente. Validations no concede acceso adicional al de su relación existente. Revalidar permisos en cada petición de perfil, imagen, estadísticas y presencia; denegar por defecto y responder de forma uniforme cuando un recurso no sea visible. No ampliar `/users/{id}` ni reutilizar su DTO privado. Bloqueos futuros deben prevalecer sobre cualquier relación y revocar acceso.

Persistencia: reutilizar displayName, bio, registrationDate e imágenes existentes; añadir preferencias por usuario con visibilidades separadas para perfil/estadísticas/presencia/última conexión. No rellenar fechas históricas desconocidas. Mantener heartbeats por sesión en un almacén con TTL (Redis si está disponible); un usuario está online si alguna sesión no expiró. Una alternativa inicial es una tabla de sesiones indexada con limpieza periódica. Persistir una única lastSeenAt UTC por usuario, agregada y con frecuencia limitada; distinguir desconexión de logout y múltiples dispositivos. Retención explícita y eliminación con la cuenta. No publicar ubicación, dispositivo ni historial de actividad.

Estadísticas: crear una proyección agregada pública con opt-in, reutilizando las reglas actuales de rachas y tiempo verificado; no exponer metas privadas, registros, evidencias, audio ni validaciones individuales. No reutilizar directamente `ProfileService.response`, que calcula estadísticas del usuario actual.

Etapas propuestas: primero contrato y autorización con pruebas de acceso cruzado/privacidad; después consulta de perfiles desde los tres puntos de entrada; luego presencia multisesión y finalmente panel plegable con actualización por polling moderado, pausado cuando la pestaña esté oculta. SSE sólo si la necesidad de tiempo real lo justifica. Probar expiración, revocación, concurrencia y ausencia de filtraciones antes de conectar UI.

## Opinión técnica

Un panel de compañeros conectados tiene utilidad inmediata para formar sesiones y pedir validaciones, siempre que sea opcional, plegable y respete privacidad. Un foro académico puede aportar preguntas persistentes y respuestas reutilizables, pero introduce búsqueda, moderación, reportes, spam y notificaciones. Conviene validar demanda y capacidad de moderación antes de construirlo; tiene menor prioridad que perfiles y colaboración fiable.

La implementación se detiene en los cambios visuales y esta auditoría. La siguiente etapa requiere autorización del usuario.

## Verificación

- ESLint, `tsc -b` y build de producción; Vite avisa del chunk de Study Rooms superior a 500 kB.
- `npm run test:web`: 60 pruebas de lógica y 32 de UI, con Chrome real para rutas, foco, imágenes y responsive.
- Profile: validación de texto, cancelar/Escape, guardado, recarga, subida repetida de imágenes, eliminación, errores y liberación de object URLs. Las peticiones se interceptan con fixtures: esta verificación no prueba el almacenamiento de un backend desplegado.
- Anchuras 320, 375, 768, 1024 y 1440 px; geometría de banner/avatar, botones en una fila con anchuras y alturas iguales, ausencia de desbordamiento, nombres accesibles, títulos, foco y navegación con Tab.
- Hover real con eventos de ratón de Chrome, foco en los siete iconos y desactivación de animaciones con Settings y `prefers-reduced-motion`. Revisión visual de capturas del editor a 320 y 1440 px en `/tmp`, fuera del commit.
