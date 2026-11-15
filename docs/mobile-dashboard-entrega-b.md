# Mobile — Entrega B: Dashboard de actividad verificada

Rama `feat/ui-ux-web-mobile`. Parte de la navegación A en `26f8694`, conservando apariencia 6.2b y sesión 6.2a. Referencia funcional: Dashboard Web y [auditoría de paridad](auditoria-paridad-web-mobile.md). No se modifica Web ni se importa código DOM/CSS en runtime nativo.

## Datos, métricas y presentación

`/dashboard` sustituye la ruta preparada en A por una pantalla real. Consulta `GET /api/focus-sessions/stats?days=7|30` mediante el cliente autenticado y valida exclusivamente `verifiedPeriod`: ventana solicitada, número de días, fechas válidas/consecutivas, valores finitos/no negativos, sesiones enteras y suma coherente. Comparte reglas y tolerancia numérica con Web. No utiliza `periodMinutes`, `totalMinutes`, `daily` histórico o el historial paginado para construir cifras verificadas. La declaración aditiva del DTO no cambia el comportamiento de Focus Studio.

El gráfico permite **Bars / Lines** y **7 / 30 days**, conserva el tipo al cambiar período y ofrece refresh, loading, empty, error y retry. Un contrato verificado ausente o inconsistente se muestra como no disponible, nunca como cero ni como histórico. Los días vacíos sí son ceros cuando el servidor entrega un período completo válido.

Se usan exclusivamente vistas, texto, ScrollView y transformaciones de React Native: barras y segmentos de línea comparten coordenadas/escala. No se añade SVG, librería de gráficos o animación. La ventana larga tiene scroll horizontal para mantener etiquetas legibles de 12 sp, eje en minutos y fechas de calendario sin desplazamiento de zona horaria. Hay resumen accesible y lista diaria desplegable de minutos/sesiones. El gráfico no anima; respeta movimiento reducido sin una variante visual distinta.

Las tarjetas se apilan, con alturas determinadas por contenido:

| Tarjeta | Regla conservada de Web |
| --- | --- |
| Verified focus | `verifiedPeriod.minutes`, confirmados en 7/30 días. |
| Completed sessions | `verifiedPeriod.sessions`, sesiones individuales y de grupo verificadas. |
| Daily average | Minutos verificados / todos los días de la ventana, incluidos días sin actividad. |
| Current study streak | `studyStreak` del servidor; incluye días completados históricos y es independiente de la ventana. No se denomina racha verificada. |

Las metas activas reutilizan `listActiveFocusGoals`, recorriendo todas las páginas del endpoint existente de metas propias. Se muestran hasta tres, con objetivos de frecuencia/duración, total activo y navegación a detalle/registros o lista completa.

La actividad reciente consulta por separado `GET /api/study/history?from=...&to=...&page=0`, muestra hasta cuatro intentos, su estado y minutos guardados; distingue Historical/unverified, Individual y Group. Sus fechas corresponden al **inicio**, mientras el gráfico agrega por **finalización**, como Web. No se deduce un ID de meta a partir del nombre: para explorar sesiones se enlaza a Focus Studio, donde ya existe historial. Ambas secciones tienen loading/empty/error/retry independientes del gráfico.

## Ciclo de vida y seguridad

`useFocusedResource` cancela al cambiar filtro, perder foco o desmontarse, y vincula cada resultado a su loader e intento de carga. Un resultado viejo no se presenta como perteneciente al filtro nuevo. Se vuelve a consultar al regresar a Dashboard; no se añade polling ni heartbeat. El árbol autenticado de A permanece separado por cuenta y todos los servicios reutilizan Bearer/refresh existentes.

La prueba Chrome detectó que la primera versión del retry quedaba en loading sin emitir otra solicitud en la aplicación compilada. Se corrigió usando el número de intento como parte observable del resultado, en lugar de una dependencia sin uso efectivo. La regresión verifica múltiples refresh/retry reales y una respuesta de 7 días retrasada que no debe sobrescribir 30 días.

## Verificación final

- ESLint: **OK**, sin advertencias. TypeScript `--noEmit --incremental false`: **OK**.
- Suite `node --experimental-strip-types --test tests/*.test.mjs`: **18 archivos aprobados**, 0 fallos. Siete casos nuevos: cuatro de validación/precisión/geometría y tres de renderizado/estados, incluyendo los ocho temas/paletas.
- Exportación Expo web con Metro y React Compiler: **OK**, sin instalar dependencias. No es un build nativo ni certificación en teléfono.
- Chrome, con todas las peticiones externas interceptadas por fixtures: barras/líneas; 7/30; promedios/reglas sin histórico; empty/error/retry y contrato verificado ausente; filtro con respuesta retrasada; metas en página posterior; preview reciente limitado y etiquetas de históricos; fallos/retry independientes de metas y actividad reciente; Light/Blue; menú reducido con Escape; sin overflow del documento a 320/390/768/1440 px.
- Regresión Chrome de **A** repetida sobre la aplicación final: cuatro acciones contextuales y cancelación sin escrituras, selección de pestaña, drawer, perfil mínimo, badge y Back **OK**.
- Capturas de barras/líneas a 390 px revisadas después de esperar el cierre del drawer; quedan en `.expo/dashboard-bars.png` y `.expo/dashboard-lines.png`, ignoradas por Git. No representan datos reales ni capturas de Expo Go.

Comandos: `npm run lint`, `./node_modules/.bin/tsc --noEmit --incremental false`, suite anterior. Para integración, `EXPO_OFFLINE=1 CI=1 ./node_modules/.bin/expo export --platform web --output-dir .expo/integration-export`, luego `node tests/mobileDashboard.browser.mjs` y `node tests/mobileNavigation.browser.mjs`. Chrome y el servidor local requieren permisos de ejecución/red local. Los fixtures no alcanzan PostgreSQL; no se crean cuentas, sesiones o metas en la base habitual. El harness no imprime JWT ni contraseñas.

## Archivos y límites

- Ruta `(app)/(main)/dashboard.tsx`.
- `components/dashboard/ActivityPlot.tsx`, `DashboardActivity.tsx`, `DashboardContext.tsx`.
- `features/dashboard/verifiedActivity.ts`; campo opcional en `features/focus/focusStatisticsService.ts`.
- `hooks/useFocusedResource.ts`, `services/dashboardActivityService.ts`.
- Tests `dashboardActivity.test.mjs`, `dashboardRendering.test.mjs`, `mobileDashboard.browser.mjs`; ajustes de los helpers nativos/Chrome para transforms, visibilidad real y cierre de drawer antes de capturar.
- Este informe.

No cambian endpoints, Spring Boot, PostgreSQL, Docker, AWS, dependencias, lockfiles ni archivos privados. Los cambios preexistentes ajenos permanecen fuera del commit. No se añade Profile editor, presencia, panel social, foro o estética retro.

Pendiente en **Expo Go**: comprobar tacto/scroll del gráfico a 7/30 días, lectura con VoiceOver/TalkBack y texto grande, SafeArea/teclado/gestos/Back en Android e iOS, imágenes privadas nativas y consulta con la cuenta real autorizada. Confirmar que al volver a Dashboard aparecen las sesiones que el servidor ya haya confirmado. El navegador valida lógica y navegación de React Native web, pero no sustituye esas comprobaciones físicas. Los módulos antiguos siguen con las superficies oscuras documentadas en 6.2b; Dashboard y navegación utilizan el tema global completo.
