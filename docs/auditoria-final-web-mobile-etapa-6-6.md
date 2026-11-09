# Etapa 6.6 — Auditoría final Web / Mobile

Fecha: **2026-11-09 (America/Lima)**. Rama: `feat/ui-ux-web-mobile`. Base auditada: `2877fc5`; corrección Web de esta auditoría: **`b86eb51`**.

## Resultado y alcance de la evidencia

La paridad funcional principal está implementada sobre la arquitectura existente. Las entregas 6.2–6.5 incorporaron configuración/sesiones, temas, navegación, Dashboard, Focus, perfiles/social, compañeros y CRUD. No se reconstruyó Mobile ni se repitió su implementación. **No se declara paridad completamente verificada de extremo a extremo ni en Android físico.** Las pruebas con adaptadores y API simulada acreditan el comportamiento del cliente bajo esos escenarios, no el transporte, almacenamiento, sensores ni autorizaciones reales de producción.

Se encontró y corrigió **un P0 Web de aislamiento entre cuentas**. No se confirmó otro P0/P1 que requiriera cambiar código. Queda **un fallo P2 reproducible en un test adicional de síntesis de ruido Web**, además de diferencias menores y comprobaciones manuales pendientes. Por ello, el resultado global no es «todas las pruebas existentes pasan».

Fuentes: [auditoría 6.1](auditoria-paridad-web-mobile.md), [rúbrica](rubrica.md), AGENTS.md y documentación 6.2–6.5: [API/sesión](mobile-api-session-etapa-6-2a.md), [sistema visual](mobile-sistema-visual-etapa-6-2b.md), [navegación](mobile-navegacion-entrega-a.md), [Dashboard](mobile-dashboard-entrega-b.md), [Focus](mobile-focus-studio-etapa-6-3b.md), [perfil](mobile-profile-etapa-6-4a.md), [social](mobile-social-etapa-6-4b.md), [compañeros](mobile-study-partners-etapa-6-4c.md), [CRUD](mobile-paridad-crud-etapa-6-5a.md), [Rooms/Resources/Notifications](mobile-paridad-etapa-6-5b.md) y [corrección multimedia](mobile-room-media-expo-go-fix.md). Las listas antiguas de pantallas aún no tematizadas se contrastan con los commits posteriores; no se presentan como brechas actuales.

### Clases de verificación

- **A. Automática:** unidades, integración entre módulos del frontend con almacenamiento/red nativos simulados, Chrome con API interceptada, checks estáticos y compilación/exportación. Se identifica cuándo se usa un backend simulado.
- **B. Expo Go / Android real:** interacción física, almacenamiento/archivos reales, permisos, sonido, bloqueo, ciclo de vida y autenticación contra un entorno de prueba. Pendiente salvo la confirmación del fallback comunicada por el usuario.
- **C. Development build:** visor de pantalla LiveKit/WebRTC en un binario compatible; no disponible en Go. No se construyó ni instaló ningún binario.

## Estado inicial de Git

Se confirmó la rama y los commits `fd56939`, `5b7e08b`, `590b35b`, `d49c876`, `cd885b6`, `a3e78ae`, `e785c82`, `a039599`, `81276eb` y `2877fc5`. El último corrige el lazy multimedia y se conserva.

Los **17 elementos preexistentes ajenos** no se editaron ni incluyeron en staging:

```text
.env.docker.local.example
docs/desarrollo-local.md
AGENTS.md
config/application-local-existing.properties
docs/auditoria-paridad-web-mobile.md
docs/auditoria_post_sincronizacion_main.md
docs/backend-remoto.md
docs/google-books-local.md
docs/recomendaciones.md
docs/respaldo-local-2026-11-06.md
docs/rubrica.md
frontend-mobile/.env.example
frontend-mobile/tests/apiConfiguration.test.mjs
frontend-web/src/config/
frontend-web/tests/apiConfiguration.test.mjs
package-lock.json
scripts/check-google-books.py
```

La relación exacta de Git se conserva al terminar; no se usa git reset/amend/merge/push. Los artefactos de pruebas se escriben en `/tmp` y `.expo` ignorado.

## Matriz de paridad final

