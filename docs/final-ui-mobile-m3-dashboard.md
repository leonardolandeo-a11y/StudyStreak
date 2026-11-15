# M3 — Corrección nativa y Dashboard Mobile

14 de noviembre de 2026 · rama `feat/ui-ux-web-mobile` · base M2 `76fa003` y su informe `dc10b6d`.

## Corrección urgente, anterior al Dashboard

Commit **`6b46f6d` — `fix(mobile): resolve native text rendering errors`**.

`AcademicHeading` tenía ocho espacios en la misma línea después de `<>`: TypeScript los compilaba como un hijo string del fragmento, finalmente situado dentro de un `View`. Lo utilizan Profile, Settings, Goals, Tracking, Validations, Resources, Notifications, Focus Studio y Study Rooms. Se cambió únicamente ese espacio JSX por un salto de línea. También se hizo booleano el condicional de `RecordedSummary` que podía devolver un timestamp `0` fuera de Text.

La comprobación de Fabric está en `node_modules/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js`, `createTextInstance`, línea 17182. El mock nativo ahora aplica la misma restricción a View/Pressable, incluyendo fragmentos, números y espacios. Antes del arreglo, `academic.test.mjs` reproduce el mensaje y stack: `Text strings must be rendered within a <Text> component. View received "        "`; después pasan ocho archivos de regresión. Se añadió además una inspección AST de todos los TSX y casos de encabezados/valores cero. No se ocultan advertencias ni se modifica el renderer.

**Límite:** no hay `adb` disponible ni dispositivo conectado accesible desde esta sesión. Esa reproducción es controlada con la restricción nativa, no un log obtenido de Expo Go. La confirmación física del error reportado sigue pendiente.

## Dashboard

- Customize Dashboard pasa a Modal nativo con SafeArea, scroll independiente, cierre/Back, Escape en Expo Web y retorno del foco. Cambios inmediatos persistidos por cuenta; se conservan errores/reintento y defaults.
- Asas con PanResponder, desplazamiento visual, indicador antes/después del destino y autoscroll en los bordes. Solo el asa captura el gesto; guardar ocurre al soltar. Cancelación/interrupción no guarda un orden intermedio. Sin HTML Drag and Drop ni dependencias nuevas.
- Alternativa sin arrastrar: activar el asa abre selección explícita de posición; también hay acciones accesibles subir/bajar/primero/último. Se anuncia el resultado y se restaura el foco al asa al regresar. Las acciones internas de widgets no cambian.
- Activity Calendar reutiliza `stats.activity` del snapshot existente. Si está visible, Study Journey ofrece una referencia en lugar de duplicarlo; si está oculto, el calendario interno se conserva. Preferencias antiguas mantienen sus ocho posiciones/visibilidad y añaden calendario oculto; defaults nuevos/restaurados incluyen nueve widgets. Se conserva el formato y la clave por cuenta.
- No existía barra redundante de notificaciones en el Dashboard actual; se verifica su ausencia. Hero integrado y superficies siguen M2; no cambian estadísticas, cálculos, consultas ni endpoints.
- Mobile aún utilizaba ilustraciones `study-v1`, mientras Web final y su prueba de máscaras usan `study-v2`. Se incorporaron copias PNG locales de las cuatro ilustraciones finales y sus previews: igualdad de píxeles RGB decodificados verificada contra los WebP fuente, sin redibujar. Se alinearon máscaras/efectos; Night Desk final utiliza lluvia. Se conservan IDs, preferencias, horarios, fallback y pausa por foco/background/Reduce Motion. Los ocho PNG añaden aproximadamente 4,2 MB de recursos locales; los históricos permanecen intactos.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| Lint / TypeScript | `npm run lint` y `tsc --noEmit --pretty false`: aprobados, sin warnings de lint. |
| Pruebas Mobile con guard nativo | `node --experimental-strip-types --test tests/*.test.mjs`: **48/48 archivos**, sin skips. Tras el último ajuste del indicador, tres regresiones dirigidas adicionales aprobadas. |
| Dos pendientes de M2 | `dashboardWidgets` y `environmentRendering` pasan. Se conserva la comparación de contrato/máscaras Web: ahora la implementación cumple. Solo se actualizan cantidades/migración a nueve widgets y expectativas browser de rutas de imágenes/lluvia justificadas por `study-v2`. |
| Export para simulación | `CI=1 EXPO_OFFLINE=1 npx expo export --platform web --output-dir .expo/integration-export`: aprobado; no es un binario Android. |
| `dashboardWidgets.browser.mjs` | Chrome con fixtures: touchStart/move/end y cancel reales automatizados, feedback de destino, arrastre hasta la última posición con autoscroll, teclado/selector, modal Escape/foco, cuentas A→B→A, persistencia/defaults, calendario único y cero consultas estadísticas adicionales al personalizar. Navegación por rutas principales, incluido Profile; anchos 320/390/768. |
| `environmentSettings.browser.mjs` | Chrome con fixtures: cuatro escenas/previews, efectos medidos, pausa, Reduce Motion, cuentas/recarga, horarios, fallback real del cargador de imágenes y 12 apariencias. Capturas solo en `.expo/m3-environment`; se inspeccionaron también modal y Dashboard actuales. |

