# F4 — Focus Studio y Notifications Web

Rama `feat/ui-ux-web-mobile`, base `b5acfcb`. Sin dependencias nuevas ni cambios en Mobile, backend, contratos, infraestructura o servicios API.

## Focus Studio

- Se reutiliza Embla con arrastre habilitado explícitamente, umbral de 10 px y cursor de agarre. Se conservan flechas, categorías, teclado y los doce soundscapes. Embla suprime el clic tras arrastrar; se verificó con mouse real automatizado en Chrome.
- Import Music admite selección múltiple de audio local compatible. Valida tipo/tamaño no vacío y capacidad del navegador antes de crear URLs; errores de decodificación o reproducción se comunican explícitamente. Imported music ofrece reproducción, pausa, cambio y eliminación, con nombre y estado en Now Playing y el volumen existente.
- Un único HTMLAudioElement sirve a los archivos importados. La coordinación de UI detiene el otro reproductor antes de iniciar música y descarta respuestas asíncronas antiguas. No se modificaron `PomodoroAudio`, síntesis, soundscapes, motor Pomodoro, UUID, outbox ni ledger.
- Archivos y URLs viven solo en memoria. Al eliminar o desmontar se pausa, se descarga la fuente y se revocan las URLs. Logout/cambio de cuenta desmontan el Focus Studio con clave por usuario. No se suben ni se guardan archivos, nombres o URLs en preferencias.
- Now Playing, Settings y Goal ya usaban superficies F1; se conservaron y se verificaron. Retry sync se lleva a tokens semánticos. Los tonos oscuros del arte de discos son intencionales y se mantienen.

Pruebas aprobadas: ESLint, TypeScript/build Web; siete pruebas existentes de `focusStudioRendering.test.mjs`; `noiseSynthesis`, `pomodoroState`, `pomodoroGoalTracking` y `soundscapes`; `focusLocalMusic.browser.mjs` con WAV reales generados como fixtures, errores de formato, mouse drag sin reproducción accidental, flechas, reproducción/pausa/cambio/volumen, exclusión de audio, eliminación, desmontaje y logout. Responsive 390/768/1440/1920 y 80 combinaciones de apariencia con Reduce Motion. No hubo escrituras de sesiones reales.

Capturas: [Antes](images/final-ui-f4/before-focus.png), [música importada](images/final-ui-f4/after-focus-imported.png), [390](images/final-ui-f4/after-focus-390.png), [768](images/final-ui-f4/after-focus-768.png), [1440](images/final-ui-f4/after-focus-1440.png), [1920](images/final-ui-f4/after-focus-1920.png).

Archivos Focus: `components/dashboard/FocusStudio.tsx`, `components/focus/SoundscapeCarousel.tsx`, `components/focus/LocalMusicLibrary.tsx`, `hooks/useLocalMusic.ts`, `tests/focusLocalMusic.browser.mjs` (todos bajo `frontend-web`), este informe y sus capturas.

Los formatos dependen de los códecs del navegador; se probó decodificación WAV real, no todas las combinaciones de códec/OS. La biblioteca se vacía al abandonar Focus Studio conforme al requisito de limpieza al desmontar. Mouse automatizado no equivale a prueba de touchpad físico o lector de pantalla.

## Registro

Focus: `feat(web): add session music and draggable soundscapes`. Hash informado al finalizar y consultable con `git log --format='%h %s' --grep='^feat(web): add session music and draggable soundscapes$' -1`.

El cierre de Notifications se registra por separado. Los archivos preexistentes ajenos y recursos históricos permanecen fuera del staging.
