# F4 — Focus Studio y Notifications Web

Rama `feat/ui-ux-web-mobile`, base `b5acfcb`. Sin dependencias nuevas ni cambios en Mobile, backend, contratos, infraestructura o servicios API.

## Focus Studio

- Se reutiliza Embla con arrastre habilitado explícitamente, umbral de 10 px y cursor de agarre. Se conservan flechas, categorías, teclado y los doce soundscapes. Embla suprime el clic tras arrastrar; se verificó con mouse real automatizado en Chrome.
- Import Music admite selección múltiple de audio local compatible. Valida tipo/tamaño no vacío y capacidad del navegador antes de crear URLs; errores de decodificación o reproducción se comunican explícitamente. Imported music ofrece reproducción, pausa, cambio y eliminación, con nombre y estado en Now Playing y el volumen existente.
- Un único HTMLAudioElement sirve a los archivos importados. La coordinación de UI detiene el otro reproductor antes de iniciar música y descarta respuestas asíncronas antiguas. No se modificaron `PomodoroAudio`, síntesis, soundscapes, motor Pomodoro, UUID, outbox ni ledger.
- Archivos y URLs viven solo en memoria. Al eliminar o desmontar se pausa, se descarga la fuente y se revocan las URLs. Logout/cambio de cuenta desmontan el Focus Studio con clave por usuario. No se suben ni se guardan archivos, nombres o URLs en preferencias.
- Now Playing, Settings y Goal ya usaban superficies F1; se conservaron y se verificaron. Retry sync se lleva a tokens semánticos. Los tonos oscuros del arte de discos son intencionales y se mantienen.

Pruebas aprobadas: ESLint, TypeScript/build Web; siete pruebas existentes de `focusStudioRendering.test.mjs`; `noiseSynthesis`, `pomodoroState`, `pomodoroGoalTracking` y `soundscapes`; `focusLocalMusic.browser.mjs` con WAV reales generados como fixtures, errores de formato, mouse drag sin reproducción accidental, flechas, reproducción/pausa/cambio/volumen, exclusión de audio, eliminación, desmontaje y logout. Responsive 390/768/1440/1920 y 80 combinaciones de apariencia con Reduce Motion. No hubo escrituras de sesiones reales.

Capturas: [Antes](images/final-ui-f4/before-focus.png), [música importada](images/final-ui-f4/after-focus-imported.png), [390](images/final-ui-f4/after-focus-390.png), [768](images/final-ui-f4/after-focus-768.png), [1440](images/final-ui-f4/after-focus-1440.png), [1920](images/final-ui-f4/after-focus-1920.png).

Archivos Focus: `components/dashboard/FocusStudio.tsx`, `components/focus/SoundscapeCarousel.tsx`, `components/focus/LocalMusicLibrary.tsx`, `hooks/useLocalMusic.ts`, `tests/focusLocalMusic.browser.mjs` (todos bajo `frontend-web`), este informe y sus capturas.

Los formatos dependen de los códecs del navegador; se probó decodificación WAV real, no todas las combinaciones de códec/OS. La biblioteca se vacía al abandonar Focus Studio conforme al requisito de limpieza al desmontar. Mouse automatizado no equivale a prueba de touchpad físico o lector de pantalla.

## Registro

Focus: `feat(web): add session music and draggable soundscapes`. Hash informado al finalizar y consultable con `git log --format='%h %s' --grep='^feat(web): add session music and draggable soundscapes$' -1`.

Commit Focus confirmado: **`15dd0d5`**. Los archivos preexistentes ajenos y recursos históricos permanecen fuera del staging.

## Notifications

