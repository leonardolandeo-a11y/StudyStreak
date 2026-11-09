# Etapa 6.7 — Cierre técnico Web / Mobile

Fecha: 2026-11-09 (America/Lima). Rama: `feat/ui-ux-web-mobile`. Base: `cfcc6dc`, auditoría [6.6](auditoria-final-web-mobile-etapa-6-6.md). No se añaden funcionalidades, soundscapes, dependencias ni rediseños.

## Recuperación del trabajo interrumpido

Al reanudar se confirmó `feat/ui-ux-web-mobile`, HEAD `456af2a`, staging vacío y los cambios E-04/documento todavía sin commit. Se revisaron `git diff`, `git diff --cached`, historial y resultados guardados, sin revertir ni sobrescribir implementaciones válidas.

- **Terminado antes de la interrupción:** E-02 implementado y registrado; E-04 implementado, con lint/TypeScript/build y 11 regresiones dirigidas aprobadas; consulta de Resources y decisiones E-03/E-05 documentadas. El documento de cierre era un borrador.
- **Pendiente entonces:** resolver una comprobación puntual tras el único fallo de la suite UI, ejecutar el test del validador que quedó detrás de ese comando, registrar E-04 y completar este informe. La última comprobación Chrome no llegó a ejecutarse porque la revisión automática agotó su cuota; no fue un rechazo de seguridad de la acción.
- **Completado al reanudar:** se repitió únicamente `socialAvatarCompletion.test.mjs` (2/2) sin modificar producto ni test, y el validador preexistente (3/3). Se verificó que el validador sigue íntegro, se creó `da89593` para E-04 y se terminó este documento. No se añadieron nuevas correcciones ejecutables durante la reanudación.
- **No repetido:** suites completas, build/lint ya aprobados para exactamente el mismo código, comprobaciones Mobile y consultas remotas que no dependen de cambios nuevos. Los commits y el documento no invalidan esos resultados.

## E-02 corregido — continuidad del ruido Web

El crossfade anterior terminaba en `head[blend - 1]`, no en `head[0]`. El test numérico existente fallaba de forma reproducible; no era un problema de tolerancia del test. Ahora el final mezcla progresivamente con el comienzo invertido temporalmente, hasta coincidir exactamente con la primera muestra. La ponderación cosenoidal empieza en cero y acaba en uno, sin introducir bruscamente la mezcla. Se conserva el máximo de 4096 muestras del tramo de transición, el resto del búfer y los filtros originales de ruido blanco/rosa/marrón. Los búferes muy cortos también igualan la última muestra a la primera.

La inversión temporal del segmento conserva su carácter de ruido; la mezcla es acotada y las pruebas comprueban que blanco sigue débilmente correlacionado, y rosa/marrón mantienen correlación temporal mayor. No se cambian `pomodoroAudio`, el motor, preferencias, volúmenes, temporizadores ni los 12 soundscapes. La suite estándar incluye ahora el test de síntesis que antes quedaba fuera.

**Pruebas:** cinco casos de síntesis: amplitud/finito/no silencio, reproducibilidad y distinción de colores, unión exacta con varios tamaños/semillas, interior sin modificar y pesos de crossfade, correlación de colores. Se mantiene el test original y se añaden regresiones, sin relajar su aserción. También pasa `soundscapes.test.mjs`. Esto acredita continuidad numérica de valor en la unión; **no se afirma una comprobación auditiva ni ausencia universal de artefactos perceptibles**. La escucha de los loops y sus transiciones queda como comprobación manual breve.

Commit: `456af2a fix(web): improve soundscape loop continuity`.

## E-04 corregido — validador API Web integrado

Se reutiliza `frontend-web/src/config/api.ts` como única fuente de reglas y normalización. Su contenido preexistente se conserva **íntegro**, comprobado por SHA-256 antes/después: `b0001cdb7668c72f47b5d8f0b97062c2a7f7bd3fc3d47c09d726da9f63a82c71`.