«Implementado, pendiente de dispositivo real» implica que la lógica/contratos se verificaron en A, pero faltan B y, donde corresponda, integración autenticada real. **Ningún módulo completo se etiqueta como «Completo y verificado» sólo por pasar mocks.** Las validaciones puras individuales sí están comprobadas automáticamente.

| Módulo | Web / Mobile implementado y evidencia A | Clasificación final y pendiente |
| --- | --- | --- |
| 1. Login/Register y sesiones | Formularios/REST, JWT, refresh, restauración y logout. Mobile SecureStore, serialización, single-flight y aislamiento por revisión; Web corrección de respuestas/refresh de cuentas anteriores. Suites auth/session y Chrome autenticado simulado. | **Implementado, pendiente de dispositivo real.** P0 Web confirmado y corregido. B: almacenamiento/restauración real y autenticación contra backend de prueba. |
| 2. Dashboard | Estadísticas `verifiedPeriod`, 7/30 días, barras/líneas, metas y actividad reciente en ambas plataformas. Mobile posee ruta Dashboard real, no Home de accesos. Unidades de series y Chrome: ambos gráficos, ausencia/error/retry y separación de históricos. | **Implementado, pendiente de dispositivo real.** Falta observar cifras end-to-end del ledger real en entorno desechable. |
| 3. Focus Studio y audio | Start/Pause/Resume/Reset, meta/UUID, recuperación, outbox y finalización automática; 12 sonidos. Tests de temporizador/outbox/audio simulado y Chrome Focus. | **Error confirmado P2 en Web** (seam del ruido, abajo). Resto implementado; audio, interrupciones, bloqueo y continuidad B pendientes. No existe Finish manual: se documenta la finalización automática existente. |
| 4. Goals, registros y tags | CRUD/paginación, etiquetas, rachas, evidencia foto/voz, enlaces Focus/Resources. 6.5a añadió tags Mobile y separó formularios/listas. Pruebas de contratos, permisos, multipart, cancelación, fechas y aislamiento. | **Implementado, pendiente de dispositivo real.** B: captura/grabación/subida/descarga real, permisos, teclado y CRUD contra una base de prueba. |
| 5. Tracking | Búsqueda con debounce, solicitud, pendientes, decisiones, activos/historial, avatares y perfiles autorizados; paginación. Tests sociales de aceptación/revocación y navegación. | **Implementado, pendiente de dispositivo real.** A usa relaciones de fixture; no se cambiaron vínculos reales. |
| 6. Validations | Compañero → meta → registro → evidencia → crear/actualizar; permisos, IDs y retorno contextual desde Notifications conservados. Unidades de acceso y pruebas UI/Chrome previas de 6.5a/b. | **Implementado, pendiente de dispositivo real.** B: evidencia real, dos cuentas autorizadas, decisión/actualización y retorno físico. |
| 7. Study Rooms | Membresías, crear/unir/salir, host/member, reloj versionado, studying/meta, chat, reacciones y moderación. Unidades de reloj/contratos, pruebas servidor sin DB y Chrome de 6.5b. | **Implementado, pendiente de dispositivo real**, con **limitación técnica documentada** para medios C. Fallback Go confirmado por el usuario, no por acceso del agente al teléfono. |
| 8. Resources | Google Books únicamente vía `/api/resources/books`, validación/cancelación/retry, metadatos, portadas y detalle/enlaces. Tests de servicio y Chrome. | **Implementado, pendiente de dispositivo real.** La API devuelve lista sin paginación; no se inventa un endpoint paginado. Configuración/cuota Google y apertura Android real pendientes. |
| 9. Notifications | Filtros, paginación, leer/eliminar, contador común y destinos Goal/Validation/Tracking. Refresh de contador descarta polls obsoletos y oculta cero. Pruebas de contratos/carreras y Chrome previo. | **Implementado, pendiente de dispositivo real.** No incluye push nativo; no es una brecha de la etapa. |
| 10. Settings/temas | Dark/Light/System, cuatro paletas, persistencia local y Reduce Motion combinado con SO en Mobile. Pruebas de store/renderizado y Chrome; navegación Settings/Back existente. | **Implementado, pendiente de dispositivo real.** B: cambio del tema del dispositivo, reinicio, TalkBack y teclado/escala de texto. |
| 11. Profile propio | Lectura/edición, avatar/banner autenticados, validaciones, preview, guardado parcial informado y actualización del drawer. Chrome Mobile actual verifica PATCH/DELETE, cancelación, errores y cambio de cuenta. | **Parcial** en un detalle P2: Mobile sólo obtiene fecha de `/api/profile`, cuyo DTO no la incluye; Web usa su proyección social propia. B: picker y archivos nativos reales pendientes. |
| 12. Member Profile | Perfil social autorizado, banner/avatar, nombre/bio/fecha real, estadísticas consentidas y Back. Tests sociales/medios/caché y Chrome previo. | **Implementado, pendiente de dispositivo real.** Falta confirmar accesos reales ACCEPTED/revocados contra backend de prueba. |
| 13. Presencia/privacidad | Flags de privacidad y estados ONLINE/OFFLINE/HIDDEN/indisponible, lastSeen sólo autorizado; heartbeat único en foreground y limpieza por cuenta. Unidades de sesiones sociales/directorio y fixtures de UI. | **Implementado, pendiente de dispositivo real.** No se promete presencia continua con la app suspendida ni revocación instantánea antes del próximo refresh. |
| 14. Study Partners | Panel oculto inicialmente, grupos explícitos/neutral, páginas, caché/concurrencia y limpieza al cerrar/background/cambiar cuenta. Pruebas de modelo, permisos y Chrome de 6.4c/6.5b. | **Implementado, pendiente de dispositivo real.** Limitación existente: sin API agregada se consultan perfiles individualmente, con límites de concurrencia y polling; no se añade backend nuevo. |

