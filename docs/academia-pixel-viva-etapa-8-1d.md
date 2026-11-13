# Etapa 8.1d — Paridad visual Mobile

12 de noviembre de 2026. Rama `feat/ui-ux-web-mobile`, HEAD `765c005`. El usuario aprobó explícitamente la propuesta Web de 8.1c antes de empezar Mobile. **Revisión visual Mobile aprobada por el usuario; autorizado su registro separado antes de 8.2.**

## Estado recuperado y alcance

Se revisaron rama, status, últimos commits, diff de los componentes involucrados, AGENTS.md, documentación y capturas finales de 8.1c. Los cambios Web continúan sin registrar y se han conservado byte por byte. También se contrastaron por SHA-256 los 16 elementos ajenos con `.local/stage81b/baseline.json`. No se reconstruyó 8.1c ni se modificaron Login/Register.

## Dashboard

- Se sustituyó la miniatura independiente de 8.1 por un hero integrado: panorama completo en la franja superior y bienvenida/CTA dentro de la misma superficie. Es la adaptación vertical del hero Web estrecho, con el mismo campus, libros, lámpara, taza y gato.
- Mañana, tarde y noche reutilizan las ilustraciones aprobadas de Web, sin nuevas escenas ni generación de imágenes. `useStudyPeriod` conserva el horario local y la actualización al recuperar foco/foreground.
- Los cuatro indicadores originales preceden al gráfico. A 390 y 768 px forman dos columnas; a 320 px se apilan para preservar texto y accesibilidad. No cambió ninguna fórmula: minutos y sesiones de `verifiedPeriod`, promedio sobre todos los días del período y racha registrada con su aclaración histórica.
- Study Activity mantiene barras/líneas, 7/30, tabla diaria y estados loading/empty/error/retry. No añade consultas: comparte el snapshot existente.
- Metas activas, Study Journey y actividad reciente siguen el orden de la propuesta Web. El calendario mensual y Activity/Goals/Together/History permanecen en el flujo existente de «Explore study details», sin inventar progreso o logros.
- Las tarjetas y sus superficies internas usan lavanda luminoso con tinta oscura. El fondo exterior mantiene la apariencia elegida. Los acentos se adaptan para conservar contraste en las tarjetas claras.

## Focus Studio

Se eliminaron `FocusEnvironment`, la habitación y el switch exclusivo Study ambience. El temporizador conserva su contenedor circular con ancho/alto iguales, ajuste al ancho disponible, fases, Settings, Start/Pause/Resume/Reset y progreso real. Now Playing, objetivo y los doce soundscapes permanecen disponibles. Las superficies son lavanda oscuro en Dark y claras en Light.

Sólo cambió presentación: no se editaron motores de tiempo/audio, UUID, preferencias de duración, recuperación, outbox, sesiones, ledger, servicios ni contratos. No hay animaciones ambientales en Focus.

## Recursos y rendimiento

`frontend-mobile/assets/environments/` contiene cuatro PNG locales de 1086 × 362 px:

| Archivo | Bytes |
| --- | ---: |
| academy-pixel-morning.png | 531782 |
| academy-pixel-afternoon.png | 537997 |
| academy-pixel-night.png | 515342 |
| academy-pixel-static.png | 537997 |

Se derivaron con reducción exacta 2:1 y vecino más cercano de los originales Web de 2172 × 724 para conservar los píxeles. El fallback corresponde al panorama estático aprobado. Se requieren localmente; no necesitan un proveedor externo ni credenciales. Las tres capas de ventana reutilizan la misma fuente seleccionada, no son descargas separadas.

Movimiento mediante Animated nativo: desplazamiento muy leve dentro de las ventanas y vapor de la taza. Se detiene al perder foco, entrar en background, activar Reduce Motion global/dispositivo, recibir advertencia de memoria o fallar la imagen. Se limpian listeners y animaciones al desmontar; el listener de memoria es opcional en React Native Web. Los recursos estáticos siguen visibles sin animación. No se instalaron dependencias.

Se reutiliza el proveedor de apariencia existente. Los componentes compartidos admiten una paleta visual opcional; sus valores por defecto y acciones permanecen iguales para las otras pantallas. No hay un segundo sistema de preferencias.

## Capturas y comparación

Las capturas proceden de **Chrome headless ejecutando la exportación React Native Web con API simulada**. Los números pertenecen a fixtures de prueba; no son datos del PostgreSQL habitual. No constituyen una comprobación de Android físico.

| Vista | Web aprobado | Mobile |
| --- | --- | --- |
| Dashboard 390 | [Web](images/academia-pixel-viva-8-1c/after-web-dashboard-390.png) | [Mobile](images/academia-pixel-viva-8-1d/dashboard-390.png) |
| Dashboard 768 | [Web](images/academia-pixel-viva-8-1c/after-web-dashboard-768.png) | [Mobile](images/academia-pixel-viva-8-1d/dashboard-768.png) |
| Dashboard 320 | Referencia vertical de Web 390 | [Mobile](images/academia-pixel-viva-8-1d/dashboard-320.png) |
| Focus 390 | [Web](images/academia-pixel-viva-8-1c/after-web-focus-studio-390.png) | [Dark/Mint](images/academia-pixel-viva-8-1d/focus-studio-dark-mint-390.png) · [Light/Orange](images/academia-pixel-viva-8-1d/focus-studio-390.png) |
| Focus 768 | [Web](images/academia-pixel-viva-8-1c/after-web-focus-studio-768.png) | [Mobile](images/academia-pixel-viva-8-1d/focus-studio-768.png) |
| Focus 320 | Referencia vertical de Web 390 | [Mobile](images/academia-pixel-viva-8-1d/focus-studio-320.png) |

