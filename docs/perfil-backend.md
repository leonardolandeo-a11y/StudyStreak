# Perfil privado: backend

## Parte A — datos y estadísticas

`GET /api/profile` y `PATCH /api/profile` utilizan al usuario autenticado.
No existe parámetro de propietario ni edición de identidad. Se mantienen intactos
PATCH /users/{userId}, JWT, username, email, permisos y contraseña.

PATCH acepta únicamente displayName y bio:

- Campo ausente: conserva el valor; null: lo elimina; objeto vacío: no modifica.
- displayName: hasta 60 valores escalares Unicode tras quitar espacios exteriores
  Unicode. Vacío pasa a null. Sin caracteres de control ni Unicode mal formado.
- bio: hasta 300 valores escalares Unicode. Conserva texto, HTML literal, saltos
  de línea y tabulaciones; vacío pasa a null. Rechaza NUL y controles no textuales.
- La validación es atómica: un campo inválido impide guardar todo el PATCH.

La respuesta incluye id, username, displayName/bio opcionales, presentationName
(displayName o username como fallback) y statistics:

- studyStreak/bestStudyStreak: definición existente de Study Ledger, que incluye
  históricos estimados. **No son rachas exclusivamente verificadas** ni rachas
  de Daily Records aprobados. Se reutiliza StudyAnalyticsService sin alterarlo.
- verifiedMinutes/verifiedSessions: totales vitalicios de COMPLETE, verified=true,
  source INDIVIDUAL o GROUP; agregación de confirmed_seconds antes de dividir por
  60, sin duración planificada ni duplicación por joins. Excluye LEGACY incluso
  si se encuentra marcado verified, y excluye RUNNING/PAUSED/CANCELLED.
- activeGoals: metas del usuario con completed=false.

## Migración manual

`src/main/resources/db/migrations/2026-11-07_add_user_profile.sql` añade únicamente
users.display_name varchar(60) y users.bio varchar(300), ambos nullable. Puede
repetirse; no escribe nombres inventados, sesiones, datos históricos ni secuencias.

**No se ha aplicado a la base local habitual.** Un backend actualizado con
Hibernate validate necesita estas columnas antes de arrancar. No iniciar el jar
nuevo contra esa base hasta revisar y autorizar su migración con respaldo previo.
Hibernate update también puede ejecutar DDL: no utilizarlo para saltarse esa
aprobación. Esta funcionalidad no añade migración automática al arranque.

Cuando exista autorización específica para un destino, detener únicamente la
aplicación que lo utiliza, verificar/restaurar un respaldo en un destino aislado,
seleccionar explícitamente el esquema y ejecutar el SQL con ON_ERROR_STOP. Después
arrancar con ddl-auto=validate y las inicializaciones generales desactivadas.
Ejemplo de ejecución manual posterior (no ejecutarlo todavía en el entorno habitual):

```bash
PGOPTIONS='-c search_path=public' psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f src/main/resources/db/migrations/2026-11-07_add_user_profile.sql
```

## Pruebas aisladas

El script scripts/test-profile-backend.sh fija la conexión exclusivamente a
127.0.0.1:55437, base studystreak_schema_check, esquema ss_audit_profile, credenciales
sintéticas y almacenamiento de pruebas separado. No lee .env ni credenciales reales.
Crear previamente un PostgreSQL 17 desechable con tmpfs, sin volúmenes existentes,
y ese esquema. Las pruebas que escriben comprueban base y esquema de auditoría.

```bash
scripts/test-profile-backend.sh -Dtest=ProfileTextTest,ProfileIntegrationTest test
scripts/test-profile-backend.sh test
```

El test de migración crea su propio esquema de prueba, aplica el SQL dos veces y
comprueba filas anteriores, históricos y una secuencia ajena sin alterarlos.
Las pruebas HTTP usan puerto aleatorio y cuentas sintéticas; no generan datos en
studystreak_local ni acceden al servicio habitual en 8080.
