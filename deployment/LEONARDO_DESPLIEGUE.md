# Entrega de despliegue — Leonardo

**Documento temporal para el responsable de infraestructura de StudyStreak.** Contiene los pasos pendientes para conectar Backend, PostgreSQL, Web y Android de forma pública. No es una constancia de que estos pasos ya se hayan completado.

**Importante:** no introducir credenciales reales en GitHub, capturas, issues, commits, Vite ni variables `EXPO_PUBLIC_*`. No reinicializar RDS, eliminar volúmenes ni cambiar la base de producción sin respaldo y validación.

## 1. Confirmar el código que se desplegará

La auditoría técnica trabaja en la rama `audit/rubrica-cs2031-20261115`. Antes de publicar, comparar su código con `main` y acordar con el equipo el commit que corresponde integrar, mediante un Pull Request revisado. No asumir que el último CI verde de una rama también existe en producción. Evitar cambios directos a `main` sin revisión del equipo.

Comprobar GitHub Actions: `.github/workflows/ci.yml` (backend) y `.github/workflows/frontend-ci.yml` (Web y Mobile). Las verificaciones de la rama auditada incluyen 154 pruebas Web, 75 pruebas Mobile, TypeScript, ESLint y build Android de desarrollo.

## 2. API Spring Boot y PostgreSQL administrado

**Objetivo:** URL HTTPS estable para el backend (AWS EC2 u otra plataforma equivalente) comunicándose con Amazon RDS PostgreSQL por una red privada.

Variables del backend que deben configurarse **en el hosting/secret manager**, sin publicar los valores:

~~~ini
SPRING_DATASOURCE_URL=jdbc:postgresql://HOST_RDS_PRIVADO:5432/NOMBRE_BD?sslmode=require
SPRING_DATASOURCE_USERNAME=USUARIO_RDS
SPRING_DATASOURCE_PASSWORD=VALOR_SECRETO
JWT_SECRET=VALOR_SECRETO_DE_ALTA_ENTROPIA
JWT_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=604800000
APP_CORS_ALLOWED_ORIGINS=https://WEB_PUBLICA
SPRING_JPA_SHOW_SQL=false
PROFILE_IMAGE_DIRECTORY=/ruta/persistente/imagenes-perfil
GOOGLE_BOOKS_API_KEY=CLAVE_PRIVADA_SERVIDOR
~~~

Las variables `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` y las opciones SMTP requieren un servicio de correo configurado si se habilitan las notificaciones por email.

**Esquema:** no aplicar migraciones directamente sobre RDS sin revisar el estado de tablas y disponer de un respaldo. Usar `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` únicamente si el esquema de producción ya fue instalado o migrado correctamente; no asumirlo para una base vacía. Verificar roles, transacciones, imágenes persistentes y revocación de refresh tokens.

**HTTPS y seguridad:** configurar certificado TLS válido en el proxy/API pública, restringir Security Groups, no exponer el puerto de PostgreSQL a Internet y establecer `APP_CORS_ALLOWED_ORIGINS` con el origen HTTPS real de la Web, sin rutas. No utilizar comodines globales. La dirección HTTP de una EC2 antigua no sustituye a una API HTTPS verificable.

## 3. Web — Vercel

Configurar un proyecto Vercel conectado al repositorio y al commit/branch previamente aprobado:

| Campo | Valor |
| --- | --- |
| Root Directory | `frontend-web` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Variable de entorno | `VITE_API_BASE_URL=https://URL_BACKEND_HTTPS` |

El archivo `frontend-web/vercel.json` ya incluye el rewrite SPA hacia `index.html`. Abrir tanto la raíz como una ruta directa, por ejemplo `/login`, y confirmar que no devuelve 404. Probar registro, login, refresh, dashboard, metas, registros y recursos reales contra el backend **público**, no el Docker local.

Una variable `VITE_*` es visible en el bundle del navegador: nunca introducir claves privadas de AWS, JWT, RDS, correo o Google Books.

## 4. Android — Expo / EAS

Proyecto Expo existente: `@srhouse/studystreak`, projectId `f87140eb-01ad-4e30-b5a5-60722617531d`, identificador Android `com.srhouse.studystreak`.

Ya se generó una **development build** que arranca en un Android físico:

https://expo.dev/accounts/srhouse/projects/studystreak/builds/8c6f383f-93f7-418d-8144-632a902d4c40

**Esta APK requiere Metro y NO acredita todavía publicación ni conectividad con la API pública.** Para un build independiente:

1. En el entorno EAS `preview`, configurar `EXPO_PUBLIC_API_URL=https://URL_BACKEND_HTTPS` como variable pública. Verificar que la API está activa; nunca colocar una IP LAN ni `localhost` en una APK distribuible.
2. Revisar el perfil `preview` de `frontend-mobile/eas.json`: genera un APK instalable sin Metro. Ejecutar desde `frontend-mobile`:
   ~~~powershell
   npx --yes eas-cli@latest build --platform android --profile preview
   ~~~
3. Instalar la APK resultante en un Android real, abrirla sin Metro y comprobar registro/login, perfil, metas, registros, cámara, micrófono, permisos, recursos y estados de carga.
4. Si corresponde una publicación en tienda, revisar por separado el perfil `production`, que genera un AAB; no confundirlo con una APK instalable.

Las funciones de audio/vídeo de Study Rooms usan módulos nativos LiveKit/WebRTC: **no** utilizar Expo Go como prueba de esas capacidades. Configurar en el backend, solo si el servicio LiveKit está aprovisionado, las variables privadas `LIVEKIT_ENABLED`, `LIVEKIT_URL`, `LIVEKIT_INTERNAL_URL`, `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET`. Comprobar TLS/WSS, emisión de tokens de sala y conexión real desde Web y Android. No publicar `LIVEKIT_API_SECRET` en clientes.

## 5. Comprobación integral antes de anunciar el despliegue

Desde la raíz, sustituir las dos URLs por valores realmente publicados:

~~~powershell
node scripts/check-deployment.mjs --api https://URL_BACKEND_HTTPS --web https://URL_WEB_HTTPS
~~~

El script verifica disponibilidad básica, JavaScript de la Web, ruta profunda, rechazo sin JWT y preflight de CORS. **No** verifica transacciones autenticadas ni comunicación multimedia. Completar manualmente:

- Dos cuentas reales de prueba; registro, login, renovación y logout.
- Crear y editar metas, registrar progreso, enviar y aceptar seguimiento, validar registros, consultar racha y notificaciones.
- Acceder a los mismos datos desde Web y Android conectados a la **misma API HTTPS y RDS**.
- Google Books desde ambos clientes, incluyendo el manejo de falta de resultados y errores externos.
- Paginación, permisos de cámara/micrófono denegados, carga de evidencias, pérdida de conexión y mensajes de recuperación.
- Study Rooms y LiveKit entre dispositivos cuando el servicio multimedia esté habilitado.
- Revisar HTTPS, certificados, CORS, seguridad de las variables, latencia de endpoints (objetivo de la rúbrica: promedio inferior a 500 ms) y disponibilidad.

Registrar las URLs y resultados verificados, sin compartir contraseñas, JWT ni datos privados. La infraestructura no se considera validada únicamente porque Docker local, CI o EAS Build estén en verde.

## 6. Completar el README final y retirar esta carpeta

1. Sustituir en `README.md` los estados “por confirmar” por las **URLs HTTPS verificadas** de la Web y del backend, y el enlace de la APK preview/publicación Android **que funcione sin Metro**. Actualizar el estado de RDS solo si se verificó su integración.
2. Pedir al equipo que confirme las contribuciones y el **porcentaje individual de 0 % a 100 % de cada integrante**; no inventar los valores.
3. Dejar enlazados los resultados de CI del **commit efectivamente entregado** y conservar evidencia de la demo.
4. **Eliminar toda la carpeta `deployment/` una vez finalizado el despliegue y actualizado el README**. Este documento es únicamente un traspaso de tareas para Leonardo; no debe quedar como documentación provisional en la versión final de entrega.

Desde una rama revisada y después de comprobar que ya no se necesita este archivo:

~~~powershell
git rm -r deployment
git add README.md
git commit -m "docs: finalize StudyStreak deployment handoff"
git push origin NOMBRE_DE_LA_RAMA
~~~

Crear Pull Request y revisar antes de integrar en `main`. No ejecutar la eliminación de manera anticipada ni modificar servicios productivos sin confirmación del responsable.
