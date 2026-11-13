# Entrega final StudyStreak — Etapa 9.0

Revisión: 13 de noviembre de 2026. Rama `feat/ui-ux-web-mobile`; entrada `a52f963`. Preparación local, sin deployment, push, merge, cambios de backend, migraciones ni escrituras en PostgreSQL habitual.

## Resultado y prioridades

| Prioridad | Hallazgo real | Resultado / acción |
| --- | --- | --- |
| P0 corregido | HEAD no incluía Web 8.3a aprobado. El test Mobile confirmado importaba `frontend-web/src/features/environment/environmentPreferences.ts`, ausente en Git. | Reproducción con archivos de HEAD: `ERR_MODULE_NOT_FOUND`. Registro exclusivo de la implementación existente en `92225d8`; la misma prueba pasa desde una exportación de Git. No hubo nuevo diseño. |
| P1 corregido | Tres regresiones visuales seguían esperando decoraciones, textos y tamaño de iconos anteriores. | Actualizados dos tests en `3a31095`: sprite/glyph académico, filas actuales de Tracking, conexión a sala sin inferir presencia privada e icono de 22 px. Conservadas comprobaciones de permisos, caché, fallback, responsive y movimiento real. |
| P1 pendiente | El contenedor local no tiene `GOOGLE_BOOKS_API_KEY`. | Resources no está preparado para búsqueda real local. Sólo se comprobó presencia/ausencia de la variable, sin revelar valores. Requiere configuración del servidor y comprobación autenticada por el responsable; esta corrección se detiene por alcance de infraestructura. |
| P1 de verificación | Deployment público y recorrido autenticado en el destino final sin comprobar en esta etapa. | No se acreditan HTTPS, CORS, disponibilidad, latencia, publicación Expo ni URLs públicas funcionales a partir de pruebas locales. Validarlos antes de la demo. |
| P1 de verificación | Falta revisión física de los últimos cambios Mobile. | Ejecutar checklist Android inferior. No es un fallo de producto confirmado ni una prueba que pueda sustituirse con mocks. |
| P2 | Chunk Study Rooms de 569,83 kB minificado / 150,38 kB gzip. Fecha de incorporación propia Mobile condicionada al DTO. | Build válido; refactor de carga y ampliación de datos fuera de esta entrega. No inventar fecha. |

No queda otro P0 confirmado por estas comprobaciones. Esto no certifica todas las rutas contra producción ni sustituye la revisión de deployment.

## Estado por módulo

**Simulado** significa servicios con adaptadores, renderizado o Chrome con respuestas controladas; no integración real con PostgreSQL.

| Módulo | Evidencia y estado | Límite para la entrega |
| --- | --- | --- |
| Login/Register y sesión | Tests actuales Web/Mobile: JWT, configuración inválida, refresh, aislamiento, logout y restauración. SecureStore nativo y cliente autenticado conservados. | Chrome usa fixtures. HTTP real de login/refresh/logout ya consta en la copia aislada del backend; no se reutilizaron credenciales personales. |
| Dashboard | Actividad verificada, widgets y preferencias por cuenta; modelos y renderizado actuales aprobados. Revisión visual y cuentas simuladas de 8.4 vigente para estos componentes. | Repetir demo con los datos reales autorizados; estadísticas históricas siguen separadas de verificadas. |
| Goals / dificultad / registros / tags | Pruebas de escritura/contratos, formulario y validación contextual aprobadas. Persistencia real aislada previa y comprobación actual de JAR/esquema, descritas abajo. | No se crearon ni editaron metas habituales durante 9.0. |
| Focus Studio | Pruebas actuales de estado/audio y síntesis; reloj y catálogo existentes. Regresiones visuales/audio de 8.4 reutilizadas para código sin cambios. | Audio audible, bloqueo de pantalla y recuperación física requieren teléfono; no se promete tiempo verificado por cálculo local. |
| Tracking | Chrome actual comprueba estados, imágenes protegidas, fallback 403/404 y permisos; navegación y flujo conservados. | Relaciones reales no se modificaron para fabricar casos. |
| Validations | Flujo Chrome compañero → meta → registro → validación aprobado; permisos/IDs y servicios de evidencias Mobile aprobados. | Cámara/micrófono reales: confirmación previa del usuario en 6.7; repetir permisos/archivos para la demo si fuera necesario. |
| Study Rooms | Regresiones de modelo actuales; 7.4d aporta 24/24 Web, 31/31 Mobile y revisiones Chrome host/member, reconexión, chat, permisos y cuentas. | Expo Go conserva fallback multimedia. Recepción LiveKit requiere development build; no hay publicación Mobile de cámara/micrófono/pantalla. |
| Resources | Búsqueda, normalización, errores/cancelación y enlaces cubiertos con mocks; página Web recorrida en Chrome actual. Google Books sólo a través de Spring Boot. | P1 de configuración local confirmado. No se probó proveedor externo autenticado ni deployment. |
| Notifications | Servicios Mobile actuales: filtros, páginas, lectura/eliminación, contador y carreras por cuenta. Ruta Web recorrida en Chrome; navegación contextual cubierta por regresiones anteriores sin cambios del módulo. | No incluye push nativo. Revisar destinos y badge con cuenta autorizada antes de exponer. |
| Profile / social / Partners | Editor propio Chrome actual, renderizado y servicios sociales Mobile, privacidad y limpieza por sesión aprobados. | No se deduce autorización de imágenes por pertenecer a una sala. Fecha propia Mobile se omite si no llega. |
| Appearance / ambientes | Web 8.3a registrado, cuatro ambientes y Automatic alineados con Mobile 8.3b. Evidencia 8.4 conserva temas, paletas, widgets, restauraciones independientes, Back y Reduce Motion. | Las preferencias son locales; no se sincronizan entre plataformas/dispositivos. |

