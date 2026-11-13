# Etapa 7.4d — Pulido final de Study Rooms

Fecha: 2026-11-13. Rama `feat/ui-ux-web-mobile`. HEAD inicial `eef5e48`.

## Estado recuperado de 7.4c

7.4c está registrada en `eef5e48` y no tenía archivos de salas pendientes. Se leyeron AGENTS.md, su informe, historial, diffs, staging y componentes actuales. Los pendientes de Android físico y LiveKit real documentados en 7.4c siguen siendo verificaciones de dispositivo; no había otra implementación de 7.4c que reconstruir.

Antes de editar se guardaron hashes de los 83 archivos que expanden los elementos iniciales modificados/sin seguimiento. Se conservaron los 16 elementos ajenos, Web 8.3a, 8.1b y sus imágenes. No se repitieron las auditorías generales de otros módulos ni se modificaron las tres pruebas generales antiguas ya documentadas en 7.4c.

## Defectos confirmados y correcciones

| Caso reproducido | Antes | Corrección verificada |
| --- | --- | --- |
| Recuperación tras 403/404 del feed | El contenido se borraba, pero el cursor de páginas seguía avanzado: después de recuperar acceso podía saltar de página 0 a página 2 | Se reinicia en página 1 al invalidar acceso |
| Respuestas concurrentes anteriores a una denegación | Un GET o la confirmación tardía de un envío podía volver a mostrar mensajes borrados del estado o borrar el borrador | La denegación cancela el controlador de esa generación del chat; las respuestas anteriores no se aplican. Se conserva el UUID pendiente para un reintento idempotente |
| Confirmación Mobile al perder autorización | El diálogo seguía abierto después de perder Host. También sobrevivía a un 403 que retiraba el mensaje del feed mientras el snapshot de la sala aún conservaba Host | Se cierra y descarta si el usuario deja de ser Host o el mensaje ya no está disponible/no es eliminable. Volver a obtener Host/acceso no reabre la confirmación |
| Participants Mobile con 12 miembros | El panel alcanzaba **3799 px** | ScrollView anidado con altura máxima de 540 px; panel completo observado: **599 px** |
| Controles táctiles Web | Papelera de **40×44 px** y envío de **35×44 px** | Ambos alcanzan al menos **44×44 px** en modo táctil; los iconos de escritorio conservan su tratamiento de hover/foco |

Las cuatro regresiones nuevas del modelo fallaron contra una copia de HEAD y pasan en Web y Mobile con el arreglo. Las mediciones y el diálogo retenido se reprodujeron en Chrome/RN Web antes de corregirlos. No se hicieron cambios decorativos para justificar la entrega.

La invalidación usa la generación de **peticiones del chat**, no versiones ni epochs del temporizador o del servidor multimedia. Mantiene un único intervalo de polling y permite que la siguiente lectura revalide acceso. No cambia autenticación, reglas del servidor, endpoints ni permisos. Ante fallos de red transitorios se sigue conservando el historial y el borrador; la retirada de contenido se limita al feed que devuelve 403/404.

## Elementos conservados y revisión visual

Se conserva íntegra la composición de 7.4c: Shared Screens y Pomodoro debajo, panel Chat/Participants, controles de host, compositor y superficies lavanda. Se revisaron carga, vacío, errores, conexión, identidad, roles, avatares/fallback y moderación. El único cambio de distribución es acotar la lista Mobile larga; no hay escenarios, widgets ni decoraciones nuevas.

El círculo conserva diámetro igual a altura a 320, 390, 768 y 1440 px. El tiempo sigue procediendo de snapshots y `sharedTimeRemaining`; el anillo sigue representando su proporción de tiempo restante. No se cambiaron reloj, interpolación, controles Start/Pause/Reset/Break, versiones, epochs, heartbeats, sesiones, UUID de Focus, outbox o ledger. Los servicios y componentes multimedia tampoco se tocaron.

Se comprobó con respuestas simuladas que un host puede iniciar la sesión, que los errores de GET/heartbeat se muestran por separado de la limitación multimedia, y que una lectura posterior recupera el estado en marcha. Después de logout, la cuenta participante recibe ese estado del servidor y carece de controles de host. Ninguna prueba produce solicitudes de escritura al ledger o a focus-sessions.

El chat mantiene Enter/Shift+Enter Web, envío táctil, carga incremental, anclaje, deduplicación, confirmación, reintento con el mismo ID y pausa en background. La lista de participantes usa la conexión autorizada a la sala; no se deriva presencia social global. Las preferencias de apariencia siguen siendo las existentes.

## Verificación ejecutada

Todos los escenarios con escrituras usan fixtures o modelos aislados. Chrome usa perfiles temporales y las peticiones API son interceptadas. No se escribieron usuarios, relaciones, mensajes, sesiones ni registros sobre PostgreSQL habitual.

