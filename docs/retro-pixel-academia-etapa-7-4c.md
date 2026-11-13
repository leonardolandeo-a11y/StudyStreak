# Etapa 7.4c — Study Rooms: colaboración Cozy Retro

Fecha: 2026-11-13. Rama: `feat/ui-ux-web-mobile`. HEAD inicial: `03b14f5`, con `595507e` ya registrado. Se revisaron AGENTS.md, historial, staging, archivos nuevos y componentes de salas. No existía una implementación parcial de 7.4c que recuperar.

## Composición Web y Mobile

**Web:** sala organizada en dos zonas. La principal contiene Shared Screens, el Pomodoro circular debajo y la selección privada de Goal existente. A la derecha queda un panel con pestañas Chat y Participants. En anchos inferiores a 1000 px se apilan las zonas. La cabecera seleccionada usa el nombre real de la sala, contador de miembros/conexión a la sala y código de invitación; la introducción extensa queda en el lobby. La zona multimedia vacía es más baja sin comprimir el vídeo compartido real.

**Mobile:** cabecera compacta, Shared Screens/fallback, Pomodoro, Goal y panel de pestañas táctiles en el scroll nativo. Chat tiene una ventana de lectura acotada y scroll anidado, compositor multilínea y acciones táctiles de al menos 44–48 px. Se conservan drawer, pestañas inferiores, acción contextual y Back. Abrir una sala coloca su contenido al inicio; no se reinicia el scroll durante los snapshots posteriores.

Superficies lavanda locales, paleta seleccionada, bordes finos y controles compactos. Sin escenarios panorámicos, recursos nuevos ni ilustraciones dominantes. Dashboard, Focus Studio, autenticación y personalización 8.x permanecen sin cambios.

## Pomodoro compartido

El anillo Web usa SVG; Native usa segmentos de View y medidas nativas, sin dependencias adicionales. El diámetro se adapta al espacio disponible y el tiempo Native se ajusta a una sola línea. El anillo muestra la proporción de tiempo restante de las fases existentes del servidor: 25 minutos de Focus / 5 de Break.

No hay un reloj independiente. El número visible continúa viniendo de `sharedTimeRemaining(room, receivedAt, now)`. Se conservan versiones, snapshots, epochs multimedia, confirmación de acciones destructivas, Start/Pause/Reset/Break, heartbeats, membresía y registro de tiempo. Los archivos de servicios y reloj son idénticos a HEAD. El badge sano `Synced · server confirmed` desaparece; continúan los avisos de desconexión, espera, reconexión y errores, además del estado real del temporizador.

## Chat e historial

- Filas compactas con avatar protegido/fallback, autor, hora local y texto. Agrupación visual del mismo autor dentro de cinco minutos, conservando identificación accesible; las filas retiradas interrumpen la agrupación.
- Web: Enter envía, Shift+Enter añade una línea y Enter de composición IME no se trata como envío. Papelera roja en hover/foco; en pantallas táctiles permanece visible. Confirmación antes de borrar.
- Mobile: envío táctil, selector de reacciones compacto y diálogo de confirmación. La reacción actual se representa como elección confirmada en el grupo nativo/accesible, sin simular una retirada que no existe en la API.
- UUID estable al reintentar una escritura no confirmada. Bloqueo síncrono de envíos/acciones simultáneos y rechazo de mensajes vacíos. El texto no desaparece por un fallo de red.
- Cada sala/cuenta tiene su estado de colaboración en memoria. Al salir, perder foco Native, cambiar de cuenta o ir a background se cancelan las operaciones correspondientes. Las respuestas antiguas no contaminan la instancia siguiente.

Older/Newer se sustituyen por lectura acumulada: se consulta página cero para mensajes recientes y se solicita **una** página anterior de 25 mensajes por interacción. No se precarga todo el historial. Los IDs se deduplican y se mantiene orden cronológico; una respuesta antigua no resucita un mensaje retirado. Web carga al subir con rueda, gesto o teclado; mantiene un control accesible de carga anterior para teclado. Native usa gesto de scroll y control táctil/teclado equivalente. Llegar al principio no inicia descargas automáticas.

Sólo se sigue el final si el lector estaba a menos de 80 px. Al insertar anteriores se conserva el mensaje visible y su desplazamiento. En Native se mide el mensaje anclado con `measureLayout`: `onLayout` por sí solo no notificaba el cambio de posición de filas antiguas en RN Web. Las mediciones se invalidan al desmontar/cambiar de pestaña. Se probó también el último lote, con solapamiento por mensajes nuevos. El indicador Web de carga queda fuera del flujo de las filas para no mover su ancla; Native mantiene estable la altura del control de historial.

En errores transitorios se conserva el contenido ya cargado y se ofrece Retry chat. Ante 403/404 del feed se retira el contenido protegido de esa instancia. La paginación fallida conserva su número para el reintento.

## Participants, permisos y medios

Participants conserva identidades, Host/Member, estado de estudio y **conexión a la sala** suministrada por el servidor. No se presenta ese dato como presencia social global, ni se inventa última conexión.

