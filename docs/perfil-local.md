# Profile: activación local y verificación

## Migración y respaldo — 7 de noviembre de 2026

Destino autorizado: contenedor `studystreak-local-db-1`, base `studystreak_local`,
esquema `public`, volumen `studystreak_local_postgres_data_v1`.
Las columnas no existían. Se aplicó **sólo**
`src/main/resources/db/migrations/2026-11-07_add_user_profile.sql`.
Resultado: `users.display_name varchar(60)` y `users.bio varchar(300)`, ambos
nullable, sin default. Todos los usuarios anteriores conservaron NULL.
No se añadieron otras restricciones, tablas, secuencias ni migraciones automáticas.

Respaldo previo completo, fuera del volumen PostgreSQL y excluido de Git:
`.local/backups/2026-11-07T231553Z_profile/`:

- `database.dump`: pg_dump custom, todos los esquemas, datos y secuencias; incluye
  metadatos de propietarios y permisos.
- `globals.sql`: roles y configuración global; contiene información sensible.
- `SHA256SUMS` y `archive-list.txt`: integridad y contenido del archivo.

Directorio 0700; dump y globals 0600. No compartir ni subir esos archivos.
Se verificó la lista del archivo y se restauró completamente en PostgreSQL 17
sobre tmpfs, sin montar volúmenes existentes. En esa restauración se sustituyó
el propietario por el rol de pruebas y se omitieron ACL para no introducir roles
reales en el entorno aislado; el archivo original conserva ambos.

La comparación textual inicial mostró casts equivalentes de arrays y paréntesis
reescritos por PostgreSQL. Se reinterpretaron todas las definiciones originales
en otra base desechable y se verificó igualdad exacta de su representación
normalizada con la del esquema restaurado. No hubo diferencias semánticas en
restricciones, índices ni definiciones. También coincidieron las huellas ordenadas
de **todas** las tablas y los valores/estados de **todas** las secuencias, incluyendo
`ss_audit_compose_tests`. La migración se probó primero sobre la restauración.
Inmediatamente después de aplicarla en local se repitió la comparación, excluyendo únicamente
las dos columnas nuevas de la huella de users, y se verificó que ambas eran NULL.

Tras reiniciar y usar el frontend, una sesión de autenticación existente rotó
únicamente token_hash y expires_at mediante el refresh actual. Conservó su ID y
propietario; ninguna sesión se creó ni eliminó en la base habitual. No se restauró
el token anterior. Las demás tablas, sesiones de estudio, datos y secuencias siguen
coincidiendo con el respaldo. Las escrituras de pruebas pertenecen exclusivamente
a la base desechable.

Comprobación del respaldo (desde su propio directorio):

```bash
cd .local/backups/2026-11-07T231553Z_profile
sha256sum -c SHA256SUMS
```

Restauración: detener la aplicación que utilice el destino y restaurar primero
en **otra base vacía**, nunca encima de datos existentes ni con --clean. Ejemplo
para repetir la comprobación en un PostgreSQL desechable con su rol de pruebas:

```bash
docker exec -i <contenedor-desechable> pg_restore \
  -U <rol-de-pruebas> -d <base-vacia> --exit-on-error --no-owner --no-privileges \
  < .local/backups/2026-11-07T231553Z_profile/database.dump
```

Para una recuperación con propietarios/permisos originales, revisar primero los
roles del destino y recuperar los necesarios desde globals.sql en un entorno
privado. Restaurar el dump sin --no-owner/--no-privileges una vez existan esos roles.
No registrar globals.sql ni contraseñas en terminales compartidas. Verificar datos,
secuencias, permisos y arranque antes de cambiar la conexión de la aplicación.
No se ha necesitado restaurar la base habitual ni eliminar/recrear su volumen.

## Almacenamiento privado persistente

Se añade `compose.profile-images.local.yaml` sobre `compose.local.yaml`, sin
editar .env ni el Compose anterior. Configura:

- Bind mount `./.local/profile-images` → `/var/lib/studystreak/profile-images`.
- `PROFILE_IMAGE_DIRECTORY` apunta a la ruta interna.
- Aplicación con UID/GID 1000:1000; directorio local 0700, archivos nuevos 0600.
- ddl-auto=validate; inicialización auth=never; migraciones Ledger al arranque=false.
- PostgreSQL conserva su contenedor y volumen independientes.

