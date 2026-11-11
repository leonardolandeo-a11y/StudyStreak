# Etapa 7.4a — Dashboard, sidebar y Tracking

Rama: `feat/ui-ux-web-mobile`. Base de trabajo: `9312d08`, documentación posterior al refinamiento `99579da`. Se revisaron Git, AGENTS.md y la documentación previa. Los 16 elementos ajenos originales (dos modificados y catorce sin seguimiento) se conservan fuera de la entrega. No había trabajo de esta etapa sin commit al comenzar.

## Diferencias visibles

| Área | Antes | Después |
| --- | --- | --- |
| Dashboard Web/Mobile | Actividad verificada y tarjetas complementarias; barra segmentada de días activos bajo el gráfico. | Gráfico 7/30 y barras/líneas intacto, sin la barra ni su fila redundante. Se añade «Time well spent» con estadísticas registradas y acceso a los detalles que estaban en Focus. |
| Focus Web/Mobile | Bloque de estadísticas con su propio selector, consultas y refrescos. | Pomodoro, Now Playing, Settings, meta vinculada y los 12 soundscapes. Sin bloque ni consulta de estadísticas. El conteo local de ciclos conserva su aclaración: no equivale a sesiones verificadas. |
| Sidebar Web | Ancho fijo, iconos de 18 px, filas de unos 41 px y sin descripciones. | Se expande a 264 px y contrae a 84 px; iconos de 22 px y filas de al menos 52 px. Descripciones al hover/foco, también como tooltip en modo contraído; selección con marcador animado y desplazamiento breve al hover/foco. |
| Tracking Web/Mobile | Tres listas permanentemente abiertas; perfil mediante botón adicional y eliminación textual. | Tres encabezados plegables independientes con indicador y contador. Activos primero. Avatar/nombre abren el perfil autorizado; papelera roja separada con confirmación. Se elimina la frase repetitiva de solicitud recibida/enviada, conservando la dirección compacta Sent/Received y el estado. |

Los grupos comienzan abiertos y se contraen/expanden sin desmontar sus filas ni reiniciar la paginación. En Web se controla su visibilidad con `hidden`; en Native, con `display` y exclusión de accesibilidad al estar cerrados. Los datos e imágenes ya cargados permanecen durante el plegado: no se vuelve a consultar por pulsar el encabezado. Los cargadores y la recuperación de página existentes siguen resolviendo las actualizaciones reales.

## Estadísticas sin duplicar consultas

`FocusInsights` y `FocusInsightsMobile` pasan a ser presentación del snapshot que ya carga Dashboard desde **GET `/api/focus-sessions/stats?days=7|30`**. No mantienen otro fetch, polling, selector ni temporizador de refresco. El selector 7/30, retry/refresh Web y pull-to-refresh Native existentes actualizan el mismo snapshot. Mobile conserva la recarga al enfocar Dashboard.

Se conservan:

- Métricas principales: minutos/sesiones del `verifiedPeriod`, promedio y racha actual.
- Tarjetas trasladadas: tiempo registrado total, sesiones registradas totales, tiempo registrado del período y de la semana. Se distinguen explícitamente los minutos verificados de las estimaciones históricas; los totales registrados nunca alimentan el gráfico verificado.
- Detalles Activity/Goals/Together/History: agrupaciones, calendario, distribución por meta/hora, comparación e historial paginado, reutilizando `StudyAnalyticsDetails`. El historial se consulta sólo al seleccionar su pestaña, mediante `/api/study/history`, como antes. El detalle ahora destaca la mejor racha existente en vez de repetir la racha actual de la tarjeta principal; no cambia su cálculo.
- Metas activas, actividad reciente, notificaciones y sus destinos actuales en Dashboard.

No cambian `verifiedActivity`, DTO, límites REST, acreditación, reglas de rachas, Pomodoro, UUID, outbox, recuperación, ledger, heartbeats ni audio. En Focus Web sólo se eliminó el contador interno que invalidaba la vista estadística retirada; los efectos de recuperación y guardado permanecen.

## Navegación, autorización y seguridad de interacción

El sidebar conserva todos los destinos, contador de no leídas, perfil, Settings y logout. El estado contraído se conserva mientras el layout autenticado continúa montado; no se añade otra preferencia persistente. La navegación Web estrecha y el drawer/pestañas/`+` de Mobile mantienen su implementación.

