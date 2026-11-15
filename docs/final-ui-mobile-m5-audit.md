# M5 — Auditoría final Mobile

15 de noviembre de 2026 · `feat/ui-ux-web-mobile` · base `0d8ec27` (M4d).
Referencias reutilizadas: informes M1–M4d, `final-ui-f6-web-audit.md`, contratos/pruebas existentes de paridad con Web. Sin nueva auditoría de Web F6 ni rediseños.

**Cierre:** ningún P0/P1 confirmado pendiente dentro del alcance Mobile comprobado. No equivale a aprobación física Android ni de integraciones reales; esas verificaciones siguen pendientes.

## Estado por pantalla

| Área | Resultado y evidencia actual |
| --- | --- |
| Login / Register / sesión | Marco retro y escenarios mañana/tarde/noche; vertical 320/390 y horizontal 600/844/1024, acceso por scroll, errores/carga y logout pasan. Restauración/refresh y aislamiento de sesión cubiertos con mocks; SecureStore y reinicio reales pendientes. |
| Dashboard / ambientes | Hero compacto integrado, Study Activity primero por defecto, nueve widgets y calendario independiente. Arrastre directo, cancelación, autoscroll, selección sin Place, defaults y cuentas A→B→A pasan. Cuatro ambientes, Automatic, movimiento/pausa y fallback pasan. |
| Focus Studio | Pomodoro, metas y catálogo de 12 soundscapes cubiertos por suite. Importación/reproducción WAV real en Chrome, pausa/cambio/eliminación, exclusión con soundscapes y liberación de URLs al salir pasan. Picker, codecs y recursos nativos pendientes. |
| Study Rooms | Host/member, círculo bajo Chat/Participants, controles inferiores, invitaciones y confirmaciones pasan. Reloj/versiones, reconexión/estado obsoleto, permisos, chat idempotente con retry, reacciones y moderación pasan con API simulada. LiveKit real pendiente. |
| Goals | Creación contextual, edición/eliminación, registros/evidencias y tags, errores/reintentos y confirmaciones pasan. Botón pixel idéntico entre pestañas. |
| Tracking | Solicitudes/selección de partner, acceso a perfiles y estados cubiertos por suite y flujo integrado. Sin nuevas operaciones ni cambios de permisos. |
| Validations | Wizard completo, selección, pasos/IDs, evidencia, draft al retroceder, confirmación y retry pasan. Filas compactas/flechas y Refresh cubiertos. |
| Resources | Búsqueda, vacío/error/retry, cancelación y respuesta tardía, detalle/cierre y destino Google Books pasan. Proveedor externo y apertura nativa sin comprobar. |
| Notifications | Papelera/confirmación, filtros/contador/Refresh y destinos pasan. Historia silenciosa, máximo tres avisos, deduplicación, descarte, background y respuestas tardías tras logout/cambio de cuenta pasan. |
| Profile / Member Profile | Banner/avatar/identidad, edición solo propia, permisos y cancelación pasan. Suite cubre caché/errores de imágenes con mocks; decodificación/picker privados nativos pendientes. |
| Settings / Drawer | Cinco familias × Light/Dark/System, cuatro acentos, migración/persistencia A→B→A pasan. Primer Settings sin Home, Back y origen, identidad/estrella/skyline/taza y logout pasan en fixtures. |
| Loading / navegación | Taza/política Reduce Motion y renderizados semánticos cubiertos por suite. Tabs, Drawer, rutas autenticadas y Back simulado pasan. Back físico y deep link frío pendientes. |

No se detectaron superficies discordantes ni overflow en las geometrías automatizadas de las rutas comprobadas (320/390/768; algunos flujos también 1440). Esto no certifica contraste perceptual, SafeArea, teclado ni lector de pantalla nativos. Se conservan las adaptaciones aprobadas F1–F6: navegación Expo, controles táctiles y presentación compacta, sin copiar DOM/sidebar de escritorio.

## Hallazgos y correcciones

- **P0: 0 / P1: 0 confirmados pendientes.** No se confirmó un defecto de producto que requiriese modificar código Mobile.
- **P2 corregidos — mantenimiento de pruebas**, commit **`b2c2985`**:
  - `frontend-mobile/tests/authScenes.test.mjs`: esperaba el eslogan retirado del formulario compacto M4d; comprueba marca accesible y marco pixel, manteniendo campos/temas/escenas.
  - `frontend-mobile/tests/mobilePolish.browser.mjs`: fixture anterior a Activity Calendar omitía `stats.activity`, obligatorio en el contrato existente; se añade el array diario ya simulado. El crash observado pertenecía a ese fixture incompleto.
  - `frontend-mobile/tests/mobileRoomsResourcesNotifications.browser.mjs`: selectores/textos anteriores a M4; se usan estado del dial, pestaña Participants, selector de reacciones y papeleras/confirmación actuales. Se conservan verificaciones de escrituras, permisos, retry y navegación.
  - `frontend-web/tests/authEntry.test.mjs`: espera al submit Login renderizado tras salir de Register; el campo password anterior no acreditaba que hubiese terminado la transición. Solo prueba de autenticación afectada por M4d; ningún cambio Web de producto.
- **P2 registrado, sin rediseño:** arneses históricos `widgetSelection.browser.mjs` y `dashboardWidgets.browser.mjs`/`helpers/m3DashboardReview.mjs` aún esperan asas dentro del modal retiradas por el micro-hotfix M3. No se ejecutaron como contrato actual; la cobertura vigente es `compactDashboard.browser.mjs` y las pruebas de modelo/renderizado/reordenamiento. Pendiente alinear o retirar esos arneses históricos.
- El error `Text strings must be rendered within a <Text> component` no reaparece en la suite: guard nativo simulado que rechaza strings/números/fragmentos, renderizados compartidos y recorrido AST de todos los TSX. Los recorridos Chrome pasan; falta corroboración en Fabric/Expo Go real.