## Backend disponible y persistencia real

Lectura actual: `studystreak-local-app-1` y `studystreak-local-db-1` están **healthy**. GET anónimo de `/actuator/health`, `/api/profile`, `/api/users/3/profile` y `/api/resources/books?q=algebra`: **401**. Son rechazos de autenticación; no prueban por sí solos existencia de rutas ni integración autorizada.

En transacción explícita **READ ONLY**, base `studystreak_local`, esquema `public`: `goal.difficulty` existe, nullable; `goal_difficulty_check` está validado para NULL/TRIVIAL/EASY/INTERMEDIATE/HARD. Existen `social_preferences` y `presence_session`. No se ejecutaron migraciones ni escrituras.

El JAR activo contiene `GoalDifficulty`, `SocialProfileController`, `GlobalExceptionHandler` y la migración de dificultad. SHA256: `26bab3c5c03004e1a05e98d604d56aad71fa03f090b11e9a543da37e0c02d323`. Coincide exactamente con la activación documentada en `.local/backups/goal-difficulty-2026-11-12_160939/verification.md` (evidencia local excluida de Git). No se atribuye al binario un commit que no declare.

Esa activación verificó con **la misma imagen/JAR y PostgreSQL desechable**: POST EASY → 201/EASY; GET → EASY; PUT HARD → HARD; GET → HARD; los cuatro enum persistidos con SQL independiente; cliente antiguo que omite dificultad conserva HARD; históricos NULL válidos. Login 200, perfil/stats 200, refresh 200, logout 204 y refresh revocado 401. Se reutiliza esta evidencia; no se repiten escrituras ni se afirma un round-trip nuevo sobre la base habitual. El [hotfix](hotfix-goals-difficulty-dashboard.md) describe el diagnóstico anterior; su advertencia de migración pendiente quedó superada por esa activación y la lectura actual.

## Pruebas de 9.0

| Ejecución | Resultado |
| --- | --- |
| ESLint y TypeScript Web/Mobile | Aprobados; lint Web repetido tras ajustar tests. |
| Build Web | Aprobado, con aviso de chunk indicado arriba. |
| Expo export Web + Android | Aprobado; JS/assets en `frontend-mobile/.expo/integration-export`. No es APK ni prueba física. |
| Web crítico: JWT, ruido, Goals, acceso a registros/validaciones, actividad, Pomodoro, reloj, colaboración, ambientes y widgets | 12 archivos aprobados. |
| Mobile crítico: sesión/JWT/refresh/restauración, Rooms/Books/Notifications, fallback multimedia, ambientes, widgets, Focus y directorio social | 10 archivos aprobados. |
| Mobile adicional: Goals/evidencias, servicios/sesión/renderizado social, Dashboard y dificultad | 6 archivos aprobados. |
| Chrome: configuración, refresh, aislamiento, Profile y dificultad | 13 casos aprobados. |
| Chrome: formularios Goals/tags/Validations | 1 caso aprobado. |
| Chrome: 13 rutas académicas, 320/390/768/1440, temas/paletas | 1 caso aprobado tras actualizar la expectativa de decoración. |
| Chrome: avatares, permisos, caché, Responsive y microanimaciones | 2/2 aprobados tras actualizar expectativas obsoletas. |
| Exportación de archivos registrados, sin archivos privados/pendientes | Test de paridad de ambientes aprobado, build Web aprobado y TypeScript Mobile aprobado, usando dependencias instaladas existentes. No equivale a instalación limpia de dependencias. |