## Integración API, seguridad y backend local

**Conectividad real, sólo lectura y sin credenciales:** `GET http://127.0.0.1:8080/actuator/health`, `/api/profile` y `/api/users/3/profile` devolvieron **401**. El intento dentro del sandbox falló por conectividad y se repitió fuera para distinguirlo de una caída real. El servicio HTTP responde y rechaza solicitudes anónimas; **401 no demuestra que el endpoint exista ni que el proceso esté saludable**, porque el filtro puede responder antes del routing. No se afirma un health UP, versión de JAR ni integración autenticada a partir de esos 401.

No hay una sesión de usuario conectada a estas herramientas ni un backend de integración autenticada desechable preparado en esta ejecución. No se extraen tokens del navegador/teléfono ni archivos privados, no se registran usuarios en PostgreSQL habitual y no se inicia/recrea Docker. Por tanto, siguen pendientes login/refresh/logout y permisos/medios end-to-end contra Spring con cuentas de prueba. No es correcto declarar el backend indisponible: sí respondió. El límite es la validación autenticada aislada, no la conectividad HTTP local.

- Mobile usa el validador existente y conserva prefijos REST sin añadir `/api`. HTTP LAN para Go es configuración local, no una IP hardcodeada ni credencial pública. SecureStore nativo separa tokens; el preview web móvil usa memoria porque no dispone de ese SDK.
- Web mantiene su cliente común y timeout de 15 s. El validador Web preexistente sin seguimiento **no está conectado al cliente**; sus tests adicionales verifican la función, no garantizan mensajes de configuración en producción. Se conserva sin modificar ese trabajo ajeno.
- Las pruebas aisladas cubren refresh correcto/rechazado, single-flight, restauración, logout, red sin borrado injustificado de sesión, 403/404, imágenes protegidas, cachés y Tracking. Ninguna supone que pertenecer a una sala otorgue acceso a imágenes privadas.
- Web usa sessionStorage para JWT, no cookies HttpOnly. Eso limita su protección frente a JavaScript/XSS; aquí no se certifica seguridad integral ni se modifica el contrato backend de autenticación.
- No se vuelcan tokens/contraseñas reales en logs. Los tests nuevos usan únicamente credenciales sintéticas y contabilizan reintentos sin imprimir cabeceras.
- 401 significa autenticación fallida; 403/404 y recursos restringidos se verifican en unidades/fixtures. Los 401 anónimos reales no prueban autorización ni comportamiento 404/405 posterior al filtro. No se relaja Spring Security para comprobarlos.