Pendiente en Expo Go Android: recorrido de rutas para confirmar ausencia del warning, gesto físico/fluidez, Back del sistema, foco con TalkBack, SafeArea/teclado y ciclo de vida real. Las pruebas Chrome/SSR no acreditan esas comprobaciones ni integración autenticada con un backend real.

## Archivos y alcance

- Urgente: `components/academic/Academic.tsx`, `components/study/RecordedSummary.tsx`, guard de `tests/helpers/appearanceNativeMock.mjs` y `tests/nativeTextRendering.test.mjs`.
- Dashboard, bajo `frontend-mobile/src`: `app/(app)/(main)/dashboard.tsx`, `components/dashboard/{CustomizeDashboard,WidgetReorderList}.tsx`, `components/focus/{FocusInsightsMobile,StudyAnalyticsDetails}.tsx`, `features/dashboard/{widgetPreferences,widgetReorder}.ts`, `components/environment/scenes.ts`; ocho PNG en `assets/environments/study-v2/`.
- Pruebas: `dashboardWidgets.{test,browser}.mjs`, `widgetReorder.test.mjs`, `environmentSettings.browser.mjs`, `studyEnvironment.browser.mjs`, `helpers/m3DashboardReview.mjs` y soporte de primitivas nativas en `helpers/appearanceNativeMock.mjs`.
- Este informe acompaña al commit `feat(mobile): improve dashboard customization`; el hash definitivo se informa en la entrega y se consulta con `git log -1 --format=%h -- docs/final-ui-mobile-m3-dashboard.md`.

Cambios ajenos preservados y fuera del staging. Sin cambios en Web, API/backend, dependencias o infraestructura; sin push, merge, reset, clean, stash ni amend. No se implementan Profile Discord, logout en Drawer ni acceso horizontal. M3 termina aquí; M4/M5 no iniciados.

## Hotfix — Dashboard compacto y arrastre directo

Continuación de `727e471`. Se elimina toda la bienvenida y sus CTA. El panorama conserva sus cuatro recursos completos 3:1 y gana ancho, sin tarjeta, borde o fondo propio. Dos degradados alpha derivados de `theme.colors.background` funden sus bordes con el lienzo real; se utiliza `backgroundImage`, disponible en React Native instalado, sin dependencias ni imágenes nuevas. La superficie previa a la carga también usa el tema.

Debajo hay icono, título Dashboard, descripción de una línea y engranaje de personalización con nombre accesible. La cabecera nativa muestra la marca para evitar repetir el título. Nuevos defaults/restauración empiezan con **Study Activity**; los arrays guardados conservan íntegramente orden y visibilidad, incluido el calendario.

`useWidgetDrag` y `WidgetDragHandle` comparten la lógica entre modal y Dashboard. Asas de 44 px capturan únicamente su gesto; hay feedback, destino, hit testing en dos columnas y autoscroll. Solo drop guarda el array completo por cuenta; se conservan widgets ocultos y su orden relativo. Cancelación, pérdida de foco, background y Back durante arrastre cancelan sin guardar. Activar un asa abre el selector accesible de posición del modal; las acciones nativas accesibles siguen disponibles. Los controles internos de widgets permanecen independientes.

Verificación del hotfix: lint y TypeScript aprobados; **11/11 archivos dirigidos** aprobados, sin skips, incluidos errores de texto, preferencias, renderizado, navegación, apariencia y Profile. Export Expo Web aprobado. Chrome con fixtures comprueba arrastre directo vertical/horizontal, cancelación, autoscroll, persistencia A→B→A, modal, controles de gráfico, defaults, diez combinaciones familia × Light/Dark con colores reales del degradado y anchos 320/390/768. Las regresiones existentes de modal M3 y cuatro ambientes también pasan. Se inspeccionó la captura inicial compacta, con el gráfico visible antes de las métricas. No son pruebas Android físicas: continúan pendientes Expo Go, fluidez real, SafeArea, TalkBack y Back del sistema en dispositivo.

Archivos del hotfix: rutas `dashboard.tsx` y su layout Drawer; `StudyEnvironment.tsx`, `EnvironmentScene.tsx`, `Screen.tsx`, `CustomizeDashboard.tsx`, `WidgetReorderList.tsx`, nuevos `WidgetDragHandle.tsx`/`useWidgetDrag.ts`, preferencias y geometría de reordenamiento. Pruebas: `compactDashboard.browser.mjs`, `dashboardWidgets.test.mjs`, `widgetReorder.test.mjs`, `environmentRendering.test.mjs` y `helpers/m3DashboardReview.mjs`. Solo Mobile y este informe; servicios y cambios ajenos intactos. Commit: `refactor(mobile): streamline dashboard and enable direct widget dragging`. Sin push; M4/M5 no iniciados.
