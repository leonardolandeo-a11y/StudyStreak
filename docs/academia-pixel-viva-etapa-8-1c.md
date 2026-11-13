# Etapa 8.1c — Recuperación y propuesta Web

Rama `feat/ui-ux-web-mobile`, HEAD `765c005`. **Diseño Web aprobado explícitamente por el usuario; autorizado su registro separado antes de 8.2.** Esta propuesta sustituye el diseño de 8.1b en Dashboard/Focus Web. No comienza Mobile.

## Trabajo recuperado después del reinicio

Se inspeccionaron rama, últimos seis commits, status, diff completo, diff cached y archivos nuevos. No existen commits parciales de 8.1b/8.1c. Se conservaron:

- El nuevo panorama pixel art original, sus variantes mañana/tarde/noche y el fallback local. Los originales de 2172 × 724 px sobrevivieron en `.local/stage81c/art-sources/`; no fue necesario volver a generarlos.
- Hero integrado, bienvenida/CTA a la izquierda y campus, escritorio, libros, taza y gato hacia centro/derecha.
- Fila de métricas y cuadrícula de Study Activity, metas activas y calendario. Study Journey y actividad reciente quedan debajo.
- Retirada de la habitación y del control Study ambience de Focus. Pomodoro circular centrado, Settings, Now Playing, metas y los 12 soundscapes conservados.
- Tokens lavanda locales, animación del hero con pausa y las capturas anteriores/posteriores.
- Recursos y documentación de 8.1b conservados como antecedentes; el Dashboard actual usa únicamente los nuevos `academy-pixel-*`.

Los logs de `/tmp` no sobrevivieron. Había constancia conversacional de una primera pasada visual aprobada, pero no un resultado final durable de la última compilación/suite. Se repitieron las comprobaciones necesarias y ahora sus logs quedan en `.local/stage81c/verification/`.

## Qué faltaba y qué se completó ahora

1. Se volvieron a ejecutar ESLint, TypeScript, build y pruebas dirigidas del código recuperado.
2. Se corrigió una carrera del test visual: cambiar a 30 días actualiza la etiqueta antes de que se observe la petición HTTP. El test ahora espera la solicitud antes de contarla; no se modificó el cliente API ni la carga de datos.
3. Una regresión visual existente detectó que las tarjetas internas de Study Journey tenían exactamente la misma superficie que su contenedor. Se añadió un tono lavanda diferenciado, acotado a `.study-analytics`, sin bloques negros ni cambios en métricas.
4. Se repitieron sólo los dos archivos afectados después de esas correcciones. Se regeneraron las capturas, incluida una captura completa del Dashboard a 1920 px que muestra la zona inferior.
5. Se inspeccionaron las imágenes y se completó este registro. No se reconstruyeron componentes terminados ni se generaron ilustraciones nuevas tras el reinicio.

## Composición y datos

Dashboard amplía su contenedor sólo en esta ruta para permitir tres widgets en escritorio. El orden es hero → cuatro métricas originales → Study Activity/metas/calendario → Study Journey/actividad reciente. A 768 px la cuadrícula se adapta; a 390 px se apila y el hero muestra el panorama completo en una franja superior para conservar el gato y los objetos.

Se mantiene un único snapshot de `/api/focus-sessions/stats` por período. Las métricas siguen siendo tiempo verificado, sesiones verificadas, promedio diario y racha registrada, con sus aclaraciones existentes. No se añadieron porcentajes, comparaciones, XP o hitos ficticios.

El calendario reutiliza `RecordedCalendar` y las fechas reales de `activity`. Se muestra fuera de Study Journey cuando existen datos y se sustituye su copia en Activity por un enlace al calendario superior. La navegación mensual, selección de días y leyenda se conservan. No se rellenan fechas ausentes. Las pestañas Activity/Goals/Together/History y sus estadísticas siguen accesibles.

Las metas activas conservan targets, detalle y enlaces a registros. No se dibujan barras de progreso como las de la maqueta: esos objetos no proporcionan un porcentaje de avance equivalente. Study Journey conserva totales e historial, sin convertirlos en un recorrido de logros.

Focus vuelve a ser una herramienta limpia. Sólo cambió la composición JSX y su presentación; no se tocaron audio, Pomodoro, UUID, outbox, ledger, llamadas API ni preferencias del temporizador.