Más vistas: [Activity](images/academia-pixel-viva-8-1d/dashboard-activity-390.png), [Journey/metas/recientes](images/academia-pixel-viva-8-1d/journey-390.png), [soundscapes](images/academia-pixel-viva-8-1d/focus-soundscapes-390.png), [mañana](images/academia-pixel-viva-8-1d/dashboard-morning.png), [tarde](images/academia-pixel-viva-8-1d/dashboard-afternoon.png), [noche](images/academia-pixel-viva-8-1d/dashboard-night.png), [fallback](images/academia-pixel-viva-8-1d/dashboard-static-fallback.png). La carpeta incluye las doce apariencias de cada pantalla.

Se inspeccionaron las capturas a 320/390/768: no hay scroll horizontal de página ni superposiciones de controles. Se mantienen los carruseles/gráficos desplazables que forman parte de sus controles existentes. Mobile conserva su encabezado nativo, navegación y orden vertical; no copia la cuadrícula de escritorio.

## Verificación

Logs locales ignorados: `.local/stage81d/`.

- `npm run lint`: aprobado (`lint.log`).
- `npx tsc --noEmit`: aprobado (`types.log`).
- `npx expo export --platform all --output-dir .expo/integration-export`: aprobado para Android, iOS y Web (`export.log`). Se repitió después de los últimos cambios visuales.
- Nueve archivos de pruebas dirigidas aprobados: `dashboardActivity`, `dashboardRendering`, `focusTimer`, `focusAudioLifecycle`, `focusGoalTracking`, `focusSessionId`, `focusStudioRendering`, `mobileAppearanceRendering`, `profileRendering`. Los dos archivos de renderizado directamente modificados se repitieron tras terminar, junto con las regresiones de controles compartidos. Logs `tests.log` y `final-rendering.log`.
- `node tests/studyEnvironment.browser.mjs`: aprobado (`browser.log`). Verifica tres anchos, tres franjas, doce apariencias en cada pantalla, transformaciones reales, pausa/reanudación en background, Reduce Motion del sistema y de Settings, fallo real de carga/fallback, una petición de estadísticas por período, 7/30, barras/líneas, acceso a las cuatro vistas de Journey, fases del timer, foco de Settings y ausencia de escena visible en Focus. Expo Router puede conservar Dashboard montado pero oculto; la comprobación distingue la ruta visible.
- `node tests/mobileDashboard.browser.mjs`: aprobado (`dashboard-browser.log`), incluidos cero/error/retry, contrato verificado ausente, consultas retrasadas y paginación de metas, calendario mensual, navegación, temas y responsive.
- Regresiones de métricas: no se sustituyen datos verificados por históricos, y los estados vacío/error/contrato ausente conservan sus mensajes y retry.
- `git diff --check`: aprobado.

Durante el recorrido se detectó y corrigió la limpieza no opcional del listener `memoryWarning` del nuevo hero, que React Native Web no proporciona. También se ajustaron las expectativas visuales del helper de galería a las nuevas superficies. No se modificó la autenticación ni la navegación para resolver las pruebas.

## Límites y comprobación en Expo Go

No se accedió a un teléfono Android. En React Native Web, el almacenamiento documental nativo del outbox puede mostrar «Recording recovery unavailable»; es una limitación de esa previsualización y no se ocultó ni se cambió el mecanismo de recuperación. La exportación Android comprueba el bundle, no sustituye la ejecución en Expo Go.

Verificar manualmente en Expo Go:

1. Abrir Dashboard con sesión habitual; comprobar imágenes y datos reales, desplazamiento, CTA, cuadrícula y acceso a Journey/historial.
2. Cambiar Dark/Light/System y las cuatro paletas; activar Reduce Motion y volver con Back. Comprobar la actualización del modo System con el tema del dispositivo.
3. Enviar la app a background y volver; confirmar pausa/reanudación y franja horaria correcta.
4. Abrir Focus: círculo redondo, sin habitación ni switch, Settings y teclado/Back correctos. Probar Start/Pause/Reset sin cambiar los ajustes previos.
5. Probar Now Playing y los doce sonidos, selección de objetivo, restauración y envío de sesiones en el flujo habitual. No se generaron sesiones ni escrituras reales durante la verificación automatizada.
6. Comprobar escalado de texto, lector de pantalla y orientación en el dispositivo.

## Archivos de esta entrega

- `frontend-mobile/src/app/(app)/(main)/{dashboard,focus-studio}.tsx`.
- `src/components/academic/workspacePalette.ts`.
- `src/components/environment/StudyEnvironment.tsx`.
- `src/components/dashboard/{DashboardActivity,DashboardContext,ActivityPlot,RecordedCalendar}.tsx`.
- `src/components/focus/{FocusTimerPanel,FocusSoundCarousel,FocusInsightsMobile,StudyAnalyticsDetails}.tsx`.
- `src/components/study/{BarChart,MetricCard}.tsx` y `src/components/ui/{ActionButton,SegmentedControl,StatusMessage}.tsx`: paleta opcional, sin cambios de acciones.
- `frontend-mobile/tests/{dashboardRendering.test,focusStudioRendering.test,studyEnvironment.browser}.mjs` y `tests/helpers/academicGallery.mjs`.
- Los cuatro PNG de `frontend-mobile/assets/environments/`.
- Este documento y `docs/images/academia-pixel-viva-8-1d/`.

Sin commit ni staging. Web aprobado y 16 elementos ajenos preservados. Sin cambios en backend, PostgreSQL, Docker, AWS, archivos privados o dependencias. Se detiene para revisión visual; no comienza 8.2 ni widgets personalizables.
