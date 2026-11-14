# F1 Hotfix — Coherencia de Background Theme entre secciones

Base: `0fdd4b4`, rama `feat/ui-ux-web-mobile`. Los hotfixes anteriores estaban confirmados; se conservaron y no se duplicaron. Alcance: estilos Web, pruebas y capturas; sin Mobile, backend, datos persistentes ni infraestructura.

## Causa confirmada

La reproducción en Chrome con **Amber Dark + Orange** registró un canvas esperado `rgb(48,36,29)` (`#30241d`), mientras Study Rooms pintaba `rgb(33,27,48)` (`#211b30`). Dos reglas causaban la divergencia:

1. `.cozy-rooms` redefinía cinco tokens de fondo/superficie/bordes como lavanda. Sus tarjetas, formularios, chat y paneles heredaban esas redefiniciones.
2. `.min-h-screen:has(.cozy-rooms)` imponía un fondo lavanda literal a los contenedores, aunque el sidebar/topbar ya utilizaban la familia correcta.

El Dashboard tenía otra inconsistencia comprobada: sus cuatro métricas mezclaban tintes y bordes fijos morados, azules, verdes y rosas con la superficie elegida. La auditoría de estilos computados detectó cuatro métricas fuera de la superficie semántica esperada.

Evidencias de diagnóstico y resultados computados: `.local/f1-sections/before-computed.json` y `after-computed.json` (archivos locales fuera de Git). Se distinguen correctamente los contenedores transparentes de un fondo que realmente tapa el canvas.

## Corrección

- Study Rooms hereda los tokens globales; se retiró la regla de fondo literal. Tarjetas, formulario de creación/unión, temporizador, chat, participantes y paneles mantienen sus dimensiones y distribución.
- Las métricas del Dashboard usan `surface-raised` y `border`. Sombras y el pequeño texto de cabecera utilizan tokens; no se modificaron gráficos, cálculos, widgets, hero ni pixel art.
- Join, Refresh, Open y regeneración de código usan el acento seleccionado; el hover y borde de las tarjetas interactivas también lo respetan. Join utiliza su superficie suave en hover; conserva validaciones, permisos, estados deshabilitados y acción original.
- Goals/Goal Details, Tracking, Validations, Resources, Notifications, Profile, Settings y Focus Studio se comprobaron y no necesitaron cambios de implementación adicionales.
- Se mantienen colores semánticos de estado/dificultad, backdrops y negro de reproducción multimedia cuando corresponde. Las ilustraciones y fotografías no se recolorearon. Las confirmaciones nativas del navegador conservan el aspecto del sistema.

## Verificación

Chrome con fixtures aisladas: ninguna petición llegó al backend habitual. Sólo hubo heartbeats simulados al abrir una sala; no se enviaron formularios ni se guardaron/eliminaron registros.

- **80 combinaciones efectivas por cada una de once rutas**, más las 80 del interior de Rooms: cinco familias × cuatro acentos × Light/Dark/System, comprobando System con ambos esquemas del dispositivo. Sin divergencias entre tokens locales/globales ni canvas incompatible.
- Comprobación de colores computados en tarjetas, controles y opciones activas; texto ≥4,5:1 y bordes de inputs ≥3:1 en los casos medidos. En las muestras representativas registradas: mínimos aproximados de 8,64:1 para texto de paneles, 6,16:1 para controles activos y 3,38:1 para bordes de inputs. Esto no certifica cada píxel de imágenes o controles deshabilitados.
- Hover real del botón Join en Amber Dark + Orange, Sage Dark + Mint, Lavender Dark + Purple y Neutral Light + Blue.
- Editor de Goal, Profile, detalle de Resources, confirmación de Tracking y Settings del Pomodoro; también el panel inline de personalización Dashboard, conservando su comportamiento.
- Rooms responsive a 390/768/1440 px sin overflow. Capturas de lobby, sala abierta, Dashboard, Profile y modales con sidebar y contenido visibles.
- **28/28 regresiones** de colaboración, permisos, reloj y Dashboard aprobadas. Revisión Chrome existente de sala aprobada: host/member, chat, historial/scroll, reintento con UUID, reacciones, permisos, versiones y reconexión.
- ESLint, TypeScript y build Web aprobados; permanece el aviso previo de tamaño de chunk. No se ejecutaron pruebas Android ni toda la suite Web de nuevo.