- Delete se sustituye por papelera roja de 44 px con tooltip y nombre accesible. Se conservan confirmación, bloqueo durante operaciones, permisos, filtros, paginación y navegación contextual. Las tarjetas y botones usan superficies/acento semánticos en vez de colores Slate/Sky fijos.
- El proveedor de contador existente reutiliza su intervalo de 30 segundos y eventos focus/visibility. Añade una lectura de la primera página de `getNotifications` (máximo 20) en el mismo ciclo, con el mismo AbortController y protección single-flight; no se añaden timers ni se modifican servicios/endpoints.
- La primera lectura satisfactoria solo establece una referencia silenciosa. Después se comparan fecha e ID del servidor; actualizar el contador por sí solo no produce avisos. El watermark persiste en memoria durante remounts del proveedor y se reinicia al salir/cambiar de cuenta. La lista visible también se aísla por userId.
- Máximo tres avisos, título derivado del tipo, resumen, apertura contextual y cierre individual. Abrir utiliza el marcado de lectura existente; resultados tardíos no navegan en otra cuenta. Los descartados no reaparecen al repetir polling o recobrar conexión.
- Esquina inferior derecha, altura limitada y scroll propio; en pantallas estrechas el stack se limita a 160 px para dejar disponible el área principal del temporizador. Animación de entrada de 220 ms, desactivada con Reduce Motion. No hay Web Push, permisos del sistema ni expiración automática de tarjetas.

Pruebas aprobadas: `incomingNotifications.test.mjs` (histórico silencioso, filas nuevas, repetidas, lecturas fuera de orden, cuentas e IDs inválidos); `notificationPopups.browser.mjs` (cancelar/confirmar eliminación, novedades, máximo tres, descartar sin reaparición, abrir y marcar leída, recarga, otra cuenta, logout, filtros, responsive 390–1920 y 80 combinaciones de apariencia/Reduce Motion). ESLint, TypeScript y build Web aprobados; permanece el aviso previo de chunk multimedia >500 kB.

Las escrituras de API fueron **simuladas**. Los WAV de Focus sí se decodificaron/reprodujeron mediante HTMLAudioElement en Chrome; no se afirma escucha humana ni prueba de touchpad físico. No se utilizaron datos personales ni se escribió en PostgreSQL.

### Límites de detección

El backend entrega páginas ordenadas por `createdAt DESC` (contrato existente). Este mecanismo anuncia novedades **observadas** después de una referencia satisfactoria, no entrega garantizada en tiempo real. Si llegan más de 20 entre lecturas, algunas no entran en la página observada; se muestran como máximo las tres más recientes detectadas. Filas insertadas con fecha anterior al watermark no se anuncian. El historial completo continúa disponible en Notifications con su paginación. Una primera lectura fallida no se interpreta como lista vacía: cuando se recupera, establece la referencia silenciosa.

No se modifica el backend para resolver esos límites. Queda pendiente una comprobación manual con una sesión real del backend local y tecnología asistiva. Los escenarios automatizados utilizan respuestas del contrato, no eventos inventados a partir de contadores ni pruebas de Web Push.

Capturas: [Antes](images/final-ui-f4/before-notifications.png), [avisos nuevos](images/final-ui-f4/after-notifications-new.png), [390](images/final-ui-f4/after-notifications-390.png), [768](images/final-ui-f4/after-notifications-768.png), [1440](images/final-ui-f4/after-notifications-1440.png), [1920](images/final-ui-f4/after-notifications-1920.png), [stack móvil limitado y desplazable](images/final-ui-f4/after-notifications-mobile-popup.png).

Archivos Notifications bajo `frontend-web`: `components/notifications/NotificationCard.tsx`, `NotificationPopups.tsx`, `notifications.css`; `components/navigation/AuthenticatedLayout.tsx` (solo montaje del stack); `contexts/UnreadNotificationProvider.tsx`, `UnreadNotificationContext.ts`; `features/notifications/incomingNotifications.ts`; `pages/Notifications.tsx`; `tests/incomingNotifications.test.mjs`, `notificationPopups.browser.mjs`; este informe y sus capturas.

Segundo commit: `feat(web): add notification popups and refine cards`. Hash consultable con `git log -1 --format='%h %s' -- docs/final-ui-f4-focus-notifications.md` e informado en la entrega. Staging explícito, sin push, merge, amend ni operaciones destructivas. F4 finaliza aquí.
