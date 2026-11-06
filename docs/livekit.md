# Fase 4: LiveKit y colaboración

## Recuperación y alcance

Se conservaron `3c2b3ab` (autorización/rotación), `4590b71` (Web),
`e44b973` (visor Mobile) y todos los archivos posteriores. `61568e5` integra
chat, manos, reacciones y moderación. No se modifican las reglas del Ledger,
Goal privado, temporizador ni acreditación de minutos. Cámara, audio de pantalla,
micrófono y grabación permanecen desactivados.

Spring Boot autoriza con el JWT existente y membresía bloqueada transaccionalmente.
LiveKit transporta exclusivamente video de pantalla; el navegador solo inicia
`getDisplayMedia` al pulsar **Share screen** después de conectarse. El selector
nativo ofrece las superficies admitidas por ese navegador. Web y Mobile permiten
elegir emisor y ampliar video. Al cambiar permisos se solicita una reconexión
explícita con credenciales nuevas; nunca se reinicia la captura automáticamente.

## Autorización y revocación

- `GET /api/study-rooms/{id}/media`: disponibilidad, espacio actual y permisos.
- `POST .../media/token`: JWT LiveKit de 60 segundos, identidad UUID por conexión,
  sala exacta, sin administración, datos, cámara, audio ni metadatos modificables.
- `?publish=false`: token de espectador, incluso si lo solicita el anfitrión.
- `PUT .../media/permissions/{user}`: anfitrión concede/revoca publicación de pantalla.
- `DELETE .../media/members/{user}`: anfitrión expulsa; el backend persiste el veto,
  cancela participación verificable de ese usuario y bloquea la invitación conocida.
- Salida, cierre, transferencia y cambios de permisos rotan el UUID del espacio.
  El espacio retirado se guarda en PostgreSQL en la misma transacción.
- El cliente comprueba la autorización cada 4 segundos y desconecta al cambiar
  el espacio, perder autorización o desmontarse. El SDK maneja interrupciones
  transitorias; una desconexión definitiva requiere autorización nueva.

**La rotación no equivale a revocar criptográficamente un JWT antiguo.** LiveKit
self-hosted permite usar un JWT todavía válido para recrear el espacio retirado.
Ese JWT nunca autoriza el nuevo espacio. Los clientes legítimos se trasladan al
nuevo espacio; el limpiador revoca publicación/suscripción, expulsa y elimina
espacios retirados, conservando sus registros para futuras recreaciones.

La limpieza recorre lotes de 25, con 5 segundos entre ejecuciones y timeouts HTTP.
Su latencia aumenta con el número de espacios, participantes y fallos de red:
**no hay garantía de corte en 5 segundos**. Durante esa ventana, conexiones antiguas
pueden seguir intercambiando video en el espacio retirado. Los tokens renovados
por LiveKit pueden vivir más de 60 segundos; por eso los registros no se borran al
vencer el JWT original. Una caída del backend o de la administración de LiveKit
prolonga esa ventana. Monitorizar los avisos `Media cleanup unavailable` y la
cantidad de espacios retirados; para requisitos de revocación estricta hace falta
una política de admisión/revocación en el servicio multimedia. No publicar este
sistema con una promesa de expulsión instantánea.

