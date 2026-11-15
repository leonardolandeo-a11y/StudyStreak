# Desarrollo local con PostgreSQL

El entorno habitual ya funciona en `http://localhost:8080`, con el frontend web
en `http://localhost:5173` y la URL móvil `http://172.24.214.66:8080` (IP LAN
actual, no permanente). Se aplicaron únicamente las dos migraciones autorizadas
en `public`. El respaldo completo y su restauración comprobada están documentados
en [respaldo-local-2026-11-06.md](respaldo-local-2026-11-06.md).

## Uso diario del entorno existente

Desde la raíz, iniciar los mismos contenedores y esperar a que estén listos:

```bash
docker compose --env-file .env.docker.local -f compose.local.yaml \
  start --wait --wait-timeout 60 db app
```

Frontend web, en otra terminal:

```bash
cd frontend-web
npm run dev
```

Abrir `http://localhost:5173/register`. Para el móvil ejecutar `npx expo start`
dentro de `frontend-mobile`, con el teléfono en la misma LAN.

Detener backend y PostgreSQL conservando contenedores y datos:

```bash
docker compose --env-file .env.docker.local -f compose.local.yaml stop app db
```

Vite y Expo se detienen con Ctrl+C. `start` y `stop` conservan el volumen y los
contenedores existentes. No hace falta reconstruir la aplicación: la causa era
el esquema. No usar `up --force-recreate` ni `down` para el uso diario.

`.env.docker.local` fija `LOCAL_DB_DDL_AUTO=validate`,
`LOCAL_AUTH_SCHEMA_INIT=never` y `LOCAL_LEDGER_SCHEMA_INIT=false`. El Compose
propaga esos valores a Spring para futuras creaciones explícitas de servicios.
Para conservar el contenedor actual sin recrearlo, se copió la configuración
equivalente [application-local-existing.properties](../config/application-local-existing.properties)
a `/app/application.properties`; Spring la carga al iniciar. Esto impide DDL e
inicialización de scripts, incluido el ledger, durante los arranques habituales.
La configuración no contiene secretos. Su instalación reproducible sobre el
contenedor ya detenido es:

```bash
docker cp config/application-local-existing.properties \
  studystreak-local-app-1:/app/application.properties
```

Para comprobar HTTP creando otra cuenta sintética, con autorización explícita
del destino habitual:

```bash
python3 scripts/check-local-auth.py http://127.0.0.1:8080 --allow-existing-local
```

Los apartados siguientes describen también el bootstrap **de bases nuevas** y
el entorno desechable de pruebas; no son pasos que deban repetirse sobre v1.

No se necesita acceso a producción. Para verificar desde cero sin afectar bases
existentes, usar primero `compose.schema-check.yaml`: PostgreSQL en memoria,
sin volúmenes persistentes, API en `127.0.0.1:18081` y PostgreSQL en
`127.0.0.1:55436`. Las cuentas sintéticas solo existen en ese entorno.

**Destino existente corregido con autorización el 6 de noviembre de 2026:**
contenedor `studystreak-local-db-1`, base/usuario `studystreak_local`, esquema
`public`, volumen `studystreak_local_postgres_data_v1`, montado en
`/var/lib/postgresql/data` (host Docker:
`/var/lib/docker/volumes/studystreak_local_postgres_data_v1/_data`). La API actual
usa `jdbc:postgresql://db:5432/studystreak_local` y publica 8080. Se conservaron
el mismo volumen y los mismos contenedores. No habilitar nuevas migraciones o
Hibernate update sobre este destino sin inspección y autorización.

## 1. Configuración inicial

Requisitos: Docker con Compose; Python 3 para la comprobación HTTP; Node/npm para
el frontend. El backend se compila dentro de Docker;
no es necesario ejecutar Spring ni PostgreSQL directamente en el host. La primera
construcción descarga imágenes Java y dependencias Maven y puede tardar.

La comprobación desechable no necesita `.env.docker.local` ni credenciales
externas: tiene credenciales públicas exclusivamente de prueba. Para un entorno
persistente nuevo, `.env.docker.local` está ignorado por Git y por el contexto de
Docker. No copiar aquí el `.env` de producción.