## P0 corregido y problemas restantes

| ID / prioridad | Evidencia, efecto y decisión |
| --- | --- |
| **E-01 P0 — Web, corregido** | Un adaptador aislado mantiene una petición de A pendiente; tras sustituir las credenciales por B, un 401 de A provocaba replay con B y un 200 tardío se entregaba como éxito. Ambos casos fallaron antes de la corrección. La revisión de sesión ahora rechaza respuestas/reintentos de otra sesión; el interceptor síncrono captura la revisión al enviar; refresh conserva la revisión cuando sólo rota tokens y las tareas de refresh pertenecen a su propia revisión. No cambian endpoints, backend ni reglas JWT. |
| **E-02 P2 — Web, abierto** | `noiseSynthesis.test.mjs` falla de forma reproducible en `abs(first-last) < 0.01`. El crossfade actual termina mezclando hacia una muestra interior, no necesariamente la primera; no satisface su contrato de continuidad. No se afirmó haber oído un clic físico. Es un defecto de calidad de loop, no pérdida de datos/crédito ni pantalla bloqueada; la política de esta etapa sólo autoriza corregir P0/P1, por lo que no se modifica. |
| **E-03 P2 — paridad de fecha de Profile, abierto** | `OwnProfile.registrationDate` es opcional y la pantalla Mobile lo muestra sólo si llega. El DTO propio actual no lo aporta; Web utiliza la proyección social. No se inventa fecha ni se cambia contrato. Queda una diferencia pequeña de presentación, no un fallo del editor. |
| **E-04 P2 — configuración Web, abierto** | Validación explícita de URL aún no integrada en el cliente Web; el trabajo correspondiente es uno de los 17 elementos ajenos. Un valor incorrecto puede presentarse como error de red. No se altera ese trabajo preexistente durante la auditoría. |
| **E-05 P2 — tamaño del bundle Web** | Vite build correcto con advertencia de chunk StudyRoomsPage superior a 500 kB (aprox. 564 kB minificado). Riesgo de carga inicial en red lenta; no se introduce un refactor de rendimiento general. |

**No se confirmó un P1 funcional adicional.** Android físico, integración autenticada de prueba, deployment y transporte LiveKit son límites de evidencia, no bugs P0/P1 deducidos de la ausencia de acceso. No se proponen ni realizan cambios de ledger, migraciones, dependencias nativas o Spring para cerrar artificialmente esas verificaciones.

### Cambios de E-01 y regresión

Commit **`b86eb51 fix(web): isolate in-flight requests across account changes`**, cuatro archivos:

- `frontend-web/src/services/apiClient.ts`: captura/validación de revisión en requests/responses/retry; refresh single-flight separado por revisión.
- `frontend-web/src/services/authSession.ts`: observa el almacenamiento existente para distinguir login/logout/cambio de cuenta de rotación de tokens; no añade proveedor ni altera AuthProvider.
- `frontend-web/tests/apiAccountIsolation.test.mjs`: 401 y 200 tardíos de A frente a B; refresh antiguo de A que no borra/bloquea el refresh nuevo de B. Tres escenarios Chrome sin backend real.
- `frontend-web/tests/apiTimeout.test.mjs`: ajusta el selector estático a la variable de la tarea por revisión, conservando la comprobación del timeout.

Las regresiones pasan después; también siguen pasando las pruebas existentes de single-flight y refresh fallido. No se cambian ficheros Mobile ni backend en esta auditoría.

## Pomodoro, audio y estadísticas

