# Etapa 2 — Auditoría de datos del Dashboard

Estado: ampliación aditiva autorizada e implementada. Esta auditoría explica
por qué el Dashboard necesita `verifiedPeriod` en lugar de reutilizar `daily`.

## Preparación y alcance

- Rama: `feat/ui-ux-web-mobile`; base visual: `520b218`.
- Solo se modifica el servicio de lectura, sus tests aislados y este documento.
- Los 17 archivos preexistentes ajenos permanecen intactos.
- No se crean tablas, migraciones ni cambios de esquema. No se cambia el ledger,
  autenticación, autorización, Docker, Google Books ni mobile.

## Componentes y fuentes existentes

`frontend-web/src/pages/Dashboard.tsx` consume `useAuth`,
`useUnreadNotifications`, `SummaryCard` y `dashboardService`. Muestra resúmenes
de metas, rachas de registros, validaciones y registros, Your Study Flow y la
tarjeta Account. No tiene todavía el gráfico Pomodoro solicitado.

`FocusInsights.tsx` y `StudyAnalyticsDetails.tsx` ya consumen
`focusStatisticsService.ts`, con filtros 7/30 días, cancelación mediante
AbortController, actualización periódica y gráficos existentes `BarChart`.
Hay componentes reutilizables `MetricCard`, estados de UI y servicios de metas
activas. Esas piezas son candidatas de reutilización, sin cambiar sus reglas.

El endpoint de estadísticas vigente es
`GET /api/focus-sessions/stats?days=7|30`. Su controlador utiliza
**StudyAnalyticsService**, no el antiguo FocusStatisticsService. Los tests de
FocusStatisticsService no bastan para demostrar el contrato de ese endpoint.

## Semántica de Study Ledger

Fuentes inspeccionadas:

- `src/main/java/com/example/studystreak/service/StudyAnalyticsService.java`.
- `src/main/java/com/example/studystreak/service/StudyLedgerService.java`.
- `src/main/resources/db/study-tracking-v3.sql` (solo lectura).
- `src/test/java/com/example/studystreak/model/StudyLedgerIntegrationTest.java`.

La migración histórica registra `focus_session` como `source=LEGACY`,
`state=COMPLETE`, `verified=false`, con minutos estimados. Las nuevas sesiones
individuales y grupales utilizan `verified=true` por defecto. El tiempo
confirmado se almacena en `confirmed_seconds`; no debe sustituirse por duración
planificada, tiempo local del temporizador ni estados pendientes de sincronizar.

La finalización acredita minutos observados y deja como CANCELLED los intentos
sin el mínimo requerido. Las rondas grupales se registran en fase FOCUS, no en
descanso. RUNNING, PAUSED y CANCELLED no deben entrar en los totales del gráfico.
Para la separación explícita solicitada, la serie debe filtrar COMPLETE y
verified=true, con fuentes INDIVIDUAL/GROUP, excluyendo las estimaciones LEGACY.

## Datos disponibles y limitaciones

| Dato actual | Alcance real | Consecuencia |
|---|---|---|
| `days`, `timeZone` | 7/30 días y zona del usuario, resueltos por el servidor | Aptos para filtros y etiquetas; no reconstruir fechas en la zona del navegador |
| `daily[].date/minutes/sessions` | Días completos de la ventana, incluidos ceros; COMPLETE por fecha local de finalización, sin filtrar verified | Mezcla sesiones verificadas y estimaciones históricas |
| `periodMinutes`, `periodSessions` | COMPLETE dentro de la ventana de finalización, sin filtrar verified | No son totales exclusivamente verificados |
| `verifiedMinutes`, `estimatedMinutes` | Acumulados de toda la historia | No permiten separar cada día o periodo |
| `averageMinutes` | Minutos del periodo divididos entre sesiones | No es el promedio diario solicitado |
| `studyStreak`, `bestStudyStreak` | Días consecutivos con COMPLETE y tiempo positivo, en la zona del usuario, incluidos históricos | Se pueden mostrar con su definición original; la racha actual no depende del filtro 7/30 |
| `/api/dashboard/streaks` | Resumen de rachas asociadas a Daily Records/metas | No sustituye una racha de sesiones Pomodoro |
| `/api/study/history?from&to&page` | Filtra por started_at, devuelve 25 intentos por página y estado/verified/completed_at | No garantiza cubrir todas las sesiones finalizadas en la ventana elegida |

La inclusión de LEGACY en la serie diaria está confirmada además por el test
existente `midnightAggregatesAndGoalDeletionPreserveHistoricalTotals`: construye
históricos con verified=false, obtiene verifiedMinutes=0 y aun así espera
minutos positivos en daily. Es evidencia del comportamiento intencional actual,
no un fallo que esta tarea de UI deba corregir silenciosamente.

No se puede restar `estimatedMinutes` al total de cada día: ese campo es global
y no indica cuándo se completó el tiempo estimado. Una cuenta nueva sin LEGACY
podría producir una serie adecuada, pero eso no demuestra corrección para todas
las cuentas y no autoriza presentar estadísticas mezcladas como verificadas.

## Por qué el historial no resuelve el problema en frontend

Una sesión que comienza antes del primer día y termina dentro del periodo debe
contabilizarse por completed_at en la zona del usuario. El historial solicitado
para ese mismo periodo la omite porque filtra started_at.