| Verificación | Resultado |
| --- | --- |
| ESLint Web/Mobile | Aprobado |
| TypeScript Web (`tsc -b`) y Mobile (`tsc --noEmit`) | Aprobado |
| Build Web | Aprobado; permanece el aviso previo de chunks superiores a 500 kB |
| Expo export Web y Android | Aprobado; exportación JS/assets, sin compilación nativa |
| Regresiones Web dirigidas | **24/24** |
| Regresiones Mobile dirigidas | **31/31** |
| Revisión completa existente de colaboración, Web y RN Web | Aprobada, conservando las capturas anteriores |
| Revisión nueva `roomPolish.browser.mjs`, Web y RN Web | Aprobada: 12 participantes, medidas táctiles, círculo, pérdida/restauración de Host, denegación/restauración del feed, reconexión en marcha, logout y segunda cuenta |

La revisión completa reutilizada cubre: host/participante, Start/Pause/Reset/Break con confirmación y versiones esperadas, Enter/Shift+Enter, envío fallido y reintento, historial anterior/nuevo, última página, lectura sin autoscroll involuntario, borrado, reacciones, Raise Hand, perfiles permitidos y denegados, moderación, background/foreground, temas y paletas. La revisión nueva comprueba además que la segunda cuenta usa su propio ID de usuario en las peticiones autenticadas simuladas y no hereda borrador ni confirmación.

Se inspeccionaron capturas a 320/390/768/1440 px, sin overflow horizontal, en Web y React Native Web. Las revisiones existentes recorren Dark/Light/System y las cuatro paletas; también Reduce Motion. No se afirma una ejecución de TalkBack, teclado Android o Back físico.

Una ejecución paralela intermedia falló al esperar autoscroll Native; la revisión aislada pasó. El helper deja ahora finalizar el callback throttled de scroll (120 ms) antes de simular la siguiente escritura. No se cambió la lógica de scroll de la app por ese fallo no determinista. Las revisiones finales, también ejecutadas concurrentemente, pasaron. Las primeras ejecuciones fallidas de las pruebas nuevas sirvieron para reproducir defectos o ajustar los fixtures a los mensajes sanitizados reales de cada cliente; no se presentan como resultados finales.

Comandos principales desde cada frontend:

```sh
npm run lint
# Web:
npx tsc -b
npm run build
node --experimental-strip-types --test tests/roomPolish.test.mjs tests/roomCollaboration.test.mjs tests/studyRoomClock.test.mjs tests/mediaCapture.test.mjs tests/socialRendering.test.mjs
node tests/roomPolish.browser.mjs
ROOM_REVIEW_CAPTURES=../.local/stage74d/full-web node tests/roomCollaboration.browser.mjs
# Mobile:
npx tsc --noEmit
node --experimental-strip-types --test tests/roomPolish.test.mjs tests/roomCollaboration.test.mjs tests/studyRoomClock.test.mjs tests/roomMediaSafety.test.mjs tests/roomsResourcesNotifications.test.mjs
npx expo export --platform web --platform android --output-dir .expo/integration-export
node tests/roomPolish.browser.mjs
ROOM_REVIEW_CAPTURES=../.local/stage74d/full-mobile node tests/roomCollaboration.browser.mjs
```

Logs y reproducciones de HEAD: `.local/stage74d/`. La opción `ROOM_REVIEW_CAPTURES` del helper permite reutilizar la revisión anterior sin sobrescribir las imágenes de 7.4c.

## Capturas comparativas

Directorio: `docs/images/retro-pixel-academia-7-4d/`. Datos sintéticos, no perfiles ni tiempos del usuario.

| Vista | Antes | Después |
| --- | --- | --- |
| Web, 390 px | [Antes](images/retro-pixel-academia-7-4d/before-web-room-390.png) | [Después](images/retro-pixel-academia-7-4d/after-web-room-390.png) |
| Web, 1440 px | [Antes](images/retro-pixel-academia-7-4d/before-web-room-1440.png) | [Después](images/retro-pixel-academia-7-4d/after-web-room-1440.png) |
| RN Web, 390 px | [Antes](images/retro-pixel-academia-7-4d/before-mobile-room-390.png) | [Después](images/retro-pixel-academia-7-4d/after-mobile-room-390.png) |
| Participants Mobile con 12 miembros | [Antes](images/retro-pixel-academia-7-4d/before-mobile-participants-390.png) | [Después](images/retro-pixel-academia-7-4d/after-mobile-participants-390.png) |
| Confirmación tras perder Host | [Antes](images/retro-pixel-academia-7-4d/before-mobile-host-revoked.png) | [Después](images/retro-pixel-academia-7-4d/after-mobile-host-revoked.png) |
| Confirmación con mensaje inaccesible | [Reproducción previa al arreglo](images/retro-pixel-academia-7-4d/before-mobile-feed-denied.png) | [Después](images/retro-pixel-academia-7-4d/after-mobile-feed-denied.png) |