En otro equipo, copiar `.env.docker.local.example` a `.env.docker.local` sin
sobrescribir un archivo existente. Reemplazar los placeholders de contraseña y
JWT por salidas generadas, respectivamente, con:

```bash
openssl rand -hex 24
openssl rand -base64 32
```

Definir `LOCAL_LAN_IP` con la IPv4 Wi-Fi de la laptop. En este equipo se detectó
`172.24.214.66` en `wlo1`; no es una dirección permanente. Puede consultarse con:

```bash
ip -4 route get 1.1.1.1
```

Los valores `LOCAL_*` pertenecen solo a este entorno. Spring usa la URL interna
`jdbc:postgresql://db:5432/studystreak_local`; no puede tomar una URL de producción
del `.env` general. No cambiar la contraseña o nombre de la base después de
inicializar el volumen sin preparar una modificación explícita de esa base.

## 2. Iniciar backend y PostgreSQL

Desde la raíz del repositorio, sobre una base desechable completamente nueva:

```bash
docker compose -f compose.schema-check.yaml up --build -d --wait
docker compose -f compose.schema-check.yaml ps
python3 scripts/check-local-auth.py
```

Antes de arrancar, comprobar que 18081 y 55436 estén libres; no detener servicios
ajenos. Este archivo Compose es independiente, no una extensión del Compose
habitual. No ejecutar dos copias del mismo proyecto simultáneamente. Si ya está
iniciado, `up` reutiliza su base en memoria. Para otra base totalmente vacía,
detener **solo este PostgreSQL desechable** y volver a iniciarlo:

```bash
docker compose -f compose.schema-check.yaml stop app db
docker compose -f compose.schema-check.yaml up -d --wait
python3 scripts/check-local-auth.py
```

El `tmpfs` pierde todos sus datos sintéticos al detener PostgreSQL; no hay un
volumen que borrar. Reiniciar **solo app** conserva esa base y permite verificar
la repetición de las migraciones. El healthcheck espera 401 sin JWT de un
endpoint protegido; no sustituye el registro/login real del script.

Para un entorno **persistente nuevo**, preparar `.env.docker.local` según la
sección 1, verificar que el volumen siguiente todavía no exista y seleccionar
explícitamente otro proyecto, volumen y puertos:

```bash
docker volume inspect studystreak_local_postgres_data_v2
# Continuar solo si inspect devuelve "no such volume".
LOCAL_DB_VOLUME=studystreak_local_postgres_data_v2 LOCAL_API_PORT=18082 LOCAL_DB_PORT=55437 \
  LOCAL_DB_DDL_AUTO=update LOCAL_AUTH_SCHEMA_INIT=always LOCAL_LEDGER_SCHEMA_INIT=true \
  docker compose --env-file .env.docker.local -f compose.local.yaml \
  -p studystreak-local-v2 up --build -d --wait
```

Este comando crea una base nueva; no repara ni monta v1. `compose.local.yaml`
activa el perfil `local` y publica el backend en loopback y `LOCAL_LAN_IP`.
Configurar los frontends con el puerto elegido (18082 en este ejemplo).
El Compose general y el volumen antiguo `studystreak_studystreak_postgres_data`
no forman parte de este procedimiento.

## 3. Inicialización de autenticación

`User` utiliza `@GeneratedValue(strategy = GenerationType.SEQUENCE)`, sin
generador explícito: Hibernate requiere `users_seq`, con asignación en bloques
de 50. Los otros diez modelos con IDs numéricos usan la misma estrategia.
No se cambió a `IDENTITY`, ni se añadieron defaults a las columnas `id`.

**Causa confirmada:** `public.users` existía, sin identity/default; las once
secuencias existían únicamente en `ss_audit_compose_tests`. `search_path` era
`"$user", public`; el usuario tenía permisos USAGE/CREATE en public. Hibernate
7.4.5 almacena metadatos de secuencias por nombre sin esquema y `ddl-auto=update`
consideró existentes las secuencias del esquema de auditoría. No emitió CREATE
para las de public y completó el arranque. Después `nextval('users_seq')` no
encontró una secuencia visible. Se reprodujo el 500 con la misma imagen y una
copia **solo de estructura**, sin exportar registros. Configurar únicamente
`default_schema` no corrige esa búsqueda interna por nombre.