Este archivo es la **única excepción autorizada** a los 17 elementos preexistentes: se incorpora al commit porque ahora es una dependencia directa del cliente. El test preexistente `frontend-web/tests/apiConfiguration.test.mjs` se ejecuta y se conserva, pero permanece sin seguimiento y fuera del commit. Los otros 16 elementos ajenos siguen intactos.

- `apiClient` utiliza la URL normalizada y la exige antes de cada envío. URL ausente/relativa, protocolo no HTTP(S), userinfo, query o fragmento producen `ApiConfigurationError` antes del adaptador HTTP. No se usa el origen de Vite como alternativa silenciosa.
- `apiRuntime.ts` convierte el error del validador en un tipo explícito. No duplica reglas ni añade `/api`, localhost o direcciones hardcodeadas. Conserva los prefijos de despliegue y las rutas REST de cada servicio.
- El refresh del interceptor y las peticiones raw de restauración/logout de AuthProvider usan la misma configuración. Una configuración inválida no rompe el render ni impide logout local. Un fallo de configuración/red durante restauración no borra credenciales como si el servidor hubiese rechazado la sesión.
- JWT, SecureStore Mobile, métodos/contratos, timeouts (15 s; revocación al salir 3.5 s), retry único y single-flight por revisión de `b86eb51` permanecen. No se modifica `authSession.ts` ni se reescribe AuthProvider.
- `getApiErrorMessage` y el clasificador de Books distinguen configuración inválida de conexión/timeout, sin imprimir la URL suministrada, tokens o claves. La modificación en Books sólo afecta la presentación de ese error común; no cambia su búsqueda.
- La suite estándar de UI incorpora las regresiones de configuración y de aislamiento entre cuentas para no depender de ejecuciones manuales separadas.

Commit: `da89593 fix(web): integrate API URL validation`.

## Resources — resultado real y límites

### Contrato y requisitos revisados

Web y Mobile conservan **`GET /api/resources/books?q=...`**, protegido por JWT. La consulta admite 2–80 caracteres y pasa por Spring Boot. Los clientes no usan directamente otra API de libros ni contienen una clave Google. El servidor consulta `https://www.googleapis.com/books/v1/volumes`, devuelve hasta diez libros y normaliza metadatos; el contrato de frontend es una lista, no una página.

Spring lee `GOOGLE_BOOKS_API_KEY`. La documentación local explica cómo se proporciona en el servidor y que la ausencia se rechaza antes de consultar Google. En esta etapa **no se leen archivos privados ni valores de claves**, no se configura Books localmente y no se modifica el servidor, Compose, AWS o producción. El estado local sin configuración se toma de lo confirmado por el usuario, no de una inspección nueva de secretos.

### Comprobación de sólo lectura

`README.md`, `postman_collection.json` y el documento preexistente [backend-remoto](backend-remoto.md) identifican `http://3.238.32.75:8080` como dirección del backend del equipo. Las direcciones example.com de plantillas no se consideran deployments. Se consultó, antes de la interrupción, únicamente el endpoint documentado, sin autenticación ni envío de credenciales. No se repitió la consulta al reanudar:

| Destino | Petición | Resultado observado |
| --- | --- | --- |
| Deployment documentado | GET `/api/resources/books?q=algebra` | Timeout tras 8 s, curl exit 28; indicador **000**, que significa ausencia de respuesta HTTP y no un código HTTP del servidor. |
| Backend local | GET del mismo endpoint en `127.0.0.1:8080` | **401** anónimo. El filtro exige autenticación; no permite comprobar configuración Google ni contenido de la ruta. |

**Resultado de Resources real: pendiente.** No se afirma que funcione en deployment por el comentario de compañeros. Tampoco se afirma que esté caído universalmente: la consulta no respondió desde este entorno en ese momento. No se infiere un fallo CORS, de clave ni de Google a partir de un timeout de conexión al backend.

