# Etapa 8.1 — Academia Pixel Viva

Rama: `feat/ui-ux-web-mobile`. Base: `6864e67`. Alcance: presentación de Dashboard y Focus Studio Web/Mobile. Se conservaron los 16 elementos ajenos iniciales, comprobando sus hashes antes de registrar la entrega.

## Resultado visible

**Dashboard:** la bienvenida incorpora la habitación académica de StudyStreak: ventana y paisaje, escritorio, libros, lámpara y taza con la marca original. En escritorio ocupa una columna de 360 × 210 px junto al saludo; a menos de 1050 px pasa debajo, con 155–170 px de alto. En Mobile ocupa 162 px bajo el encabezado. El gráfico verificado, 7/30, barras/líneas, métricas y Study Journey conservan componentes, datos y controles.

**Focus Studio:** el mismo espacio rodea el círculo, con una veladura de la superficie del tema y un centro opaco para mantener el contraste del tiempo. Los controles quedan fuera de la imagen. El nuevo checkbox/switch «Study ambience» permite ocultarla; es una preferencia visual de esa pantalla, sin escribir ni migrar preferencias de Focus. Ocultarla no desmonta el temporizador. Se conservan Pomodoro circular, Start/Pause/Reset, Settings, Now Playing, metas y los doce soundscapes.

No se crearon widgets, nuevos ambientes seleccionables ni pantallas. Login/Register mantiene exactamente sus componentes, recursos y composición aprobada.

## Recursos y horario

No hay ilustraciones duplicadas ni archivos gráficos de producción nuevos. Se reutiliza la fuente original `assets/auth/study-room.json`, la marca `assets/branding/coffee-mark.json`, los SVG/PNG de `frontend-web/public/auth/` y las texturas de `frontend-mobile/assets/auth/`, mediante los componentes existentes `StudyScene`, `sceneImages`, `useStudyPeriod` y `useAmbientMotion`.

| Hora local | Habitación |
| --- | --- |
| 05:00–11:59 | Mañana: cielo de amanecer, nubes y luz suave. |
| 12:00–17:59 | Tarde: cielo claro, paisaje y luz cálida. |
| 18:00–04:59 | Noche: lámpara cálida, luna y estrellas. |

El scheduler existente programa el siguiente límite, recalcula al volver a foreground y elimina listeners/timeouts al salir. No utiliza geolocalización, consultas API ni descargas gráficas externas. El tema de los controles sigue siendo independiente del horario del paisaje.

## Movimiento, accesibilidad y rendimiento

- Reutilizadas las capas originales: nubes (34 s por recorrido), paisaje (48 s), vapor (4,5 s), estrellas (8 s) y luz (18 s). Sólo hay una habitación por pantalla, sin animación ambiental añadida a las tarjetas.
- Web reutiliza CSS con transform/opacity. `IntersectionObserver` pausa las capas cuando la escena sale del viewport; el hook existente pausa por visibilidad, movimiento reducido global/sistema y dispositivos limitados. Se limpia el observador al desmontarse.
- Mobile reutiliza Animated con driver nativo y `isInteraction:false`. `useFocusEffect`/`AppState` detienen y limpian los bucles al perder foco o entrar en background. Se conservan las restricciones existentes por memoria y memoryWarning.
- Entrada ambiental de 600 ms: CSS sólo en escena visible/activa y Animated sólo en foreground. La transición no afecta al texto ni al círculo. Se detiene en background y se omite con Reduce Motion.
- Reduce Motion global o del dispositivo muestra la habitación estática. Ante fallo de la imagen base se utiliza el fallback PNG existente. Se probó en Web mediante error de imagen y en React Native Web bloqueando realmente la carga del PNG base en Chrome.
- La ilustración es decorativa, queda fuera del árbol accesible y no intercepta pulsaciones. Checkbox etiquetado y con foco visible; switch nativo accesible. Se comprobó Space para activar/desactivar y que el mismo nodo del temporizador permanece montado.
- Sin dependencias nuevas, timers por frame en React, cambios en audio, nuevos proveedores o solicitudes de estadísticas. Las capturas y recorridos no son mediciones de FPS, batería o consumo en teléfono físico.

## Comparativas

Capturas de Chrome headless con API simulada; no son imágenes de Android físico. Se capturó el estado previo antes de editar los componentes. Los datos y dimensiones de referencia son los mismos.

| Vista | Antes | Después |
| --- | --- | --- |
| Dashboard Web, 1440 px | [Antes](images/academia-pixel-viva-8-1/before-web-dashboard.png) | [Mañana](images/academia-pixel-viva-8-1/after-web-dashboard-morning.png) |
| Focus Web, 1440 px | [Antes](images/academia-pixel-viva-8-1/before-web-focus-studio.png) | [Noche](images/academia-pixel-viva-8-1/after-web-focus-studio-night.png) |
| Dashboard React Native Web, 390 px | [Antes](images/academia-pixel-viva-8-1/before-mobile-dashboard.png) | [Mañana](images/academia-pixel-viva-8-1/after-mobile-dashboard-morning.png) |
| Focus React Native Web, 390 px | [Antes](images/academia-pixel-viva-8-1/before-mobile-focus-studio.png) | [Noche](images/academia-pixel-viva-8-1/after-mobile-focus-studio-night.png) |

