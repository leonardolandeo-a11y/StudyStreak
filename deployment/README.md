# StudyStreak deployment — etapa 19.1

Este paquete **no publica** servicios ni modifica AWS, RDS, GitHub, variables de entorno reales o credenciales.

## Cobertura de rubrica

Se requieren backend publico con HTTPS (AWS u otro cloud), PostgreSQL administrado, React Web publico (Vercel/Netlify/etc.), React Native publicado por Expo/EAS o tienda, URLs publicas, JWT funcionando de extremo a extremo, CORS, secretos externos y disponibilidad. El despliegue efectivo debe comprobarse por separado.

## Cambios de este paquete

- `SecurityConfig.java`: toma la lista de origenes desde `APP_CORS_ALLOWED_ORIGINS`; si esta ausente, conserva el soporte de `http://localhost:*` para desarrollo. Separa multiples origenes con coma. Establecer en produccion **origenes HTTPS exactos** (scheme + dominio y puerto si corresponde, sin ruta): `https://your-site.vercel.app`. No usar `*` en produccion.
- `frontend-web/vercel.json`: proporciona fallback a `index.html` para que las rutas React Router funcionen al actualizar. Solo aplica si se elige Vercel.
- `.env.production.example`: muestras de la URL publica de API para Vite/Expo; **no** contienen secretos y no se usan automaticamente si no se copian/configuran.
- `deployment/production.env.example`: lista orientativa, no segura para ejecutar hasta reemplazar TODO placeholder.

## Pasos de despliegue despues de la auditoria de infraestructura

1. Confirmar endpoint publico HTTPS del backend, estado de EC2/servidor y conectividad a RDS. Mantener la base de datos en red privada; no abrir PostgreSQL a internet.
2. Configurar credenciales de base de datos, JWT, email, Google Books y `APP_CORS_ALLOWED_ORIGINS` en variables de entorno/secret manager del backend. Reiniciar el backend **solo tras validar configuracion**.
3. En Vercel, configurar **Root Directory** `frontend-web`, Build Command `npm run build`, Output Directory `dist` y `VITE_API_BASE_URL=https://TU-API-HTTPS` como variable de entorno de produccion. Si se usa Netlify/Amplify, aplicar la regla SPA equivalente del proveedor elegido.
4. Para Expo/EAS, definir `EXPO_PUBLIC_API_URL=https://TU-API-HTTPS` en variables de entorno de `production`. Este valor se incluye en el JS; nunca poner secretos en `EXPO_PUBLIC_`. Verificar cuenta Expo, projectId, identificador Android, perfil EAS antes de publicar.
5. Comprobar acceso directo a rutas web, CORS/OPTIONS, registro/login/refresh/logout y funcionalidades con web y telefono; registrar URLs publicas y tiempos de respuesta. Estas son pruebas finales obligatorias, aun si el build local pasa.

## Observaciones importantes

- La auditoria original excluyo deliberadamente archivos `.properties`, `.env` y configuraciones reales de hosting: no se puede afirmar que AWS, RDS o HTTPS ya esten correctamente configurados.
- Variables `VITE_*` y `EXPO_PUBLIC_*` son publicas en el bundle; no son aptas para secretos.
- Las claves y contrasenas reales nunca deben compartirse ni subirse a Git.
- No se hace `git commit` ni `git push` automaticamente.

Documentacion oficial: https://www.springframework.org/spring-security/reference/servlet/integrations/cors.html ; https://vercel.com/docs/frameworks/frontend/vite ; https://docs.expo.dev/eas/environment-variables/