Además, `refresh_session` faltaba en public: no es una entidad JPA y Hibernate
no la crea. La variable `APP_AUTH_SCHEMA_INIT=always` del Compose no estaba
conectada a ninguna propiedad Spring y la migración no se empaquetaba en el JAR.
No hay Flyway ni Liquibase en el proyecto; los SQL de `db/migrations` son scripts
explícitos, no migraciones descubiertas automáticamente.

El perfil `local`, con `APP_AUTH_SCHEMA_INIT=always`, ejecuta este orden:

1. Hibernate `update` prepara las tablas JPA. Un error DDL detiene el arranque
   (`hibernate.hbm2ddl.halt_on_error=true`).
2. Spring, con `defer-datasource-initialization=true`, ejecuta
   `db/migrations/2026-11-06_reconcile_jpa_sequences.sql`. Comprueba en
   `current_schema()` las once secuencias verificadas contra los modelos. Solo
   crea las ausentes con incremento 50; si hay IDs almacenados, empieza en
   `max(id)+50` para que el bloque asignado no colisione. No reinicia ni adelanta
   secuencias existentes; un incremento incompatible detiene el arranque para
   inspección. Debe aplicarse sin otras instancias escribiendo en ese destino.
3. Spring ejecuta el script existente, sin modificarlo,
   `db/migrations/2026-10-30_create_refresh_sessions.sql`, que crea tabla, FK
   `users(id) ON DELETE CASCADE` e índice `idx_refresh_session_user_id`.
4. El inicializador existente `StudyLedgerSchema`, dependiente de JPA, prepara
   `src/main/resources/db/study-tracking-v3.sql`. Este mecanismo ya existía y
   sigue activo; no depende de `APP_AUTH_SCHEMA_INIT`.

Los pasos 2 y 3 se ordenan entre sí después de JPA; el inicializador del ledger
también corre después de JPA, sin exigir orden respecto a esos dos scripts.
Maven y Docker incluyen ambos scripts de inicialización local. El separador EOF
de Spring permite ejecutar cada archivo completo, incluido el bloque PostgreSQL
`DO $$ ... $$`. Los errores de inicialización impiden completar el arranque.

En este perfil, `APP_DB_SCHEMA` (por defecto `public`) fija tanto el esquema de
Hibernate como el de las conexiones JDBC. Un esquema alternativo debe existir
antes de iniciar. Sin perfil `local`, estas dos migraciones no se ejecutan;
dentro del perfil la opción predeterminada sigue siendo `never` y ambos Compose
locales la activan explícitamente. La configuración general conserva su
`ddl-auto=update` y el inicializador del ledger: **no conectarla a una base
existente suponiendo que es de solo lectura**.

Las migraciones históricas `2026-10-29_allow_daily_record_created.sql` y
`2026-11-02_create_focus_sessions.sql` no son necesarias para una base nueva:
Hibernate genera el enum actual de notificaciones y la entidad `FocusSession`.
El SQL de focus es una alternativa manual para despliegues sin Hibernate update.
No se ejecutan indiscriminadamente todos los SQL. Una base antigua con checks
incompatibles requiere inspección y autorización antes de aplicar el SQL de
notificaciones, que además está dirigido explícitamente a `public`.

