# F2 — Study Rooms Web

Base: `b5d656e`, rama `feat/ui-ux-web-mobile`. Alcance exclusivo de presentación Web sobre 7.4c/7.4d. El PDF mencionado no estaba disponible en los adjuntos accesibles; se siguieron los requisitos detallados del encargo.

## Cambios visibles

- Shared Screens y Chat/Participants comparten la fila superior y altura en escritorio. Los mensajes y participantes conservan scroll interno; a anchos estrechos los paneles se apilan.
- Shared Pomodoro ocupa una fila completa debajo: círculo de 320 px en escritorio y hasta 300 px en móvil Web, fase legible y controles compactos. El progreso sigue usando el snapshot del servidor.
- Regenerate se mueve junto al código y Copy, conservando permiso de host, bloqueo durante acciones/reconexión y confirmación.
- Las identidades autorizadas (avatar/nombre) abren el perfil. Desaparece el botón textual View profile; Make host queda al lado, con icono de corona y confirmación. Las acciones administrativas no pertenecen al enlace de identidad.
- Remove en Screen Permissions pasa a papelera roja con nombre accesible, tooltip y confirmación. Conserva su operación existente: **elimina al participante de la sala**. Revoke screen permission también solicita confirmación; Allow mantiene su comportamiento.
- Superficies, estados y bordes usan tokens F1. Recorded for this Goal ya utilizaba `surface-raised`; se verificó su estilo computado sin modificar métricas ni el componente compartido. El negro del vídeo se conserva para el contenido multimedia.

## Integridad

Sin cambios en servicios, endpoints, autenticación, permisos del backend, LiveKit, captura de medios, chat, versiones, epochs, heartbeats ni ledger. Los bloques de estado, polling, reloj y acciones de StudyRoomsPage, y los hooks/métodos de RoomMedia previos al render, se compararon con HEAD: permanecen iguales. Se modifica únicamente su presentación y las confirmaciones indicadas.

No se editaron Mobile, Dashboard, Focus Studio, lobby, recursos artísticos ni infraestructura. Los archivos preexistentes ajenos y los recursos 8.1b permanecen fuera del staging.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | Pasa |
| `npx tsc -b --pretty false` | Pasa |
| `npm run build` | Pasa; continúa el aviso de chunk >500 kB en Study Rooms, sin cambiar el SDK multimedia |
| `node --experimental-strip-types --test tests/roomCollaboration.test.mjs tests/roomPolish.test.mjs tests/studyRoomClock.test.mjs tests/mediaCapture.test.mjs tests/uiRendering.test.mjs` | 5 archivos aprobados |
| `node tests/roomCollaboration.browser.mjs` | Pasa: historial anclado, mensajes nuevos, UUID/retry, reacciones, permisos, perfiles, controles versionados y recuperación |
| `node --test tests/roomLayout.test.mjs` | Pasa: layout, Host/Member, 12 participantes, código, identidad, confirmaciones, acciones del reloj, pérdida de permisos, reconexión y temas |

Chrome headless con API simulada: no se escribieron datos en PostgreSQL ni se utilizaron cuentas personales. La prueba de pantalla recibida ejercita la vista real con un transporte simulado, **no acredita una conexión LiveKit real**. La caché de Vite del fixture multimedia queda aislada para no contaminar otras pruebas.

Responsive medido a 390, 768, 1440 y 1920 px, sin overflow horizontal. A 1440/1920, ambos paneles superiores miden 715 px para una ventana de 1100 px de alto; el temporizador mide 320×320 px. En 390 px mide 300×300 px. Se comprobó foco visible, Tab, Escape sin cerrar accidentalmente la sala y transición desactivada con Reduce Motion.

Se recorrieron las cinco familias × Light/Dark/System (sistema claro y oscuro) × cuatro acentos: 80 combinaciones. Contraste mínimo **5,83:1** en los pares evaluados: texto/superficie elevada, texto secundario/superficie elevada, acento/superficie y texto del botón/acento. No equivale a una auditoría completa WCAG de todos los elementos.

## Capturas

Datos e identidades sintéticos. Las capturas previas son del viewport; las posteriores muestran la página completa. El estado multimedia previo estaba deshabilitado en el fixture; el posterior incluye escenarios habilitado/vacío/pantalla simulada. Esto no representa un cambio de configuración del backend.

| Vista | Antes | Después |
| --- | --- | --- |
| Sala, 390 | [Antes](images/final-ui-f2/before-room-390.png) | [Después](images/final-ui-f2/after-room-390.png) |
| Sala, 768 | [Antes](images/final-ui-f2/before-room-768.png) | [Después](images/final-ui-f2/after-room-768.png) |
| Sala, 1440 | [Antes](images/final-ui-f2/before-room-1440.png) | [Después](images/final-ui-f2/after-room-1440.png) |
| Sala, 1920 | [Antes](images/final-ui-f2/before-room-1920.png) | [Después](images/final-ui-f2/after-room-1920.png) |
| Participants | [Antes](images/final-ui-f2/before-participants-1920.png) | [Después](images/final-ui-f2/after-participants-1920.png) |

Otras evidencias: [pantalla simulada](images/final-ui-f2/after-shared-screen-1920.png), [permisos](images/final-ui-f2/after-permissions-1920.png), [Member](images/final-ui-f2/after-member-1920.png), [Amber Dark + Orange](images/final-ui-f2/after-amber-dark-orange-1920.png). Las demás capturas posteriores utilizan Sage Dark + Mint.

Pendiente manual: confirmar recepción y reconexión de pantalla entre dos navegadores con LiveKit configurado, y confirmaciones nativas con lector de pantalla. No se presentan fixtures como pruebas de transporte real.

## Archivos y registro

- `frontend-web/src/pages/StudyRoomsPage.tsx`
- `frontend-web/src/components/study/ParticipantCard.tsx`
- `frontend-web/src/components/study/RoomProfileLink.tsx`
- `frontend-web/src/components/study/RoomMedia.tsx`
- `frontend-web/src/components/study/study-rooms.css`
- `frontend-web/tests/roomLayout.test.mjs`
- `frontend-web/tests/uiRendering.test.mjs` (expectativas alineadas con el texto de conexión a sala ya existente)
- `frontend-web/tests/helpers/profileBrowser.mjs`
- `frontend-web/tests/helpers/roomLayoutFixture.mjs`
- `frontend-web/tests/helpers/roomMediaViewMock.mjs`
- Este informe y 14 capturas en `docs/images/final-ui-f2/`.

Commit local: `refactor(web): improve study rooms layout and controls`. Hash consultable sin ambigüedad mediante:

```bash
git log -1 --format='%h %s' -- docs/final-ui-f2-study-rooms.md
```

El hash se informa también en la entrega. Sin push, merge, amend ni operaciones destructivas. F2 finaliza aquí.
