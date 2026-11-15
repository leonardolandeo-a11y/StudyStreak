# Hotfix CI posterior al PR

Base `a11b8f4`, rama `feat/ui-ux-web-mobile`. Sin cambios de funcionalidad/diseño ni push.

## Causas confirmadas

- **Mobile:** reproducidos los dos TS2322 con Node **22.23.4** y `npx --no-install tsc --noEmit` en una copia de archivos rastreados sin `expo-env.d.ts`. Ese archivo ignorado carga localmente las extensiones oficiales `expo/types/react-native-web` para `TextProps.tabIndex` y `ViewStyle.touchAction`. La declaración rastreada `src/types/expo-web.d.ts` las importa explícitamente, sin casts, supresiones ni cambios al foco/PanResponder. No era una incompatibilidad de versiones del lockfile.
- **Backend, run [43727941837](https://github.com/leonardolandeo-a11y/StudyStreak/actions/runs/43727941837):** falla el paso `Run backend verification including PostgreSQL integration`, comando `./mvnw -B -Dspring.jpa.properties.hibernate.default_schema=ss_audit_ci verify`. Surefire: 233 tests, 20 fallos, 0 errores, 17 skips. Los 20 fallos son los guards de `StudyObservationPrecisionIntegrationTest.setup:47` y `VerifiedPeriodIntegrationTest.setup:38`: esperan `current_database() = studystreak_schema_check`, pero el workflow provisiona/conecta `studystreak`. Se documenta antes de corregir la configuración: se conserva el guard y el código Backend; solo se alinea el nombre de la base efímera del workflow, su healthcheck, URL y creación de schema. Las advertencias de acciones Node/setup-java no causaron el exit 1.
- **Web / Chrome:** el timeout reportado de `Target.createTarget` ocurre antes de cargar la aplicación. El comando CI ya usa `--test-concurrency=1`. `academic.test.mjs` pasó aislado con Node 22.23.4 y también dentro del comando completo previo al arreglo; no se reprodujo ese timeout. Defecto confirmado del helper: descartaba stderr, no rechazaba comandos al terminar el proceso y dejaba Vite/perfil/proceso sin cleanup si fallaba la inicialización, que ocurre antes del `try/finally` del consumidor. Se preserva stderr acotado, se propagan fallos del proceso y se libera todo también en ese camino; cierre normal mediante `Browser.close` esperando la salida. Nuevos tests simulan salida de Chrome con código 23 y rechazo CDP, comprobando error original, proceso terminado, perfil borrado y puerto reutilizable. Sin retries ni cambios al límite CDP de 15 s o a los límites de las pruebas. No se ha demostrado agotamiento de recursos ni concurrencia como disparador del timeout remoto.
- **Web / apariencia:** el comando completo reveló además una expectativa anterior a M4d: buscaba `.auth-content` al navegar a `/login` y `/register` con una sesión autenticada. Ahora se exige el redirect al Dashboard y se comprueba su superficie; el color del formulario se verifica después de logout. Se mantienen todos los recorridos y los tests invitados `authScenes`.

## Validación

Se usó **Node 22.23.4**, igual al log del job Mobile `132853861659` (workflow `43727941855`); binario temporal en `/tmp`, sin cambiar la instalación local. Se reutilizaron dependencias instaladas con versiones del lockfile, sin reinstalarlas ni modificar locks.

| Check | Resultado |
| --- | --- |
| Mobile `npx --no-install tsc --noEmit` | Copia de archivos rastreados sin `expo-env.d.ts`/`.expo`: reproduce ambos TS2322 antes; aprobado después de añadir únicamente la declaración rastreada. |
| Mobile `npm run lint -- --max-warnings 0` | Aprobado. |
| Mobile comandos CI `npm run test:auth`, `test:pagination`, `test:review`, `test:focus` | 3 + 1 + 1 + 6 archivos aprobados, sin skips. |
| Dashboard dirigido | 5/5 archivos aprobados: `dashboardRendering`, `dashboardWidgetStorage`, `dashboardWidgets`, `widgetReorder`, `nativeTextRendering`. |
| Dashboard navegador | `compactDashboard.browser.mjs` aprobado: selección, arrastre/cancelación/autoscroll, cuentas, defaults, controles internos, diez pares tema/modo y 320/390/768. Reutiliza exportación M5 porque el cambio Mobile es solo de tipos. |
| Web `npm run lint`, `npx --no-install tsc -b`, `npm run build` | Aprobados. Build conserva warning no bloqueante de chunks >500 kB; no se cambia bundle/diseño para silenciarlo. |
| Web `npm run test:web` | Primera ejecución: unitarias aprobadas, UI 68/69; falla apariencia por expectativa de autenticación antigua, no el arranque Chrome. **Ejecución final: 77/77 unitarias + 71/71 UI aprobadas, cero skips**. Incluye `academic` y los dos nuevos casos de lifecycle; no se retira ninguna prueba. |
| Chrome dirigido | `academic`: 2/2 antes del cambio. `profileBrowserLifecycle`: 2/2 con fallos de proceso/CDP simulados. `appearance`: 6/6 tras actualizar ambas expectativas M4d y conservar el check del formulario después de logout. |
| Backend comando CI `./mvnw -B -Dspring.jpa.properties.hibernate.default_schema=ss_audit_ci verify` | **BUILD SUCCESS: 233 tests, 0 fallos, 0 errores, 17 skips existentes**. Java 21, PostgreSQL **16 local** temporal en `/tmp`, puerto 55743, base `studystreak_schema_check` y schema `ss_audit_ci`. Workflow conserva **PostgreSQL 17** y puerto 5432: esa variante exacta queda para GitHub. Base temporal detenida al finalizar; sin tocar bases/servicios existentes. |

Logs locales: `/tmp/ci-hotfix-*.log`. `git diff --check` aprobado.

## Archivos y commits locales

- `9f76a2a` — `frontend-mobile/src/types/expo-web.d.ts`: declaraciones oficiales de Expo Web disponibles antes de generar archivos ignorados.
- `f25391a` — `.github/workflows/ci.yml`: cuatro referencias al nombre de la base efímera; sin modificar pruebas/Java ni otros pasos.
- `8400d3b` — `frontend-web/tests/helpers/profileBrowser.mjs`, nuevo `tests/profileBrowserLifecycle.test.mjs`, `frontend-web/package.json`: lifecycle/diagnóstico y regresión añadida a `test:ui`.
- `8b67055` — `frontend-web/tests/appearance.test.mjs`: expectativa de rutas autenticadas M4d.
- Este informe se guarda en un commit documental separado.

## Pendiente y límites

No se certifica la causa del bloqueo interno de Chrome remoto: faltaba stderr en el helper anterior y el job Web seguía `in_progress` al consultarlo; GitHub no proporcionaba todavía su log completo. El arreglo corrige el manejo de fallos confirmado, sin atribuir un defecto al producto. Confirmar en una ejecución GitHub posterior si persiste `Target.createTarget`; el nuevo error incluye salida/código para investigarlo. No se inició ni canceló ninguna ejecución remota.

No hay acceso Android físico: foco/PanResponder/drag/accesibilidad se conservaron sin cambios de ejecución y se comprobaron mediante mocks/Expo Web, no mediante Expo Go real. Sin cambios en UI, autenticación, servicios, dependencias, contratos API, código Backend o datos persistentes. Se revisaron ambos workflows; solo se corrigió el nombre de la base CI. Cambios ajenos preservados y excluidos del staging. Sin push ni operaciones destructivas.
