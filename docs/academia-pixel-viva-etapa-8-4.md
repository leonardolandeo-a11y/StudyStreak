# Etapa 8.4 — Pulido final de Academia Pixel Viva

Rama: `feat/ui-ux-web-mobile`. Punto inicial: `723c275`. Revisión y pruebas locales del 13 de noviembre de 2026.

## Recuperación y cierre de 8.3b

Se revisaron rama, historial, staging, diffs y archivos nuevos antes de editar. La aprobación explícita del usuario permitió registrar la entrega Mobile existente, sin reconstruirla:

- **`595507e` — `feat(mobile): add customizable illustrated study environments`.**
- Contiene exclusivamente componentes, preferencias, almacenamiento, PNG, pruebas y documentación de 8.3b. Conserva los pendientes Android físico de su documento.
- La implementación Web 8.3a, sus originales y sus capturas ya estaban sin commit. Se preservaron byte a byte y quedaron fuera de ambos commits de esta entrega. El resultado Web se verificó con esa implementación presente en el workspace; su registro independiente sigue pendiente.
- Se verificaron por SHA-256 los 16 elementos ajenos de la línea base: ninguno fue modificado ni incluido. También permanecen fuera los archivos previos de 8.1b.

## Problemas reproducidos y correcciones

| Caso | Antes | Después |
| --- | --- | --- |
| Un único widget Web | Activity ocupaba aproximadamente 66,2 % del ancho disponible a 1440 px y 66,4 % a 1920 px | Ocupa el 100 % a 390, 768, 1440 y 1920 px |
| Dos widgets Web | Los spans heredados producían columnas desiguales | Dos columnas iguales en escritorio; filas completas en anchos intermedios y pequeños |
| Reordenamiento rápido Web | Dos animaciones de posición simultáneas sobre un mismo widget | La limpieza cancela la animación anterior; máximo observado: una |
| Error de estadísticas con Activity oculto | Los resúmenes no ofrecían su propio reintento | Mensaje y botón `Retry study statistics`, reutilizando el mismo recurso y callback |
| Regreso de Settings en Mobile | `hydrate()` volvía a marcar el estado como no preparado y desmontaba la ilustración durante la lectura | Conserva el último panorama cargado hasta completar la lectura; mantiene las protecciones contra respuestas antiguas y cambios de cuenta |
| Resumen Mobile en tablet | Tres métricas repartidas en dos filas a 768 px | Tres métricas en una fila a partir de 700 px; distribución telefónica conservada |

El reintento aparece sólo si Activity está oculto y hay algún widget visible dependiente de esas estadísticas. Una pulsación produjo exactamente una nueva consulta; no se añadieron endpoints ni cargas por widget. El aviso conserva la superficie lavanda y no cambia el significado de los datos.

La hidratación inicial sigue esperando preferencias antes de mostrar la escena. Una relectura fallida conserva la selección disponible y comunica el error sin afirmar incorrectamente que se muestran valores predeterminados. El test nuevo falló contra el comportamiento anterior y pasa con la corrección.

## Dashboard y Appearance

Se conservó el hero aprobado y sus cuatro ambientes, sin cambiar imágenes, recortes, recursos originales ni su composición. Se revisaron lectura de la bienvenida, CTA, métricas, Activity, Goals, Journey, Recent Activity, Partners y Quick Focus. El orden DOM continúa siendo el orden de lectura y teclado, sin empaquetado que altere esa secuencia.

Settings ya ofrecía los controles necesarios y no necesitaba otro rediseño ni controles duplicados. Se verificaron:

- Dark / Light / System y Mint / Blue / Purple / Orange.
- Selección, vista previa y persistencia de los cuatro ambientes.
- Automatic: 05:00–11:59 Café, 12:00–17:59 Campus, 18:00–04:59 Night Desk. Library permanece como selección artística manual.
- Ambient movement independiente de Reduce Motion; la preferencia global y la del dispositivo tienen prioridad.
- Restore environment conserva apariencia y widgets; Restore appearance conserva ambiente y widgets; Restore layout conserva ambiente.
- Configuraciones inválidas, recarga, dos cuentas simuladas y regreso con Back.

El control de widgets continúa en Dashboard. No se duplicó en Settings. Las preferencias de ambientes y widgets siguen separadas por ID de cuenta y sin tokens ni datos privados; no se cambió el alcance existente de las preferencias globales de apariencia.

## Animaciones, recursos y Focus

La inspección y las pruebas existentes confirman pausa ambiental en background, al abandonar Dashboard y, en Web, fuera del viewport. Se verificó movimiento real de nubes/lluvia/estrellas, pausa estable, regreso al foreground y fallback estático ante una petición de imagen bloqueada. El driver nativo y las restricciones existentes para dispositivos con poca memoria permanecen intactos.

