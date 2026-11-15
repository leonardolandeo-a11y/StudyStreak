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

**Aplicada posteriormente al entorno local con autorización y respaldo.** Véase
[Activación local](perfil-local.md). En otros destinos todavía requiere autorización. Un backend actualizado con
Hibernate validate necesita estas columnas antes de arrancar. No iniciar el jar
nuevo contra esa base hasta revisar y autorizar su migración con respaldo previo.
Hibernate update también puede ejecutar DDL: no utilizarlo para saltarse esa
aprobación. Esta funcionalidad no añade migración automática al arranque.

Cuando exista autorización específica para un destino, detener únicamente la
aplicación que lo utiliza, verificar/restaurar un respaldo en un destino aislado,
seleccionar explícitamente el esquema y ejecutar el SQL con ON_ERROR_STOP. Después
arrancar con ddl-auto=validate y las inicializaciones generales desactivadas.
Ejemplo manual para otros destinos autorizados (no repetirlo en local por inercia):

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

## Parte B — avatar y banner privados

| Ruta | GET | PUT | DELETE |
| --- | --- | --- | --- |
| /api/profile/avatar | Imagen propia, 200; ausente, 404 | Crear o reemplazar, 204 | Eliminar, 204 (idempotente) |
| /api/profile/banner | Imagen propia, 200; ausente, 404 | Crear o reemplazar, 204 | Eliminar, 204 (idempotente) |

Las seis operaciones requieren JWT y usan exclusivamente el propietario autenticado.
No hay rutas públicas ni parámetros para elegir otra cuenta. Los clientes deben
obtener las imágenes mediante fetch con Authorization y crear una URL de objeto
local, revocándola al dejar de usarla; una etiqueta img por sí sola no añade JWT.
No colocar tokens en URLs.

PUT recibe **bytes directamente**, no multipart ni JSON/base64. Content-Type debe
ser image/png, image/jpeg o image/webp; no se recibe un nombre de archivo.
Ejemplo posterior contra un backend de pruebas ya migrado, con un token propio:

```bash
curl --fail-with-body -X PUT "$API_URL/api/profile/avatar" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: image/png' \
  --data-binary @avatar.png
```

No activar curl --verbose/--trace ni registrar Authorization. El límite es de
2 MiB (2 097 152 bytes) para avatar y 5 MiB (5 242 880 bytes) para banner. Los bytes
se leen con límite antes de decodificar; el límite multipart anterior de evidencias
no cambia. Se verifica formato real, integridad del contenedor y decodificación de
píxeles. Se rechazan errores/advertencias del decodificador, MIME discordante,
archivos truncados, SVG/HTML y dimensiones superiores a 8192 por lado o 16 millones
de píxeles. Máximo dos decodificaciones simultáneas; una saturación devuelve 503
para reintentar. No se promete conservar ni interpretar animaciones.

Java no incluye decodificador WebP: se incorpora exclusivamente TwelveMonkeys
imageio-webp 3.15.3, sin programas nativos ni servicios externos. Las imágenes de
prueba son pequeños fixtures sintéticos PNG/JPEG/WebP, sin fotografías personales.
Se sigue el patrón de evidencias de resolver propietario en servidor y limitar
bytes/formato; no se modifica DailyRecordPhotoService ni su almacenamiento.

Errores: 400 contenido inválido/corrupto o MIME discordante; 401 sin autenticación;
404 imagen ausente; 413 exceso de bytes; 415 Content-Type no admitido; 503
almacenamiento no disponible o decodificador ocupado. Las respuestas de lectura
incluyen el tipo real, Cache-Control: no-store, nosniff y CSP restrictiva.

### Almacenamiento y persistencia posterior

La propiedad `profile.images.directory` se configura con `PROFILE_IMAGE_DIRECTORY`.
Valor predeterminado: `./.local/profile-images`, excluido de Git. Allí se guardan
`<id-numérico>/avatar.blob` y `<id-numérico>/banner.blob`, separados de User y de
cualquier carpeta pública del frontend. No se necesita otra tabla ni migración.
El nombre del cliente y parámetros de URL no participan en las rutas. Se rechazan
symlinks. Directorios creados: 0700; archivos: 0600 cuando POSIX está disponible.
No se cambia el permiso de carpetas padre ya existentes. El directorio debe estar
bajo control exclusivo del usuario del backend, sin escritura de otros procesos.

Se escribe un temporal privado en el mismo directorio y se reemplaza mediante
movimiento atómico. Si el filesystem no lo permite, falla con 503 y conserva la
imagen anterior; no se usa una sustitución parcial. GET/DELETE de imágenes ausentes
no crean archivos. La imagen sobrevive al recrear el servicio Java mientras se
conserve ese directorio; esto **no** la hace sobrevivir por sí solo a recrear Docker.

Para un despliegue posterior autorizado:

1. Aplicar primero la migración de la Parte A al destino autorizado con respaldo.
2. Preparar un directorio privado persistente, propiedad del UID del backend.
3. Configurar PROFILE_IMAGE_DIRECTORY=/var/lib/studystreak/profile-images y montar
   un volumen dedicado o bind mount en esa ruta; mantenerlo al recrear el contenedor.
4. No servir esa ruta con Vite/nginx ni habilitar acceso público.
5. Respaldar/restaurar **base de datos y directorio de imágenes conjuntamente**:
   los nombres utilizan los IDs reales de usuarios. No intercambiar carpetas entre
   bases con IDs diferentes. Verificar lectura autenticada después de restaurar.

La activación local posterior utiliza un bind privado mediante un override Compose;
véase [perfil-local.md](perfil-local.md). El Compose y .env anteriores se conservan. El directorio
predeterminado dentro de un contenedor efímero se pierde al recrearlo; el montaje
persistente debe configurarse en cada despliegue autorizado. El borrado administrativo de cuentas
existente no se modifica: archivos huérfanos requieren mantenimiento posterior,
verificando que su usuario ya no exista y respetando la política de retención.

### Verificación de imágenes

```bash
scripts/test-profile-backend.sh -Dtest=ProfileImageStorageTest,ProfileImageIntegrationTest test
scripts/test-profile-backend.sh test
```

Pruebas con almacenamiento temporal privado y PostgreSQL desechable: tres formatos,
reemplazo/lectura/eliminación, reinicialización del servicio sobre los mismos archivos,
cuentas aisladas, acceso anónimo, filename malicioso, symlinks, corrupción, MIME falso,
límites exactos de 2/5 MiB, exceso de un byte y banner PNG real >3 MiB mediante HTTP.
Los errores de subida conservan la imagen anterior. GET de perfil y estadísticas
existentes siguen funcionando junto con las nuevas rutas.

## Resultado de esta implementación

Parte A: 10 pruebas específicas y suite completa de 212 pruebas sin fallos.
Parte B: 11 pruebas específicas y `verify` completo con 223 pruebas, sin fallos ni
omisiones, incluido empaquetado del backend. Las primeras ejecuciones detectaron
que las integraciones anteriores exigían el nombre studystreak_schema_check; se
creó esa base únicamente dentro del contenedor desechable y se ajustó el wrapper,
sin relajar las protecciones ni modificar los tests anteriores.

El backend habitual fue actualizado posteriormente con autorización; migración,
respaldo y almacenamiento local se documentan en [perfil-local.md](perfil-local.md).
Otros despliegues necesitan completar esos pasos antes de iniciar el jar nuevo.
