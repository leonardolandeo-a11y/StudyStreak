# Etapa 7.4b.1 — Dificultad de Goals y composición de Dashboard

Fecha: 2026-11-12. Rama: `feat/ui-ux-web-mobile`. Base: `642358c` / `e8a5912`.

**Implementación y pruebas aisladas terminadas. Activación local pendiente:** no se migró PostgreSQL persistente ni se reconstruyó/reemplazó su backend en ejecución. El selector requiere el nuevo backend y la columna migrada; no debe tomarse el backend antiguo como prueba de persistencia. No se cambian producción, AWS, Docker persistente ni archivos privados.

## Contrato de dificultad

| API | UI | Expresión | Significado visual |
|---|---|---|---|
| `TRIVIAL` | Intrascendente | Neutral | Gris |
| `EASY` | Fácil | Alegre | Verde |
| `INTERMEDIATE` | Intermedio | Seria | Ámbar |
| `HARD` | Difícil | Enojada | Rojo suave |
| `null` / campo ausente histórico | Sin dificultad | Neutral | Gris, sin nivel atribuido |

- `GoalDifficulty` es un enum persistido como STRING, con validación JSON estricta. No se aceptan nombres desconocidos, minúsculas, números, booleanos u objetos como niveles.
- `GoalRequestDTO` y `GoalResponseDTO` incorporan `difficulty`. POST/GET/PUT y el listado de `/users/{userId}/goals` conservan rutas y autorización.
- En creación, los clientes nuevos exigen elegir uno de los cuatro niveles. El backend permite ausencia/null para conservar compatibilidad con clientes antiguos; una meta histórica permanece “Sin dificultad”. No hay valor deducido de frecuencia, duración, progreso ni finalización.
- En PUT, ausencia o null **conserva** la dificultad existente. Un cliente antiguo no puede borrarla accidentalmente. Esta entrega no define una operación para limpiar una dificultad ya seleccionada; sí permite cambiarla entre los cuatro valores.
- Las reglas de propiedad de GoalController/GoalService siguen vigentes. No se modifican progreso, rachas, completed ni eventos de finalización más allá del campo independiente de dificultad.

Ejemplo del cuerpo existente ampliado:

```json
{"topic":"Álgebra","frequency":3,"duration":25,"completed":false,"difficulty":"INTERMEDIATE"}
```

## Migración propuesta y comprobada

`src/main/resources/db/migrations/2026-11-12_goal_difficulty.sql` sigue la convención manual de las migraciones recientes, sin instalar Flyway ni ejecutarla al iniciar mediante un mecanismo nuevo.

- Transacción explícita, columna `goal.difficulty varchar(16)` nullable, sin DEFAULT ni backfill.
- Restricción CHECK con los cuatro valores, inicialmente NOT VALID y después VALIDATE. Repetición segura mediante comprobación de columna/restricción existentes en la tabla del esquema seleccionado.
- No elimina tablas, relaciones, datos ni secuencias. No actualiza metas históricas para inventarles dificultad.
- La prueba reconstruye una tabla goal anterior al campo, inserta una meta histórica, aplica el SQL dos veces y verifica conservación de su fila, valores y secuencia.

El runner `scripts/test-goal-difficulty-backend.sh` crea un cluster nuevo de PostgreSQL 16 en un directorio `/tmp/studystreak-goal-difficulty.*`, ligado a `127.0.0.1:55461`, base `studystreak_goal_difficulty_test`, esquema `ss_audit_goals`. Lo detiene y elimina al terminar. No usa Docker ni lee credenciales privadas. El test fija también ese destino en sus propiedades para evitar heredar accidentalmente otra base. El puerto debe estar libre; si no lo está, el runner falla en lugar de reutilizar un servidor.

## Goals Web/Mobile

- Se mantienen los modales y el wizard de 7.4b; no se reconstruyen. Create/Edit incorporan radio-opciones con nombre, expresión accesible, carita original, color semántico y selección visible. Busy deshabilita los controles. El payload enviado y la lectura posterior incluyen dificultad.
- Tarjetas horizontales compactas con franja izquierda, carita de dificultad, título, planificación secundaria, estado y nombre del nivel. Las metas antiguas muestran “Sin dificultad”. No hay checkbox ni sprite de libros repetido en cada tarjeta.
- La identidad abre Goal Details. Focus se conserva como icono/acción hermana de esa zona, con nombre accesible; no propaga accidentalmente la navegación a detalles. Se elimina el gran pie repetido de Focus.
- Goal Details reduce la cabecera, muestra dificultad y destaca los totales reales. Web reutiliza `RecordedSummary compact`; Mobile reutiliza su modo embedded, destaca Daily Records y mantiene registros/evidencias debajo.
- Se preservan Update Goal, Study this Goal, View Tags/+, Resources, Study Rooms, eliminación confirmada, paginación y evidencias.
- Cinco sprites pequeños (cuatro niveles y neutral histórico) salen de `create-academic-sprites.mjs` → `assets/academic/sprites.json` → SVG Web/PNG Mobile mediante `generate-academic.mjs`. Los recursos anteriores permanecen idénticos; no hay dependencias nuevas, imágenes remotas, timers nuevos ni una View por píxel.

