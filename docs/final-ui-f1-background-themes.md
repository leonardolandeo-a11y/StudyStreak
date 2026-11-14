# F1 — Familias de fondo y coherencia visual Web

Base: `9565f63`, rama `feat/ui-ux-web-mobile`. Alcance: frontend Web y este informe/capturas. Sin dependencias nuevas ni cambios Mobile, backend, API, PostgreSQL, infraestructura o autenticación. El PDF mencionado no estaba disponible entre los archivos accesibles; se siguieron los requisitos explícitos de F1.

## Tokens y preferencias

El proveedor existente incorpora `background: neutral | lavender | sage | amber | sky`, independiente de `mode`, `accent` y `reduceMotion`. Cada familia define background, surface, **surface-raised**, surface-hover, border, border-strong, text, text-secondary y text-muted. Los acentos Mint/Blue/Purple/Orange y los colores semánticos de error/éxito siguen independientes. `light-dark()` y `color-scheme` resuelven Light/Dark/System y los cambios del dispositivo sin polling.

Settings → Appearance ofrece cinco radios compactos con muestras clara/oscura obtenidas de los mismos tokens, indicador seleccionado y foco de teclado. Restore default appearance restaura **System + Neutral + Mint**, y la preferencia de reducción de movimiento a su valor predeterminado; nunca modifica ambientes ni widgets. La reducción de movimiento del SO conserva prioridad.

Persistencia: `studystreak:appearance:v2:<userId>`, separada por cuenta; la vista pública utiliza `studystreak:appearance:v2:guest`. Un identificador de cuenta en sessionStorage permite aplicar el fondo correspondiente antes de cargar React, sin leer ni almacenar tokens en la configuración de apariencia.

El único ThemeProvider queda dentro del AuthProvider existente para conocer la cuenta. Cambia sus preferencias antes de renderizar los hijos, **sin poner una key en el árbol de navegación ni remontar router/audio**. No se modificaron AuthProvider, JWT, refresh, rutas o servicios. Los eventos de almacenamiento sólo actualizan la cuenta correspondiente.

## Compatibilidad

- Instalaciones/cuentas sin preferencias: Neutral + System; acento Mint.
- Preferencia anterior válida `studystreak:appearance:v1`: conserva modo, acento y Reduce Motion; adopta Lavender para conservar la identidad predominante anterior.
- La antigua configuración era compartida por navegador. Se migra una sola vez a la primera cuenta autenticada que la use, con una marca de propietario; las siguientes cuentas comienzan independientes. El original v1 no se modifica ni elimina. No se pueden reconstruir preferencias históricas distintas por usuario que nunca existieron en v1.
- JSON inválido y valores desconocidos se normalizan; una configuración v2 dañada no recupera silenciosamente otra preferencia antigua. Almacenamiento bloqueado no impide cambiar la apariencia durante la visita y el guardado muestra el aviso existente.
- Ambientes ilustrados, widgets y preferencias Focus mantienen sus claves y contenido.

## Superficies corregidas

Se eliminaron las redefiniciones locales de tokens en `retro-shell`, las tarjetas Cozy Dashboard y `academic-focus`: impedían que los alias globales y las superficies internas compartieran colores. El cambio de Dashboard es exclusivamente esa herencia de tokens; no se tocaron distribución, widgets, datos, arte ni controles. El sidebar, Study Rooms y Login/Register mantienen sus componentes y estilos específicos; reciben únicamente los tokens globales indispensables. La banda lavanda intencional del sidebar se conserva.

- **Goal Details:** resumen Recorded for this Goal, registros y Streak heredan la misma familia; RecordedSummary usa una superficie semántica también en su variante no compacta. Sin cambios de cálculos ni de dificultad.
- **Focus:** Now Playing, Goals, formulario de duración y controles secundarios heredan el fondo elegido. Pomodoro circular, temporizador, catálogo y audio intactos.
- **Resources:** búsqueda, resultados, portadas/fallback y detalle pasan de nombres de colores heredados a surface/surface-raised/border/text. Servicio Books intacto.
- **Notifications:** filtros, listado y controles usan superficies y textos semánticos, conservando los estados y acciones.
- **Profile/editor:** campos con surface-raised, preview y contadores coherentes con la familia. Selección, validaciones y subida sin cambios.
- **Compartidos:** formularios, estados vacíos, alertas y confirmaciones reciben los tokens globales existentes. Se conservan negros intencionales en backdrops, sombras y artwork; no se hizo una sustitución indiscriminada.

## Verificación

Todas las peticiones de Chrome se interceptaron con fixtures; no hubo escrituras ni sesiones personales contra el backend. Las pruebas de login/logout son UI real con respuestas simuladas, no integración HTTP real.

| Comprobación | Resultado |
| --- | --- |
| ESLint, TypeScript y build Web finales | Aprobados. Permanece el aviso previo de chunk mayor de 500 kB. |
| Preferencias nuevas y antiguas, JSON inválido, almacenamiento denegado, dos cuentas, reinicio y restauración independiente | Aprobados en `backgroundPreferences.test.mjs`. |
| Cinco familias × Light/Dark/System × cuatro acentos | Aprobadas 80 combinaciones efectivas: System se comprueba en ambos esquemas del dispositivo. El acento no cambia el fondo; System coincide con la variante explícita correspondiente. |
| Contraste | Mínimo **5,08:1** en los pares de texto medidos; **4,06:1** para borde fuerte/surface. No es una certificación de todos los píxeles, imágenes ni combinaciones de opacidad. |
| Chrome nuevo: superficies, selecciones, recarga, cuentas, Restore, foco y flechas | Aprobado. Logout/login mediante AuthContext conserva navegación y restaura la cuenta B sin heredar A. |
| Apariencia y Focus existentes | 13/13 aprobadas, incluyendo primer render antes de React, System, Reduce Motion, teclado, modales y círculo responsive. |
| Profile, Goals/validación, superficies/Journey, autenticación, configuración API y aislamiento | Aprobadas. El lote inicial dio 20/21; el único fallo de Focus por asumir Dark quedó aprobado en la repetición dirigida anterior. |
| Dashboard, Login/Register, Rooms y rutas académicas | Aprobadas. El lote inicial dio 16/17; el test académico asumía que los radios estaban habilitados por defecto. Su repetición dirigida pasó tras desactivar System mediante el control existente. |
| Responsive | 390/768/1440 en los módulos solicitados; regresiones existentes también comprueban 320 px. Sin overflow horizontal. |