La única corrección de animación es cancelar los movimientos de widgets Web pendientes al reorganizar, desmontar o activar movimiento reducido. No se añadieron timers, listeners, dependencias ni cargas gráficas externas. No se realizó un perfil de CPU/GPU en Android físico.

Focus Studio no se modificó: permanece sin habitación, con Pomodoro circular, controles, Settings, Now Playing, Goal y catálogo de 12 soundscapes. Pasaron las regresiones de renderizado, temporizador, catálogo y ciclo de vida de audio, además de la navegación y revisión Chrome de Focus.

## Verificación ejecutada

Todas las interacciones con datos usaron fixtures/mocks aislados. No hubo escrituras sobre PostgreSQL ni cambios de backend o infraestructura.

| Comprobación | Resultado |
| --- | --- |
| ESLint Web y Mobile | Aprobado |
| TypeScript Web (`tsc -b`) y Mobile (`tsc --noEmit`) | Aprobado |
| Build Web (`npm run build`) | Aprobado; permanece el aviso existente de chunks mayores de 500 kB |
| Exportación Expo Web y Android | Aprobada en `.expo/integration-export`; no es una compilación nativa ni una prueba física |
| Modelos/renderizado Web: widgets, preferencias, actividad y Dashboard | Aprobados |
| Focus Web y apariencia global | Aprobados, incluyendo contraste, foco, teclado y rutas existentes |
| Mobile: 13 archivos de regresión dirigidos | Aprobados: preferencias, almacenamiento, widgets, apariencia, Dashboard, Focus, audio y temporizador |
| Chrome: nuevas regresiones `personalization.browser.mjs` Web/Mobile | Aprobadas: uno/dos widgets, error/reintento, reordenamiento, Back lento y restauraciones independientes |
| Chrome: revisión existente de widgets Web/Mobile | Aprobada: ocultar/reordenar, persistencia, dos cuentas, invalidación, controles de gráficos y teclado |
| Chrome: revisión existente de ambientes Web/Mobile | Aprobada: cuatro escenas, Automatic, 12 apariencias, movimiento, fallback, cuentas y navegación |
| Chrome: Dashboard/Focus Web y React Native Web | Aprobada: franjas, controles, movimiento y responsive |

La prueba antigua `appearance.test.mjs` tenía selectores ambiguos: el primer checkbox ahora es Ambient movement y el primer botón del sidebar es Collapse. Se sustituyeron por los nombres de Reduce Motion y Sign out. También se actualizaron sus expectativas de superficies y del título ilustrado para el diseño lavanda aprobado; no se modificaron estilos para satisfacer expectativas antiguas. Los primeros intentos fallidos quedaron registrados como diagnóstico, y la revisión final es la que se informa.

Comandos principales, desde cada frontend:

```sh
npm run lint
# Web:
npx tsc -b
npm run build
node --experimental-strip-types --test tests/dashboardWidgets.test.mjs tests/environmentPreferences.test.mjs tests/studyActivity.test.mjs tests/dashboardRendering.test.mjs
node --test --test-concurrency=1 tests/appearance.test.mjs tests/focusStudioRendering.test.mjs
node tests/personalization.browser.mjs
# Mobile:
npx tsc --noEmit
npx expo export --platform web --platform android --output-dir .expo/integration-export
node --experimental-strip-types --test tests/dashboardWidgets.test.mjs tests/dashboardWidgetStorage.test.mjs tests/environmentPreferences.test.mjs tests/environmentStorage.test.mjs tests/environmentRendering.test.mjs tests/dashboardActivity.test.mjs tests/dashboardRendering.test.mjs tests/appearanceState.test.mjs tests/mobileAppearanceRendering.test.mjs tests/focusStudioRendering.test.mjs tests/focusTimer.test.mjs tests/focusCatalog.test.mjs tests/focusAudioLifecycle.test.mjs
node tests/personalization.browser.mjs
```

Las revisiones existentes de widgets y ambientes se ejecutaron con capturas en `.local/stage84/`, conservando las evidencias anteriores. Los helpers admiten `STUDY_ENV_CAPTURES` cuando corresponde. El test Web 8.3a pendiente se ejecutó mediante una copia temporal con única sustitución del directorio de salida; su original y sus capturas permanecen intactos. Logs de diagnóstico y verificación en `.local/stage84/`.

## Capturas comparativas

Capturas Chrome con datos sintéticos, no estadísticas del usuario. Se inspeccionaron Dashboard y Settings en claro/oscuro; Web a 390/768/1440/1920 px y React Native Web a 320/390/768 px. Las imágenes anteriores y posteriores completas están en `docs/images/academia-pixel-viva-8-4/`.