## Dashboard: origen y significado de los datos

Se revisó el controlador real: `/api/focus-sessions/stats` delega en **StudyAnalyticsService**, no en el antiguo FocusStatisticsService. Dashboard comparte una sola consulta por período entre gráfico, métricas y Study Journey.

| Dato / vista | Origen y período | Regla existente preservada |
|---|---|---|
| Gráfico principal 7/30 y sus totales | `verifiedPeriod` | Ledger COMPLETE, verified=true, fuente INDIVIDUAL/GROUP, por fecha de finalización en zona del usuario. Excluye histórico estimado, pausas y tiempo pendiente. |
| All-time recorded / completed | `totalMinutes`, `completedSessions` | Todas las entradas COMPLETE de toda la historia; puede incluir estimaciones históricas. |
| Desglose all-time | `verifiedMinutes`, `estimatedMinutes` | Separa verified=true/false de esas entradas completas; no se mezcla visualmente con el total verificado del gráfico principal. |
| Recorded in 7/30 / This week | `periodMinutes`, `periodSessions`, `weekMinutes` | Completadas por fecha de finalización; semana de lunes a hoy. Incluye histórico. |
| Recorded active days | `activeDays` | Días del período seleccionado con minutos registrados >0; incluye histórico. No es el número de días exclusivamente verificados. |
| Racha actual / Best recorded streak | `studyStreak`, `bestStudyStreak` | Días consecutivos con sesiones COMPLETE y segundos confirmados >0, todas las fuentes; mejor racha de toda la historia. No se recalcula en cliente. |
| Completion rate | `completionPercent` | Cohorte de intentos verificados **iniciados** en el período: completos / intentos. No usa la cohorte por fecha de finalización del gráfico. |
| Antiguo segundo gráfico Daily | `daily` | Tiempo registrado completo por finalización, incluye histórico. Sus valores diarios se conservan en el calendario de `activity`, que cubre esos 7/30 días y el resto del año. |
| Weekly / Monthly | `weekly`, `monthly` | Agrupaciones registradas del período seleccionado, con semanas/meses de borde parciales. Horas del contrato convertidas a minutos como antes. |
| Calendario | `activity` | Los 365 días proporcionados por el servidor, completos registrados por día; no una consulta adicional ni historial paginado. |
| When sessions finish | `hourly` | Minutos registrados del período agrupados por hora local de finalización. No representa asistencia minuto a minuto. |
| Goals / Together / comparación | `byGoal`, individual/group, previous/changePercent | ByGoal es all-time; Together y comparación son del período seleccionado/anterior. Se preservan sus secciones. |
| History / actividad reciente | `/api/study/history` | Intentos filtrados por **inicio**, con paginación y etiqueta verificado/histórico. Nunca se suman sus páginas para fabricar totales. |

### Reorganización justificada

1. El gráfico diario verificado permanece como protagonista con 7/30 y barras/líneas.
2. Se retira solamente el segundo gráfico **diario** de detalles. Aunque podía diferir por histórico, repetía una distribución diaria; sus valores registrados siguen accesibles por fecha en el calendario. No se borra información del contrato ni se altera el cálculo.
3. Weekly/Monthly permanecen en “Recorded trends · weekly / monthly”, cerrado inicialmente. Son agrupaciones complementarias, con advertencia de histórico y límites de período.
4. Días activos registrados, mejor racha y tasa de finalización permanecen porque significan cosas distintas. Se aclara su procedencia.
5. Se sustituye la tira anual con desplazamiento horizontal por navegación mensual sobre la misma serie anual. Web ofrece selector y anterior/siguiente; Mobile anterior/siguiente. Solo se muestran los días presentes en la respuesta: meses parciales no inventan datos fuera del período. Se conserva selección de fecha/valor y leyenda.
6. En escritorio Web, calendario y patrón horario comparten fila; Mobile los apila. Se conserva la jerarquía retro, temas y paletas. Los meses no provocan nuevas consultas; tampoco plegar/desplegar tendencias.

No se modifica StudyAnalyticsService, su SQL, los endpoints de estadísticas ni el ledger.

## Pruebas y revisión visual