## Pruebas ejecutadas

| Comprobación | Resultado |
| --- | --- |
| ESLint Mobile: `npm run lint` | Una ejecución, aprobada sin warnings. |
| TypeScript Mobile: `npx tsc --noEmit` | Una ejecución, aprobada. |
| Suite completa: `node --experimental-strip-types --test --test-concurrency=4 tests/*.test.mjs` | Una ejecución: **53/54 archivos**, sin skips; único fallo en expectativa antigua de authScenes. Tras corregirla, solo `--test tests/authScenes.test.mjs`: **1/1 aprobado**. Los 54 archivos quedan cubiertos; no se afirma una segunda ejecución completa verde. Incluye los anteriores pendientes `dashboardWidgets` y `environmentRendering`, ambos aprobados. |
| Expo: `CI=1 EXPO_OFFLINE=1 npx expo export --platform all --output-dir .expo/integration-export` | Una exportación aprobada **Android, iOS y Web**. Bundle Android 2330 módulos; iOS 2222. No instala ni ejecuta una app nativa. |
| Web autenticación: `node --test --test-concurrency=1 tests/authEntry.test.mjs tests/authScenes.test.mjs tests/jwt.test.mjs` | Inicial **11/12 casos**; fallo de espera Register→Login. Repetición solo de `authEntry.test.mjs`: **2/2 aprobados**. Escenas (3) y JWT (7) ya aprobados, sin repetir F6. |
| Regresiones navegador Mobile | **12 scripts aprobados**, listados abajo. Dos fallaron inicialmente por fixtures/selectores antiguos y se repitieron solo tras corregirlos; sin fallos restantes entre los ejecutados. |
| Integridad de cambios | `node --check` de los cuatro archivos editados y `git diff --check`: aprobados. Sin cambios en `frontend-mobile/src` ni `frontend-web/src`. |

Scripts de `frontend-mobile/tests/`: `mobileNavigation.browser.mjs`, `compactDashboard.browser.mjs`, `mobileAuthScenes.browser.mjs`, `m4Music.browser.mjs`, `m4Rooms.browser.mjs`, `m4Notifications.browser.mjs`, `m4cNavigation.browser.mjs`, `mobileRoomsResourcesNotifications.browser.mjs`, `mobilePolish.browser.mjs`, `environmentSettings.browser.mjs`, `m2Appearance.browser.mjs`, `mobileGoalsParity.browser.mjs`.

Incluyen 80 combinaciones de apariencia (System con ambos esquemas), migraciones/recarga/cuentas, diez pares familia/modo del Dashboard, controles internos y estados loading/disabled. `environmentSettings` guardó capturas en `/tmp/m5-environments`; demás artefactos de ejecución en `.expo`, fuera del staging. Logs locales `/tmp/m5-*.log`.

## Android — checklist manual pendiente (Expo Go)

No hay dispositivo físico ni `adb` disponible. Todas las casillas permanecen **pendientes**:

- [ ] Login/Register, refresh de sesión, cerrar/reabrir app, logout y otra cuenta; sin datos/preferencias cruzados.
- [ ] Todas las pestañas/Drawer, Settings desde distintos orígenes, Back físico y deep links en arranque frío/caliente; sin errores Text.
- [ ] Rotación, teclado abierto, scroll y SafeArea/notch; inputs y botones accesibles en pantallas pequeñas.
- [ ] Dashboard: tocar/deseleccionar, arrastrar con autoscroll, cancelar, soltar/recargar y Restore defaults; calendario único.
- [ ] Import Music: elegir/cancelar archivo, reproducir/pausar/cambiar/eliminar, alternar soundscapes, salir/background y cambiar de cuenta; sin audio simultáneo ni recursos retenidos.
- [ ] Salas host/member: copiar/compartir invitación, permisos/confirmaciones, chat, reconexión y reloj con dos sesiones reales.
- [ ] Perfil propio/ajeno, selección/permisos y carga de imágenes; notificaciones nuevas/históricas/deduplicadas al reanudar y cambiar cuenta.
- [ ] Cinco familias, System, acentos, TalkBack, tamaño de texto, Reduce Motion y animaciones/fluidez reales.

## Límites de integración y preparación

Chrome ejecutó Expo Web con APIs interceptadas; **no equivale a Android**. AppState, sesión, permisos, reloj y servicios tienen simulaciones; no se certifican backend autenticado, latencia real, concurrencia multiusuario, polling remoto ni servicios externos. La decodificación WAV fue real en navegador, no el selector/codec nativo. Limpieza nativa de caché, imágenes privadas, SecureStore e interrupciones del SO requieren el recorrido físico.

La recepción LiveKit requiere **development build con módulos nativos**; Expo Go muestra el fallback aprobado y mantiene chat/reloj. Probar transporte real exige ese build separado. Publicación nativa y presencia `Active on Mobile` siguen fuera de alcance.

Git: staging explícito únicamente de los cuatro tests del commit `b2c2985` y este informe en commit documental separado. Se preservan todos los cambios ajenos previos (incluidos `.env.docker.local.example`, `docs/desarrollo-local.md` y archivos no rastreados); el árbol global continúa sucio por ellos, sin cambios M5 pendientes tras los commits. Ningún cambio de servicios, dependencias, API, backend o infraestructura. Sin push ni operaciones destructivas.

**Preparación:** M5 automatizado cerrado y commits locales revisables. Integración sujeta a revisión de cambios ajenos y a confirmar la checklist Android/integraciones reales; no se inició merge, deployment ni otra etapa.