Referencia: [ciclo de tokens y limitaciones self-hosted](https://docs.livekit.io/frontends/reference/tokens-grants/).

## Chat, manos y reacciones

`/api/study-rooms/{id}/collaboration` reutiliza el JWT y la membresía; no usa
autenticación ni credenciales LiveKit. Funciona también si LiveKit está desactivado.

- `GET ?page=0`: 25 mensajes recientes, más nuevos primero, orden por fecha/UUID.
  Las interfaces invierten cada página para lectura cronológica y ofrecen Older/Newer.
- `POST /messages {id,text}`: UUID del cliente como clave de idempotencia, autor
  obtenido exclusivamente del usuario autenticado, texto de 1–1000 caracteres.
  Repetir el mismo ID y texto devuelve el resultado guardado, incluso tras moderación.
  Cambiar contenido/autor/sala con ese ID se rechaza. Bloqueo de sala y versión JPA
  evitan duplicados y sobrescrituras concurrentes. Un mensaje nuevo cada 2 segundos
  por usuario/sala. Las interfaces conservan el ID al reintentar una entrega incierta.
- `DELETE /messages/{id}`: solo anfitrión; sustituye texto por una marca de moderación.
- `PUT /hand {raised}`: estado por miembro; salir/expulsar elimina la membresía y
  su estado. Manos inactivas se limpian después de 90 segundos sin heartbeat.
- `POST /reaction {reaction}`: `👏`, `💡`, `✅`; límite de una cada 3 segundos.
  Visibles 10 segundos; los campos se limpian cada 10 segundos, sin tabla histórica.
- Historial visible durante 30 días; eliminación física por tarea horaria
  (retención física máxima aproximada: 30 días + 1 hora mientras el backend funciona).
- Sincronización HTTP cada 2,5 segundos, sin solicitudes solapadas. Mobile suspende
  polling al desenfocar la pantalla y no consulta en segundo plano.
- Se muestra texto escapado por React, sin HTML aportado por usuarios. La presencia,
  chat y reacciones nunca acreditan tiempo de estudio.

## Desarrollo local

No reutilizar una base real para las pruebas. `scripts/setup-livekit.py` genera
`.env.livekit` y `.local/livekit.yaml` con permisos 0600, ignorados por Git. Se niega
a sobrescribir configuración existente. Leer el script antes de ejecutarlo.

```bash
python3 scripts/setup-livekit.py
# Con la configuración Docker habitual ya preparada en .env:
docker compose --env-file .env --env-file .env.livekit \
  -f docker-compose.yml -f docker-compose.media.yml --profile media up -d livekit
```

El overlay fija LiveKit Server `v1.13.11`, señalización TCP 7880, transporte TCP
7881 y UDP 7882, publicados únicamente en loopback. No ejecutar `down -v` en
contenedores ajenos ni usar esta configuración plaintext en Internet.

Variables backend (nunca `VITE_*` ni `EXPO_PUBLIC_*` para claves):

| Variable | Uso |
|---|---|
| `LIVEKIT_ENABLED` | `false` por defecto; salas/chat/temporizador funcionan sin video |
| `LIVEKIT_URL` | URL WS/WSS alcanzable por los clientes |
| `LIVEKIT_INTERNAL_URL` | URL HTTP/HTTPS administrativa alcanzable por Spring |
| `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Solo backend/LiveKit; secreto de al menos 32 bytes |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | PostgreSQL; esquema desechable para aceptación |
| `JWT_SECRET` | Secreto JWT existente, codificado en Base64; generar aleatoriamente |
| `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | Autenticación existente |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | En pruebas: servicio local, nunca correo de producción |
| `APP_CORS_ALLOWED_ORIGINS` | Orígenes Web autorizados; local permite `http://localhost:*` |

Spring en Docker usa `http://livekit:7880`; ejecutado en el host usa
`http://localhost:7880`. En esta auditoría se reutilizaron exclusivamente
`studystreak-phase4-db` (PostgreSQL 17, 127.0.0.1:55439), esquema `ss_audit_phase4`,
y `studystreak-phase4-livekit`. Spring escucha 18089 y Vite 5179. No ejecutar Maven
y aceptación de navegador simultáneamente contra el mismo esquema.

Web: `VITE_API_BASE_URL=http://localhost:18089`. Mobile:
`EXPO_PUBLIC_API_URL` debe señalar a un backend alcanzable desde el dispositivo.
**localhost en un teléfono es el propio teléfono.** Para LAN configurar URL,
IP anunciada de LiveKit, bindings, firewall y certificados acordes; el overlay
loopback suministrado solo cubre escritorio local.

## Expo y compilación nativa

Se fijan `livekit-client@2.23.0`, `@livekit/react-native@3.1.0`,
`@livekit/react-native-webrtc@150.1.1`, plugin Expo `1.1.0` y plugin WebRTC `15.0.2`.
`npm ls` confirma una sola versión de cada SDK. Expo SDK 58 incluye `expo-dev-client`.
`app.json` permite orientación de dispositivo y configura plugins nativos sin
servicio de publicación de pantalla. EAS contiene perfil `development`.

El layout raíz no importa LiveKit. `RoomMedia` comprueba Expo Go y carga el módulo
nativo solo al abrir video en un build compatible. Expo Go muestra disponibilidad
sin afectar las demás funciones. El visor no solicita cámara/micrófono ni inicia
AudioSession; `registerGlobals({autoConfigureAudioSession:false})` evita modificar
la sesión de audio de Focus Studio. Salir de la pantalla, entrar en segundo plano
o perder autorización desmonta LiveKitRoom y desconecta; volver exige pulsar Connect.

Desde `frontend-mobile`, con herramientas de compilación instaladas:

```bash
npx expo run:android
# En macOS con Xcode:
npx expo run:ios
# Alternativa remota autorizada por el propietario:
eas build --profile development --platform android
# o --platform ios con firma/provisionamiento iOS válidos
npx expo start --dev-client
```

No se ejecutó una compilación EAS remota ni se desplegaron servidores públicos.
Referencia: [plugin oficial de LiveKit para Expo](https://github.com/livekit/client-sdk-react-native-expo-plugin).

## Producción

Usar HTTPS para Web/API y WSS para señalización LiveKit con dominio y certificado
válidos; HTTP remoto no permite captura de pantalla. Configurar la IP pública
anunciada y NAT, abrir el puerto UDP configurado y TCP de respaldo, y verificar
STUN/TURN (incluido TURN/TLS para redes restrictivas). Un proxy HTTP por sí solo
no transporta WebRTC. Publicar solo los puertos necesarios y proteger acceso
administrativo/secretos. Validar desde Wi-Fi, red móvil y redes corporativas.

El egreso del SFU crece aproximadamente con bitrate × número de espectadores
por cada pantalla publicada. Limitar capacidad, medir CPU/egreso y probar varios
emisores antes de dimensionar. No hay grabación ni almacenamiento del video.

## Validación reproducible y evidencia (2026-11-06)

1. Backend: `./mvnw -B -Dspring.jpa.properties.hibernate.default_schema=ss_audit_phase4 verify`
   con `STUDYSTREAK_POSTGRES_INTEGRATION=true` y variables de prueba apuntando al
   PostgreSQL desechable anterior: **173 pruebas, 0 fallos, 0 errores, 0 omitidas**.
   Incluye membresía, tokens, solo lectura Mobile, expulsión, transferencia,
   cierre, rotación, persistencia, concurrencia, siete pruebas de colaboración y
   regresiones de las fases anteriores. El fallo inicial de sandbox fue Mockito
   sin permiso de auto-attach y PostgreSQL sin acceso de red; al ejecutar con los
   permisos requeridos pasó. No se omitieron pruebas para resolverlo.
2. Web: `npm run lint`, `npm run build`, `npm run test:web`: aprobados.
   Ejecución por caso con `NODE_OPTIONS=--test-isolation=none`: **53 pruebas + 5 regresiones UI**, todas aprobadas. Las cinco pruebas UI se repitieron fuera del sandbox para permitir el socket temporal de Vite.
   Incluye cuatro casos de captura (inicio/parada voluntaria, finalización tardía,
   cancelación y fallo tras desmontar). Vite advierte un chunk de StudyRooms >500 kB;
   no es un error de compilación.
3. Mobile: lint con cero warnings, `tsc --noEmit`, `test:auth` (**8 casos**),
   `test:pagination` (**5**), `test:review` (**6**), `test:focus` (**26**): aprobados con `NODE_OPTIONS=--test-isolation=none`.
   `expo config --type public`, `expo config --type introspect` y
   `expo export --platform android` aprobados: bundle Android/Hermes generado.
   Esto **no es una compilación Gradle/Xcode ni reproducción en un dispositivo**.
4. Dependencias: versiones LiveKit fijadas, lockfiles consistentes; árbol instalado
   sin SDKs LiveKit duplicados. La verificación online de Expo detectó ocho actualizaciones compatibles; se aplicaron y se repitieron lint, TypeScript y exportación Android. `expo install --check` online quedó correcto. Se corrigió la alerta alta de Zod mediante actualización transitiva compatible. Quedan 13 avisos moderados en herramientas Expo/ESLint (glob/minimatch); la solución automática propuesta cambia versiones mayores e incluso retrocede Expo. No se ejecutó `npm audit fix --force`.

### Aceptación audiovisual opt-in

Con backend desechable, LiveKit y Vite ejecutándose, y Playwright/Chrome instalados:

```bash
# No ejecutar la suite Maven sobre ese esquema mientras corre esta aceptación.
PLAYWRIGHT_MODULE=/ruta/a/playwright/index.mjs node scripts/test-livekit-browser.mjs
SYNTHETIC=1 PLAYWRIGHT_MODULE=/ruta/a/playwright/index.mjs node scripts/test-livekit-browser.mjs
```

Variables opcionales: `TEST_API_URL` (localhost:18089), `TEST_WEB_URL`
(localhost:5179), `CHROME_PATH` (/usr/bin/google-chrome), `HEADED=1`.
El script exige hostname localhost, crea tres cuentas desechables, cierra su sala
en `finally` y cierra el navegador. Deja cuentas/mensajes únicamente en la base
DE PRUEBA; no apuntarlo a una base real. No imprime JWT ni claves. No requiere
clave administrativa LiveKit. Capturas de evidencia en `/tmp/ss-phase4-host.png`
y `/tmp/ss-phase4-viewer.png`.

Resultados realmente observados:

| Prueba | Resultado |
|---|---|
| Tres cuentas autenticadas; mensajes, moderación, mano y reacción desde UI | Aprobado |
| Video sintético, 1 emisor y 2 receptores Web, fotogramas decodificados | Aprobado |
| JWT viejo recrea espacio retirado, sin alcanzar el actual; limpiador lo desconecta | Aprobado; confirma limitación self-hosted |
| Captura real con `getDisplayMedia`, pestaña dedicada seleccionada por Chrome | Aprobado con dos receptores Web |
| Dos emisores reales simultáneos, selección del principal y fullscreen | Aprobado |
| Stop sharing en aplicación, desaparición remota y pistas locales terminadas | Aprobado |
| Cerrar pestaña fuente: evento de fin, controles actualizados y video remoto retirado | Aprobado |
| Revocación/rotación desconecta clientes y publicación | Aprobado |
| Expulsado: rechaza token, invitación conocida y chat | Aprobado |
| Navegación SPA a Dashboard: todos los RTCPeerConnection cerrados y pistas terminadas | Aprobado |
| Selector manual de monitor/ventana/pestaña y botón Stop del chrome del navegador | Pendiente manual |
| Reproducción Android/iOS nativos, orientación física, background/retorno | Pendiente dispositivo/Development Build |
| Redes externas, TURN y reconexión tras caída real de red | Pendiente entorno de despliegue |

La prueba real no sustituye `getDisplayMedia` por un stream sintético: instrumenta
la API para observar sus pistas y deja que Chrome capture la pestaña dedicada.
Usa auto-selección del origen, por lo que no valida la interacción humana con el
selector. El modo sintético está separado y rotulado expresamente.

La prueba real detectó una carrera del SDK: `TrackUnsubscribed` se emite antes de
limpiar `publication.track`. Web ahora actualiza la lista en una microtarea y
escucha retirada/silencio/fallo de suscripción; el mismo script verifica la regresión.

### Prueba manual pendiente Mobile

Instalar el Development Build, abrir la misma sala que Web, pulsar Open shared
screens → Connect, compartir voluntariamente desde Web y verificar video/nombre,
selección de emisor, ampliación y rotación. Enviar chat/mano/reacción en ambos
sentidos. Ir al background y confirmar desconexión; al volver, conectar de nuevo.
Revocar permiso/expulsar/cerrar sala desde otra cuenta y comprobar salida del visor.
Abrir Expo Go y confirmar que solo video figura como no disponible. Probar además
Focus Studio/audio y Goal privado antes y después. No declarar aceptación completa
Web → Mobile hasta ejecutar estos pasos en Android/iOS compatibles.
