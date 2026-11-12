# Hotfix Goals Difficulty + Dashboard Visual Consistency

Fecha: 2026-11-12 · rama `feat/ui-ux-web-mobile` · base `5f40abc`.

## Resultado y límite operativo

**Causa confirmada y código corregido. La activación del entorno habitual sigue pendiente de autorización.** No se ha migrado `studystreak_local`, sustituido/recreado `app`, modificado Docker/configuración privada ni escrito metas en esa base. No se afirma que el backend actualmente activo ya persista dificultad.

## Causa raíz confirmada

Hay dos problemas relacionados:

1. El frontend actualizado hablaba con un backend Docker anterior a la ampliación de Goals. Ese backend acepta el JSON nuevo pero ignora `difficulty` y devuelve un 2xx sin el campo.
2. Web y Mobile consideraban cualquier 2xx un éxito y cerraban el editor sin confirmar la dificultad mediante GET. Esa confirmación insuficiente hacía parecer que el nivel había sido guardado.

### Evidencia del entorno local — solo lectura

- Contenedor: `studystreak-local-app-1`, saludable. Imagen activa: `sha256:0a644f5ca8d470e9b538278497ecc97683a71725b98aba5ad043b1a52e486031`.
- JAR `/app/app.jar` copiado a `/tmp/hotfix-active-app.jar` para inspección. SHA-256: `22c90cd2e14f362936786483515c3845d1fd03627b08b39fb99c0efb1ca1077c`.
- En el JAR activo no existen `GoalDifficulty.class` ni `db/migrations/2026-11-12_goal_difficulty.sql`. Goal, GoalRequestDTO, GoalResponseDTO y GoalService tampoco contienen el campo. No se atribuye un hash Git al binario sin metadatos de revisión que lo prueben.
- Transacción explícita **READ ONLY** en `studystreak-local-db-1`: base `studystreak_local`, esquema `public`; no existe `goal.difficulty` ni `goal_difficulty_check`.
- Runtime comprobado: `APP_DB_SCHEMA=public`, JPA `validate`, inicialización auth `never` y ledger `false`. Por tanto no puede aparecer la columna por una actualización automática durante el arranque actual.
- Compose activo usa `compose.local.yaml` y `compose.profile-images.local.yaml`, con bind persistente en `/var/lib/studystreak/profile-images`. Se conservaron sin modificaciones.

### Recorrido completo

| Punto | Resultado comprobado |
|---|---|
| Selector / formulario | Mantienen el valor API uppercase elegido; no lo derivan de planificación o progreso. |
| POST / PUT Web y Mobile | Los cuerpos generados por los clientes contienen TRIVIAL/EASY/INTERMEDIATE/HARD. Se verificaron en Chrome instrumentado y tests de servicios/confirmación. |
| Tipos de cliente | Ambos usan el mismo contrato `difficulty?: GoalDifficulty \| null`. |
| Backend fuente | Enum validado, mapeo de creación/lectura correcto y actualización solo cuando el campo no es null. Las pruebas reales lo confirman. |
| Backend Docker activo | No reconoce el campo. El valor se pierde aquí, antes de poder persistirse; el problema no es una conversión errónea del selector. |
| PostgreSQL habitual | Sin columna/constraint de dificultad; la migración está pendiente de activación. |
| Respuesta antigua | La reproducción aislada del JAR activo devuelve POST EASY → **201 sin difficulty**, GET → **200 sin difficulty**. |
| Cliente anterior al hotfix | Interpretaba el 2xx como éxito; al recargar, mostraba la ausencia real devuelta por el servidor. |
| Cliente corregido | Exige ID válido y GET posterior con el mismo ID y dificultad elegida antes de informar éxito. |

No se accedió a una sesión Chrome del usuario ni se hicieron POST/PUT contra su API persistente. Los payloads de cliente se observaron en navegadores de prueba; el contrato antiguo se reprodujo con el **mismo JAR copiado** en PostgreSQL desechable. Esto separa evidencia de UI, versión desplegada y persistencia real sin alterar datos habituales.

## Corrección funcional