Las descripciones utilizan `role="tooltip"` y `aria-describedby`, admiten hover sobre el propio contenido y se cierran con Escape, al navegar, desplazar o redimensionar. Las áreas activas siguen teniendo foco visible. Los efectos anteriores de Resources, Goals y demás iconos se conservan; la selección nueva dura 300 ms y el movimiento de filas/ancho 260 ms. La preferencia global y `prefers-reduced-motion` desactivan estos movimientos. La casita con puerta de Menu Mobile no se modifica y su prueba sigue pasando.

Las tarjetas de Tracking no tienen una acción global de borrado o navegación. Avatar/nombre y papelera son controles hermanos. El borrado Web usa el diálogo de confirmación existente; Native conserva su confirmación local Keep/Remove con estilo destructivo. No se envía DELETE al abrir o cancelar la confirmación. Aceptar/rechazar permanecen separados de la identidad. Mobile conserva también cancelar solicitudes y eliminar enlaces históricos, con los nombres accesibles anteriores.

Se reutilizan TrackingAvatar/SocialAvatar y sus clientes autenticados, fallback, caché/cola y limpieza existentes. Web sólo enlaza identidades ACCEPTED; Native conserva la comprobación del directorio autorizado antes de hacer pulsable la identidad. El backend sigue siendo la autoridad al abrir un perfil o descargar una imagen; no se amplían permisos de relaciones pendientes/rechazadas. Permanecen búsqueda, debounce, envío, tres paginadores y recuperación de errores. No se cambian servicios ni contratos.

Dark/Light/System y Mint/Blue/Purple/Orange siguen procediendo de los proveedores y tokens existentes. No se añaden ilustraciones, fuentes, dependencias, endpoints o nuevos destinos.

## Verificación

Todas las escrituras automatizadas son mocks, sin acceso a PostgreSQL persistente.

- ESLint y TypeScript Web/Mobile: aprobados. El build Web incluye `tsc -b`.
- Build Web: aprobado. Persiste la advertencia conocida del chunk Study Rooms >500 kB; no se toca su implementación.
- Expo export Web y Android: aprobados; sin compilación nativa ni instalaciones. Las exportaciones de prueba usan una URL API de fixture y permanecen en `.expo`, fuera del commit; los archivos `.env` privados no cambian.
- Web: **20 casos dirigidos** aprobados entre dashboardRendering, focusStudioRendering, academic, trackingPolish y workspaceInteractions. Los casos ya aprobados se conservaron y el recorrido nuevo se repitió de forma aislada al ajustar instrumentación/teclado. Incluyen una sola consulta por período en Dashboard, ninguna adicional al abrir detalles, cero consultas de estadísticas desde Focus, 7/30, barras/líneas, métricas históricas rotuladas, navegación, sidebar contraído/expandido, tooltip/Escape, teclado Enter, plegado independiente sin recargas, perfiles desde identidad, cancelación y confirmación de DELETE, ACCEPT/REJECT y envío/búsqueda con avatar.
- Layout compartido Web: **10 casos adicionales aprobados** en uiRendering y studyPartnersRendering, incluyendo panel derecho/drawer, teclado, temas, limpieza de imágenes, logout, aislamiento de cuentas y ausencia de heartbeats duplicados con la navegación compartida.
- Regresiones lógicas Web: **4 archivos aprobados**, pomodoroState, pomodoroGoalTracking, studyActivity y pageBounds.
- Mobile: **10 archivos aprobados** entre dashboardRendering, focusStudioRendering, academic, socialRendering, dashboardActivity, focusTimer, focusGoalTracking, focusSessionId, focusRecordingIntegration y mobileMenuNavigation. La aserción nueva del Dashboard se validó después por separado al adaptar la instrumentación del mock de controles.
- Recorridos Chrome de React Native Web: **mobileDashboard, mobileFocus y mobileSocial aprobados**. Verifican gráficos/filtros, errores/retry, período verificado ausente, navegación y rachas/estimaciones; Focus Start/Pause/Resume/Reset y un único ID al navegar; cero consultas estadísticas desde Focus frente a la consulta legítima al visitar Dashboard; tres grupos independientes, cancelación y borrado confirmado, privacidad/revocación, perfiles, aislamiento al cambiar de cuenta y logout. La prueba de Menu conserva engranajes y puerta animada/Reduce Motion.
- `git diff --check`: aprobado.

React Native Web requirió exponer `aria-expanded` explícitamente además del estado de accesibilidad nativo. Las pruebas se ajustaron a esperar las recargas al volver de un perfil o mutar una relación, y a enviar Enter completo en Chrome. No se introdujo una solución funcional para un fallo de instrumentación.