### Cómo distinguir errores

| Evidencia | Interpretación |
| --- | --- |
| `ApiConfigurationError` antes de transporte | Variable pública del frontend ausente o inválida; no hubo llamada a Spring/Google. |
| Sin respuesta HTTP / ERR_NETWORK / timeout | Conectividad/transporte hacia StudyStreak; no acredita un rechazo de Google ni diagnostica CORS por sí solo. |
| 401 | Autenticación StudyStreak ausente/caducada; conservar flujo de refresh/login. |
| 403 | Acceso a StudyStreak prohibido según su respuesta; no eludir JWT. |
| 503 de Books autenticado | Configuración/acceso del proveedor en servidor; revisar con el responsable. Un mensaje sobre clave/restricciones no demuestra por sí solo qué restricción falló. |
| 429 | Límite/cuota según la respuesta del servicio. |
| 502/504 | Proveedor temporalmente no disponible o timeout aguas arriba según el mapeo existente. |
| 200 con lista | Búsqueda recibida; lista vacía es un resultado válido, no un fallo. |

### Verificación manual mínima pendiente

1. Desde una red donde el deployment sea accesible, iniciar sesión con una cuenta autorizada en la aplicación existente. No pegar tokens ni cabeceras completas en el chat o documentación.
2. Buscar «algebra» en Resources Web y Mobile. En Network de Web comprobar GET Books autenticado: estado y lista recibida. Si hay 401, comprobar refresh/login antes de atribuirlo a Books.
3. Con 200, comprobar títulos, portada o fallback, detalle y enlace externo; en Mobile comprobar apertura Android. Probar una consulta sin resultados y cancelación. Registrar sólo estado y resultado funcional, sin secretos.
4. Si hay 503/429/502/504, anotar el código y mensaje saneado y consultar al responsable de backend. No crear claves ni cambiar la configuración remota desde esta tarea.

## E-03 / E-05 — decisión acotada, sin implementación

La decisión se comunicó antes de editar código. No se modifica backend ni se realiza un refactor para ocultar advertencias.

- **E-03:** el DTO de `/api/profile` no aporta fecha; Mobile la muestra si llega. Web obtiene el dato de su proyección social propia. No hay una fecha disponible en el estado propio Mobile que pueda mostrarse cambiando sólo una línea visual. Una solución frontend podría añadir una consulta social adicional y su ciclo de carga/cancelación/errores, pero no es una mera corrección de presentación con los datos actuales. Se conserva como limitación conocida en este cierre; no se inventa fecha ni se amplía el contrato.
- **E-05:** el build mantiene la advertencia del chunk Study Rooms, aproximadamente 564 kB minificado, asociado al módulo y su visor LiveKit. No bloquea build. Separarlo exige revisar la carga y fallback del visor Web y probarlo; mover módulos a otro chunk o subir el umbral no demostraría menor coste real. No se hace ese refactor ni se oculta la advertencia.

## Verificación realizada

### Automatizada

- ESLint Web sin errores/advertencias; TypeScript (`tsc -b`) y build Vite aprobados. La advertencia de bundle E-05 se distingue de un fallo.
- Pruebas numéricas de ruido y catálogo de soundscapes aprobadas antes del primer commit.
- Once casos Chrome dirigidos aprobados: seis nuevos de configuración (tres inválidas, prefijo/rutas/red, restauración y logout), tres de aislamiento entre cuentas y dos de refresh correcto/rechazado. Adaptadores/respuestas sintéticas, sin PostgreSQL.
- Suite Web estándar completa, ejecutada antes de la interrupción tras integrar el cliente compartido: **65/65 pruebas de lógica** y **51/52 de UI/Chrome**. El fallo puntual fue «Room refresh must not download avatars again» en `socialAvatarCompletion.test.mjs` (conteo de una petición adicional del avatar 79). No fallaron las regresiones de configuración, autenticación o ruido.
- Al reanudar, el archivo de avatares pasó **2/2** sin cambios de código ni relajación de aserciones. Se registra la sensibilidad temporal observada; **no se afirma que la suite UI completa pasara 52/52 en una sola ejecución**. Queda una observación de estabilidad del test, sin defecto nuevo del producto confirmado. No se repite la suite completa sólo para obtener una ejecución verde.
- Test preexistente del validador: **3/3** al reanudar, sin modificarlo ni incorporarlo al commit.
- Mobile: `roomsResourcesNotifications.test.mjs` aprobado con mocks, incluidos Books, normalización, cancelación y errores. No hubo cambios Mobile, por lo que no se repiten lint/TypeScript/exportación y suite completa ya aprobados en 6.6.
- No se ejecutan tests con escrituras sobre PostgreSQL habitual; tampoco se crean cuentas en producción para verificar Resources.