- Los servicios de Goals de ambos clientes confirman la lectura posterior a POST/PUT cuando se eligió dificultad. No mezclan el valor solicitado dentro de una respuesta que lo omita.
- Si el GET no coincide, falla, devuelve un ID distinto o no hay ID válido, se genera `GoalWriteUnconfirmedError`. No se emite éxito ni se cierra el formulario.
- Una respuesta 2xx no confirmada puede haber guardado otros campos: se informa expresamente. Se conserva el borrador, se bloquea el reenvío automático/accidental del formulario y se permite cancelar. Si se conoce el ID creado, el acceso “Review saved goal” abre su detalle existente para no crear un duplicado al reintentar ciegamente.
- Los errores HTTP normales conservan el manejo de autenticación, refresh y permisos existente. Un timeout de la escritura sin respuesta no se convierte en éxito; esta entrega no introduce un protocolo nuevo de idempotencia para POST.
- Las lecturas rechazan niveles no nulos desconocidos. Los badges que reciban un valor no soportado fuera del servicio muestran “Difficulty unavailable”, no “Sin dificultad”. Solo null/ausencia representa “Sin dificultad”.
- En el backend fuente ya existente, una actualización de un cliente antiguo con campo ausente o null conserva la dificultad. No se modifica esa regla ni Spring Security. Se añaden pruebas, no una modificación adicional al modelo productivo.

**Las selecciones ignoradas por el backend antiguo no pueden recuperarse desde una columna que no existía.** No se infieren ni se rellenan automáticamente. Tras activar el backend nuevo, habrá que editar esas metas y escoger explícitamente el nivel deseado.

## Corrección visual

- Goal Details Web: resumen compacto y rachas con superficie principal lavanda; métricas interiores lavanda elevada, bordes finos y acentos del tema. No cambian minutos, sesiones, registros o rachas.
- React Native: StreakCard, MetricCard y StudyAnalyticsDetails consumen `workspacePalette(theme)` en lugar de mezclar las superficies slate generales con las lavanda del workspace.
- Activity, Goals, Together e History comparten tratamiento de paneles, texto, badge y bordes. Se mantienen controles y navegación.
- Gráficos con hasta cuatro valores: filas horizontales compactas, con etiqueta y valor exacto visibles. Un cero conserva ancho cero.
- Series largas pero dispersas: se muestran los no cero y se avisa de ello. Todos los valores, incluidos los ceros, permanecen en “All N recorded values”. No se elimina información ni se inventan datos.
- Series densas: altura reducida (112 px de barras); scroll horizontal solo cuando los valores no caben conservando legibilidad y controles. Las series pequeñas ya no reservan un lienzo alto ni requieren ese scroll.
- No cambian endpoints de estadísticas, fórmulas, cohortes, zona horaria o ledger. `verifiedPeriod` sigue siendo el origen del gráfico principal; Study Journey mantiene las etiquetas de histórico y las reglas de cada pestaña documentadas en 7.4b.1.
- No se añaden widgets, escenarios, gamificación, arte, dependencias ni animaciones. Se conservan los modos, las cuatro paletas y Reduce Motion.

## Persistencia real y regresiones

### PostgreSQL desechable

Se ejecutó:

```bash
STUDYSTREAK_LEGACY_GOAL_JAR=/tmp/hotfix-active-app.jar scripts/test-goal-difficulty-backend.sh
```

**9 pruebas backend aprobadas**: GoalServiceTest, GoalDeletionServiceTest y dos casos de GoalDifficultyIntegrationTest. El runner crea y destruye su cluster en `/tmp`, base `studystreak_goal_difficulty_test`, puerto 55461.

- Backend nuevo: crear cada nivel, SQL/GET posterior, cambiar a HARD, listar, recargar mediante nueva petición, histórico null, PUT antiguo sin campo/null conservando dificultad, inválidos rechazados por API y CHECK, 401 y 403, migración repetible y secuencia preservada.
- Backend activo antiguo: segunda instancia **temporal** del JAR copiado, ligada a loopback/puerto 55462 y esquema `ss_audit_old_goals` dentro de la base desechable. POST EASY responde 201 pero POST/GET omiten dificultad. Su esquema no tiene columna. La secuencia requerida por su configuración antigua se prepara solo en ese esquema de fixture.
- Ninguna de las dos instancias de prueba se conecta a 5433 ni a `studystreak_local`. Los procesos de fixture terminan y el cluster se elimina.

### Clientes y UI