| Escenario | Comportamiento revisado / evidencia | Límite pendiente |
| --- | --- | --- |
| Start / Pause / Resume | Sesión vinculada usa UUID y meta/duración inmutables; pausa/reanudación conserva UUID. Chrome Focus Mobile y unidades de ambas plataformas. | Latencia/respuestas reales y control físico B. |
| Finish | Finalización automática al vencer el bloque; no se añade Finish manual ni crédito parcial inexistente. | Confirmar un bloque completo realmente observado en backend de prueba. |
| Reset / incompleta | Cancelación del bloque activo; no inventa completado. Las pruebas preservan pendientes legítimos separados del timer. | Corte de red durante CANCEL y recuperación en Android. |
| Cambio de pantalla | Audio y render de Focus se limpian al perder foco. El timer se recalcula por deadline al volver. Los pulsos de sesión individual pueden continuar si la ruta permanece montada y la app está activa: política existente, no un cambio de esta etapa. | Comprobar con dos pantallas y dispositivo; no confundir blur con background. |
| Background/bloqueo | Pulsos condicionados a AppState activo; el deadline local puede transcurrir sin que eso genere tiempo verificado. | Gestión real del SO, llamadas/auriculares y retorno; no se promete ejecución continua. |
| Outbox | Persistencia por cuenta/UUID, recuperación, deduplicación, confirmación perdida y reintento idempotente probados con FileSystem/adaptador simulados. | Cierre forzado mientras escribe, capacidad real de SecureStore y archivos, red móvil. |
| Tiempo observado | Unidades backend de precisión prueban intervalos y restos temporales sin DB; reloj de salas versionado rechaza snapshots antiguos. No se modifica ledger. | No se hizo una prueba transaccional PostgreSQL ni se auditó crédito real del usuario. |
| Estadísticas | Ambas plataformas validan `verifiedPeriod`, 7/30 y coherencia de serie; nunca sustituyen esos datos por historial paginado o estimados. Resúmenes all-time por meta conservan su significado distinto. | Comparar Profile/Dashboard/Focus con un ledger desechable real. |
| Gráficos/audio | Chrome Dashboard verifica barras/líneas y empty/error; audio simulado verifica lifecycle/dispose y comandos. | Sonido físico y seam P2 Web; no se afirma verificación audible. |

## Study Rooms y multimedia

Se conserva `2877fc5`: Go se detecta antes del SDK; faltan WebRTC/LiveKit → fallback; el loader valida un default función/clase y convierte imports inválidos en un componente válido. El usuario confirmó que el fallback ya no bloquea su pantalla en Go. Las cinco regresiones y las unidades de salas siguen aprobadas.

- **Expo Go:** salas, reloj, roles, chat/reacciones/moderación, participantes, avatares autorizados y meta privada están implementados; no se requiere LiveKit para esos flujos. El fallback no promete recepción.
- **Development build:** visor receptor de pistas ScreenShare, selección/maximización y desconexión. Requiere módulos nativos instalados en el binario y servidor multimedia autorizado/configurado.
- **No implementado en Mobile:** publicar cámara, micrófono o pantalla, grabar reuniones. Cámara y nota de voz de Daily Records son flujos separados de evidencia. Los permisos de moderación no crean un emisor nativo.
- **Web:** publicación de pantalla existente es independiente. Puede ser emisor de prueba del visor Android; no se ha probado transporte real en esta ejecución.
- Reconexión, revocación de permisos/epoch y detención en background existen en el visor, pero precisan C para acreditarlas realmente.

## Pruebas ejecutadas y reutilizadas

