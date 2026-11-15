# Precisión de observaciones Pomodoro — corrección previa a Etapa 3

Alcance: acumulación de tiempo confirmado en Study Ledger, migración aditiva y
pruebas. No se modifican UI, Dashboard, temporizador/audio del frontend,
autenticación ni reglas de acreditación. El rediseño visual sigue pendiente.

## Defecto reproducido antes de cambiar el algoritmo

Una sesión real de cinco minutos en PostgreSQL desechable terminó COMPLETE y
verified=true con `observed_ms=299985` y `confirmed_seconds=240`. Focus Studio y
Dashboard mostraban de forma consistente 4 minutos/1 sesión: el error ocurría
al acumular tiempo en el backend, no al presentar las estadísticas.

La prueba determinista reproduce exactamente los 15 ms: 29 pulsos en
`inicio + i*10 s + i*0.5 ms` y un pulso final exacto a 300 s, todos dentro del
límite permitido. Sumar `Duration.between(...).toMillis()` por intervalo produce
299985 ms, aunque el intervalo total mide exactamente 300000 ms.

Se descartó restar `toEpochMilli()` de los extremos: un intervalo real de
299999.8 ms puede convertirse en 300000 ms. También se demostró que tras pausas
grupales dos historias con restos distintos podían dejar los mismos campos
persistidos y necesitar acreditaciones diferentes. Sin guardar el resto no se
podía resolver el problema respetando los umbrales estrictos.

## Modelo y algoritmo

Se comprobó en PostgreSQL 17 que `started_at`, `last_seen_at` y `ends_at` son
`timestamptz` con `datetime_precision=6`. El reloj usado por StudyLedgerService
se obtiene de PostgreSQL y devuelve instantes alineados a microsegundos.

El ledger utiliza JDBC; **no existe una entidad JPA de study_ledger** que deba
modificarse o introducirse. La migración y el servicio mantienen este modelo:

```text
tiempo observado en µs = observed_ms * 1000 + observed_remainder_us
0 <= observed_remainder_us <= 999
```

Para cada intervalo elegible se suma la diferencia exacta en microsegundos,
limitada por el deadline y el máximo planificado. Se persisten el cociente en
milisegundos y el resto en la misma actualización/transacción. Los bloqueos
existentes de usuario/ledger siguen serializando operaciones concurrentes.

Las pausas y desconexiones no suman tiempo; conservan lo ya observado, incluido
su resto. La reanudación individual calcula el deadline a partir del tiempo
restante exacto en microsegundos. No se guarda precisión solo en memoria:
sobrevive a recargas desde JDBC, otra instancia del servicio y reinicios.

La finalización conserva la fórmula descendente existente de minutos completos:
`confirmed_seconds = (observed_ms / 60000) * 60`. El resto menor de un milisegundo
no puede completar un minuto que aún no se observó. Se conservan el mínimo de
60 segundos confirmados, los estados COMPLETE/CANCELLED, la exclusión de descansos,
la política existente de pulsos/desconexión y la idempotencia.

La misma función de observación se usa en sesiones individuales y grupales.
La columna auxiliar se elimina de las respuestas start/pulse/active/completion;
selection/history ya enumeran columnas explícitas. No cambia el contrato REST.
Los resúmenes siguen leyendo `confirmed_seconds` y `verifiedPeriod` sigue
incluyendo únicamente COMPLETE, verified=true e INDIVIDUAL/GROUP.

## Migración

Archivo:
`src/main/resources/db/migrations/2026-11-06_preserve_observation_precision.sql`.

- Añade `observed_remainder_us SMALLINT NOT NULL DEFAULT 0`.
- CHECK limita el resto a 0–999 y exige cero cuando se alcanza el máximo de ms.
- No actualiza tiempos, estados, IDs, metas ni finalizaciones históricas.
- Usa la misma exclusión mutua de migración del ledger y es repetible.
- Las filas existentes comienzan con resto cero: el tiempo fraccionario perdido
  por versiones anteriores **no puede reconstruirse**. No se inventa ni se
  acredita retroactivamente. Esto también afecta a intentos activos preexistentes.