- Web/Mobile `goalWrite.test.mjs`: cuatro niveles, lectura autoritativa, servidor antiguo, discrepancia, ID incorrecto, lectura fallida, ausencia e inválidos no nulos.
- Web `goalDifficultyDashboard` y `goalWorkflows`: formulario bloqueado ante falso 2xx, borrador conservado, cuatro niveles, edición, confirmación, tags y navegación.
- Web `studySurfaceHotfix`: capturas antes/después, cuatro pestañas, cero/pocos/muchos datos, comparación de superficies calculadas y altura máxima de gráficos densos, matriz de 320/390/768/1440 y Dark/Light/System × cuatro paletas.
- Web `uiRendering` y regresiones recordAccess, validationAccess, studyActivity, apiTimeout aprobados. FocusStudioRendering: **7 casos aprobados**, incluido Chrome, por los componentes compartidos.
- Mobile: **7 archivos de regresión aprobados**: goalWrite, studyChartPresentation, goalsParity, mobilePolish, reviewNavigation, voicePlaybackLifecycle y mobileSessionIntegration.
- Recorridos Native Web aprobados: mobileGoalDifficulty, mobileGoalsParity, mobilePolish, mobileStudySurface y mobileDashboard. Cubren aviso ante backend antiguo, CRUD, tags/registros, navegación, temas y responsive. Se ajustó la espera de render del script al volver a Goals; no se cambió la navegación productiva.
- ESLint/TypeScript Web y Mobile, build Web y exportaciones Expo **Web/Android** aprobados. Build mantiene la advertencia conocida de chunk grande de Study Rooms; no se modifica ese módulo.
- No se afirma verificación en Android físico. Queda comprobar allí teclado, TalkBack y el aviso/retención de borrador, después de la activación local autorizada.

## Capturas comparativas

Fixtures de prueba, no datos personales. Comparaciones con el mismo recorrido y tamaños. Capturas Web y React Native Web inspeccionadas entre 320 y 1440 px. Se versiona una selección de 22 imágenes; los ceros y la serie densa son escenarios de comprobación, no registros añadidos al usuario.

| Vista | Antes | Después |
|---|---|---|
| Details web | [Antes](images/hotfix-goals-dashboard/before-details-web.png) | [Después](images/hotfix-goals-dashboard/after-details-web.png) |
| Activity web | [Antes](images/hotfix-goals-dashboard/before-activity-web.png) | [Después](images/hotfix-goals-dashboard/after-activity-web.png) |
| Goals web | [Antes](images/hotfix-goals-dashboard/before-goals-web.png) | [Después](images/hotfix-goals-dashboard/after-goals-web.png) |
| Together web | [Antes](images/hotfix-goals-dashboard/before-together-web.png) | [Después](images/hotfix-goals-dashboard/after-together-web.png) |
| History web | [Antes](images/hotfix-goals-dashboard/before-history-web.png) | [Después](images/hotfix-goals-dashboard/after-history-web.png) |
| Details mobile | [Antes](images/hotfix-goals-dashboard/before-details-mobile.png) | [Después](images/hotfix-goals-dashboard/after-details-mobile.png) |
| Activity mobile | [Antes](images/hotfix-goals-dashboard/before-activity-mobile.png) | [Después](images/hotfix-goals-dashboard/after-activity-mobile.png) |
| Goals mobile | [Antes](images/hotfix-goals-dashboard/before-goals-mobile.png) | [Después](images/hotfix-goals-dashboard/after-goals-mobile.png) |
| Together mobile | [Antes](images/hotfix-goals-dashboard/before-together-mobile.png) | [Después](images/hotfix-goals-dashboard/after-together-mobile.png) |
| History mobile | [Antes](images/hotfix-goals-dashboard/before-history-mobile.png) | [Después](images/hotfix-goals-dashboard/after-history-mobile.png) |

[Valores cero](images/hotfix-goals-dashboard/after-zero-web.png) · [Serie densa](images/hotfix-goals-dashboard/after-many-web.png).

## Operaciones locales necesarias — propuestas, NO ejecutadas

La persistencia de la aplicación habitual **no queda activada con los commits frontend**. Requiere autorización para estas operaciones, en este orden:

1. Volver a confirmar base/esquema y crear/verificar un respaldo recuperable de `studystreak_local`. Guardarlo fuera del volumen activo y comprobar restauración en una copia desechable antes de tocar el esquema.
2. Aplicar **solo** `2026-11-12_goal_difficulty.sql` a `public`, con ON_ERROR_STOP. Comprobar columna nullable, CHECK validado, metas históricas y secuencias.
3. Reconstruir y recrear **solo el servicio app**, preservando ambos archivos Compose, sus variables privadas y el bind de imágenes. El override actual mantiene JPA validate, auth init never y ledger init false: no deben habilitarse otras inicializaciones.
4. Comprobar salud, JAR nuevo y GET/POST/PUT con una cuenta y metas de pruebas autorizadas; no hacer backfill de dificultad.

Comandos concretos para los pasos 2–3, **únicamente tras esa autorización y respaldo verificado**:

```bash
# No se ha ejecutado este bloque.
docker exec -i studystreak-local-db-1 sh -c 'exec psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "SET search_path TO public" -f -' < src/main/resources/db/migrations/2026-11-12_goal_difficulty.sql

docker compose --env-file .env.docker.local -f compose.local.yaml -f compose.profile-images.local.yaml build app

docker compose --env-file .env.docker.local -f compose.local.yaml -f compose.profile-images.local.yaml up -d --no-deps --force-recreate app
```

No se necesita down, recrear db, eliminar volúmenes, sobrescribir .env, modificar AWS ni aplicar otras migraciones. Se detiene el trabajo antes de estas operaciones.

## Archivos y commits

- `0a76f7c` — `fix(goals): confirm difficulty persistence before reporting success`.
- `18032cd` — `fix(ui): unify study surfaces and compact recorded charts`.
- Informe y 22 PNG en un commit documental separado.

Archivos de los commits funcional y visual:

- `frontend-mobile/src/app/(app)/(main)/(menu)/goals/index.tsx`
- `frontend-mobile/src/app/(app)/goals/[goalId].tsx`
- `frontend-mobile/src/components/focus/StudyAnalyticsDetails.tsx`
- `frontend-mobile/src/components/goals/GoalDifficulty.tsx`
- `frontend-mobile/src/components/goals/GoalForm.tsx`
- `frontend-mobile/src/components/streaks/StreakCard.tsx`
- `frontend-mobile/src/components/study/BarChart.tsx`
- `frontend-mobile/src/components/study/MetricCard.tsx`
- `frontend-mobile/src/services/goalService.ts`
- `frontend-mobile/src/utils/apiError.ts`
- `frontend-mobile/src/utils/goalWrite.ts`
- `frontend-mobile/tests/goalWrite.test.mjs`
- `frontend-mobile/tests/mobileGoalDifficulty.browser.mjs`
- `frontend-mobile/tests/mobilePolish.browser.mjs`
- `frontend-mobile/tests/mobileStudySurface.browser.mjs`
- `frontend-mobile/tests/studyChartPresentation.test.mjs`
- `frontend-web/package.json`
- `frontend-web/src/components/academic/retro-workspace.css`
- `frontend-web/src/components/dashboard/StudyAnalyticsDetails.tsx`
- `frontend-web/src/components/goals/GoalDifficulty.tsx`
- `frontend-web/src/components/goals/GoalForm.tsx`
- `frontend-web/src/components/streaks/StreakCard.tsx`
- `frontend-web/src/components/study/BarChart.tsx`
- `frontend-web/src/components/study/MetricCard.tsx`
- `frontend-web/src/components/study/RecordedSummary.tsx`
- `frontend-web/src/pages/GoalDetails.tsx`
- `frontend-web/src/pages/Goals.tsx`
- `frontend-web/src/services/goalService.ts`
- `frontend-web/src/utils/apiError.ts`
- `frontend-web/src/utils/goalWrite.ts`
- `frontend-web/tests/goalDifficultyDashboard.test.mjs`
- `frontend-web/tests/goalWrite.test.mjs`
- `frontend-web/tests/studySurfaceHotfix.test.mjs`
- `frontend-web/tests/uiRendering.test.mjs`
- `src/test/java/com/example/studystreak/model/GoalDifficultyIntegrationTest.java`

Documentación: `docs/hotfix-goals-difficulty-dashboard.md` y `docs/images/hotfix-goals-dashboard/`.

Se preservan los 16 elementos ajenos originales, comprobados por SHA-256 y excluidos del staging. Sin push, merge, amend, reset, cambios privados o inicio de otra etapa.