### Android real — confirmado por el usuario, no por el agente

El usuario informa comprobación satisfactoria en Expo Go de:

- Login, restauración y cambio entre cuentas.
- Pomodoro y estadísticas de Dashboard.
- Cámara, micrófono y evidencias de Validations.
- Profile, avatar, banner y privacidad.
- Study Partners y presencia.
- Study Rooms: temporizador y chat.
- Notifications.

Estas confirmaciones reales complementan los tests automáticos; no se presentan como ejecución del agente ni como prueba de todos los casos límite de la checklist 6.6. No implican haber probado TalkBack, todos los permisos denegados, terminación forzada, transporte LiveKit o cada caso de bloqueo/interrupción de audio. **Resources real sigue pendiente**; su funcionamiento en deployment aún es comentario de terceros.

La recepción de pantalla Mobile conserva `2877fc5`, requiere development build compatible y no se amplía. No se añade publicación de cámara, micrófono o pantalla. No se genera ningún development build.

## Archivos y Git

**Commit de ruido (`456af2a`):** `frontend-web/src/components/dashboard/noiseSynthesis.ts`, `frontend-web/tests/noiseSynthesis.test.mjs`, `frontend-web/package.json` (script que ya no omite la regresión).

**Commit API (`da89593`):** `frontend-web/src/config/api.ts` (preexistente, íntegro e incorporado por necesidad), nuevo `apiRuntime.ts`, `services/apiClient.ts`, `contexts/AuthProvider.tsx`, `utils/apiError.ts`, `services/googleBooksService.ts`, nuevo `tests/apiConfigurationIntegration.test.mjs` y `package.json` (regresiones en suite estándar).

**Documento de cierre:** este archivo se registra en un tercer commit documental independiente, identificado en la entrega final y en `git log`. No se hace amend para intentar escribir su propio hash dentro del documento.

**Estado final esperado y comprobado antes del commit documental:** HEAD `da89593`, las dos correcciones registradas y únicamente este documento pendiente de staging. Al registrar el documento quedan los **16 elementos preexistentes restantes** fuera de los commits: `.env.docker.local.example`, `docs/desarrollo-local.md`, `AGENTS.md`, `config/application-local-existing.properties`, `docs/auditoria-paridad-web-mobile.md`, `docs/auditoria_post_sincronizacion_main.md`, `docs/backend-remoto.md`, `docs/google-books-local.md`, `docs/recomendaciones.md`, `docs/respaldo-local-2026-11-06.md`, `docs/rubrica.md`, `frontend-mobile/.env.example`, `frontend-mobile/tests/apiConfiguration.test.mjs`, `frontend-web/tests/apiConfiguration.test.mjs`, `package-lock.json` raíz y `scripts/check-google-books.py`. El decimoséptimo elemento original, el validador Web, se incorporó expresamente y sin alterar su contenido, no por staging accidental. Sin amend, push, merge ni reset; sin cambios en Mobile, Spring, PostgreSQL, Docker, AWS, producción, dependencias o archivos privados.

Se termina 6.7 sin iniciar rediseño retro ni funcionalidades nuevas.
