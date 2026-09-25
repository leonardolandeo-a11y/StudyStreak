# StudyStreak - AWS Deployment

## 1. Objetivo

Este documento describe el primer despliegue del backend de StudyStreak en AWS.

La arquitectura utiliza:

- Amazon EC2 para ejecutar el backend con Docker.
- Amazon RDS PostgreSQL para la base de datos.
- Caddy como reverse proxy y terminación HTTPS.
- Variables de entorno para credenciales y configuración sensible.
- TLS para la conexión entre el backend y RDS.

El archivo `docker-compose.yml` continúa utilizándose para desarrollo local.

El despliegue AWS utiliza:

- `docker-compose.aws.yml`
- `docker-compose.https.yml`
- `src/main/resources/application-aws.properties`
- `.env.aws`
- `deploy/Caddyfile`

El archivo `.env.aws` contiene secretos reales y no debe versionarse.

---

## 2. Arquitectura

Flujo previsto:

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