En Web, el enlace social se ofrece después de una lectura autorizada del perfil; el propio usuario enlaza a Profile. Native reutiliza la relación ACCEPTED del directorio social existente. Ser miembro de una sala no concede acceso a avatar o perfil privado. Las imágenes siguen usando el cliente autenticado y sus mecanismos existentes de concurrencia/limpieza; 403/404 muestran iniciales.

Transferir host y regenerar código permanecen disponibles según rol. Los controles Web existentes de permisos/remoción multimedia se presentan en Participants mediante un portal del mismo RoomMedia, sin duplicar su estado, polling, SDK ni funciones. Native mueve el RoomModeration existente a la pestaña. Se probaron la cancelación de remoción y el cambio de permiso con fixtures; no se otorgaron permisos reales.

Expo Go conserva el fallback y nunca carga LiveKit/WebRTC incompatibles. `RoomMedia.tsx` y `NativeRoomMedia.tsx` de Mobile no se modificaron. Native continúa como receptor; no se implementaron cámara, micrófono o publicación de pantalla. Web conserva exclusivamente la captura de pantalla existente. No se probó una conexión real a un servidor LiveKit.

## Contrato real y límites del backend

Se inspeccionaron controladores/servicios sólo en lectura. No se cambiaron endpoints ni contratos:

- `GET /api/study-rooms/{id}/collaboration?page=…`: páginas descendentes de 25, retención de 30 días, presencia efímera del chat. La API admite páginas hasta 1000; no tiene cursor ni revisión de mensajes antiguos.
- `POST …/collaboration/messages`: `{ id, text }`, UUID idempotente y límite de 1000 caracteres. El servidor limita la frecuencia de envío.
- `DELETE …/collaboration/messages/{messageId}`: sólo host; retirada visible para todos, no eliminación del ID.
- `PUT …/collaboration/hand`: `{ raised }`.
- `POST …/collaboration/reaction`: sólo 👏, 💡, ✅, duración de 10 segundos y límite de frecuencia de 3 segundos. **No existe endpoint para retirar una reacción**; volver a pulsarla usa la acción real, sin desmarcado local ficticio.

La paginación por offset puede solaparse con llegadas nuevas; el cliente elimina duplicados. El polling de página cero no comunica ediciones de páginas antiguas efectuadas en otra sesión: una retirada local confirmada se refleja inmediatamente, pero cambios remotos fuera de la página reciente sólo se conocen al reabrir y cargar de nuevo esa página. No se simula sincronización histórica que la API no proporciona.

El transporte de estos componentes ya era polling: sala cada 4 s, heartbeat cada 12 s y colaboración cada 2,5 s. Se conserva; no se sustituyó un reloj o canal SSE por otro. La colaboración pausa su consulta en background y Native al abandonar la pantalla. No se añadieron heartbeats personales, endpoints, dependencias, escrituras de ledger o llamadas directas al almacenamiento de sesiones.

## Verificación

Datos exclusivamente simulados o unitarios; sin escrituras en PostgreSQL habitual, migraciones, Docker o AWS.

- ESLint Web/Mobile y TypeScript Web/Mobile.
- Build Web; permanece el aviso previo de chunks superiores a 500 kB.
- Expo export para Web y Android, sin compilación nativa ni instalación de dependencias.
- Web: 20 regresiones dirigidas aprobadas de colaboración, reloj, captura segura y perfiles sociales.
- Mobile: regresiones de colaboración, reloj, seguridad de carga multimedia y contratos de salas/recursos/notificaciones aprobadas (27 casos; el runner puede agruparlos por archivo).
- Chrome Web y RN Web: actor host y miembro, pestañas, borrador conservado, avatares autenticados/fallback, enlaces autorizados, Enter/Shift+Enter y envío táctil, fallo/reintento con mismo UUID, carga incremental de páginas 1/2, posición de lectura, llegadas nuevas al leer anteriores, último lote, borrado cancelado/confirmado, reacción propia y mano levantada, permisos multimedia existentes, Start/Pause/Reset/Break con confirmaciones/versiones, reconexión y polling pausado en background.
- Responsive: 320/390/768/1440 px sin overflow horizontal; Dark/Light/System y cuatro paletas. Reduce Motion conserva el funcionamiento y evita transiciones del panel/modal.

### Pruebas generales antiguas fuera de alcance

Se ejecutaron además dos scripts amplios existentes. Tres casos fallaron antes de verificar la nueva sala:

1. `academicModules.test.mjs`: espera un `data-pixel-glyph` en `/goals/7`, ajeno a esta entrega.
2. `socialAvatarCompletion.test.mjs`: busca tarjetas `article` con el texto `Tracking connection` que no coincide con Tracking actual.
3. El mismo archivo espera que el icono Resources mida 18 px, diferente del sidebar actual.

No se cambiaron Goals, Tracking, Sidebar ni esos tests para ocultar los fallos. Una copia aislada con los archivos Web de Rooms de HEAD también reprodujo los fallos de Tracking/Resources; la prueba general de módulos en esa copia se detuvo en una espera de navegación, por lo que no se presenta como reproducción exacta del primer caso. Las regresiones específicas anteriores sí son las verificaciones de esta entrega. Logs y diagnóstico aislado en `.local/stage74c/`.