Las expectativas antiguas de Dark predeterminado, superficies locales y modo manual se actualizaron al contrato de F1. No se alteró producto para forzar esos tests. Los intentos rojos intermedios de los nuevos scripts correspondieron a rutas de salida, sincronización de montaje y fixtures; los resultados finales son los informados. No se ejecutó toda la suite Web de nuevo ni pruebas Android/Mobile, fuera de alcance.

Comandos desde `frontend-web`:

```sh
npm run lint
npx tsc -b
npm run build
npm run test:background-themes
node --test --test-concurrency=1 tests/appearance.test.mjs tests/focusStudioRendering.test.mjs
node --test --test-concurrency=1 tests/profileRendering.test.mjs tests/goalWorkflows.test.mjs tests/studySurfaceHotfix.test.mjs tests/apiAccountIsolation.test.mjs tests/authenticatedApiRendering.test.mjs tests/apiConfigurationIntegration.test.mjs
node --experimental-strip-types --test --test-concurrency=1 tests/dashboardRendering.test.mjs tests/academicModules.test.mjs tests/roomPolish.test.mjs tests/authScenes.test.mjs
```

`test:web` incorpora la regresión pura de preferencias. `test:background-themes` permite repetir la revisión Chrome y las capturas; `F1_SKIP_CAPTURES=1` reutiliza imágenes cuando sólo se comprueban interacciones. Logs y mediciones en `.local/f1/`, excluidos de Git.

## Capturas comparativas

60 PNG en `docs/images/final-ui-f1/`: antes/después de seis pantallas, formularios Goal/Profile y modal Pomodoro. Capturas con datos sintéticos, inspeccionadas visualmente; las imágenes no representan datos personales. Los estados de error presentes en Focus provienen de las respuestas de la fixture, no de una prueba del backend real.

| Vista | Antes | Después |
| --- | --- | --- |
| Settings / Lavender Dark | [Antes](images/final-ui-f1/before-settings-lavender-dark-1440.png) | [Después](images/final-ui-f1/after-settings-lavender-dark-1440.png) |
| Focus / Lavender Dark | [Antes](images/final-ui-f1/before-focus-lavender-dark-1440.png) | [Después](images/final-ui-f1/after-focus-lavender-dark-1440.png) |
| Goal Details / Lavender Dark | [Antes](images/final-ui-f1/before-goal-lavender-dark-1440.png) | [Después](images/final-ui-f1/after-goal-lavender-dark-1440.png) |
| Goal Details / Sage Dark | [Antes, fondo anterior](images/final-ui-f1/before-goal-lavender-dark-1440.png) | [Sage](images/final-ui-f1/after-goal-sage-dark-1440.png) |
| Resources / Neutral Light | [Antes](images/final-ui-f1/before-resources-lavender-dark-1440.png) | [Después](images/final-ui-f1/after-resources-neutral-light-1440.png) |
| Editor / Neutral Light | [Antes](images/final-ui-f1/before-editor-lavender-dark.png) | [Después](images/final-ui-f1/after-editor-neutral-light.png) |
| Notifications / Sage Dark, 390 px | [Antes](images/final-ui-f1/before-notifications-lavender-dark-390.png) | [Después](images/final-ui-f1/after-notifications-sage-dark-390.png) |
| Focus / Sage Dark, 390 px | [Antes](images/final-ui-f1/before-focus-lavender-dark-390.png) | [Después](images/final-ui-f1/after-focus-sage-dark-390.png) |

## Archivos y cierre

Implementación:

- `frontend-web/public/appearance.js`.
- `frontend-web/src/theme/appearance.ts`, `ThemeProvider.tsx` y `src/main.tsx`.
- `frontend-web/src/styles/tokens.css`.
- `frontend-web/src/components/settings/AppearanceSelectors.tsx`.
- `frontend-web/src/components/academic/retro-workspace.css` y `components/dashboard/cozy-dashboard.css` (sólo herencia de tokens).
- `frontend-web/src/components/study/RecordedSummary.tsx`, `components/focus/FocusDurationDialog.tsx`, `components/profile/ProfileEditDialog.tsx`.
- `frontend-web/src/pages/Resources.tsx`, `Notifications.tsx`.

Pruebas: `frontend-web/package.json`, `tests/backgroundPreferences.test.mjs`, `tests/backgroundThemes.browser.mjs`, `tests/appearance.test.mjs`, `tests/focusStudioRendering.test.mjs`, `tests/academicModules.test.mjs`; este informe y sus capturas.

Se conservaron byte por byte los **39 archivos pendientes preexistentes**: los 16 elementos ajenos y los recursos/informe/capturas anteriores de 8.1b. Staging explícito exclusivo de F1. Commit local **`feat(web): add background themes and unify surfaces`**; hash consultable con `git log -1 --format=%h -- docs/final-ui-f1-background-themes.md` e informado en la entrega. Sin reset, clean, stash, amend, merge, push o deployment. Se detiene el trabajo en F1.
