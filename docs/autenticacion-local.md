# API local y autenticación (P0)

## Frontends

Web: copiar `frontend-web/.env.example` a `frontend-web/.env.local` y ejecutar
`npm run dev` dentro de `frontend-web`. La API es `http://localhost:8080`.

Expo en teléfono físico: copiar `frontend-mobile/.env.example` a
`frontend-mobile/.env.local`, reemplazar la IP de muestra por la IPv4 Wi-Fi del
equipo que ejecuta Spring y ejecutar `npx expo start` dentro de `frontend-mobile`.
El teléfono y el equipo deben estar en la misma red y el puerto 8080 debe ser
accesible desde el teléfono. `localhost` en el teléfono es el propio teléfono.
La IP puede cambiar al cambiar de red; actualizar el archivo local y reiniciar
Expo. El túnel de Metro no expone automáticamente la API de Spring.

Los `.env.local` están ignorados por Git. Las variables `VITE_*` y
`EXPO_PUBLIC_*` son públicas en los bundles: nunca contienen credenciales.
Ambos clientes muestran un error de configuración si la URL falta o no es una
URL HTTP(S) absoluta; también bloquean requests en ese caso.

## PostgreSQL y preparación explícita de la tabla de sesiones

El entorno habitual `studystreak_local.public` ya fue corregido con autorización
y respaldo completo el 6 de noviembre de 2026. Sus arranques usan **validate**,
sin scripts ni migración del ledger. Ver [uso diario](desarrollo-local.md) y
[respaldo/resultados](respaldo-local-2026-11-06.md). El mecanismo de inicialización
descrito a continuación corresponde a bases nuevas autorizadas.

La arquitectura actual crea las entidades JPA mediante Hibernate. La tabla
`refresh_session` se administra mediante JDBC y necesita el SQL existente
`db/migrations/2026-10-30_create_refresh_sessions.sql`.

**Actualización del 6 de noviembre de 2026:** el código actual requiere el perfil
`local` además de `APP_AUTH_SCHEMA_INIT=always`. Este perfil empaqueta y ejecuta
la migración de refresh y la reconciliación de secuencias JPA. El procedimiento
vigente y seguro, sobre PostgreSQL desechable, está en
[desarrollo-local.md](desarrollo-local.md). Las instrucciones y resultados P0
de abajo describen la verificación histórica; no ejecutar sus comandos contra
una base existente.

Para aquel P0 se reutilizó ese único script idempotente mediante la inicialización
SQL de Spring, después de Hibernate (`defer-datasource-initialization=true`).
Maven lo empaqueta y Docker copia su fuente durante el build. No se ejecutan las
otras migraciones ni se introduce un segundo sistema de versionado del esquema.
Esto es una inicialización repetible específica de autenticación, no un migrador
general. Los errores del script impiden dar por iniciado correctamente el backend.

Por defecto `APP_AUTH_SCHEMA_INIT=never`: no se aplica el script automáticamente
a una base existente. Solo usar `APP_AUTH_SCHEMA_INIT=always` cuando se haya
autorizado expresamente preparar la base de destino. El script usa `CREATE ...
IF NOT EXISTS`; no borra tablas ni registros. No repara estructuras existentes
incompatibles: esas requieren inspección y autorización por separado.

### Verificación segura en una instancia nueva

No reutilizar el volumen o el contenedor de la base real. Ejemplo de instancia
aislada, publicada únicamente en loopback y sin credenciales reales:

```bash
docker run --detach --name studystreak-p0-test \
  --publish 127.0.0.1:55434:5432 \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --env POSTGRES_DB=studystreak_p0 postgres:17-alpine
```

Desde la raíz del repositorio, con Java 21 y las dependencias Maven disponibles:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:55434/studystreak_p0
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=''
export APP_AUTH_SCHEMA_INIT=always
export SPRING_PROFILES_ACTIVE=local
export JWT_SECRET="$(openssl rand -base64 32)"
export JWT_EXPIRATION=3600000
export JWT_REFRESH_EXPIRATION=86400000
export MAIL_HOST=127.0.0.1
export MAIL_PORT=9
export MAIL_USERNAME=audit@example.invalid
export MAIL_PASSWORD=audit-only
./mvnw spring-boot:run
```

El correo está deliberadamente desconectado en esta prueba; un intento de correo
asíncrono fallará sin invalidar el registro. Nunca enviar correos reales durante
las verificaciones. Al terminar se puede detener el contenedor de prueba; no se
incluyen comandos de eliminación de contenedores, datos ni volúmenes.

Reiniciar Spring con la misma configuración verifica que la inicialización puede
repetirse y que usuarios y sesiones permanecen. Consultar `users` y
`refresh_session` solo en la instancia aislada para comprobar persistencia.

### Docker Compose o Spring en el host

Compose usa `db:5432` internamente. Spring en el host usa el puerto publicado
(`5433` en `.env.example`), con `SPRING_DATASOURCE_*` explícitos. El archivo
`.env` raíz no se carga automáticamente al ejecutar Maven: exportar las variables
o cargarlas en una shell de confianza. No activar la inicialización en un volumen
existente hasta recibir autorización. Los ejemplos dejan esa opción en `never`.

Los endpoints no cambian: `POST /register`, `/login`, `/refresh`, `/logout`.
El logout revoca el refresh token; el access token expira según su duración.

CORS para web local admite `http://localhost:*`. Si se usa el frontend web desde
otra IP u origen, configurar `APP_CORS_ALLOWED_ORIGINS` con la lista explícita
correspondiente. Un cliente React Native nativo no está sujeto al CORS del navegador.

