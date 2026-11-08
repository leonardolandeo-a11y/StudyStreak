# Focus Studio Mobile — Etapa 6.3b

## Alcance y presentación

Se conserva el motor existente de Pomodoro, audio sintetizado, seguimiento y outbox. La pantalla consume la apariencia global (Dark/Light/System y Mint/Blue/Purple/Orange); el campo antiguo `preferences.theme` sigue guardándose para no destruir preferencias previas, pero no sustituye el tema global.

El temporizador encabeza la pantalla, con cuenta regresiva, progreso accesible, Start/Pause/Resume, Reset y engranaje. Now Playing y Goal quedan debajo, apilados en móvil y equilibrados cuando hay ancho. Los doce sonidos originales pasan a un carrusel horizontal nativo con portada, descripción visible, selección y estado de reproducción/carga. Los filtros sólo cambian el catálogo visible. El foco desplaza la tarjeta a la vista; el movimiento respeta la preferencia global combinada con el dispositivo.

El diálogo reutiliza CreationModal, SafeArea, ScrollView y controles compartidos; tiene borrador Save/Cancel, duración, volumen y efectos. Su encabezado muestra un único cierre, sin Back duplicado. Los formularios de creación existentes conservan su Back. La duración y la fase quedan bloqueadas mientras corre el timer o existe una sesión vinculada, incluso pausada. Start/Pause/Resume tienen una guarda contra pulsaciones simultáneas durante la petición.

Se elimina de esta pantalla el resumen repetido por meta y su consulta exclusiva. Los ciclos locales se etiquetan explícitamente como locales. La sección inferior conserva estadísticas/historial y ofrece 7/30 días: las tarjetas verificadas usan exclusivamente `verifiedPeriod` validado, con mensaje de indisponibilidad si falta. Los datos históricos/estimados aparecen separados y rotulados. Las estadísticas sólo consultan mientras se despliegan y el componente tiene foco; refrescan cada 30 segundos en primer plano y limpian listeners/intervalos al salir.

## Política conservada de sesión y audio

| Situación | Comportamiento actual y límite |
| --- | --- |
| Inicio vinculado | Genera UUID y usa POST `/api/study/sessions`; conserva meta y duración. Timer-only no registra minutos de meta. |
| Pausa/reanudación | Envía PAUSE/RESUME al mismo UUID y recupera estado del servidor; no crea otra sesión. Meta, duración y fase siguen bloqueadas durante pausa vinculada. |
| Finalización | Automática al vencer el bloque. Encola el mismo UUID y sólo retira el pendiente tras confirmación del servidor. No existe Finish manual equivalente en Web ni en el motor actual; no se inventa acreditación de tiempo parcial. Reset descarta el bloque activo y mantiene la cancelación existente. |
| Cambio de pantalla | Detiene intervalo de renderizado y audio; libera reproductores y descarta preparaciones tardías. Al volver recalcula desde deadline y recupera del servidor. Si Focus queda montado, los pulsos de 12 s y la recuperación de 30 s pueden continuar en otra ruta mientras AppState está activo. |
| Segundo plano/bloqueo | Los pulsos comprueban AppState activo. El deadline local puede transcurrir; eso no convierte minutos en verificados. Al volver se recalcula y recupera. La lógica de audio no define explícitamente pausa/reanudación por cada transición de AppState; la configuración existente deshabilita reproducción/grabación en segundo plano. Verificación física pendiente. |
| Interrupción de audio | Se conserva expo-audio y su modo mixWithOthers. No se añade reanudación automática ni otro motor. El indicador refleja comandos, sin nueva suscripción al estado nativo de interrupciones. Se necesita prueba en dispositivo. |
| Cierre/reapertura | Snapshot y selección siguen en SecureStore con claves por cuenta; restauración con deadline original y recuperación backend. Outbox durable por cuenta/UUID en FileSystem. No se migra almacenamiento. |
| Sin red/reintento | Inicio/cambio de grabación fallido muestra error; no promete grabación offline nueva. Los completados pendientes se conservan y reintentan con mismo UUID. Una respuesta perdida no genera UUID nuevo. El ledger backend decide crédito observado. |
| Logout/cambio de cuenta | La navegación existente se remonta por usuario y dispone audio. Snapshot/selección/outbox quedan separados por usuario; los servicios mantienen la protección de revisión de sesión de 6.2a. No se mueve información entre cuentas ni se borra el trabajo pendiente de otra cuenta. |