También se guardaron 320/768 px y los estados de error de conexión de ambos clientes. Las imágenes previas de 7.4c, 8.1b y 8.3a permanecen intactas.

## Limitaciones reales

Expo Go conserva su fallback de recepción de pantalla: LiveKit/WebRTC requiere el development build existente. Esto es una limitación multimedia, no un error de chat o Pomodoro. No se implementó emisión de cámara, micrófono o pantalla Mobile; no se conectó a un servidor LiveKit real ni se compiló/instaló un build nativo.

Las reacciones siguen siendo las tres del contrato, temporales durante 10 segundos. El backend no ofrece retirada de reacción ni un cursor de historial; se conservan esas limitaciones y la paginación por offset. Tampoco hay notificación de ediciones remotas de páginas antiguas: véase 7.4c. No se agregaron endpoints para aparentar esas capacidades.

RN Web comprueba peticiones protegidas y placeholders, pero no certifica la caché de archivos ni visualización de imágenes en Android. TalkBack, gestos, IME, teclado, SafeArea y rendimiento en hardware requieren la comprobación física siguiente.

## Checklist breve para Expo Go / Android físico

- [ ] Con cuentas de prueba autorizadas, entrar como host y participante. Comprobar círculo, tiempo, Start/Pause/Reset/Break y confirmaciones; ambos deben recibir el mismo estado del servidor.
- [ ] Mantener el fallback multimedia visible y verificar que chat y temporizador funcionan. Para recepción real usar exclusivamente el development build ya previsto en `docs/mobile-room-media-expo-go-fix.md`.
- [ ] Escribir con teclado Android/IME, incluir saltos de línea, enviar, probar doble toque y fallo/reintento de red: no deben aparecer duplicados ni perderse el borrador sin confirmar.
- [ ] Leer mensajes antiguos mientras llegan nuevos, cargar el inicio del historial, alternar Chat/Participants y comprobar scroll anidado con una lista larga. Revisar el ancla y el autoscroll también en un dispositivo con pocos recursos.
- [ ] Abrir confirmación de borrado y transferir Host desde otra sesión autorizada: debe cerrarse sin borrar. Repetir pérdida de acceso y comprobar que no reaparece al recuperarlo. Cancelar también mediante Android Back.
- [ ] Usar TalkBack, tamaño de fuente elevado y Reduce Motion del dispositivo/app. Revisar etiquetas, selección de pestañas, objetivos táctiles y retorno del foco tras cerrar diálogos.
- [ ] Pasar a background y volver; desconectar/reconectar durante una sesión. Verificar recuperación del estado sin duplicar envíos o adjudicar tiempo local.
- [ ] Hacer logout desde Profile y entrar con otra cuenta. Revisar borrador vacío, permisos, avatar/fallback y ausencia de información de la cuenta anterior. Recorrer temas y paletas.

## Archivos y cierre Git

Código de producto modificado exclusivamente:

- `frontend-web/src/features/studyRooms/collaborationState.ts`.
- `frontend-mobile/src/features/studyRooms/collaborationState.ts`.
- `frontend-mobile/src/components/media/RoomCollaboration.tsx`.
- `frontend-web/src/components/study/study-rooms.css`.

Pruebas/documentación:

- `frontend-web/tests/roomPolish.{test,browser}.mjs`.
- `frontend-mobile/tests/roomPolish.{test,browser}.mjs`.
- `scripts/tests/roomPolish{Cases,Fixture,Review}.mjs`.
- `scripts/tests/roomCollaborationReview.mjs` — directorio de capturas configurable y sincronización de la automatización Native.
- Este documento y las capturas de 7.4d.

Commit previsto de cierre: **`fix(ui): polish study rooms web and mobile experience`**. Su hash se informa al registrar y puede consultarse con `git log -1 --format=%h -- docs/retro-pixel-academia-etapa-7-4d.md`.

Se revisa staging explícito y hashes de los archivos preexistentes antes/después del registro. El árbol conserva los cambios ajenos iniciales; no se declara limpio. Staging vacío tras el commit. Sin cambios de backend, PostgreSQL, Docker, AWS, autenticación, JWT, contratos REST, servicios multimedia o ledger. Sin cambios de Dashboard, Focus Studio, Login/Register, Goals o personalización 8.x. Sin dependencias nuevas, reset, clean, stash, amend, merge ni push. Se detiene la etapa en 7.4d.