Si el UID/GID del equipo difiere, usar `config/profile-images.local.env.example`
como referencia y una segunda configuración local excluida de Git. Crear primero
el directorio con el propietario correcto: el override no crea rutas de host por
accidente. No apuntar a rutas compartidas ni públicas. .dockerignore excluye .local/
para que respaldos e imágenes tampoco entren en el contexto de construcción.

Desde la raíz del repositorio, iniciar o reconstruir sólo el backend:

```bash
mkdir -p .local/profile-images
chmod 700 .local/profile-images
docker compose --env-file .env.docker.local -f compose.local.yaml \
  -f compose.profile-images.local.yaml up -d --build app
```

Arranque posterior sin reconstrucción:

```bash
docker compose --env-file .env.docker.local -f compose.local.yaml \
  -f compose.profile-images.local.yaml up -d
```

Detener los servicios sin borrar contenedores, datos, archivos ni volúmenes:

```bash
docker compose --env-file .env.docker.local -f compose.local.yaml \
  -f compose.profile-images.local.yaml stop
```

Web, desde frontend-web: `npm run dev`, después abrir
http://localhost:5173/profile e iniciar sesión normalmente. Detener Vite con Ctrl+C.
La conexión JWT y las variables VITE existentes se conservan.
**Usar siempre ambos archivos Compose** para conservar el montaje y el arranque
sin migraciones automáticas. No utilizar down -v ni borrar .local/profile-images.
Respaldar esta carpeta y la base conjuntamente en futuros respaldos de usuarios.

Se conserva un archivo técnico `.storage-check` sin datos personales para verificar
el montaje al recrear únicamente la aplicación. Las pruebas de escritura de perfil
y de imágenes se hacen en 18087, contra PostgreSQL desechable en 55437 y otro bind
mount `.local/profile-rollout/test-images`, nunca sobre cuentas habituales.

## Frontend y verificaciones

/profile está dentro de ProtectedRoute y AuthenticatedLayout. Usa GET/PATCH del
perfil y GET/PUT/DELETE privados de avatar/banner. Las lecturas de imágenes pasan
por apiClient con JWT, se convierten en Blob URLs y se revocan al reemplazar,
cancelar o desmontar. No se guardan imágenes ni tokens en URLs públicas.

El diálogo guarda texto e imágenes mediante operaciones separadas: cancelar antes
de guardar no escribe. Un error durante un guardado múltiple puede dejar cambios
parciales; se actualiza la vista desde el servidor y se muestra un aviso explícito
para revisar y reintentar. No se simula una transacción que la API no proporciona.
El nombre visible y avatar se comparten con el panel del sidebar y el menú móvil.
Las rachas conservan datos históricos y no se etiquetan como sólo verificadas.

Pruebas específicas y suite final, desde frontend-web:

```bash
npm run test:profile
npm run lint
npx tsc -b
npm run build
npm run test:web
```

La integración `STUDYSTREAK_PROFILE_E2E=true npm run test:profile:integration` es
opt-in y exige la instancia desechable en 18087, PostgreSQL 17 en 55437/base
studystreak_schema_check/esquema ss_audit_profile y almacenamiento de pruebas.
Comprueba la conexión del contenedor antes de crear cuentas/sesiones sintéticas.
No cambiar esos destinos por 8080 ni la base habitual. Incluye registro 201,
login/refresh 200, logout 204, edición, tres formatos, recarga, recreación sólo del
backend de pruebas, borrado/fallback y comparación Profile/Dashboard: 11 minutos
y 2 sesiones verificadas reales de sus fixtures aislados.

## Resultado final

ESLint y TypeScript sin errores; build web correcto. Suite web: 60 pruebas de
lógica y 32 pruebas de UI, todas aprobadas y sin omisiones. Integración real opt-in
aprobada con PostgreSQL desechable, incluyendo recreación de la aplicación.
Chrome comprobó los modos Dark/Light/System y cuatro acentos en anchos de
320, 375, 768, 1024 y 1440 px; también foco, Escape, cancelación, errores
401/403/red, guardado parcial y revocación de Blob URLs al salir.

La primera revisión final detectó una actualización de estado en el efecto del
proveedor y una aserción antigua que suponía que el primer enlace era Settings.
Se corrigieron ambos casos y se repitieron los controles afectados con éxito.
El build mantiene una advertencia de tamaño de chunks existentes; no impide
compilar ni se añadieron dependencias en esta etapa.
