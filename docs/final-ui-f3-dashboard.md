# F3 — Dashboard personalizable Web

Base: `6117255`, rama `feat/ui-ux-web-mobile`. Implementación exclusiva de `frontend-web`.

## Cambios

- Customize Dashboard reutiliza `WorkflowDialog`, el diálogo nativo usado por los formularios. Tiene backdrop, X/Escape, foco contenido/restaurado, scroll interior y bloqueo del scroll exterior. Se reserva el canal de scrollbar para evitar desplazar el Dashboard al abrirlo.
- Las flechas visibles se sustituyen por asas. Se pueden arrastrar los widgets desde el Dashboard o las filas del modal con HTML Drag and Drop nativo. La imagen de arrastre, la atenuación del origen y la línea de destino anticipan el movimiento; el orden se guarda al soltar. Soltar fuera/cancelar no confirma cambios.
- Con un asa enfocada, ↑/↓ y Home/End reordenan sin mouse. Se mantiene el foco y se anuncia la nueva posición. Los controles dentro de los widgets conservan su comportamiento. La animación de reordenamiento de 220 ms existente sigue respetando Reduce Motion.
- Se elimina exclusivamente la barra inferior Your notifications. La navegación de Notifications y sus contadores se conservan.
- El hero conserva sus cuatro recursos y composición. Solo aumentan discretamente los recorridos de nubes/vapor y la intensidad de iluminación en sus capas existentes. No se añaden recursos, listeners, consultas ni timers. La política existente controla visibilidad, background, dispositivos limitados y Reduce Motion.

## Calendario y preferencias

El calendario no estaba eliminado: `FocusInsights → StudyAnalyticsDetails → Activity → RecordedCalendar`, dentro del desplegable de Study Journey. Ahora también se ofrece como **Activity Calendar**, usando el mismo `stats.activity` del snapshot de `/api/focus-sessions/stats`, sin consultas adicionales ni nuevos cálculos.

Cuando el widget está visible, Journey muestra una referencia al calendario externo en lugar de otra instancia. Cuando se oculta, se conserva el acceso anterior desde Journey. El componente sigue distinguiendo tiempo registrado —incluidas estimaciones históricas— de actividad verificada; mantiene sus fechas reales del contrato y su estado vacío.

Se mantiene `studystreak-dashboard-v1-<userId>`, con solo IDs, orden y visibilidad. Los ocho ajustes antiguos se conservan; el nuevo calendario se añade **oculto a configuraciones previas**, para no alterar su distribución. Instalaciones sin preferencias y Restore default layout incluyen el calendario visible. No se cambian las preferencias de apariencia ni ambientes. Mobile conserva su contrato e implementación anteriores.

## Verificación

| Prueba | Resultado |
| --- | --- |
| `npm run lint` | Aprobada |
| `npx tsc -b --pretty false` | Aprobada |
| `npm run build` | Aprobada; persiste el aviso previo de chunk multimedia >500 kB |
| `node --experimental-strip-types --test tests/dashboardWidgets.test.mjs tests/environmentPreferences.test.mjs` | Aprobadas: normalización, migración, serialización, fallos de almacenamiento, cuentas y preferencias independientes |
| `node --test tests/dashboardRendering.test.mjs` | Aprobada: métricas/gráficos, eliminación de barra redundante, colocación de widgets y calendario con datos/vacío |
| `node tests/dashboardCustomization.browser.mjs` | Aprobada: modal, foco, Escape, estabilidad del contenido, drag nativo en modal y grid, teclado, recarga, cuentas, ocultar/restaurar, calendario único, controles 7/30 y barras/líneas, sin consultas adicionales al personalizar |

La prueba Chrome envía eventos reales de mouse mediante CDP y comprueba que Chrome emita `dragstart`/`drop`; no se sustituye el gesto por `dispatchEvent(new DragEvent(...))`. Se inspeccionaron capturas a 390, 768, 1440 y 1920 px, sin overflow. Se recorrieron 80 combinaciones de las cinco familias, Light/Dark/System (sistema claro y oscuro) y cuatro acentos. Se verificó pausa del hero con Reduce Motion, visibilidad simulada de la pestaña y desplazamiento fuera del viewport.

Los datos y las cuentas son fixtures del contrato, no una sesión con datos personales del backend. No hubo escrituras en PostgreSQL. Queda como comprobación manual el gesto con touchpad físico y tecnología asistiva; el arrastre probado es de mouse automatizado en Chrome. No se modifican servicios, estadísticas, autenticación, Focus, Mobile ni infraestructura.

## Capturas

| Vista | Antes | Después |
| --- | --- | --- |
| Dashboard 1440 | [Antes](images/final-ui-f3/before-dashboard-1440.png) | [Después](images/final-ui-f3/after-dashboard-1440.png) |
| Personalización 1440 | [Bloque inline](images/final-ui-f3/before-customize-1440.png) | [Modal](images/final-ui-f3/after-modal-1440.png) |

[Destino de arrastre](images/final-ui-f3/after-drag-destination.png) · [Calendario](images/final-ui-f3/after-calendar.png) · [Modal Lavender Dark](images/final-ui-f3/after-modal-lavender-dark.png).

Responsive: [Dashboard 390](images/final-ui-f3/after-dashboard-390.png), [768](images/final-ui-f3/after-dashboard-768.png), [1920](images/final-ui-f3/after-dashboard-1920.png); [modal 390](images/final-ui-f3/after-modal-390.png), [768](images/final-ui-f3/after-modal-768.png), [1920](images/final-ui-f3/after-modal-1920.png). Todas las capturas contienen datos sintéticos identificables.

## Archivos y Git

- `frontend-web/src/pages/Dashboard.tsx`
- `frontend-web/src/components/dashboard/CustomizeDashboard.tsx`
- `frontend-web/src/components/dashboard/cozy-dashboard.css`
- `frontend-web/src/components/environment/study-environment.css`
- `frontend-web/src/features/dashboard/widgetPreferences.ts`
- `frontend-web/src/hooks/useWidgetReorder.ts`
- `frontend-web/tests/dashboardCustomization.browser.mjs`
- `frontend-web/tests/dashboardWidgets.browser.mjs` (entrada de la revisión Web, actualizada al flujo F3)
- `frontend-web/tests/dashboardWidgets.test.mjs`
- `frontend-web/tests/dashboardRendering.test.mjs`
- Este informe y 14 capturas en `docs/images/final-ui-f3/`.

Commit local: `feat(web): improve dashboard widget customization`. Consultar hash con `git log -1 --format='%h %s' -- docs/final-ui-f3-dashboard.md`; se informa también en la entrega. Staging explícito, cambios ajenos y recursos históricos excluidos. Sin push, merge, amend ni operaciones destructivas. F3 termina aquí.
