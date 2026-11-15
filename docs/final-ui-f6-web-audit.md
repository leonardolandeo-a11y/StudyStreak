# F6 — Auditoría final Web

14 de noviembre de 2026. Rama `feat/ui-ux-web-mobile`; base auditada `84ce57b`. Alcance: Web, sin deployment ni cambios en Mobile, backend, PostgreSQL, Docker, AWS, contratos o dependencias.

**Resultado:** cero P0 y cero P1 de producto confirmados pendientes dentro del alcance Web. Se corrigió un P1 de accesibilidad en Resources y se recuperó la suite completa, cuyas expectativas habían quedado desactualizadas. Esta aprobación corresponde a las comprobaciones automatizadas y visuales descritas; no certifica integraciones reales no ejecutadas.

## Estado por página y funcionalidad

**Simulado** significa UI real ejecutada en Chrome con respuestas API controladas. No equivale a utilizar PostgreSQL, Google Books o LiveKit reales.

| Página / función | Resultado comprobado | Tipo / límite |
| --- | --- | --- |
| Login / Register | Validaciones, carga, errores, navegación; tres escenas, movimiento real, selector local de desarrollo y conservación del arte | Simulado. Sin registro ni login reales |
| Sesión y rutas protegidas | JWT, refresh single-flight 200/401, reintento, deep links, logout y aislamiento entre cuentas; respuestas tardías de otra cuenta descartadas | Simulado; ningún token personal utilizado |
| Loading principal | Taza/espiral, fondo semántico, anuncio accesible, movimiento reducido/background y salida tras restaurar sesión | Chrome, refresh simulado |
| Dashboard | Actividad verificada 7/30, barras/líneas, ausencia de valores inventados, métricas históricas diferenciadas y errores/vacíos | Fixtures del contrato, no estadísticas personales |
| Widgets / calendario | Modal, Escape/foco, drag con mouse real automatizado, teclado, visibilidad, defaults y persistencia por cuenta; calendario único | Simulado; no prueba de touchpad físico |
| Study Environment | Cuatro recursos finales, Automatic/horarios, selección, persistencia y separación respecto de temas/widgets; máscara del hero y pausa por visibilidad | Chrome, recursos locales aprobados |
| Focus Studio | Pomodoro circular y fases, Settings, Goal, 12 soundscapes, continuidad numérica del ruido; carrusel e Import Music | Simulado; WAV de prueba decodificado en navegador, sin escucha física |
| Sesiones Focus | Estado, UUID, Goal, outbox y sincronización conservados; UI no atribuye tiempo pendiente como confirmado | Pruebas unitarias/fixtures; no acreditación real en servidor |
| Study Rooms lobby / sala | Crear/unir/salir, Host/Member, permisos, código/copia/regeneración, transferencia, perfiles, Shared Screens, Chat/Participants, errores/reconexión | Acciones contra fixtures. Transporte multimedia simulado |
| Pomodoro compartido / chat | Versiones y acciones Start/Pause/Reset/Break, reloj circular; mensajes nuevos/antiguos, anclaje, deduplicación, retry, reacciones y confirmaciones | Simulado; sin escrituras reales ni cambios de ledger |
| Goals / detalles / registros / tags | Formularios, dificultad, estados históricos NULL, progreso, registros, evidencias, paginación, permisos, confirmaciones y navegación | Simulado. No se repite persistencia SQL ni se modifican metas reales |
| Tracking | Búsqueda, solicitudes/estados, grupos plegables, avatares protegidos, perfiles desde identidad y eliminación confirmada | Simulado, incluidos permisos/caché/limpieza |
| Validations | Selección Partner→Goal→Record→Evidence→Confirm, IDs y retorno contextual; sin reintroducir View Profile en el wizard | Simulado |
| Resources | Búsqueda por Spring Boot, carga/error 503, reintento, vacío, detalle, URLs oficiales y fallback sin portada | Simulado; P1 de teclado corregido, proveedor real no consultado |
| Notifications | Filtros, contador, papelera/confirmación, navegación, avisos nuevos sin historial/duplicados, máximo visible y limpieza entre cuentas | Simulado |
| Profile / Member Profile | Editor, nombres Unicode, bio como texto, selección/subida/eliminación de imágenes, geometría, errores 401/403/500/red; privacidad y autorización social | Simulado; no subida de imágenes personales |
| Settings / apariencia | Cinco familias, Light/Dark/System con ambos esquemas del SO, cuatro acentos, contraste/foco, migración y persistencia por cuenta; restauraciones independientes | Chrome + pruebas de preferencias |
| Sidebar y navegación Web móvil | Taza de 52 px centrada, chevron independiente, eslogan inline/foco/Escape, taza como expansión; menú móvil, Back y rutas | Chrome; sin modificar estos componentes |

## Hallazgos