## Dirección artística y recursos

Antes del reinicio se aplicó la skill `imagegen` mediante la herramienta integrada, usando la primera imagen aprobada como referencia de estilo y las capturas actuales como contexto. Se generó una ilustración independiente, sin UI incrustada, con formas escalonadas, colores pastel y objetos originales. Se editaron iluminación/exterior para mañana y noche, preservando geometría.

Recursos finales locales, sin red externa en producción:

- `frontend-web/public/environments/academy-pixel-afternoon.webp`: 1.521.756 bytes.
- `frontend-web/public/environments/academy-pixel-morning.webp`: 1.512.552 bytes.
- `frontend-web/public/environments/academy-pixel-night.webp`: 1.435.812 bytes.
- `frontend-web/public/environments/academy-pixel-static.png`: fallback estático.

Los WebP son sin pérdida y no amplían los originales. Sólo se carga la variante horaria necesaria; el mismo archivo se reutiliza para las capas de ventana. Nubes, paisaje, vapor e iluminación animan únicamente el hero. Reduce Motion global/sistema, background y salida del viewport pausan el movimiento; los observadores se limpian al desmontarse. Sin dependencias nuevas ni animación continua en métricas/gráficos.

Prompts utilizados antes del reinicio, conservando su intención y restricciones:

- **Maestro:** ilustración original panorámica 3:1, referencia principal pixel art lavanda aprobado; ninguna UI, texto ni captura incrustada; píxeles cuadrados, contornos ciruela, pequeñas rampas de color; habitación estilizada, región izquierda tranquila, campus al atardecer en ventana amplia, escritorio, libros, libreta, taza con símbolo de café, lámpara cálida, plantas y gato crema/naranja dormido. Sin realismo, pintura digital, ruido, texturas fotográficas ni sprites protegidos.
- **Noche:** editar sólo hora/iluminación; idénticos objetos, posición y retícula; cielo índigo, estrellas y luna pixeladas, campus y lámpara iluminados, región izquierda ciruela. Sin recomponer, recortar ni añadir UI.
- **Mañana:** editar sólo hora/iluminación; idéntica composición y geometría; cielo azul/melocotón, nubes crema, luz suave y lámpara apagada. Conservar sombreado por píxeles, taza y gato; sin realismo, texto ni objetos nuevos.

## Capturas finales

Chrome headless, API simulada con fixtures exclusivamente de prueba. **No representan métricas de una cuenta habitual ni una prueba en Android físico.** Las capturas previas de 8.1b sobrevivieron y no se sobrescribieron.

| Vista | Antes | Propuesta actual |
| --- | --- | --- |
| Dashboard, 1440 | [Antes](images/academia-pixel-viva-8-1c/before-web-dashboard-1440.png) | [Después](images/academia-pixel-viva-8-1c/after-web-dashboard-1440.png) |
| Dashboard, 1920 | [Antes](images/academia-pixel-viva-8-1c/before-web-dashboard-1920.png) | [Completo](images/academia-pixel-viva-8-1c/after-web-dashboard-1920-full.png) |
| Dashboard, 768 | [Antes](images/academia-pixel-viva-8-1c/before-web-dashboard-768.png) | [Después](images/academia-pixel-viva-8-1c/after-web-dashboard-768.png) |
| Dashboard, 390 | [Antes](images/academia-pixel-viva-8-1c/before-web-dashboard-390.png) | [Después](images/academia-pixel-viva-8-1c/after-web-dashboard-390.png) |
| Focus, 1440 | [Antes](images/academia-pixel-viva-8-1c/before-web-focus-studio-1440.png) | [Después](images/academia-pixel-viva-8-1c/after-web-focus-studio-1440.png) |
| Focus, 1920 | [Antes](images/academia-pixel-viva-8-1c/before-web-focus-studio-1920.png) | [Después](images/academia-pixel-viva-8-1c/after-web-focus-studio-1920.png) |
| Focus, 768 | [Antes](images/academia-pixel-viva-8-1c/before-web-focus-studio-768.png) | [Después](images/academia-pixel-viva-8-1c/after-web-focus-studio-768.png) |
| Focus, 390 | [Antes](images/academia-pixel-viva-8-1c/before-web-focus-studio-390.png) | [Después](images/academia-pixel-viva-8-1c/after-web-focus-studio-390.png) |