Referencias: [inicialización de Spring Boot](https://docs.spring.io/spring-boot/how-to/data-initialization.html)
y [metadatos de secuencias de Hibernate](https://github.com/hibernate/hibernate-orm/blob/main/hibernate-core/src/main/java/org/hibernate/tool/schema/extract/internal/DatabaseInformationImpl.java).

El correo local apunta deliberadamente a un SMTP desconectado: puede aparecer
un error asíncrono de bienvenida, pero el registro permanece válido. No se envían
correos reales. Google Books requiere una clave opcional `LOCAL_GOOGLE_BOOKS_API_KEY`;
registro/login no la necesitan. No versionar esa clave.

## 4. Frontend web

`frontend-web/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

```bash
cd frontend-web
npm run dev
```

Abrir `http://localhost:5173`. Para el entorno desechable usar 18081; para el
entorno persistente nuevo del ejemplo, 18082. El Compose permite ese origen y
`http://127.0.0.1:5173` por CORS. Reiniciar Vite si se cambia el `.env.local`.

## 5. Expo y teléfono físico

`frontend-mobile/.env.local`, con la IP actual de la laptop:

```dotenv
EXPO_PUBLIC_API_URL=http://172.24.214.66:8080
```

```bash
cd frontend-mobile
npx expo start
```

Esta prueba requiere el entorno persistente con publicación LAN; el desechable
solo publica loopback. El teléfono y la laptop deben estar en la misma red.
Abrir Expo y escanear su QR.
Para comprobar acceso sin crear datos, abrir desde el navegador del teléfono:
`http://172.24.214.66:8080/api/dashboard/goals`. Debe devolver 401/Authentication
is required. Eso prueba acceso HTTP, no que el formulario o SecureStore funcionen.
Luego registrar una cuenta sintética `@example.invalid` e iniciar sesión en la app.

No usar localhost ni la IP de Docker en la URL del teléfono. Si cambia la IP Wi-Fi,
actualizar `LOCAL_LAN_IP` y el `.env.local` móvil, recrear solo los servicios de este
Compose con `up -d` y reiniciar Expo. No cambia el volumen ni sus datos.

No se desactiva el firewall ni se cambian reglas DNS. La consulta de UFW requiere
permisos administrativos; si el teléfono no conecta, primero revisar `sudo ufw
status verbose`, aislamiento de clientes Wi-Fi y las direcciones configuradas.
No añadir reglas automáticamente. Si se confirma un bloqueo, una excepción debe
limitarse a la IP del teléfono, interfaz Wi-Fi y puertos TCP necesarios: 8080 para
la API y 8081 para Metro. Solicitar autorización antes de aplicarla. Los puertos
publicados por Docker tienen reglas propias: no asumir que UFW los filtra igual
que un proceso del host.

Referencia: [reglas de red y firewalls de Docker](https://docs.docker.com/engine/network/packet-filtering-firewalls/).

La compilación del bundle Android no sustituye la prueba en el teléfono. Expo Go
y una build instalada tienen políticas de transporte propias; no se relajaron
controles globales ni se habilitó HTTP en producción.

## 6. Comprobaciones

```bash
curl -i http://localhost:18081/api/dashboard/goals
curl -i -X POST http://localhost:18081/register \
  -H 'Content-Type: application/json' --data '{}'
curl -i -X OPTIONS http://localhost:18081/register \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Resultados esperados: 401 sin JWT, 400 para registro vacío y 200 con cabeceras CORS
para el preflight. Las rutas siguen siendo `/register`, `/login`, `/refresh` y
`/logout`; no añadirles `/api`.

Para consultar las tablas y secuencias exclusivamente de la base desechable:

```bash
docker compose -f compose.schema-check.yaml exec -T db \
  psql -X -U studystreak_check -d studystreak_schema_check -c '\dt public.*'
docker compose -f compose.schema-check.yaml exec -T db \
  psql -X -U studystreak_check -d studystreak_schema_check \
  -c "SELECT schemaname, sequencename, increment_by FROM pg_sequences ORDER BY 1, 2;"
```

Usar usuarios nuevos y correos `@example.invalid` para las pruebas. El logout
revoca el refresh token; los access tokens expiran según su duración.

Para ejecutar toda la suite backend con Java 21 y Maven wrapper, crear un esquema
separado **dentro del PostgreSQL desechable**, con prefijo `ss_audit_` requerido
por las pruebas de integración:

```bash
docker compose -f compose.schema-check.yaml exec -T db \
  psql -X -U studystreak_check -d studystreak_schema_check -v ON_ERROR_STOP=1 \
  -c 'CREATE SCHEMA IF NOT EXISTS ss_audit_backend_tests;'
env SPRING_PROFILES_ACTIVE=local APP_DB_SCHEMA=ss_audit_backend_tests \
  APP_AUTH_SCHEMA_INIT=always STUDYSTREAK_POSTGRES_INTEGRATION=true \
  SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:55436/studystreak_schema_check \
  SPRING_DATASOURCE_USERNAME=studystreak_check \
  SPRING_DATASOURCE_PASSWORD=disposable-local-check-only \
  JWT_SECRET=c3R1ZHlzdHJlYWstZGlzcG9zYWJsZS1sb2NhbC10ZXN0LWtleS0yMDI2 \
  JWT_EXPIRATION=3600000 JWT_REFRESH_EXPIRATION=86400000 \
  MAIL_HOST=127.0.0.1 MAIL_PORT=9 MAIL_USERNAME=check@example.invalid \
  MAIL_PASSWORD=local-only ./mvnw test
```

La suite escribe y elimina fixtures exclusivamente en ese destino de pruebas;
no apuntarla a bases existentes. El nuevo test de inicialización crea y elimina
su propio esquema aleatorio dentro de esa instancia.

Tests web (sin cambios en esta tarea): `npm run test:config`, `npm run test:web`, `npm run lint`, `npm run build`.
Tests móviles: scripts `test:config`, `test:auth`, `test:pagination`, `test:review`,
`test:focus`, `npm run lint` y `npx --no-install tsc --noEmit`.

## 7. Detener

```bash
docker compose -f compose.schema-check.yaml stop app db
```

Esto descarta únicamente los datos en memoria del entorno desechable. Para
detener el entorno persistente nuevo conservando sus datos, usar exactamente el
proyecto/volumen/puertos con los que se inició:

```bash
LOCAL_DB_VOLUME=studystreak_local_postgres_data_v2 LOCAL_API_PORT=18082 LOCAL_DB_PORT=55437 \
  docker compose --env-file .env.docker.local -f compose.local.yaml \
  -p studystreak-local-v2 stop
```

Reanudar con los mismos valores y `up -d --wait`. Detener Vite y Metro con Ctrl+C.
No usar `down -v`, `volume rm`, `prune` ni borrar directorios de datos para
solucionar errores.

## 8. Alternar entre local y remoto

Cambiar únicamente `VITE_API_BASE_URL` y `EXPO_PUBLIC_API_URL` en los respectivos
`.env.local` y reiniciar ambos frontends. Para local, web usa localhost y móvil la
IPv4 LAN. Para remoto, ambos usan la URL remota confirmada y accesible.
La dirección histórica `http://3.238.32.75:8080` no respondió durante la auditoría;
verificarla antes de volver a utilizarla. No cambian los servicios Axios ni las
rutas. Las sesiones locales y remotas pertenecen a servidores distintos: cerrar
sesión al alternar, para no reutilizar tokens del entorno anterior.

## 9. Inventario del esquema

El backend actual requiere **21 tablas** en el esquema seleccionado:

| Origen | Tablas |
|---|---|
| Entidades JPA y tabla de unión | `users`, `goal`, `tag`, `goal_tag`, `daily_record`, `daily_record_photo`, `daily_record_voice`, `notification`, `streak`, `tracking_link`, `validation`, `focus_session`, `study_room`, `study_room_member`, `study_room_message`, `study_room_ban`, `retired_media_room` |
| Migración JDBC de autenticación | `refresh_session` |
| Inicializador JDBC del ledger | `study_run`, `study_ledger`, `study_room_selection` |

Estas **11 secuencias** corresponden a los modelos `SEQUENCE`; todas requieren
incremento 50 y tipo `bigint`:

```text
users_seq                 goal_seq                  tag_seq
daily_record_seq          daily_record_photo_seq    daily_record_voice_seq
notification_seq          streak_seq                tracking_link_seq
validation_seq            study_room_member_seq
```

Las demás entidades usan UUID o claves String asignadas por la aplicación;
`refresh_session.id` también es UUID generado por el servicio. No necesitan
secuencias adicionales. No se añade una secuencia `hibernate_sequence`.

## 10. Validación del 6 de noviembre de 2026

Se reprodujo el fallo con la imagen original sobre una copia de estructura en
el contenedor `studystreak-schema-audit-db`, base `studystreak_schema_audit`,
puerto 55435, almacenamiento `tmpfs`, API separada en 18080. El registro devolvió
500 y public seguía sin secuencias. Con el perfil corregido, en esa misma copia,
se crearon las once secuencias y `refresh_session`; el esquema ajeno se conservó.

La suite backend se ejecutó contra `ss_audit_schema_fix` **dentro de esa instancia
desechable**, con `STUDYSTREAK_POSTGRES_INTEGRATION=true`: **174 pruebas aprobadas,
0 fallos, 0 errores y 0 omitidas**. Incluye pruebas de concurrencia PostgreSQL,
reinicio del ledger y el nuevo test que deriva las tablas desde los modelos JPA,
prueba IDs existentes, repetición sin reiniciar secuencias y rechazo de un
incremento incompatible. No se cambió lógica de autenticación ni contratos REST.

Comprobaciones HTTP reales en la copia corregida:

| Caso | HTTP esperado y obtenido |
|---|---|
| Registro válido / inválido / duplicado | 201 / 400 / 409 |
| Login válido / contraseña incorrecta | 200 / 401 |
| Endpoint protegido con access JWT / sin JWT / con refresh como Bearer | 200 / 401 / 401 |
| Refresh con rotación / reutilización del anterior | 200 / 401 |
| Logout / refresh revocado | 204 / 401 |

El mismo flujo HTTP pasó también desde una base **completamente nueva** creada
por `docker compose -f compose.schema-check.yaml up --build -d --wait`:
`studystreak_schema_check`, esquema `public`, puertos 18081/55436. Se comprobó
`Mounts: []` y `/var/lib/postgresql/data` en `tmpfs`; no hay ningún volumen
persistente montado. Se encontraron las 21 tablas y las 11 secuencias con
incremento 50, y el refresh quedó almacenado como hash hexadecimal de 64
caracteres y revocado después de logout. El comando de tests documentado también
pasó en `ss_audit_backend_tests` de esa base nueva: **174/174, sin omisiones**.
Se reinició solo `app` y se compararon usuarios, sesiones y valores de secuencias
antes/después: idénticos. La comprobación HTTP completa volvió a pasar tras el
reinicio. El entorno `studystreak-schema-check` queda funcionando en 18081; la
copia de reproducción de 55435 y su backend de 18080 quedaron detenidos.

Archivos modificados o añadidos en esta corrección: `.dockerignore`, `.gitignore`,
`Dockerfile`, `pom.xml`, `compose.local.yaml`, `compose.schema-check.yaml`,
`.env.docker.local.example`, `src/main/resources/application-local.properties`,
`db/migrations/2026-11-06_reconcile_jpa_sequences.sql`,
`src/test/java/com/example/studystreak/model/LocalSchemaInitializationIntegrationTest.java`,
`scripts/check-local-auth.py`, `docs/desarrollo-local.md` y
`docs/autenticacion-local.md`. Los demás cambios previos del workspace se
conservaron; en particular no se modificó el lockfile web en esta tarea.

Se verifican ambos JWT sin imprimirlos. El logout revoca el refresh token; por
el contrato existente, el access token continúa válido hasta expirar. El SMTP
desconectado genera un error asíncrono esperado que no invalida el registro.
Los frontends no se modificaron ni se realizaron pruebas de formularios.

La aplicación posterior sobre la base habitual de 8080 fue autorizada y
completada: ver [el respaldo y resultado final](respaldo-local-2026-11-06.md).
No se hicieron commit ni push.

## Errores frecuentes

| Síntoma | Qué revisar |
|---|---|
| Connection refused / timeout | Estado de `app`, puerto publicado, IP y red |
| 404 en Vite | Variable API ausente o servidor frontend sin reiniciar |
| 401 sin token | Respuesta esperada de una ruta protegida |
| 409 al registrar | Username/email ya existe en la base local |
| Registro 500 y falta users_seq | Esquema efectivo, secuencias en otros esquemas y perfil local con reconciliación autorizada |
| Login 500 y falta refresh_session | Perfil local, APP_AUTH_SCHEMA_INIT=always y scripts incluidos en el JAR |
| Error CORS | Origen exacto y preflight; no confundirlo con un timeout |
| Password authentication failed en PostgreSQL | No cambiar la contraseña de un volumen ya inicializado |
| Puerto ocupado | Revisar el propietario; no detener otro proyecto |
| Backend healthy, móvil sin conexión | Probar desde el teléfono; revisar Wi-Fi, IP y firewall sin desactivarlo |
| Error de correo asíncrono | SMTP deliberadamente desconectado en este entorno |