Comandos principales:

```sh
# En cada frontend:
npm run lint
# Web:
npx tsc -b
npm run build
node --experimental-strip-types --test tests/roomCollaboration.test.mjs tests/studyRoomClock.test.mjs tests/mediaCapture.test.mjs tests/socialRendering.test.mjs
node tests/roomCollaboration.browser.mjs
# Mobile:
npx tsc --noEmit
node --experimental-strip-types --test tests/roomCollaboration.test.mjs tests/studyRoomClock.test.mjs tests/roomMediaSafety.test.mjs tests/roomsResourcesNotifications.test.mjs
npx expo export --platform web --platform android --output-dir .expo/integration-export
node tests/roomCollaboration.browser.mjs
```

## Capturas

Chrome sobre APIs simuladas; son demostraciones de layout, no datos de usuarios reales. Directorio: `docs/images/retro-pixel-academia-7-4c/`.

| Vista | Antes | Después |
| --- | --- | --- |
| Web 1440 | [Anterior](images/retro-pixel-academia-7-4c/before-web-room-1440.png) | [Actual](images/retro-pixel-academia-7-4c/after-web-room-1440.png) |
| Web 768 | [Anterior](images/retro-pixel-academia-7-4c/before-web-room-768.png) | [Actual](images/retro-pixel-academia-7-4c/after-web-room-768.png) |
| Web 390 | [Anterior](images/retro-pixel-academia-7-4c/before-web-room-390.png) | [Actual](images/retro-pixel-academia-7-4c/after-web-room-390.png) |
| RN Web 390 | [Anterior](images/retro-pixel-academia-7-4c/before-mobile-room-390.png) | [Actual](images/retro-pixel-academia-7-4c/after-mobile-room-390.png) |
| RN Web 768 | [Anterior](images/retro-pixel-academia-7-4c/before-mobile-room-768.png) | [Actual](images/retro-pixel-academia-7-4c/after-mobile-room-768.png) |

También se incluyen `after-{web,mobile}-participants.png`, `after-{web,mobile}-history.png`, vistas de miembro y claro con paleta seleccionada. Las capturas originales anteriores de 8.x no se alteraron.

## Archivos de esta entrega

Web:

- `src/pages/StudyRoomsPage.tsx`.
- `src/components/study/RoomCollaboration.tsx`.
- `src/components/study/RoomMedia.tsx` — sólo presentación de moderación mediante portal.
- `src/components/study/ParticipantCard.tsx` — etiqueta explícita de conexión a la sala.
- `src/components/study/RoomProfileLink.tsx` y `study-rooms.css`.
- `src/hooks/useRoomCollaboration.ts`.
- `src/features/studyRooms/collaborationState.ts`.
- `tests/roomCollaboration.test.mjs` y `roomCollaboration.browser.mjs`.

Mobile:

- `src/app/(app)/(main)/(menu)/study-rooms.tsx`.
- `src/components/media/RoomCollaboration.tsx`.
- `src/components/study/SharedRoomDial.tsx`.
- `src/components/focus/StudyRoomGoal.tsx` — sólo superficie/paleta del Goal incrustado en la sala; sin lógica de registro o Focus.
- `src/hooks/useRoomCollaboration.ts`.
- `src/features/studyRooms/collaborationState.ts`.
- `tests/roomCollaboration.test.mjs` y `roomCollaboration.browser.mjs`.

Compartidos para pruebas/documentación: `scripts/tests/roomCollaboration{Cases,Fixture,Review}.mjs`, este documento y las capturas. Los modelos TS conservan archivos propios en cada plataforma, como los relojes existentes; ambos ejecutan los mismos casos de contrato y no introducen imports DOM en Native.

## Pendientes físicos y Git

Pendiente en Android/Expo Go real: scroll anidado y conservación del ancla con gestos/inercia, teclado Android e IME, TalkBack y retorno del foco desde el diálogo, tamaños de fuente elevados, SafeArea, navegación Back y background/foreground. Verificar el círculo a 320–768 px y la selección de reacciones con el lector de pantalla. La exportación y RN Web no equivalen a una prueba física. Las pruebas de imagen comprueban peticiones autenticadas y fallback; no certifican la caché de archivos nativa ni la descarga/visualización real en Android.

La recepción real de pantalla requiere el development build Android existente con LiveKit/WebRTC; seguir `docs/mobile-room-media-expo-go-fix.md`. No se inició una compilación nativa ni se instalaron módulos. Expo Go debe seguir mostrando su fallback estable.

Commit de la entrega: **`feat(ui): redesign study rooms collaboration experience`**. El hash se informa al registrar y se obtiene con `git log -1 --format=%h -- docs/retro-pixel-academia-etapa-7-4c.md`.

Se usa staging explícito sólo de esta etapa. Los 16 elementos ajenos, Web 8.3a sin commit y 8.1b permanecen íntegros; se comprobaron hashes de todos los archivos pendientes iniciales. Staging vacío después del commit, árbol aún con esos cambios preexistentes. Sin reset, clean, stash, amend, merge ni push. Se detiene el trabajo al cerrar 7.4c.