Variantes: [mañana](images/academia-pixel-viva-8-1c/after-web-dashboard-morning.png), [tarde](images/academia-pixel-viva-8-1c/after-web-dashboard-afternoon.png), [noche](images/academia-pixel-viva-8-1c/after-web-dashboard-night.png), [Light/Orange](images/academia-pixel-viva-8-1c/after-web-dashboard-light-orange.png).

Comparación visual con la referencia aprobada: se recuperan el escenario claramente pixelado, el gato, los pasteles, las superficies luminosas, las métricas horizontales y la organización de widgets. Se conserva la identidad y estructura funcional propia: calendario mensual en vez de una rejilla anual nueva, metas con targets reales en vez de porcentajes inventados y Study Journey estadístico en vez de hitos. El diseño fue aprobado explícitamente por el usuario antes de adaptar Mobile.

## Pruebas

- ESLint: aprobado; log `verification/lint.log`.
- TypeScript `tsc -b`: aprobado; log `verification/types.log` y también dentro del build.
- Build Web: aprobado; log `verification/build.log`. Persiste la advertencia conocida del chunk Study Rooms de 563,87 kB, ajeno al cambio.
- Suite dirigida de 39 tests: `dashboardRendering`, `focusStudioRendering`, `studyEnvironment`, `authScenes`, `pomodoroState`, `pomodoroGoalTracking`, `noiseSynthesis`, `studySurfaceHotfix`. Primera ejecución: 37 aprobados y los dos pendientes descritos arriba. Después de corregirlos, los dos archivos afectados pasaron completos (`verification/final-directed.log`); los otros 37 ya habían pasado.
- Chrome comprueba los cuatro anchos, filas/orden de widgets, calendario único, una consulta de estadísticas por período, 7/30 y barras/líneas, las pestañas de Study Journey, las tres franjas, las doce combinaciones de temas/paletas, Reduce Motion, pausa en background/fuera del viewport y movimiento real de las capas. Focus se comprueba sin escena/control de ambientación, con círculo y fases correctas.
- Las regresiones existentes verifican autenticación, modalidades de foco, ajustes/foco de teclado, ciclos, síntesis de sonido y gráficos con cero/pocos/muchos datos. Todo con mocks, sin escrituras sobre PostgreSQL persistente.

## Archivos de la propuesta

- `frontend-web/src/pages/Dashboard.tsx`.
- `frontend-web/src/components/dashboard/{DashboardContext,DashboardMetrics,FocusInsights,FocusStudio,RecordedCalendar,StudyAnalyticsDetails}.tsx`.
- `frontend-web/src/components/dashboard/cozy-dashboard.css`.
- `frontend-web/src/components/environment/{StudyEnvironment,PanoramicScene}.tsx` y `study-environment.css`.
- `frontend-web/tests/studyEnvironment.test.mjs` y `tests/helpers/panoramicReview.mjs`.
- Los cuatro nuevos recursos `frontend-web/public/environments/academy-pixel-*`.
- Este documento y las capturas `docs/images/academia-pixel-viva-8-1c/`.

En esta reanudación sólo se ajustaron el helper de pruebas y el tono de superficies internas en `cozy-dashboard.css`, además de generar la documentación/capturas finales. El resto se recuperó sin reconstruirlo.

## Elementos ajenos preservados

Hashes contrastados con `.local/stage81b/baseline.json`:

```text
.env.docker.local.example
docs/desarrollo-local.md
AGENTS.md
config/application-local-existing.properties
docs/auditoria-paridad-web-mobile.md
docs/auditoria_post_sincronizacion_main.md
docs/backend-remoto.md
docs/google-books-local.md
docs/recomendaciones.md
docs/respaldo-local-2026-11-06.md
docs/rubrica.md
frontend-mobile/.env.example
frontend-mobile/tests/apiConfiguration.test.mjs
frontend-web/tests/apiConfiguration.test.mjs
package-lock.json
scripts/check-google-books.py
```

HEAD sigue en `765c005`, staging vacío. Sin commit, push, merge, amend, reset, clean, restore ni stash. Sin cambios en Mobile, Login/Register, backend, PostgreSQL, Docker, AWS, autenticación/API o motores de estudio. Se detiene aquí para aprobación visual.