| Verificación | Resultado y alcance |
| --- | --- |
| Web `npm run lint` | Aprobado, sin advertencias de ESLint. |
| Web `npm run build` | TypeScript `tsc -b` y Vite aprobados; advertencia de chunk grande documentada. |
| Web `npm run test:web` | **60 pruebas de lógica + 43 de UI/Chrome aprobadas**, después del cambio de autenticación. Se repitió porque el cliente común cambió. |
| Web `node --test tests/apiAccountIsolation.test.mjs` | **3/3 aprobadas**. Las dos reproducciones originales fallaron antes del arreglo. |
| Web extra: configuración + síntesis | Validador preexistente **3/3**; síntesis **1/2**, con el fallo E-02. El validador/test son trabajo ajeno sin seguimiento. No se oculta este fallo porque el script estándar no incluya noiseSynthesis. |
| Mobile lint / `npx tsc --noEmit` | Aprobados, sin cambios de código Mobile. |
| Mobile `node --experimental-strip-types --test tests/*.test.mjs` | **32 archivos aprobados** en el árbol local; incluye el test de configuración preexistente sin seguimiento, que no se añade al commit. |
| Mobile Chrome actual | `mobileDashboard.browser.mjs`, `mobileFocus.browser.mjs`, `mobileProfile.browser.mjs`: aprobados con todas las peticiones externas interceptadas. Gráficos, timer, edición/errores/cuentas, navegación, temas y 320–1440 px. |
| Mobile Chrome reutilizado | Recorridos Goals, Social, Partners, Rooms/Resources/Notifications ya aprobados en 6.5a/b y corrección multimedia; Mobile no cambió desde entonces. Se reutiliza esa evidencia en lugar de repetir todo, sin presentarla como ejecución nueva ni Android físico. |
| Expo | Exportación Android nueva `.expo/audit66-android` aprobada. Se reutiliza exportación web del mismo código para Chrome. No es un development build ni instalación física. |
| Backend aislado | **52/52** tests en siete clases: JwtRequestFilterTest, JwtServiceTest, AuthServiceTest, FocusStatisticsServiceTest, StudyObservationPrecisionTest, StudyRoomServiceTest y GoogleBooksServiceTest. Mockito/repositorios/JdbcTemplate simulados, sin SpringBootTest ni datasource. El primer intento falló por self-attach de ByteBuddy dentro del sandbox; fuera pasó. No hubo escrituras DB. |
| Backend HTTP real | Tres GET anónimos a 8080 → 401. No se deduce health UP ni éxito autenticado. |

Comandos reproducibles se encuentran en package.json y los nombres anteriores. Pruebas backend: `./mvnw -o -Dtest=JwtRequestFilterTest,JwtServiceTest,AuthServiceTest,FocusStatisticsServiceTest,StudyObservationPrecisionTest,StudyRoomServiceTest,GoogleBooksServiceTest test`. No ejecutar suites opt-in de PostgreSQL apuntando a una base persistente para convertir esta evidencia en integración real. No se ejecutó el test opt-in que escribe perfiles/ledger en PostgreSQL.

## Rúbrica: evidencia, brechas y límites

No se asignan puntos ni nota estimada; la rúbrica incluye exposición individual y deployment que no se pueden inferir de un repositorio local.

| Criterio | Evidencia comprobada | Parcial / pendiente que afecta evaluación |
| --- | --- | --- |
| 1. Exposición | Documentos de arquitectura y recorridos disponibles. | Dominio individual, pitch y demo presencial no evaluados. La demostración debe distinguir Go y development build. |
| 2.1 Mobile/backend | REST central, JWT, SecureStore, interceptores y métodos HTTP comprobados en A. | Login/sensores/datos core end-to-end contra API real y restauración física pendientes. Mock no acredita integración completa. |
| 2.2 Arquitectura Mobile | Servicios, hooks, contextos y componentes TS; Expo Router conservado. Hay 54 archivos TSX en components y primitivas reutilizadas (Screen, FormField, ActionButton, Card, CreationModal, etc.). | El número no prueba por sí solo SRP/calidad; algunas pantallas grandes conservan orquestación inline. No se refactorizan por estética en auditoría. |
| 2.3 Sensores/API externa | Cámara y micrófono para evidencias aportan valor real; servicios de archivos y permisos implementados. Books vía backend, sin clave Google en bundle. | Ver ambos sensores funcionando/denegados en teléfono y proveedor Google configurado. LiveKit no se cuenta como sensor físico implementado en Go. |
| 2.4 Errores/carga | Tests de 4xx/5xx, timeout, empty, retry, validaciones y feedback. | Casos de SO/permisos/red real y recuperación tras terminación forzada pendientes. |
| 3.1 Web/backend | Cliente común, Bearer, timeout, refresh, cancelación y nuevo aislamiento probado. | Integración autenticada real/deployment pendiente; sessionStorage sigue accesible a JS. Validador URL Web no integrado. |
| 3.2 Componentes React | 59 archivos TSX en components, props TS, hooks/providers y primitivas compartidas. | No se confunde conteo con verificación de todos los componentes ni certificación de arquitectura perfecta. |
| 3.3 Routing | Rutas protegidas y destinos contextuales comprobados con Chrome; selección/IDs preservados. | URLs reales de deployment y navegación con backend autenticado pendientes. |
| 3.4 Errores/validación Web | Suites de formularios, autorización, paginación y estados aprobadas. | E-02 extra falla; configuración URL incompleta no se oculta. |
| 4.1 Visual | Tokens, responsive/temas, iconos, foco y movimiento reducido con evidencia UI/Chrome. | No hay medición exhaustiva de contraste por toda combinación, TalkBack o hardware. E-05 rendimiento en red lenta. |
| 4.2 UX | Confirmaciones, formularios contextuales, filtros, búsqueda, estados y Back. | Feedback/teclado/fuente ampliada reales necesitan checklist B; no se hace rediseño general. |
| 4.3 Vistas | Login/Register, Dashboard, Focus, perfiles, listados/detalles y Settings con propósito diferenciado. | Perfil propio Mobile carece de fecha efectiva; pruebas end-to-end pendientes. |
| 4.4 Paginación | Web Goals y DailyRecords exponen tamaños 10/25/50/100 y query params; componente reusable muestra rango/páginas. Mobile múltiples servicios paginados y límites por página. | Mobile conserva tamaño fijo 10 y estado nativo, no URLs compartibles equivalentes a escritorio. No es fallo de la rúbrica **Web**; no afirmar que todos los listados Web exponen todas las opciones. |
| 5. Deployment | No se alteró infraestructura. HTTP local responde. | URLs públicas, HTTPS/CORS reales, publicación Expo, disponibilidad y latencia no comprobados; no declarar esos puntos cumplidos. |