## Comprobaciones

- Web: `npm run test:config`, `npm run test:web`, `npm run lint`, `npm run build`.
- Móvil: `npm run test:config`, los scripts `test:auth`, `test:pagination`,
  `test:review`, `test:focus`, `npm run lint` y `npx --no-install tsc --noEmit`.
- Backend: `./mvnw test` con las variables de la base aislada.
- Usar cuentas únicas con email `@example.invalid` para registro, duplicados,
  login, endpoint protegido, rotación, rechazo del token consumido y logout.
- Los tests HTTP no sustituyen pruebas de formularios ni SecureStore en teléfono.

Referencias: [inicialización SQL de Spring](https://docs.spring.io/spring-boot/how-to/data-initialization.html)
y [variables de entorno de Expo](https://docs.expo.dev/guides/environment-variables/).

## Resultado de la verificación P0 — 5 de noviembre de 2026

Se utilizó exclusivamente PostgreSQL 17 aislado en `127.0.0.1:55434`, base
`studystreak_p0`, contenedor `studystreak-p0-20261105`. No se conectó la aplicación
a la base existente. No se eliminaron tablas, datos ni volúmenes. El contenedor
de prueba se conserva detenido, con sus datos sintéticos.

Spring arrancó en 8080, Vite en 5173 y Metro en 8081. Vite entregó la URL
`http://localhost:8080`; se comprobó respuesta de Spring tanto en loopback como
en la IP Wi-Fi del equipo. Esto no demuestra conectividad desde un teléfono.

Comprobaciones HTTP con una cuenta única `@example.invalid`:

| Caso | HTTP |
|---|---|
| Registro válido / DTO inválido | 201 / 400 |
| Username o email duplicado | 409 |
| Login válido / contraseña incorrecta | 200 / 401 |
| Endpoint protegido con access JWT / sin JWT / JWT inválido | 200 / 401 / 401 |
| Refresh token utilizado como Bearer de acceso | 401 |
| Perfil ajeno / meta inexistente | 403 / 404 |
| Rotación de refresh / reutilización del token consumido | 200 / 401 |
| Logout / refresh después del logout | 204 / 401 |
| Preflight web autorizado | 200 |

Se consultó la base aislada: usuario persistido, contraseña BCrypt, sesiones con
hash hexadecimal de 64 caracteres e índice `idx_refresh_session_user_id`.
Se reinició Spring sobre esa misma base, repitiendo la inicialización: el perfil
y access JWT siguieron funcionando, el refresh anterior pudo rotarse y el logout
revocó la sesión. No se imprimieron tokens en las salidas de comprobación.

Regresión:

- Maven: 125 casos, 118 aprobados y 7 omitidos por la condición de activación de
  `PostgresRepositoryIntegrationTest`; sin fallos ni errores.
- Web: `test:web` (9 archivos) y `test:config` (1 archivo) aprobados; lint y build
  aprobados.
- Todos los archivos web: 10 aprobados y 1 fallido. El fallo está en
  `noiseSynthesis.test.mjs`, comprobación de continuidad de los extremos de una
  muestra. Tanto el test como `noiseSynthesis.ts` son idénticos a `HEAD`; el fallo
  es previo y no se modificó por estar fuera de P0. Ese archivo no forma parte
  del script `test:web` existente.
- Móvil: los 12 archivos de pruebas aprobados, incluido el nuevo test de
  configuración; ESLint y TypeScript aprobados.

No se realizaron pruebas de interacción de formularios en navegador ni pruebas
en un dispositivo físico/emulador. No se instalaron Playwright, Maestro ni nuevas
dependencias. El correo de bienvenida falló de forma esperada contra el SMTP
local desconectado, sin invalidar el registro.

### Archivos intervenidos

- Web: `.env.example`, `.env.local` (ignorado), `package.json`, `src/config/api.ts`,
  `src/services/apiClient.ts`, `src/contexts/AuthProvider.tsx`, `src/main.tsx` y
  `tests/apiConfiguration.test.mjs`.
- Móvil: `.env.example`, `.env.local` (ignorado), `package.json`, `src/config/api.ts`,
  `src/services/apiClient.ts`, `src/services/authService.ts`, `src/app/_layout.tsx`
  y `tests/apiConfiguration.test.mjs`.
- Backend y ejecución: `pom.xml`, `src/main/resources/application.properties`,
  `Dockerfile`, `docker-compose.yml`, `.env.example`.
- CI: `.github/workflows/ci.yml`, `.github/workflows/frontend-ci.yml`.
- Documentación: este archivo.

La migración SQL existente se reutilizó sin cambios. Se preservaron los cambios
previos del usuario en `.gitignore`, ambos `package-lock.json`, `AGENTS.md` y los
otros documentos. No se hizo commit ni push.
