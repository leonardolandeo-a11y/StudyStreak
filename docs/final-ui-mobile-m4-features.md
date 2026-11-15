# M4 — Study Rooms, Focus Studio y Notifications

15 de noviembre de 2026 · `feat/ui-ux-web-mobile` · HEAD inicial verificado: `038103a` (último micro-hotfix M3).

## Cambios y commits locales

- **`eb08f05` — Study Rooms:** chat/participantes con scroll y altura adaptada al dispositivo; Pomodoro circular temático y controles debajo; Copy con feedback y Regenerate juntos. Avatar/nombre abre el perfil cuando los permisos sociales existentes lo permiten. Make host compacto y papelera roja con confirmación; acciones bloqueadas durante operación/estado desactualizado. Se conserva Share. Única dependencia nueva: `expo-clipboard ~58.0.4`, versión correspondiente al SDK instalado, necesaria para copiar al portapapeles nativo.
- **`a0b688d` — Focus Studio:** Import Music mediante el selector de `expo-file-system` existente, sin dependencia adicional. Biblioteca temporal de hasta diez archivos de 50 MB cada uno; reproducir, pausar, cambiar y eliminar. Copias propias en caché, sin modificar originales, subir archivos ni guardar nombres/URIs en preferencias. Un reproductor local coordinado con los doce soundscapes; cancelación de preparaciones tardías, pausa en background y liberación al eliminar, perder foco o desmontar por cambio de cuenta. Preview Expo Web usa URLs Blob, también liberadas; se adapta el audio sintetizado a ese entorno sin cambiar sus recetas. Pomodoro, metas y registros no cambian.
- **`023e1af` — Notifications:** papelera roja accesible con confirmación existente. Hasta tres avisos flotantes con cierre individual y apertura contextual. Primera lectura histórica silenciosa, watermark temporal/ID y deduplicación; descartados y desbordados no reaparecen durante la sesión. Reutiliza el polling de no leídas cada 30 segundos y su respuesta para actualizar también el contador, sin solicitudes adicionales ni endpoints nuevos. Se pausa/cancela en background, reinicia por cuenta y bloquea navegación de respuestas de sesiones anteriores. Tokens M2, SafeArea y Reduce Motion.

## Verificación ejecutada

- `npm run lint` y `npx tsc --noEmit`: aprobados, sin errores ni advertencias de lint.
- **13/13 archivos dirigidos**, sin fallos ni skips: `incomingNotifications`, `m4Rendering`, `localMusic`, `roomPolish`, `roomCollaboration`, `studyRoomClock`, `roomMediaSafety`, `roomsResourcesNotifications`, `focusAudioLifecycle`, `focusCatalog`, `focusStudioRendering`, `focusTimer` y `nativeTextRendering` (`tests/*.test.mjs`, seleccionados explícitamente). Después de los ajustes finales del audio y superficies se repitieron únicamente las cinco regresiones de audio y la de renderizado afectadas: aprobadas.
- Renderizado con mocks nativos: diez combinaciones familia × Light/Dark, controles host/member/desactualizado, superficies, accesibilidad de acciones y destinos contextuales. No acredita inspección física de colores o lectores de pantalla.
- Exportación Expo **Web** local aprobada para alimentar el arnés Chrome; no se construyó un binario Android ni se generaron capturas.
- `m4Rooms.browser.mjs`: APIs simuladas; host/member, portapapeles, confirmaciones, controles debajo del círculo, reconexión y bloqueo tras el umbral existente de 15 segundos; anchos 320/390/768.
- `m4Music.browser.mjs`: importación y decodificación real de WAV generados por la prueba, pausa/reanudación/cambio, desplazamiento táctil simulado del carrusel, exclusión con soundscapes, eliminación, liberación al salir y ausencia de uploads/persistencia de archivos; anchos 320/390.
- `m4Notifications.browser.mjs`: APIs simuladas y polling acelerado solo en el arnés; historial silencioso, límite de tres, descarte/deduplicación, apertura contextual/lectura, confirmación de borrado, background y respuesta tardía tras logout/cambio de cuenta. Reduce Motion simulado.

## Límites y alcance preservado

Sin dispositivo Expo Go/Android ni `adb` accesible. Pendientes físicos: selector/codecs del dispositivo, interrupciones y limpieza reales del audio, TalkBack, SafeArea/teclado, gestos y Back del sistema. Las pruebas Chrome y mocks no equivalen a Android. Tampoco se acredita sincronización entre usuarios contra backend real ni recepción LiveKit real; su motor/transporte y publicación nativa permanecen intactos. Las copias temporales se eliminan durante el ciclo de vida normal; una terminación abrupta depende de la recuperación de caché del sistema.

Verificado por diff: Dashboard M3, preferencias, motor del reloj, servicios de salas, LiveKit y configuración de navegación sin cambios. Web, backend e infraestructura intactos; los cambios ajenos iniciales quedan fuera de staging. Sin push ni operaciones destructivas. No se implementan Profile Discord, logout junto a la marca ni Login/Register horizontal. **M4 termina aquí; M5 no iniciado.**

## Archivos modificados

Todos bajo `frontend-mobile`, salvo este informe:

- Salas: `package{,-lock}.json`, `src/app/(app)/(main)/(menu)/study-rooms.tsx`, `src/components/media/{RoomCollaboration,RoomModeration}.tsx`, `src/components/study/{ParticipantCard,SharedRoomDial}.tsx`.
- Focus: `src/app/(app)/(main)/focus-studio.tsx`, `src/components/focus/LocalMusicLibrary.tsx`, `src/hooks/useLocalMusic.ts`, `src/features/focus/{localMusic,localMusicPicker,mobileFocusAudio}.ts`.
- Notifications: `src/components/notifications/{NotificationCard,NotificationPopups}.tsx`, `src/contexts/NavigationDataContext.tsx`, `src/features/notifications/{incomingNotifications,notificationRoute,unreadCounter}.ts`.
- Pruebas: `tests/{incomingNotifications,localMusic,m4Rendering}.test.mjs`, `tests/m4{Rooms,Music,Notifications}.browser.mjs`, `tests/helpers/{appearanceTestLoader,appearanceNativeMock,appearanceFileSystemMock,focusAudioMock,clipboardMock}.mjs`.