Los principales riesgos para una evaluación son presentar mocks como integración real, prometer LiveKit en Go, no demostrar cámara/micrófono reales, no confirmar despliegue accesible y no ejecutar el recorrido de bloqueo/recuperación del Pomodoro. Son pendientes verificables, no puntuaciones inventadas.

## Checklist reproducible de Android físico

Preparación: anotar dispositivo/Android, versión Go o APK compatible, commit JS, URL API LAN existente (sin copiar credenciales), fecha y resultado observado. Usar **dos cuentas y datos de un entorno de prueba**, no crear/modificar relaciones/registros en la base habitual para fabricar escenarios. Cada casilla empieza pendiente; la confirmación previa del usuario sólo cubre el fallback de Go.

### A. Verificado automáticamente

- [x] Revisión/configuración URL Mobile, JWT y refresh/retry/logout/restauración/cuentas con SecureStore simulado.
- [x] Timer/outbox/UUID, tiempo observado en unidades, series verificadas, 7/30 y dos gráficos.
- [x] Contratos de CRUD/imágenes/privacidad/relaciones/revocación, carga/vacío/error/retry con fixtures.
- [x] Temas/paletas, navegación contextual, Back y responsive en renderizado/Chrome.
- [x] Fallback multimedia y rechazo de defaults lazy inválidos sin importar SDKs en runtime Go simulado.
- [ ] No se marca «todo audio correcto»: E-02 falla. Ninguna casilla A sustituye B/C.

### B. Requiere comprobación manual en Expo Go