- **Backend: 8 pruebas aprobadas**, mediante `scripts/test-goal-difficulty-backend.sh` (GoalServiceTest, GoalDeletionServiceTest y GoalDifficultyIntegrationTest).
- La integración HTTP/JPA/PostgreSQL real cubre crear los cuatro niveles, leerlos de SQL/GET, listarlos, cambiarlos, actualizar sin campo y con null sin borrarlo, una meta histórica, repetir migración, secuencia intacta, valores inválidos por JSON y CHECK, 401 sin JWT y 403 de otro propietario. No es persistencia simulada.
- **Web:** ESLint, TypeScript y build aprobados; se mantiene el aviso conocido de chunk grande de Study Rooms. `goalWorkflows` conserva modales, tags, Back/borrador y confirmación del wizard; `goalDifficultyDashboard` comprueba las cuatro creaciones simuladas, lectura tras reload, cambio y selección inicial de edición, Focus independiente, tendencias/calendario, ausencia de consultas duplicadas y matriz responsive/temas. recordAccess, validationAccess, uiRendering y studyActivity aprobados.
- **Mobile:** ESLint y TypeScript aprobados. Seis archivos de regresión aprobados: goalDifficultyRendering, goalsParity, mobilePolish, dashboardRendering, reviewNavigation y voicePlaybackLifecycle. Apariencia del selector/badges comprobada en Dark/Light/System × cuatro paletas.
- Chrome/React Native Web: mobileGoalDifficulty, mobileGoalsParity, mobilePolish y mobileDashboard aprobados. Incluyen payloads de los cuatro niveles, histórico, actualización, tags/registros CRUD, evidencias, navegación contextual, errores/retry y los dos gráficos principales. Al recargar RN Web se vuelve a autenticar la cuenta ficticia: sus tokens son deliberadamente de memoria. SecureStore nativo no se modifica.
- Exportaciones **Expo Web y Android aprobadas**, con API de fixture y artefactos ignorados bajo `.expo`. No se inicia compilación nativa ni se instala nada.
- Generadores `--check`, diff check y comparación SHA-256 de los 16 elementos ajenos aprobados.

Capturas de Web/RN Web inspeccionadas con API simulada en 320, 390, 768 y 1440 px, incluyendo selector, tarjetas, detalle, calendario y ausencia de desbordamiento. La matriz de Dashboard Mobile conserva además 1920 px y comprobaciones de temas/Reduce Motion. Los formularios heredados de 7.4b conservan SafeArea, teclado, cancelación y foco; no se afirma prueba en Android físico.

## Comparación antes/después

Los “antes” reutilizan capturas de la base aprobada sin cambios en estos módulos; los “después” se generaron durante esta entrega con fixtures. Las cantidades e identidades ficticias pueden diferir; sirven para comparar composición, no como prueba de métricas personales.

| Vista | Antes | Después |
|---|---|---|
| Goals Web | [Antes](images/retro-7-4b-difficulty/before-goals-web.png) | [Después](images/retro-7-4b-difficulty/after-goals-web.png) |
| Goal Details Web | [Antes](images/retro-7-4b-difficulty/before-details-web.png) | [Después](images/retro-7-4b-difficulty/after-details-web.png) |
| Dashboard Web | [Antes](images/retro-7-4b-difficulty/before-dashboard-web.png) | [Después](images/retro-7-4b-difficulty/after-dashboard-web.png) |
| Goals Native Web | [Antes](images/retro-7-4b-difficulty/before-goals-mobile.png) | [Después](images/retro-7-4b-difficulty/after-goals-mobile.png) |
| Goal Details Native Web | [Antes](images/retro-7-4b-difficulty/before-details-mobile.png) | [Después](images/retro-7-4b-difficulty/after-details-mobile.png) |
| Dashboard Native Web | [Antes](images/retro-7-4b-difficulty/before-dashboard-mobile.png) | [Después](images/retro-7-4b-difficulty/after-dashboard-mobile.png) |
| Journey Native Web | [Antes](images/retro-7-4b-difficulty/before-journey-mobile.png) | [Después](images/retro-7-4b-difficulty/after-journey-mobile.png) |

Vistas complementarias: [Journey Web](images/retro-7-4b-difficulty/after-journey-web.png), [selector Web](images/retro-7-4b-difficulty/selector-web.png), [selector Mobile](images/retro-7-4b-difficulty/selector-mobile.png), [tarjetas a 320](images/retro-7-4b-difficulty/goals-web-320.png), [calendario Mobile a 320](images/retro-7-4b-difficulty/journey-mobile-320.png).

## Activación local pendiente — no ejecutada