### Inspección visual antes y después

Se capturaron e inspeccionaron Dashboard, Focus Studio, sidebar y Tracking **antes de editar**, en Chrome con fixtures: `/tmp/74a-before-{dashboard,focus-studio,tracking-links}.png` (el sidebar es visible en esas capturas).

Después se inspeccionaron `/tmp/74a-after-{dashboard,sidebar-collapsed,focus-studio,tracking-confirm}.png`, `/tmp/74a-after-tracking-{320,390,768,1440}.png` y la galería Dashboard/Focus actualizada `/tmp/73a-*`. La matriz comprueba anchos 320–1440 px y también 1920 px en Dashboard/Focus, los tres modos y las cuatro paletas, sin overflow del documento. Las capturas confirman el traslado visible de estadísticas, ausencia de barra, iconos más grandes, plegado, identidades y confirmación destructiva.

En React Native Web se inspeccionaron las galerías actualizadas `.expo/73a-dashboard-*`, `.expo/73a-focus-*`, `.expo/73b-tracking-*`, además de `.expo/74a-dashboard-insights.png` y `.expo/74a-tracking-confirm.png`. La matriz comprueba 320–1440 px, temas/paletas, foco y Reduce Motion. Los artefactos de prueba no se incluyen en Git.

### Pendiente en Expo Go real

No se operó un Android físico. Comprobar con la configuración LAN habitual: navegación Menu/Drawer → Dashboard/Focus, pull-to-refresh y filtros 7/30; pausa/reanudación al ir a background; pulsación y TalkBack de los tres encabezados plegables; identidad → perfil → Back; papelera → Keep y, sólo con datos de prueba autorizados, Remove; fuente grande, SafeArea y teclado. Confirmar las cuatro paletas y Reduce Motion, incluida la puerta de Menu. No se altera la configuración de Expo Go ni se requiere development build para estos cambios.

## Archivos modificados

- `docs/retro-pixel-academia-etapa-7-4a.md`
- `frontend-mobile/src/app/(app)/(main)/(menu)/tracking/index.tsx`
- `frontend-mobile/src/app/(app)/(main)/dashboard.tsx`
- `frontend-mobile/src/app/(app)/(main)/focus-studio.tsx`
- `frontend-mobile/src/components/dashboard/DashboardActivity.tsx`
- `frontend-mobile/src/components/focus/FocusInsightsMobile.tsx`
- `frontend-mobile/src/components/focus/StudyAnalyticsDetails.tsx`
- `frontend-mobile/src/components/tracking/TrackingLinkCard.tsx`
- `frontend-mobile/src/components/ui/AppIcon.tsx`
- `frontend-mobile/tests/dashboardRendering.test.mjs`
- `frontend-mobile/tests/mobileDashboard.browser.mjs`
- `frontend-mobile/tests/mobileFocus.browser.mjs`
- `frontend-mobile/tests/mobileSocial.browser.mjs`
- `frontend-web/package.json`
- `frontend-web/src/components/dashboard/FocusInsights.tsx`
- `frontend-web/src/components/dashboard/FocusStudio.tsx`
- `frontend-web/src/components/dashboard/StudyActivityChart.tsx`
- `frontend-web/src/components/dashboard/StudyAnalyticsDetails.tsx`
- `frontend-web/src/components/layout/AppSidebar.tsx`
- `frontend-web/src/components/layout/UserPanel.tsx`
- `frontend-web/src/components/layout/sidebar.css`
- `frontend-web/src/components/trackingLinks/TrackingGroup.tsx`
- `frontend-web/src/components/trackingLinks/TrackingLinkCard.tsx`
- `frontend-web/src/pages/Dashboard.tsx`
- `frontend-web/src/pages/TrackingLinks.tsx`
- `frontend-web/tests/academic.test.mjs`
- `frontend-web/tests/dashboardRendering.test.mjs`
- `frontend-web/tests/focusStudioRendering.test.mjs`
- `frontend-web/tests/workspaceInteractions.test.mjs`

## Git y cierre

Staging explícito exclusivamente de los archivos anteriores. Commit solicitado: `feat(ui): refine dashboard sidebar and tracking interactions`. Los 16 elementos ajenos quedan fuera del commit y no se revierte trabajo previo. No se modifican Goals, Validations, Study Rooms, Resources, Login/Register, backend, PostgreSQL, Docker, AWS, contratos REST ni archivos privados. Sin push, merge, amend o reset. La entrega termina en 7.4a.