Con `study-ledger.migrate-on-start=true`, StudyLedgerSchema ejecuta primero el
script de creación del ledger y después esta migración. Con `false`, solo
comprueba por lectura que la tabla y la nueva columna existen: el backend nuevo
**no puede arrancar contra un esquema antiguo sin aplicar antes la migración**.
Hibernate validate por sí solo no valida esta tabla JDBC; la comprobación explícita
se realiza en `studyLedgerSchemaReady`, antes de los servicios que la consumen.

## Entorno de pruebas y conservación de datos

Se aplicó exclusivamente en `studystreak-schema-check-db-1`, base
`studystreak_schema_check`, puerto `55436`, esquemas `public` y
`ss_audit_backend_tests`. Docker confirmó tmpfs y ausencia de montajes persistentes.
Los hashes JSON de todas las filas, excluyendo la columna añadida, coincidieron
antes/después en ambos esquemas. Los históricos de la reproducción de 4 minutos
se conservan sin cambiar su acreditación.

Las pruebas nuevas de integración verifican base/esquema antes de insertar y
usan transacciones con rollback. Las pruebas de migración crean y retiran solo
sus esquemas aleatorios dentro de esa base desechable. Se comprueban migración
repetida, conservación de históricos, constraints, detección del esquema antiguo
y bootstrap desde un esquema nuevo.

No se aplicó la migración a `studystreak_local`, su volumen
`studystreak_local_postgres_data_v1`, AWS ni producción. No se sustituyó el jar ni
se reinició el backend habitual de localhost:8080 durante esta corrección.
Se comprobó por lectura que su nueva columna sigue ausente. El hash global del
ledger local cambió al aparecer una sesión nueva de 25 minutos durante el uso del
entorno habitual; el hash de todos los registros preexistentes siguió idéntico.
Esa sesión no pertenece a las pruebas de cinco minutos del entorno desechable.
No se realizaron escrituras de prueba ni DDL contra la base persistente.

## Verificación

Pruebas unitarias, sin Spring ni base de datos:

```bash
./mvnw -o -Dtest=StudyObservationPrecisionTest test
```

**8 tests correctos**: reproducción exacta de 15 ms y conservación de 300000 ms;
umbral inferior; 8000 pulsos submilisegundo; restos a través de pausa grupal;
reloj hacia atrás; desconexión; pausa sin crédito, límite del deadline, límite exacto de 35 s y repetición del mismo instante.

Suite completa sobre la conexión desechable previamente migrada:

```bash
./mvnw -o test
./mvnw -o -DskipTests package
```

Requiere variables de conexión del entorno desechable, perfil `local`,
`APP_DB_SCHEMA=ss_audit_backend_tests`, `STUDYSTREAK_POSTGRES_INTEGRATION=true`,
`SPRING_JPA_HIBERNATE_DDL_AUTO=validate`, `SPRING_SQL_INIT_MODE=never`,
`APP_AUTH_SCHEMA_INIT=never`, `STUDY_LEDGER_MIGRATE_ON_START=false` y JWT/correo de
prueba. No ejecutar la suite contra la base persistente.

**202 tests correctos, 0 fallos, 0 errores y 0 omitidos**, incluido el flujo
individual, grupo, concurrencia, idempotencia y reinicio existentes; nueve casos
nuevos de integración de precisión/migración. El primer intento de los nuevos
fixtures tuvo un error de sobrecarga por inferencia de tipos al invocar reflexión;
se corrigió el fixture y se repitió la suite completa con éxito.

