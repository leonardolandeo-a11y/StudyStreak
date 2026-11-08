# Diagnóstico específico: 401 en perfiles sociales

## Causa y evidencia

El backend que escucha en localhost:8080 está desactualizado respecto a la etapa social. Se inspeccionó en memoria el JAR de `studystreak-local-app-1`: contiene ProfileController, pero no SocialProfileController, SocialProfileService ni la migración social. Las clases compiladas SecurityConfig, JwtRequestFilter, JwtService y GlobalExceptionHandler del JAR coinciden byte por byte con las anteriores a esta corrección.

Además existe un defecto en el manejo de errores MVC: con un JWT válido, una ruta sin mapping devuelve 401 en lugar de 404. La regresión aislada lo reprodujo ANTES de cambiar el handler: GET /api/profile = 200, GET de ruta inexistente = 401, donde se esperaba 404. El error MVC no resuelto termina en el despacho del contenedor a /error, cuya seguridad sin estado acaba enmascarando el error original. Eso activa innecesariamente el interceptor de refresh, pero renovar un JWT no crea una ruta que falta en el JAR.

El usuario confirmó en Chrome **POST /refresh = 200** y **GET /api/users/52/profile = 401**; inicialmente informó el mismo fallo para /api/users/3/profile. No se debe confundir ese POST real con GET /refresh, que no es un método soportado. La renovación de esa sesión no está siendo rechazada según la evidencia recibida.

## Comprobaciones de sólo lectura en el entorno habitual

- JAR: faltan los endpoints sociales; no se reconstruyó, reemplazó ni reinició el backend local.
- PostgreSQL: una transacción explícita BEGIN READ ONLY confirmó base studystreak_local/esquema public, ausencia de social_preferences y presence_session, y usuarios 3 y 52 activos. No se consultaron credenciales, correos ni contenido de perfiles.
- Tracking: existen relaciones ACCEPTED entre 4–3 y 52–3. Si el solicitante es 52, el requisito para consultar al 3 está satisfecho. No se dedujo la identidad exacta de Chrome sólo por ver el ID en una URL; el frontend también consulta la proyección social del usuario propio.
- GET anónimo a /api/profile y /api/users/3/profile devuelve 401, como exige la autenticación. Eso por sí solo no distingue expiración, firma inválida o ausencia de mapping.
- El cliente social importa apiClient. Su interceptor obtiene accessToken de sessionStorage y establece Authorization: Bearer; ante 401 renueva una vez y reintenta. Spring protege todas las rutas salvo login/register/refresh/logout mediante authenticated(), por lo que las nuevas rutas ya están cubiertas sin whitelist adicional.

No hubo sesión de Chrome conectada a las herramientas. No se extrajo el token real ni se inspeccionó su payload/firma o su cabecera concreta; no se afirma que ese access token original estuviera vencido, ausente o firmado con otra clave. El refresh 200 observado confirma que el servidor aceptó esa renovación, y las pruebas siguientes comprueban el envío/reemplazo de Bearer en el cliente real. No se imprimieron tokens ni claves y no se consumieron refresh tokens del usuario.

## Corrección mínima

GlobalExceptionHandler responde directamente a NoResourceFoundException con 404 y mensaje genérico, y a HttpRequestMethodNotSupportedException con 405 y cabecera Allow. Se evita el despacho que ocultaba esos errores. NO se modifica SecurityConfig, JwtRequestFilter, JWT, refresh, permisos de Tracking o persistencia. Las rutas protegidas siguen devolviendo 401 sin credenciales válidas.

La ausencia de tablas sociales es un segundo requisito pendiente de actualización, no la causa inmediata del 401 en este JAR sin rutas. Al desplegar el backend nuevo sin aplicar antes la migración, una consulta que alcance esas tablas fallará por esquema incompleto. Esta corrección no crea tablas ni aplica migraciones automáticamente.

## Pruebas y estados esperados

PostgreSQL exclusivamente desechable: contenedor studystreak-social-disposable-20261107, tmpfs, puerto 55449, esquema ss_audit_profile_social. La suite social prepara su migración sólo allí. Se ejecutaron ProfileIntegrationTest, SocialProfileIntegrationTest, JwtServiceTest, JwtRequestFilterTest y AuthServiceTest: 31 pruebas.

| Caso aislado | Resultado tras corregir |
| --- | --- |
| Perfil propio con JWT válido | 200 |
| Login y POST refresh válido | 200; el access renovado funciona |
| Refresh ya consumido | 401 |
| JWT ausente, inválido, vencido o firmado con otra clave | 401 |
| Ruta inexistente con JWT válido | 404, sin refresh necesario |
| Ruta inexistente sin JWT | 401 |
| Perfil privado de otra cuenta por contrato antiguo | 403 |
| Perfil social sin Tracking aceptado | 404 uniforme |
| Perfil social con Tracking aceptado | 200 |
| Método no soportado | 405 con Allow; no 401 espurio |

Chrome aislado, usando apiClient real con respuestas REST sintéticas: tres llamadas concurrentes llevan Bearer, un único POST refresh 200 renueva access/refresh y los reintentos llevan el access nuevo; un 404 social no provoca refresh. Si refresh da 401, se eliminan las credenciales y se vuelve a login. No se usan cuentas reales. La nueva prueba se incorpora a test:ui/test:web. Resultado final: 31 pruebas backend y 95 web aprobadas (60 de lógica y 35 de UI). ESLint, TypeScript y build aprobados; Vite mantiene el aviso de tamaño del chunk de Study Rooms. El contenedor PostgreSQL de prueba quedó detenido.

## Recuperación y siguiente acción

Para una sesión realmente vencida o con refresh rechazado: usar Sign out e iniciar sesión de nuevo contra el mismo backend. No hace falta cambiar código ni copiar tokens. En el caso observado refresh ya devuelve 200; volver a entrar no resuelve un JAR sin endpoints.

Para habilitar perfiles sociales hace falta autorizar una actualización local: aplicar manualmente la migración social al esquema correcto y actualizar sólo la aplicación backend con los commits de la etapa 5.2 y esta corrección. Seguir la guía social-profiles-presence.md; no reinicializar PostgreSQL ni sus volúmenes. No se han ejecutado estos pasos, migraciones persistentes, push, merge, cambios de AWS o panel social.