1. Con autorización para PostgreSQL persistente, identificar de nuevo contenedor/base/esquema y crear/verificar respaldo recuperable. No reutilizar ciegamente datos de otra sesión ni el runner de tests para operar la base habitual.
2. Revisar el SQL y aplicarlo **únicamente** al esquema local confirmado mediante una conexión explícita; `SET search_path` debe apuntar a ese esquema antes de ejecutar el archivo. Comprobar columna nullable, CHECK validado, conteos, metas antiguas y secuencias. No ejecutar otras migraciones.
3. Reconstruir y actualizar únicamente el backend local con estos commits, conservando variables, archivos privados e imágenes persistentes; no permitir que `ddl-auto=update` sustituya la migración revisada ni depender de él para instalar el CHECK.
4. Comprobar una meta propia con dificultad, recarga y edición utilizando una cuenta de pruebas autorizada. Reiniciar Expo Go y verificar recuperación desde GET; cancelar no debe escribir. Revisar TalkBack/teclado Android, tamaños de fuente y SafeArea con los cuatro niveles.
5. No se requieren cambios de cliente API, secretos, JWT, Docker persistente ni permisos adicionales de lectura de metas.

Esta entrega valida persistencia real en el entorno desechable; **no certifica que el backend local antiguo ya la acepte**. Los pasos anteriores requieren una autorización posterior para modificar el entorno habitual. No se han ejecutado contra él.

## Commits y archivos

- `0159b02` — `feat(goals): persist difficulty with legacy-safe updates`.
- `a0f68ff` — `feat(ui): add goal difficulty and streamline study analytics`.
- Documentación y 19 capturas en un commit separado, sin amend.

Archivos backend:

- `scripts/test-goal-difficulty-backend.sh`
- `src/main/java/com/example/studystreak/dto/Goal/GoalRequestDTO.java`
- `src/main/java/com/example/studystreak/dto/Goal/GoalResponseDTO.java`
- `src/main/java/com/example/studystreak/model/Goal.java`
- `src/main/java/com/example/studystreak/model/GoalDifficulty.java`
- `src/main/java/com/example/studystreak/service/GoalService.java`
- `src/main/resources/db/migrations/2026-11-12_goal_difficulty.sql`
- `src/test/java/com/example/studystreak/model/GoalDifficultyIntegrationTest.java`

Archivos UI y pruebas:

- `assets/academic/sprites.json`
- `frontend-mobile/src/app/(app)/(main)/(menu)/goals/index.tsx`
- `frontend-mobile/src/app/(app)/goals/[goalId].tsx`
- `frontend-mobile/src/components/academic/spriteImages.ts`
- `frontend-mobile/src/components/academic/sprites.ts`
- `frontend-mobile/src/components/focus/StudyAnalyticsDetails.tsx`
- `frontend-mobile/src/components/goals/GoalForm.tsx`
- `frontend-mobile/src/types/goal.ts`
- `frontend-mobile/tests/helpers/appearanceNativeMock.mjs`
- `frontend-mobile/tests/mobileDashboard.browser.mjs`
- `frontend-mobile/tests/mobileGoalsParity.browser.mjs`
- `frontend-mobile/tests/mobilePolish.browser.mjs`
- `frontend-web/package.json`
- `frontend-web/src/components/academic/sprites.ts`
- `frontend-web/src/components/dashboard/StudyAnalyticsDetails.tsx`
- `frontend-web/src/components/goals/GoalCard.tsx`
- `frontend-web/src/components/goals/GoalForm.tsx`
- `frontend-web/src/pages/GoalDetails.tsx`
- `frontend-web/src/types/goal.ts`
- `frontend-web/tests/goalWorkflows.test.mjs`
- `scripts/create-academic-sprites.mjs`
- `frontend-mobile/assets/academic/difficultyEasy.png`
- `frontend-mobile/assets/academic/difficultyHard.png`
- `frontend-mobile/assets/academic/difficultyIntermediate.png`
- `frontend-mobile/assets/academic/difficultyNone.png`
- `frontend-mobile/assets/academic/difficultyTrivial.png`
- `frontend-mobile/src/components/dashboard/RecordedCalendar.tsx`
- `frontend-mobile/src/components/goals/GoalDifficulty.tsx`
- `frontend-mobile/tests/goalDifficultyRendering.test.mjs`
- `frontend-mobile/tests/mobileGoalDifficulty.browser.mjs`
- `frontend-web/public/academic/difficultyEasy.svg`
- `frontend-web/public/academic/difficultyHard.svg`
- `frontend-web/public/academic/difficultyIntermediate.svg`
- `frontend-web/public/academic/difficultyNone.svg`
- `frontend-web/public/academic/difficultyTrivial.svg`
- `frontend-web/src/components/dashboard/RecordedCalendar.tsx`
- `frontend-web/src/components/goals/GoalDifficulty.tsx`
- `frontend-web/src/components/goals/difficulty.css`
- `frontend-web/tests/goalDifficultyDashboard.test.mjs`

Documentación: este archivo y `docs/images/retro-7-4b-difficulty/` (19 PNG).

Quedan únicamente los 16 elementos ajenos preexistentes sin confirmar. No hay push, merge, amend, reset ni inicio de otra etapa.