| Prioridad | Evidencia | Corrección / estado |
| --- | --- | --- |
| P0 | Ninguno confirmado | Sin pendientes confirmados |
| **P1 — producto** | El detalle de Resources tenía `aria-modal` en un artículo dentro de un div: al abrirlo, `focusInside=false`; Escape dejaba el modal abierto (`closed=false`) | Se utiliza `dialog.showModal()`, fondo inerte, foco dentro y retorno al disparador, Escape, scroll exterior bloqueado/restaurado. Se conservan X, clic en backdrop, contenido y superficies F1. Regresión: ambos valores pasan a `true` |
| P1 — verificación | Primera suite UI: 61/69, ocho fallos. Esperaba hero blanco, paleta negra anterior, grupo de marca como panel de usuario, layout antiguo de métricas, enlace eliminado del wizard y un fixture de refresh incompleto | Expectativas alineadas con F1–F5 aprobadas. El fixture de notificaciones responde ahora tanto count como list para que el refresh diagnosticado lo causen las tres solicitudes concurrentes previstas. No se modificó autenticación de producto |
| P2 — verificación | Medición exacta de 22 px durante transiciones y comparación del texto mientras el enlace completo se desplazaba | Tolerancia subpíxel de 0,1 px y espera de la transición existente, manteniendo comprobaciones de hoja individual, escala 91 %, ausencia de rotación y Reduce Motion |
| P2 — usabilidad | Cierre de Resources de aproximadamente 36 px | Objetivo táctil de 44 × 44 px, dentro de la misma corrección |
| P2 — rendimiento pendiente | Build advierte chunk Study Rooms de **571,52 kB / 150,77 kB gzip** | Preexistente; no se introduce un refactor de carga o SDK en una auditoría final |

No se atribuyen a producto los errores intermedios del harness (selectores escapados o referencias antiguas al editor inline de Dashboard); se corrigieron y se conservaron los logs. No se realizaron retoques cosméticos ajenos para justificar la etapa.

## Corrección de Resources

Único archivo de producto modificado: `frontend-web/src/pages/Resources.tsx`. La búsqueda, endpoint, normalización, cancelación y datos no cambian. La corrección se limita al contenedor del detalle, ciclo de vida del foco/scroll y tamaño del cierre.

`tests/resourcesDialog.test.mjs` reproduce primero el fallo y verifica después Escape, foco, fondo inerte, retorno, cierre X/backdrop, superficies, enlaces y los anchos 390/768/1440/1920. La descripción larga conserva scroll interno. Las peticiones son GET autenticadas simuladas.

## Pruebas ejecutadas

Logs locales en `.local/f6/` (excluidos de Git, sin credenciales reales).