| Paso | Acción reproducible | Resultado esperado / evidencia a registrar |
| --- | --- | --- |
| B1 Sesión | Login cuenta A, cerrar/reabrir app, cortar/restaurar red durante refresh. Logout y login B; repetir con peticiones de imágenes pendientes. | Restauración o error recuperable claro; ningún dato/archivo/token de A aparece como B. No se pierden credenciales sólo por fallo de red. |
| B2 Apariencia | Elegir cada paleta en Light/Dark, System y reinicio; cambiar tema del dispositivo y Reduce Motion. | Preferencias persisten, System se actualiza y movimiento se reduce; contraste/legibilidad suficientes. |
| B3 Navegación | Drawer → Menu/tabs/+ → formulario/cancelar; Settings/Profile/Resources/Notifications → Back. Abrir notificación de registro/validación. | No crea datos antes de confirmar; Back correcto, IDs de goal/record conservados y sin botones redundantes. |
| B4 Foto | En registro de prueba, permitir cámara, capturar/preview/cancelar, subir/reemplazar/eliminar; repetir denegando permiso y volviendo de Settings del SO. | Explica permiso denegado, no sube cancelaciones, limpia temporales y descarga autenticada funciona. |
| B5 Voz/audio | Permitir/denegar micrófono, iniciar/parar/cancelar/subir; reproducir/pausar nota. Reproducir/cambiar sonidos Focus y salir/logout. | Sin grabación/reproducción residual, errores recuperables, selección cancelada no escribe. Registrar sonido audible, no sólo indicadores. |
| B6 Pomodoro | Vincular meta, Start/Pause/Resume, navegar, bloquear/desbloquear y cambiar apps; probar Reset de bloque incompleto. | Mismo UUID, duración/meta bloqueadas durante sesión, recuperación coherente. Deadline local no acredita gaps; Reset no inventa minutos. |
| B7 Confirmación/outbox | Completar un bloque en foreground con tiempo realmente observado; cortar red al confirmar, reabrir y reintentar. | Mismo UUID, una acreditación; pendientes sobreviven/reintentan por cuenta. Comparar Profile/Dashboard/Focus en 7/30 sin sumar historial paginado. |
| B8 Imágenes/perfiles | Perfil propio: editar nombre/bio, galería/cancelar y avatar/banner 2/5 MiB, errores y Back. Perfil ajeno con/sin ACCEPTED en entorno de prueba. | Drawer actualiza identidad, no acceso privado por sala/búsqueda, fallback autorizado y revocación elimina caché. Fecha ausente conocida E-03. |
| B9 Partners/privacidad | Abrir/cerrar panel, páginas, perfil y Back; cuenta B alterna permisos y primer/segundo plano. | ONLINE/OFFLINE sólo con estado real; HIDDEN neutral; lastSeen/estadísticas sólo consentidos. Polling para cerrado/background y una presencia propia. |
| B10 Formularios/accesibilidad | Teclado en ancho pequeño, nombre largo, multiline, fuente grande, lector TalkBack/foco externo, permiso denegado y modo avión. | Labels, orden y controles táctiles utilizables, foco visible, sin campos tapados ni navegación atrapada. |
| B11 Rooms Go | Crear/unir/salir de sala de prueba, host/member, reloj con otro dispositivo, meta/studying, chat/reacción y moderación. Background/reconectar/cierre/revocación. | Fallback de medios sin crash; demás controles operativos. Snapshots antiguos no revierten reloj/rol, no doble crédito ni permisos ampliados. |
| B12 Resources/Notifications | Buscar desde meta, cancelar/red/empty y abrir enlace Android. Filtrar/read/delete/Back en Notifications y observar drawer. | Sin resultados tardíos, errores claros, enlace abre; contador actualizado sin cero, destino contextual correcto. |

El registro manual debe incluir «pasó/falló/no probado», pasos y resultado real; no rellenar casillas con los resultados de mocks.

### C. Requiere development build

- [ ] Disponer de APK Android compatible con los plugins/versiones LiveKit/WebRTC actuales; un APK antiguo sin esos módulos muestra fallback. No se genera ni instala durante esta auditoría.
- [ ] Abrir Metro con `npx expo start --dev-client --lan` **en ese cliente**, no en Go, usando la configuración local existente.
- [ ] En servidor multimedia de prueba autorizado, conectar visor receptor y usar Web como emisor de pantalla. Comprobar vacío, conexión/error, recepción, selección y fullscreen/landscape/SafeArea.
- [ ] Revocar permiso/epoch, cerrar sala, cambiar red, background, Back y logout/cuenta: desconectar y pedir autorización fresca sin bloquear reloj/chat.
- [ ] No esperar publicación nativa de cámara/micrófono/pantalla ni grabación: no están implementadas. No instalar dependencias o compilar para simular una paridad que no existe.

## Cierre

Cambios ejecutables limitados al P0 Web y pruebas. Este documento se registra por separado. Permanecen intactos los 17 elementos ajenos; no hubo cambios Mobile, Spring, migraciones, PostgreSQL persistente, Docker, AWS, producción, dependencias ni archivos privados. Se termina 6.6 sin comenzar rediseño retro ni funcionalidades nuevas.