Los intentos rojos iniciales están conservados en `.local/stage90/`; fueron el diagnóstico de los tests obsoletos y del archivo faltante. No se afirma una ejecución completa verde de `test:web`: se ejecutaron los casos pertinentes y se reutilizaron resultados vigentes para el mismo código (8.4 y 7.4d). No se repitió toda la suite backend. Logs locales de 9.0: `web-critical.log`, `mobile-critical.log`, `mobile-modules.log`, `web-integration-mocked.log`, `web-modules.log`, `web-modules-after.log`, `web-avatars-after.log`, lint/TS/build/export y `head-{fixture,after}.log`.

## Contraste con rúbrica

- **2.1–2.2 / 3.1–3.3:** API central, JWT, SecureStore, separación de capas, rutas y navegación implementadas y con regresiones. E-04 Web ya se resolvió en 6.7; no sigue siendo pendiente. Ambos validadores conservan prefijos REST y no añaden `/api`.
- **2.3:** cámara y micrófono de evidencias implementados; confirmación física previa del usuario documentada en 6.7. Google Books local tiene el P1 real señalado. No contar LiveKit en Expo Go como sensor disponible.
- **2.4 / 3.4 / 4.1–4.3:** estados de error/carga, formularios, permisos, accesibilidad, temas y múltiples vistas con evidencias. E-02 de audio fue corregido en 6.7 y sus regresiones actuales pasan.
- **4.4:** Goals/Daily Records Web conservan paginación, tamaño y query params; no afirmar opciones equivalentes en todos los listados. La API Books devuelve lista, no página.
- **5:** deployment integral público no verificado. No asignar puntos por un contenedor local healthy ni por exportar Expo.
- **1:** la exposición individual y el pitch de 20 minutos requieren ensayo humano. La fecha impresa en la rúbrica es 10 de noviembre; confirmar con el docente el plazo comunicado por el usuario para mañana.

Referencias: [6.6](auditoria-final-web-mobile-etapa-6-6.md), [6.7](cierre-tecnico-etapa-6-7.md), [8.2](academia-pixel-viva-etapa-8-2.md), [8.3a](academia-pixel-viva-etapa-8-3a.md), [8.3b](academia-pixel-viva-etapa-8-3b.md), [8.4](academia-pixel-viva-etapa-8-4.md), [7.4d](retro-pixel-academia-etapa-7-4d.md). Las capturas existentes de 8.4/7.4d siguen representando la UI: en 9.0 no se rediseñó.

## Variables y ejecución sin secretos

| Entorno | Variables / requisito |
| --- | --- |
| Web | `VITE_API_BASE_URL`: origen/base absoluta HTTP(S), sin credenciales/query/hash. Se incorpora al build. Ejemplo local `http://localhost:8080`. |
| Expo Go en teléfono | `EXPO_PUBLIC_API_URL`: base accesible por LAN, como `http://<IP-LAN-del-equipo>:8080`. Teléfono y equipo en la misma red; localhost del teléfono no es la laptop. Reiniciar Metro al cambiarla. |
| Backend existente | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `APP_CORS_ALLOWED_ORIGINS`, variables `MAIL_*` y directorio persistente `PROFILE_IMAGE_DIRECTORY`. No cambiadas en esta etapa. |
| Books / medios opcionales | `GOOGLE_BOOKS_API_KEY` sólo en servidor; `LIVEKIT_ENABLED`, `LIVEKIT_URL`, `LIVEKIT_INTERNAL_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` según entorno existente. Nunca en variables públicas de frontend. |

No añadir `/api` a la base: existen rutas `/login`, `/refresh`, `/users/...` y `/api/...`. No guardar tokens/secretos en variables VITE/EXPO_PUBLIC. Los `.env.local` privados existentes no se sobrescribieron.

Desde un checkout de entrega con sus variables locales configuradas:

```sh
cd frontend-web
npm ci
npm run lint
npx tsc -b
npm run build
npm run dev -- --host 0.0.0.0
```

En otra terminal:

```sh
cd frontend-mobile
npm ci
npm run lint
npx tsc --noEmit
npm run test:auth
npx expo export --platform web --platform android --output-dir .expo/entrega
npx expo start --lan
```

Entorno de verificación: Node `22.23.2`, npm `10.9.8`; mantener locks y versiones Expo/RN del proyecto. El backend habitual ya está arrancado: no ejecutar Compose, migraciones ni recreaciones para seguir estos pasos.

## Git y archivos pendientes

Commits de esta preparación: `92225d8` (44 archivos aprobados 8.3a: código, ocho recursos, tests, informe y capturas), `3a31095` (sólo `frontend-web/tests/academicModules.test.mjs` y `frontend-web/tests/socialAvatarCompletion.test.mjs`) y un commit documental exclusivo de este informe, consultable con `git log -1 --oneline -- docs/entrega-final-studystreak.md`.

Se comprobaron huellas SHA256 de los **83 archivos preexistentes pendientes** al entrar: ninguno cambió de contenido. El registro de 8.3a sólo cambió su estado en Git. Los 16 elementos ajenos permanecen fuera de los commits:

```text
.env.docker.local.example                  (modificado)
docs/desarrollo-local.md                   (modificado)
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
package-lock.json                         (raíz)
scripts/check-google-books.py
```

También quedan fuera, preservados y sin seguimiento: `docs/academia-pixel-viva-etapa-8-1b.md`, `docs/images/academia-pixel-viva-8-1b/` y cuatro recursos `frontend-web/public/environments/academia-{morning,afternoon,night}.webp`, `academia-static.jpg`. Son una propuesta intermedia sustituida por 8.1c/8.3a, sin referencias en código ejecutable actual. No deben reactivar la habitación de Focus ni mezclarse accidentalmente en la entrega. No se borraron. Staging final vacío; árbol de trabajo deliberadamente no limpio.

## Pasos concretos para entregar e integrar en main

1. Resolver con el responsable el P1 de Books y comprobar las URLs públicas de Web/backend/Expo, HTTPS, CORS y navegación directa a rutas protegidas. Esto requiere configuración autorizada fuera de 9.0; no se ha ejecutado ningún deployment. Revisar migraciones del entorno destino antes de cualquier despliegue; no confiar en que su JAR/esquema coincidan con localhost. Mantener backups y almacenamiento de imágenes. Vite necesita fallback SPA; la exportación Mobile Web usa `web.output=server` y requiere hosting compatible, no asumir que es un SPA estático.
2. Ensayar con cuenta de demostración autorizada: login/restauración, Dashboard, dificultad existente, Focus, compañero/validación, chat/reloj, Books y destino de notificación. Evitar crear datos sobre cuentas personales. En Android: cámara/micrófono y cancelación; Profile picker; Back/teclado/TalkBack; cambio de cuenta; ambientes/widgets tras reinicio; Reduce Motion/background; audio/outbox tras pérdida de red. Las pruebas físicas previas del usuario no acreditan todos estos casos posteriores.
3. Integrar desde un **worktree separado**, manteniendo intacto el árbol con archivos ajenos. Al revisar, `main` era ancestro de esta rama (0 commits exclusivos de main); no había otro worktree de main. Ejecutar manualmente desde la raíz, tras revisar el informe:

```sh
git status --short
git log -3 --oneline
git diff --cached --exit-code
git worktree add ../StudyStreak-entrega main
git -C ../StudyStreak-entrega merge --ff-only feat/ui-ux-web-mobile
git -C ../StudyStreak-entrega status --short
git -C ../StudyStreak-entrega log -3 --oneline
```

Si `--ff-only` rechaza por cambios posteriores de main, detenerse y revisar divergencia; no forzar. En el nuevo worktree ejecutar los comandos de frontend anteriores con variables privadas propias. No copiar `.local/`, backups, propiedades privadas ni hacer `git add .`. Los archivos pendientes del worktree original no se incluyen al integrar commits.

4. Después de revisar la integración y validar deployment, el responsable publica los commits en GitHub mediante su flujo de equipo y entrega enlaces de repositorio, Web/API/Expo y presentación. **Esta etapa no ejecutó publicación ni integración.** No se presume autorización para desplegar o escribir en producción.

Se cierra 9.0 sin funcionalidades ni rediseños adicionales.