También se incluyen variantes `afternoon`/`night`/`morning`, vistas a `320` y ejemplos `light-orange` de ambos módulos/plataformas en la misma carpeta. Se inspeccionaron capturas de escritorio, teléfono, Light/Orange y la comparación previa del Pomodoro: círculo legible, sin controles encima de gráficos ni overflow de página.

## Verificación

- ESLint Web (`npm run lint`) y Mobile (`npm run lint`): aprobados.
- TypeScript: Web `tsc -b` (también dentro de build) y Mobile `tsc --noEmit`: aprobados.
- `npm run build` Web: aprobado. Permanece la advertencia conocida del chunk Study Rooms de 563,87 kB, ajeno a esta entrega.
- `node scripts/generate-auth-scenes.mjs --check`: aprobados los 38 recursos/módulos locales, sin regenerarlos ni cambiarlos.
- Web, 37 tests dirigidos aprobados: `authScenes`, `dashboardRendering`, `focusStudioRendering`, `pomodoroState`, `pomodoroGoalTracking`, `noiseSynthesis`. Se ejecutaron secuencialmente para evitar conflictos entre instancias Vite; el primer intento concurrente tuvo un timeout de Chrome. Se corrigió una expectativa antigua de `dashboardRendering` («Best study streak» → «Best recorded streak»), correspondiente al texto ya existente del hotfix, sin cambiar métricas.
- Nuevo recorrido Web `studyEnvironment.test.mjs`: aprobado. Incluye mañana/tarde/noche, movimiento efectivo del vapor, background/foreground, Reduce Motion del dispositivo y global, todas las combinaciones Dark/Light/System × Mint/Blue/Purple/Orange, cambio de tema del sistema, fallback estático, teclado, ocultación de la escena y conservación del nodo del temporizador.
- Mobile, 10 archivos de regresión aprobados: `authScenes`, `dashboardRendering`, `focusStudioRendering`, `focusTimer`, `focusCatalog`, `focusSoundSynthesis`, `focusGoalTracking`, `focusSessionId`, `focusAudioLifecycle`, `focusRecordingIntegration`.
- Nuevo recorrido `studyEnvironment.browser.mjs` sobre la exportación React Native Web: aprobado, con las mismas comprobaciones de períodos, movimiento, background, preferencias, fallback y teclado. Responsive comprobado en 320/390/768/1440 px y círculo cuadrado. Pruebas HTTP interceptadas: no hubo escrituras sobre cuentas o PostgreSQL habituales.
- Exportaciones Expo web, Android e iOS: aprobadas. Los bundles nativos se exportaron con dos workers, sin compilar un development build.

Comandos de los recorridos nuevos, desde cada frontend:

```sh
# frontend-web
node --test tests/studyEnvironment.test.mjs
# frontend-mobile, después de exportar web a .expo/integration-export
node tests/studyEnvironment.browser.mjs
```

`STUDY_ENV_BASELINE=1` captura sin exigir las escenas nuevas; `STUDY_ENV_CAPTURES` permite enviar artefactos a una carpeta temporal. El test Web queda integrado en `test:ui`.

## Archivos de esta entrega

- Web: `src/components/environment/StudyEnvironment.tsx`, `study-environment.css`, `src/pages/Dashboard.tsx`, `src/components/dashboard/FocusStudio.tsx`, `tests/studyEnvironment.test.mjs`, `tests/dashboardRendering.test.mjs`, `package.json` (sólo registrar el test).
- Mobile: `src/components/environment/StudyEnvironment.tsx`, `src/app/(app)/(main)/dashboard.tsx`, `src/components/focus/FocusTimerPanel.tsx`, `tests/studyEnvironment.browser.mjs`.
- Fixtures y recorrido compartido: `scripts/tests/studyEnvironmentFixture.mjs`, `scripts/tests/studyEnvironmentReview.mjs`.
- Este documento y `docs/images/academia-pixel-viva-8-1/*.png`.

No se modificaron los componentes de autenticación, motores de audio/Pomodoro, UUID, outbox, ledger, Goals Difficulty, API, permisos, servicios, temas globales, backend, PostgreSQL, Docker, AWS ni archivos privados.

## Git y pendientes físicos

Commit local de la entrega: `feat(ui): add cozy dynamic study environments`. El hash del commit que incorpora este documento se obtiene sin una referencia circular con:

```sh
git log -1 --format='%h %s' -- docs/academia-pixel-viva-etapa-8-1.md
```

El hash concreto se informa también en la entrega. Staging explícito, sin amend, reset, merge ni push. Los 16 elementos ajenos iniciales permanecen fuera del commit.

Pendiente en Expo Go Android real: abrir Dashboard/Focus a distintas densidades y con fuente ampliada; comprobar TalkBack y el switch; cambiar hora/franja local, reducir movimiento en Settings/dispositivo, mandar la app a background y volver; confirmar suavidad, batería y audio durante una sesión autorizada. La exportación no acredita esos aspectos físicos. No se inicia la siguiente etapa.