Decisiones pendientes, sin cambiar reglas en esta entrega: decidir si una sesión debe seguir observándose al navegar a otra ruta activa; definir UX de interrupción/retorno de audio y de Finish parcial si se desea. SecureStore puede rechazar snapshots grandes según dispositivo; el código existente tolera fallos de escritura y conserva el outbox durable, pero una migración de snapshots requerirá alcance específico. No se garantiza persistencia tras un cierre forzado antes de terminar una escritura asíncrona.

## Verificación aislada

- `npm run lint`: correcto.
- `npx tsc --noEmit`: correcto.
- `node --experimental-strip-types --test tests/*.test.mjs`: 22 archivos aprobados, 0 fallos; incluye auth/refresh/logout/cuentas, Pomodoro/finalización automática, snapshots, catálogo/síntesis, outbox, recuperación, navegación, temas y componentes.
- Nuevas pruebas usan el audio real del módulo con reproductor nativo simulado: cambio sin solapamiento, volumen, caché WAV, cancelación de preparación y dispose. No prueban salida sonora física.
- Integración de servicios con Axios y FileSystem simulados: conserva pendientes tras rechazo por tiempo no observado y respuesta perdida, reintenta mismo UUID y mantiene outbox de otra cuenta. La deduplicación del servidor se representa con un fixture; no sustituye pruebas del backend, que no se modifica.
- Exportación Expo para web correcta, sin cambios de dependencias. Es soporte de verificación de UI nativa compartida, no un build Android/iOS.
- Chrome headless, todas las peticiones externas interceptadas: `node tests/mobileFocus.browser.mjs`. Comprueba Save/Cancel, selección y reintento de metas, Start/Pause/Resume mismo UUID, bloqueo de duración pausada, ida/vuelta a Dashboard, Reset/CANCEL, 12 tarjetas, estadísticas error/retry/7–30, separación de estimados, tema claro Orange, foco dentro del modal, movimiento reducido y anchos 320/390/768/1440. Inspección de capturas de UI oscura y diálogo claro. No usa PostgreSQL ni credenciales reales.
- Una repetición de la regresión de Tracking falló en una aserción inmediata de recarga (`reads.history >= 2`); la ejecución anterior y el reintento pasaron sin cambiar código. Se registra como sensibilidad temporal del test existente.
- Regresiones Chrome: `node tests/mobilePolish.browser.mjs` y `node tests/mobileDashboard.browser.mjs`, con mocks. Comprueban formularios, Back anidado, navegación contextual, gráficos, temas y responsive.

## Comprobaciones mínimas pendientes en Expo Go

1. Abrir Focus con una cuenta de prueba, cambiar tema/paleta y activar Reduce Motion; comprobar scroll vertical, carrusel táctil, lector de pantalla y controles de 48 px.
2. Seleccionar meta, iniciar, pausar y reanudar: comprobar meta/duración bloqueadas. Completar un bloque con tiempo realmente observado y comprobar confirmación, sin duplicación al reabrir. Reset debe cancelar, sin acreditar bloque parcial.
3. Reproducir/cambiar los 12 sonidos, variar volumen y efectos. Salir a Dashboard, cerrar sesión y cambiar de cuenta: no debe quedar reproducción residual.
4. Con sesión iniciada, minimizar, bloquear/desbloquear, recibir llamada/interrupción y desconectar auriculares. Verificar audio real, recuperación y límites de tiempo observado; no asumir continuidad en segundo plano.
5. Cerrar/reabrir con sesión pausada y con un pendiente de una cuenta de prueba. Cortar/restaurar red durante confirmación y comprobar que se recupera el mismo UUID sin doble crédito ni mezcla entre cuentas.

No se afirma haber probado un teléfono, interrupciones reales ni sonido físico. No se modificaron Web, backend, base de datos, Docker, AWS, dependencias ni archivos privados. Esta entrega termina en Focus Studio, sin Profile ni funcionalidades sociales nuevas.
