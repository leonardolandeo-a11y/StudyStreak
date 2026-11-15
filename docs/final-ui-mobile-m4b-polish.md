# M4b — Pulido de controles Mobile

15 de noviembre de 2026 · `feat/ui-ux-web-mobile` · base verificada `926afe5`.
Referencia: únicamente texto y capturas de las páginas **1–5** de `Documento sin título (8).pdf`. No se consultaron las páginas 6–13.

- **My Goals:** eliminado el Create Goal superior. El `+` contextual conserva callback, etiqueta accesible, visibilidad y formulario; su variante pixelada usa superficies y acento M2 y se aplica solo en Goals.
- **Study Rooms:** Share invitation usa el acento; Copy y Regenerate son iconos de 44 px, juntos al código. Copy ofrece check y anuncio “Copied”; Regenerate mantiene confirmación, host y bloqueo por estado desactualizado. Chat/Participants queda antes del Pomodoro centrado, con controles debajo. Solo se mueve presentación; reloj, LiveKit, permisos y reconexión intactos.
- **Validations:** Goals en filas pulsables con el `DifficultyBadge` existente a la izquierda y chevron a la derecha. La paginación de partners/goals/records usa flechas con nombres Previous/Next; otros usos de PageControls conservan su variante original. Selecciones, cinco pasos, IDs, evidencias, borradores y operaciones permanecen iguales.
- **Tracking partners del wizard:** tarjeta completa seleccionable, sin botón largo. El subtítulo usa `totalElements` real del servicio de Goals existente: una lectura de la primera página por partner mostrado al montar/refrescar, cancelable con el hook existente. No se confunde cantidad de elementos de página con total ni error con cero. Sin nuevos endpoints ni persistencia. Se conservan accesos a perfiles existentes en las demás áreas.
- **Notifications:** Refresh se sustituye por el icono clásico; mismo callback `reload()` + `refreshUnread()`, indicador de carga y nombre accesible.

## Verificación

- `npm run lint` y `npx tsc --noEmit`: aprobados, sin warnings de lint.
- **10/10 archivos dirigidos**, sin fallos ni skips: `m4bControls`, `m2Appearance`, `nativeTextRendering`, `goalsParity`, `pagination`, `reviewNavigation`, `roomPolish`, `studyRoomClock`, `roomsResourcesNotifications` y `m4Rendering`. Tras ajustar la exposición de selección en Expo Web, se repitieron solo `m4bControls` y `m2Appearance`: aprobados. Incluye 40 combinaciones familia × Light/Dark × acento, callback del `+`, límites de paginación y restricción nativa de Text.
- Exportación Expo Web aprobada para pruebas locales. **`m4bPolish.browser.mjs` aprobado:** creación/cierre desde `+`, total 21 con página de diez Goals, conteo no disponible, filas de dificultad, paginación, cinco pasos, selección/IDs/borrador y envío de validación, Escape como Back simulado, acento/acción Share, perfil y retorno, refresh de listado y contador. Anchos 320/390/768 y Reduce Motion simulado.
- **`m4Rooms.browser.mjs` aprobado:** Copy/feedback, Regenerate/confirmación, host/member, reconexión y bloqueo tras 15 segundos, Pomodoro después de Chat/Participants, círculo centrado/controles debajo, anchos 320/390/768.
- Chrome usa APIs simuladas; no se contactó el backend real. **Sin Expo Go físico ni adb accesible**: pendientes Back del sistema, TalkBack, SafeArea/teclado y aspecto/gestos reales. No se certifica transporte LiveKit real. No se generaron capturas nuevas de la app.

## Archivos y alcance

En `frontend-mobile/src`: rutas `app/(app)/(main)/(menu)/{goals/index,study-rooms,validations/index}.tsx` y `app/(app)/(main)/notifications/index.tsx`; componentes `navigation/MenuTabBar.tsx`, `ui/{AppIcon,PageControls}.tsx` y nuevo `validations/ValidationPartnerRow.tsx`.

Pruebas: nuevos `tests/m4bControls.test.mjs` y `tests/m4bPolish.browser.mjs`; ajustados `m4Rooms.browser.mjs` y `m2Appearance.test.mjs`. Se actualizan únicamente nombres de los controles sustituidos en `mobileGoalDifficulty.browser.mjs`, `mobilePolish.browser.mjs` y `mobileSocial.browser.mjs`; estos tres escenarios completos no se ejecutaron en M4b.

Solo Mobile y este informe. Sin dependencias nuevas ni cambios en servicios, motor del reloj, Dashboard M3, Web, backend o infraestructura. Cambios ajenos preservados y excluidos del staging. Commit local: `style(mobile): refine controls across goals rooms and validations`. Sin push ni operaciones destructivas. **M4b finaliza aquí; M4c/M5 no iniciados.**
