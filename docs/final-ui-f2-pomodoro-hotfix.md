# F2 Hotfix — Identidad del Pomodoro compartido

Base `a0a8438`, rama `feat/ui-ux-web-mobile`.

Se reutiliza la clase visual `academic-dial` de Focus Studio (gradiente radial y sombra tipográfica), sin cambiar Focus Studio. La sala adopta sus doce marcadores cuadrados, radio SVG de 110, pista de grosor 5 y progreso de grosor 8 con extremos redondos. El centro añade un sombreado interior discreto con tokens semánticos; fase, tiempo y estado conservan una jerarquía equivalente y escala adaptable. El dial sigue siendo circular, de 320 px máximo en escritorio y 300 px en móvil Web.

La etiqueta accesible del temporizador indica el tiempo restante y evita anuncios continuos (`aria-live="off"`). No se añaden animaciones al reloj. Colores derivados del Background Theme y Accent Palette.

## Integridad

El porcentaje continúa calculándose con `roomProgress(seconds, room.phase)`; solo cambia la circunferencia usada para dibujar ese porcentaje. No se importa el motor local de Focus Studio. Estado, snapshots, sincronización, acciones, permisos, versiones y controles permanecen iguales. Se comprobó por diff que todo el código fuera del markup del dial permanece idéntico en StudyRoomsPage; no se tocaron servicios, media, chat, participantes, Mobile ni backend.

## Verificación

- ESLint, `npx tsc -b --pretty false` y build Web: aprobados. Continúa el aviso previo de chunk multimedia >500 kB.
- `node --experimental-strip-types --test tests/studyRoomClock.test.mjs tests/roomCollaboration.test.mjs tests/roomPolish.test.mjs`: tres archivos aprobados.
- `node --test tests/focusStudioRendering.test.mjs`: siete pruebas aprobadas, incluida su prueba Chrome.
- `node tests/sharedPomodoro.browser.mjs`: comparación de radio, grosor, marcadores, gradiente y sombra tipográfica con Focus Studio real; capturas 390/768/1440; Focus pausado/activo, Reset, Break y snapshot de medio break; progreso 80 % y 50 %; pérdida de conexión, recuperación y host/member; 80 combinaciones de familias, modos (System claro/oscuro) y acentos con Reduce Motion. Todo aprobado.

Las interacciones usan API simulada en Chrome headless. No se escribieron datos personales ni PostgreSQL. No representan pruebas de sincronización entre dos navegadores conectados al backend real; se conserva el motor ya existente.

## Capturas

[Comparación lado a lado](images/final-ui-f2-pomodoro/comparison.png): Focus Studio a la izquierda, compartido a la derecha, ambos normalizados visualmente a 320 px para comparar proporciones. Los tiempos diferentes son intencionales: fixtures independientes de sus respectivos motores.

[390 px](images/final-ui-f2-pomodoro/shared-390.png) · [768 px](images/final-ui-f2-pomodoro/shared-768.png) · [1440 px](images/final-ui-f2-pomodoro/shared-1440.png) · [Activo](images/final-ui-f2-pomodoro/shared-running.png) · [Break](images/final-ui-f2-pomodoro/shared-break.png).

Archivos: `frontend-web/src/pages/StudyRoomsPage.tsx`, `frontend-web/src/components/study/study-rooms.css`, `frontend-web/tests/sharedPomodoro.browser.mjs`, este informe y ocho capturas en `docs/images/final-ui-f2-pomodoro/`.

Commit local: `style(web): align shared pomodoro with focus studio`. Consultar hash con `git log -1 --format='%h %s' -- docs/final-ui-f2-pomodoro-hotfix.md`. Cambios ajenos preservados y excluidos del commit; sin push ni siguiente etapa.