| Comprobación | Resultado |
| --- | --- |
| ESLint | Aprobado; repetido sobre los tests finalmente modificados |
| TypeScript `npx tsc -b --pretty false` | Aprobado |
| Build Web | Aprobado tras la corrección; aviso de chunk indicado arriba |
| Primera `npm run test:web` | Base 77/77; UI 61/69. Ocho fallos diagnosticados, no ocultados |
| `npm run test:web` después de actualizar regresiones | **Base 77/77 + UI 69/69 = 146/146**, sin skips |
| `roomLayout.test.mjs` | Aprobado: cuatro anchos, Host/Member, permisos, reloj, perfiles, reconexión y 80 combinaciones efectivas de apariencia |
| `sharedPomodoro.browser.mjs`, `roomCollaboration.browser.mjs` | Aprobados |
| `focusLocalMusic.browser.mjs`, `notificationPopups.browser.mjs` | Aprobados: arrastre, música local/limpieza, avisos/cuenta y responsive |
| `dashboardCustomization.browser.mjs`, `environmentSettings.browser.mjs` | Aprobados: drag/teclado, modal, calendario, cuatro ambientes, preferencias/restore/aislamiento |
| `finalBrandingNavigation.browser.mjs`, `appLoadingScreen.test.mjs`, `authScenePreview.browser.mjs` | Aprobados; loader incluye 2 casos |
| `SCENE_PRODUCTION=1 node tests/authScenePreview.browser.mjs` | Aprobado sobre el build final: selector ausente y parámetros de escena ignorados en producción |
| `roomCollaboration`, `roomPolish`, `incomingNotifications`, `environmentPreferences`, `dashboardWidgets` | 5 archivos adicionales aprobados |
| `academicModules.test.mjs` ampliado | Aprobado: 13 rutas en 320/390/768/1440/**1920** y editor de Profile |
| `backgroundThemes.browser.mjs` | Aprobado: cinco familias, System, acentos, contraste, migración, foco, cuentas y restore independiente |
| `sectionBackgrounds.test.mjs` | 2/2 aprobados, con módulos/sala abierta y principales modales; se actualiza la referencia de F3 y el nuevo diálogo nativo |
| `resourcesDialog.test.mjs` | Antes 0/1; después 1/1, incluido clic en backdrop |

La suite completa se ejecutó tras actualizar las expectativas. La corrección final de Resources se validó además con su regresión dedicada, auditoría de superficies y build; no se repitieron de nuevo audio/chat u otros recorridos sin cambios.

## Revisión visual y capturas

Se inspeccionaron capturas actuales de todas las páginas mediante hojas de contacto, pantallas individuales y modales. Los fondos oscuros intencionales de medios, arte y backdrops no se sustituyen por superficies planas. No se detectó otro overflow o superposición P0/P1 confirmado en los casos inspeccionados.

- [Todas las páginas — escritorio](images/final-ui-f6-web-audit/overview-desktop.png) · [Web móvil](images/final-ui-f6-web-audit/overview-mobile-web.png) · [Goals 1920](images/final-ui-f6-web-audit/goals-1920.png).
- [Dashboard](images/final-ui-f6-web-audit/dashboard-1440.png) · [Customize Dashboard](images/final-ui-f6-web-audit/dashboard-customize.png).
- [Focus / música local](images/final-ui-f6-web-audit/focus-imported.png) · [Notificaciones nuevas](images/final-ui-f6-web-audit/notifications-new.png).
- [Sala abierta](images/final-ui-f6-web-audit/room-1440.png) · [Participants](images/final-ui-f6-web-audit/participants-1920.png).
- [Resources antes](images/final-ui-f6-web-audit/resources-before-390.png) · [Después 390](images/final-ui-f6-web-audit/resources-after-390.png) · [Después 1440](images/final-ui-f6-web-audit/resources-after-1440.png). El cambio crítico es de teclado/foco, no un rediseño visual.
- [Profile editor](images/final-ui-f6-web-audit/profile-editor.png) · [Login noche](images/final-ui-f6-web-audit/login-night.png).
- [Sidebar / eslogan](images/final-ui-f6-web-audit/sidebar-title-focus.png) · [Contraído](images/final-ui-f6-web-audit/sidebar-collapsed.png).
- [Loading oscuro](images/final-ui-f6-web-audit/loading-dark.png) · [Loading claro](images/final-ui-f6-web-audit/loading-light.png).

## Backend local real y verificaciones pendientes

La configuración pública Web apunta a `http://localhost:8080`, con transporte válido y sin credenciales, query ni hash en la URL. **Solo se realizaron GET sin JWT**:

| Ruta | HTTP real |
| --- | --- |
| `/actuator/health` | 401 |
| `/api/profile` | 401 |
| `/api/users/3/profile` | 401 |
| `/api/focus-sessions/stats` | 401 |

Esto prueba respuesta del puerto y rechazo sin autenticación, **no** health UP, existencia/versión de todos los endpoints ni integración autenticada. No se utilizaron sesiones Chrome personales ni se extrajeron tokens. No hubo escrituras en PostgreSQL habitual.

Checklist humana pendiente, con cuentas autorizadas de prueba y entorno aislado para escrituras:

1. Login/refresh/logout reales y un recorrido de deep link autenticado en el backend que se usará en la entrega.
2. Google Books real: búsqueda, portada, cuota y credencial del servidor. No se verificó el proveedor externo ni se cambió su configuración.
3. Dos usuarios reales Host/Member: reconexión y pantalla compartida LiveKit. El transporte probado aquí fue un fixture, no una sesión real.
4. Escucha física de soundscapes/importaciones y comprobación en navegadores/códecs del equipo de presentación; prueba física de cámara/micrófono de evidencias si se demuestra esa función.
5. Recorrido de teclado/lector de pantalla y zoom del sistema en el equipo final. No se atribuye una certificación WCAG completa a estas pruebas.

Estos límites no son fallos Web confirmados ni se marcan como resueltos mediante mocks. No se audita Mobile, deployment ni producción.

## Archivos, commits y Git

- **`0f612ca` — `fix(web): restore keyboard access to resource details`**: `pages/Resources.tsx` y nueva regresión `tests/resourcesDialog.test.mjs`.
- **`f4a3c1d` — `test(web): align final regressions with approved interface`**: `academicModules`, `appearance`, `authenticatedApiRendering`, `designSystem`, `profileRendering`, `retroWorkspace`, `sectionBackgrounds`, `socialAvatarCompletion` y `socialRendering` (bajo `frontend-web/tests`).
- Este informe y `docs/images/final-ui-f6-web-audit/` se registran en un commit documental separado; hash consultable con `git log -1 --format=%h -- docs/final-ui-f6-web-audit.md`.

Los 39 archivos ajenos presentes del inventario conservaron sus checksums. Las capturas históricas regeneradas por las pruebas se guardaron localmente y se conservaron sus versiones previas en Git; el informe incorpora únicamente las evidencias F6 seleccionadas. Permanecen fuera del staging los dos archivos ajenos modificados (`.env.docker.local.example`, `docs/desarrollo-local.md`) y los archivos/recursos históricos sin seguimiento que ya existían al entrar.

Sin reset, clean, stash, amend, merge, push ni operaciones sobre datos reales. Al registrar el informe queda staging vacío y únicamente el trabajo ajeno preexistente pendiente. Se detiene F6; no se inicia Mobile, deployment ni nuevas funciones.