| Pantalla | Antes | Después |
| --- | --- | --- |
| Web Dashboard oscuro | [Antes](images/academia-pixel-viva-8-4/before-web-dashboard-dark.png) | [Después](images/academia-pixel-viva-8-4/after-web-dashboard-dark.png) |
| Web Dashboard claro | [Antes](images/academia-pixel-viva-8-4/before-web-dashboard-light.png) | [Después](images/academia-pixel-viva-8-4/after-web-dashboard-light.png) |
| Web Settings oscuro | [Antes](images/academia-pixel-viva-8-4/before-web-settings-dark.png) | [Después](images/academia-pixel-viva-8-4/after-web-settings-dark.png) |
| Web Settings claro | [Antes](images/academia-pixel-viva-8-4/before-web-settings-light.png) | [Después](images/academia-pixel-viva-8-4/after-web-settings-light.png) |
| RN Web Dashboard oscuro | [Antes](images/academia-pixel-viva-8-4/before-mobile-dashboard-dark.png) | [Después](images/academia-pixel-viva-8-4/after-mobile-dashboard-dark.png) |
| RN Web Dashboard claro | [Antes](images/academia-pixel-viva-8-4/before-mobile-dashboard-light.png) | [Después](images/academia-pixel-viva-8-4/after-mobile-dashboard-light.png) |
| RN Web Settings oscuro | [Antes](images/academia-pixel-viva-8-4/before-mobile-settings-dark.png) | [Después](images/academia-pixel-viva-8-4/after-mobile-settings-dark.png) |
| RN Web Settings claro | [Antes](images/academia-pixel-viva-8-4/before-mobile-settings-light.png) | [Después](images/academia-pixel-viva-8-4/after-mobile-settings-light.png) |
| Web un widget, 1440 px | [Antes](images/academia-pixel-viva-8-4/before-web-single-1440.png) | [Después](images/academia-pixel-viva-8-4/after-web-single-1440.png) |
| Mobile resumen, 768 px | [Antes](images/academia-pixel-viva-8-4/before-mobile-summary.png) | [Después](images/academia-pixel-viva-8-4/after-mobile-summary.png) |
| Mobile Back, lectura pendiente | [Antes](images/academia-pixel-viva-8-4/before-mobile-back-pending.png) | [Después](images/academia-pixel-viva-8-4/after-mobile-back-pending.png) |
| Error con gráfico oculto | [Web antes](images/academia-pixel-viva-8-4/before-web-hidden-chart-error.png) | [Web después](images/academia-pixel-viva-8-4/after-web-hidden-chart-error.png) |

Los archivos `after-{web,mobile}-{campus,library,night,cafe}-hero.png` muestran los cuatro ambientes revisados, conservando sus recursos originales.

## Archivos de 8.4

Código:

- `frontend-web/src/pages/Dashboard.tsx`.
- `frontend-web/src/components/dashboard/cozy-dashboard.css`.
- `frontend-mobile/src/app/(app)/(main)/dashboard.tsx`.
- `frontend-mobile/src/components/dashboard/DashboardActivity.tsx`.
- `frontend-mobile/src/features/environment/environmentPreferences.ts`.

Pruebas/evidencias:

- `frontend-web/tests/appearance.test.mjs`.
- `frontend-web/tests/personalization.browser.mjs`.
- `frontend-mobile/tests/personalization.browser.mjs`.
- `frontend-mobile/tests/environmentPreferences.test.mjs`.
- `frontend-mobile/tests/environmentSettings.browser.mjs`.
- `frontend-mobile/tests/studyEnvironment.browser.mjs`.
- `scripts/tests/personalizationReview.mjs`.
- `scripts/tests/dashboardWidgetsReview.mjs`.
- Este documento y `docs/images/academia-pixel-viva-8-4/`.

## Pendientes y cierre Git

Pendiente en Expo Go/Android físico: repetir Dashboard → Settings → Back sin parpadeo; reiniciar la app y comprobar preferencias con dos cuentas autorizadas; probar los cuatro ambientes, tamaño de fuente del sistema, TalkBack, SafeArea, controles táctiles, Reduce Motion del dispositivo y background/foreground. Comprobar Focus/audio al volver desde Settings y observar fluidez/memoria en un equipo de recursos limitados. La exportación Android y las pruebas RN Web no sustituyen estas verificaciones.

8.4 se registra en un commit independiente titulado **`fix(ui): polish dashboard personalization and lifecycle`**. Su hash se obtiene con `git log -1 --format=%h -- docs/academia-pixel-viva-etapa-8-4.md` y se informa en la entrega. Staging explícito, sin incluir Web 8.3a ni los 16 elementos ajenos. El estado final conserva esos cambios preexistentes sin commit; no se declara un árbol limpio. Sin reset, clean, amend, merge ni push. Se detiene el trabajo al cerrar 8.4.