Se corrigieron problemas del nuevo harness durante su preparación: fixture Profile incompleta, selector escapado y confusión entre panel inline/modal. Para comprobar hover se confirmó que Chrome headless anunciaba `hover:false`; el helper ahora permite activar un puntero de escritorio **de forma optativa**, sin cambiar el comportamiento predeterminado de las pruebas anteriores. Las ejecuciones finales pasaron.

Comandos desde `frontend-web`:

```sh
npm run lint
npx tsc -b
npm run build
node --test tests/sectionBackgrounds.test.mjs
node --experimental-strip-types --test tests/roomCollaboration.test.mjs tests/roomPolish.test.mjs tests/studyRoomClock.test.mjs tests/dashboardRendering.test.mjs
ROOM_REVIEW_CAPTURES=../.local/f1-sections/room-regression node tests/roomCollaboration.browser.mjs
```

La regresión nueva también impide redefinir tokens protegidos de la familia dentro del CSS de componentes. Los tokens siguen perteneciendo al sistema global existente.

## Capturas inspeccionadas

31 capturas sintéticas en `docs/images/final-ui-f1-sections/`; no representan datos personales. Se conservaron intactas las capturas anteriores.

| Vista | Antes | Después |
| --- | --- | --- |
| Rooms / Amber Dark + Orange | [Antes](images/final-ui-f1-sections/before-rooms-amber-dark-orange.png) | [Después](images/final-ui-f1-sections/after-rooms-amber-dark-orange.png) |
| Sala abierta / Amber Dark + Orange | [Antes](images/final-ui-f1-sections/before-room-open-amber-dark-orange.png) | [Después](images/final-ui-f1-sections/after-room-open-amber-dark-orange.png) |
| Dashboard / Amber Dark + Orange | [Antes](images/final-ui-f1-sections/before-dashboard-amber-dark-orange.png) | [Después](images/final-ui-f1-sections/after-dashboard-amber-dark-orange.png) |
| Sala abierta / Sage Dark + Mint | — | [Captura](images/final-ui-f1-sections/after-room-open-sage-dark-mint.png) |
| Sala abierta / Lavender Dark + Purple | — | [Captura](images/final-ui-f1-sections/after-room-open-lavender-dark-purple.png) |
| Sala abierta / Neutral Light + Blue | — | [Captura](images/final-ui-f1-sections/after-room-open-neutral-light-blue.png) |
| Goal editor / Amber Dark + Orange | — | [Captura](images/final-ui-f1-sections/after-goal-details-modal-amber-dark-orange.png) |
| Profile editor / Sage Dark + Mint | — | [Captura](images/final-ui-f1-sections/after-profile-modal-sage-dark-mint.png) |
| Resources / Neutral Light + Blue | — | [Captura](images/final-ui-f1-sections/after-resources-modal-neutral-light-blue.png) |

## Archivos y Git

Implementación: `frontend-web/src/components/study/study-rooms.css`, `components/academic/retro-workspace.css`, `components/dashboard/cozy-dashboard.css` y `src/pages/StudyRoomsPage.tsx` (sólo clases visuales de controles y tarjetas).

Pruebas: `frontend-web/tests/sectionBackgrounds.test.mjs` y `tests/helpers/profileBrowser.mjs`. Este informe y sus capturas completan el cambio. Sin modificaciones del proveedor de apariencia, sidebar, servicios, temporizador, ledger ni contratos REST.

Los 39 archivos pendientes preexistentes conservan su contenido SHA256; los 16 elementos ajenos y 8.1b siguen fuera del commit. Registro local separado: **`fix(web): unify background themes across sections`**; hash disponible con `git log -1 --format=%h -- docs/final-ui-f1-section-backgrounds-hotfix.md` e informado en la entrega. Sin reset, clean, stash, amend, merge, push o deployment. Se termina F1 sin comenzar F2.