La integración real usa el jar corregido en 18083 y Vite temporal en 5177, con
una cuenta/meta sintéticas nuevas. El temporizador se ejecuta cinco minutos
reales en Chrome, con los pulsos originales, sin acelerar el reloj ni insertar
observed_ms o estados mediante SQL. Durante RUNNING los totales deben seguir en
0/0; al finalizar se comparan resumen de meta, FocusInsights, Dashboard 7/30,
reintentos y un intento posterior pausado/reanudado/cancelado.

Resultado real: **300 segundos confirmados, 5 minutos y 1 sesión**. El resumen
de la meta, Focus Studio/FocusInsights y Dashboard 7/30 recibieron esos mismos
valores. Los reintentos no añadieron tiempo ni sesiones; el intento posterior
pausado/reanudado y cancelado terminó con cero segundos confirmados, manteniendo
el total en 5 minutos/1 sesión. No hubo excepciones JavaScript.

El primer guion leyó el estado inmediatamente después de enviar PAUSE y antes
de su confirmación HTTP, produciendo una aserción prematura. Se completó esa
parte esperando la confirmación efectiva del servidor, sin repetir ni inventar
la sesión de cinco minutos. Las comprobaciones de precisión de la sesión real
y de las dos pantallas ya habían pasado antes de ese fallo del guion.

## Aplicación posterior al entorno habitual — NO ejecutada

Se necesita una autorización posterior para modificar la base persistente.
Antes de hacerlo, identificar de nuevo base/esquema/volumen, crear un respaldo
completo fuera del volumen y verificar su restauración en una base desechable,
según el procedimiento de [respaldo local](respaldo-local-2026-11-06.md).
No sobrescribir los respaldos anteriores.

Con respaldo verificado y autorización, estos comandos se ejecutan desde la
raíz del repositorio. La carpeta de respaldo del jar debe ser nueva:

```bash
./mvnw -o -DskipTests package
mkdir -p .local/backups/precision-backend
# Usar un nombre nuevo si este archivo ya existe.
docker cp studystreak-local-app-1:/app/app.jar .local/backups/precision-backend/app-before-fix.jar

docker compose --env-file .env.docker.local -f compose.local.yaml stop app

docker exec -i studystreak-local-db-1 psql -X -v ON_ERROR_STOP=1 \
  -U studystreak_local -d studystreak_local \
  -c 'SET search_path TO public' -f - \
  < src/main/resources/db/migrations/2026-11-06_preserve_observation_precision.sql

docker exec studystreak-local-db-1 psql -X -v ON_ERROR_STOP=1 \
  -U studystreak_local -d studystreak_local \
  -c "SELECT column_name,data_type,column_default,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='study_ledger' AND column_name='observed_remainder_us';"

docker cp target/StudyStreak-0.0.1-SNAPSHOT.jar studystreak-local-app-1:/app/app.jar
docker compose --env-file .env.docker.local -f compose.local.yaml start app
```

Este procedimiento conserva el contenedor, la configuración externa y el volumen;
no elimina ni recrea datos. Mantener `LOCAL_DB_DDL_AUTO=validate`,
`LOCAL_AUTH_SCHEMA_INIT=never` y `LOCAL_LEDGER_SCHEMA_INIT=false`. No hace falta
modificar frontend ni `.env.local`. Una futura reconstrucción del contenedor debe
usar el código que incluye esta corrección, después de la migración explícita.

## Evidencia local

En `.local/ui-stage3/`, ignorado por Git: reproducción original, pruebas SELECT,
`fraction-migration-results.json` y `fraction-browser-results.json`. Las sesiones
sintéticas están en archivos ignorados con permisos 0600; no publicar esos archivos.
Logs actuales: `/tmp/studystreak-fraction-unit.log`,
`/tmp/studystreak-fraction-backend-tests.log`,
`/tmp/studystreak-fraction-package.log`, `/tmp/studystreak-fraction-browser.log`.
Los 17 archivos preexistentes ajenos se conservan por hash y no se incluirán en
el commit de esta corrección.