Descargar todas las páginas de esa ventana no recupera las filas omitidas.
Tampoco basta consultar arbitrariamente uno o varios días adicionales: las
sesiones individuales pueden pausarse y reanudarse, no existe un límite de
duración de calendario equivalente a su duración planificada. La ventana máxima
de cada consulta de historial es 366 días y no hay un filtro por finalización.
Recorrer toda la historia de la cuenta sería desproporcionado y no ofrece el
snapshot único que ya proporciona el endpoint agregado de estadísticas.

## Contrato aditivo implementado

El endpoint existente conserva sus campos y significados para los clientes
actuales y agrega el bloque `verifiedPeriod`:

```text
verifiedPeriod.minutes
verifiedPeriod.sessions
verifiedPeriod.daily[].date
verifiedPeriod.daily[].minutes
verifiedPeriod.daily[].sessions
```

El bloque se agrega dentro de la misma transacción REPEATABLE_READ del reporte:

1. Utilizar el mismo usuario autenticado, reloj del servidor, days y timeZone.
2. Filtrar `state='COMPLETE' AND verified=true` y fuentes INDIVIDUAL/GROUP.
3. Acotar por completed_at con inicio inclusivo y fin exclusivo, en los mismos
   límites locales que utiliza el reporte actual.
4. Sumar confirmed_seconds y convertir a minutos sin redondeos de presentación
   prematuros; contar sesiones y devolver exactamente 7/30 días, incluidos ceros.
5. Mantener invariantes: el total de minutos/sesiones coincide con la suma de
   sus respectivos días. No mezclar otros periodos o snapshots.

La extensión reutiliza columnas e índices existentes. No requiere migraciones,
tablas nuevas ni cambios en cálculo del ledger o reglas de finalización. La modificación de lectura de Spring Boot fue autorizada específicamente.
No cambia el significado de daily/periodMinutes ni las estadísticas anteriores
de web/mobile.

Con ese bloque, el frontend puede calcular correctamente el promedio diario
como `verifiedPeriod.minutes / days`, contando días sin actividad. La tarjeta de
racha utilizaría studyStreak, con etiqueta de racha actual y su definición real;
no se recalcularía ni se filtraría por la ventana del gráfico.

## Cobertura de regresión

- Mezcla de sesiones verificadas e históricas: solo las primeras en el bloque nuevo.
- Exclusión de RUNNING/PAUSED/CANCELLED y conservación de campos existentes.
- Sesión iniciada antes de la ventana y finalizada dentro: incluida.
- Finalización en medianoche, límites del periodo y zona horaria del usuario.
- Ventanas 7/30 completas, días sin actividad, cuenta sin datos y metas eliminadas.
- Sesiones individuales y de grupo; tiempo confirmado menor al planificado.
- Suma de días igual al total del mismo snapshot y compatibilidad de clientes actuales.

## Precisión y compatibilidad

La consulta agrupa `confirmed_seconds` enteros por fecha local. El total se
obtiene sumando esos mismos segundos y contadores diarios, dentro del mismo
snapshot. La conversión final usa BigDecimal/DECIMAL128 (34 cifras), sin redondear
cada sesión a minutos. Las fracciones periódicas de minuto tienen la precisión
decimal indicada; las comparaciones numéricas de clientes deben usar tolerancia.
El promedio diario del Dashboard será `verifiedPeriod.minutes / days`, sin
reutilizar `averageMinutes`, que sigue siendo el promedio por sesión existente.

Los consumidores anteriores ignoran el campo adicional. Los nuevos clientes
no deben sustituirlo silenciosamente por `daily` si un servidor antiguo no lo
expone: deben mostrar estadísticas verificadas no disponibles.

## Verificación aislada

Resultado: **185 tests, 0 fallos, 0 errores, 0 omitidos**, incluidos 11 casos
nuevos en `VerifiedPeriodIntegrationTest` y las regresiones de Study Ledger,
autenticación, estadísticas anteriores y colaboración grupal.

Se utilizó exclusivamente el contenedor desechable
`studystreak-schema-check-db-1`, PostgreSQL en `127.0.0.1:55436`, base
`studystreak_schema_check`, esquema de fixtures `ss_audit_backend_tests`.
Su almacenamiento es tmpfs; no tiene montajes persistentes. Los tests nuevos
verifican explícitamente base/esquema antes de insertar y revierten sus fixtures
mediante transacciones. No apuntar estas pruebas a la base local persistente.

Con el esquema de pruebas previamente inicializado, ejecutar `./mvnw -o test`
con las variables de conexión de esa base desechable, perfil `local`,
`STUDYSTREAK_POSTGRES_INTEGRATION=true`, `APP_DB_SCHEMA=ss_audit_backend_tests`,
`SPRING_JPA_HIBERNATE_DDL_AUTO=validate`, `SPRING_SQL_INIT_MODE=never`,
`APP_AUTH_SCHEMA_INIT=never` y `STUDY_LEDGER_MIGRATE_ON_START=false`, además de
JWT y correo de prueba. La suite existente incluye sus propias comprobaciones
de inicialización en esquemas desechables; no debe usarse contra datos reales.

La primera ejecución falló por un fixture que violaba la restricción de una
sesión activa por usuario. Se separaron los casos RUNNING/PAUSED/CANCELLED,
sin cambiar esa restricción ni las reglas de negocio; la suite completa pasó.
