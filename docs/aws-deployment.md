# StudyStreak - AWS Deployment

## 1. Objetivo

Este documento describe el despliegue del backend de StudyStreak en AWS utilizando:

- Amazon EC2 para ejecutar la aplicación con Docker.
- Amazon RDS PostgreSQL para la base de datos.
- Caddy como reverse proxy para HTTPS.
- Variables de entorno para credenciales y configuración sensible.
- TLS para la conexión entre el backend y RDS.

El desarrollo local continúa utilizando `docker-compose.yml`.

Para AWS se utilizan:

- `docker-compose.aws.yml`
- `docker-compose.https.yml`
- `src/main/resources/application-aws.properties`
- `.env.aws`
- `deploy/Caddyfile`

El archivo `.env.aws` contiene secretos reales y no debe subirse a GitHub.

---

## 2. Arquitectura

```text
Internet
   |
 HTTPS :443
   |
 Caddy
   |
StudyStreak Backend
 Docker / EC2
   |
 TLS :5432
   |
Amazon RDS PostgreSQL
```

La base de datos RDS debe permanecer privada.

El puerto `5432` de RDS debe aceptar conexiones únicamente desde el Security Group de EC2.

El backend se publica localmente en EC2 mediante:

```text
127.0.0.1:8080
```

Por lo tanto, el puerto `8080` no debe exponerse directamente a Internet.

---

## 3. Variables de entorno

Crear el archivo local:

```bash
cp .env.aws.example .env.aws
```

Completar los valores correspondientes:

```env
APP_VERSION=aws-v1

SPRING_DATASOURCE_URL=jdbc:postgresql://RDS_ENDPOINT:5432/studystreak
SPRING_DATASOURCE_USERNAME=studystreak
SPRING_DATASOURCE_PASSWORD=CHANGE_ME

JWT_SECRET=CHANGE_ME
JWT_EXPIRATION=3600000

DB_DDL_AUTO=validate

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=CHANGE_ME
MAIL_PASSWORD=CHANGE_ME

APP_DOMAIN=api.example.com
```

Nunca se deben guardar contraseñas, claves JWT ni credenciales SMTP en GitHub.

En el servidor se recomienda proteger el archivo:

```bash
chmod 600 .env.aws
```

---

## 4. Certificado TLS de Amazon RDS

La aplicación valida el certificado de RDS mediante TLS.

Crear el directorio:

```bash
mkdir -p certs
```

Descargar el certificado global de Amazon RDS:

```bash
curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  -o certs/global-bundle.pem
```

El directorio `certs/` está ignorado por Git y no debe versionarse.

---

## 5. Validación y despliegue

Antes del despliegue se verificó localmente el proyecto con Java 21.

Pruebas:

```bash
./mvnw clean test
```

Resultado obtenido:

```text
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Validación de Docker Compose:

```bash
docker compose --env-file .env.aws -f docker-compose.aws.yml config
```

Construcción de la imagen:

```bash
docker compose --env-file .env.aws -f docker-compose.aws.yml build
```

Resultado:

```text
Image studystreak:aws-v1 Built
```

En EC2, una vez configurado `.env.aws` y el certificado de RDS, iniciar el backend con:

```bash
docker compose --env-file .env.aws \
  -f docker-compose.aws.yml \
  up -d --build
```

Para HTTPS:

```bash
docker compose --env-file .env.aws \
  -f docker-compose.aws.yml \
  -f docker-compose.https.yml \
  up -d --build
```

Consultar el estado:

```bash
docker compose --env-file .env.aws \
  -f docker-compose.aws.yml \
  ps
```

Consultar logs:

```bash
docker compose --env-file .env.aws \
  -f docker-compose.aws.yml \
  logs -f app
```

---

## 6. Inicialización de PostgreSQL

Una base de datos RDS nueva todavía no contiene las tablas de StudyStreak.

Para el primer inicio se puede utilizar temporalmente:

```env
DB_DDL_AUTO=update
```

Después de que Hibernate cree el esquema, cambiar nuevamente a:

```env
DB_DDL_AUTO=validate
```

y reiniciar la aplicación:

```bash
docker compose --env-file .env.aws \
  -f docker-compose.aws.yml \
  restart app
```

El valor `validate` evita modificaciones automáticas posteriores del esquema.

---

## 7. Seguridad y pruebas

La configuración AWS debe cumplir estas condiciones:

- RDS no debe ser públicamente accesible.
- PostgreSQL `5432` debe aceptar tráfico únicamente desde el Security Group de EC2.
- No se deben subir secretos al repositorio.
- EC2 debe usar únicamente los puertos administrativos necesarios durante la configuración.
- Los puertos `80` y `443` se habilitan cuando Caddy y el dominio estén preparados.
- El puerto `8080` no se expone públicamente.
- La conexión EC2 → RDS utiliza TLS.

Después del despliegue se deben comprobar como mínimo:

```text
Registro de usuario
Login
Generación y uso de JWT
Creación de Goal
Consulta de Goal
Respuesta 401 sin JWT
Persistencia de datos después de reiniciar el backend
Persistencia de datos después de reiniciar EC2
```

---

## 8. Actualización, rollback y eliminación

Para actualizar el backend:

```bash
git pull
docker compose --env-file .env.aws \
  -f docker-compose.aws.yml \
  -f docker-compose.https.yml \
  up -d --build
```

Para revisar logs después de una actualización:

```bash
docker compose --env-file .env.aws \
  -f docker-compose.aws.yml \
  logs --tail=100 app
```

Si una actualización falla, volver al commit estable anterior:

```bash
git checkout <COMMIT_ESTABLE>
```

y reconstruir:

```bash
docker compose --env-file .env.aws \
  -f docker-compose.aws.yml \
  -f docker-compose.https.yml \
  up -d --build
```

Antes de cambios importantes en la base de datos se debe crear un backup o snapshot de RDS.

Cuando el entorno AWS ya no sea necesario:

1. Detener y eliminar los contenedores.
2. Eliminar la instancia EC2.
3. Eliminar la base de datos RDS cuando ya no se necesiten sus datos.
4. Eliminar snapshots que no sean necesarios.
5. Eliminar recursos de red creados exclusivamente para el despliegue.

Esto evita mantener recursos AWS consumiendo saldo innecesariamente.