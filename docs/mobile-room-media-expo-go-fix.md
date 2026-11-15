# Study Rooms — Protección multimedia en Expo Go

## Diagnóstico confirmado y límites

- `NativeRoomMedia.tsx` sí exporta por defecto una función React válida. No hay una exportación ausente en el código fuente actual.
- El error comunicado corresponde a un lazy que resuelve a `undefined`. Antes, `RoomMedia` entregaba directamente `import('./NativeRoomMedia')` a `React.lazy`, sin comprobar el namespace ni su `default`. Las pruebas reproducen ese resultado inválido y comprueban ahora su conversión en un componente informativo válido.
- La condición anterior sólo descartaba web y `executionEnvironment === StoreClient`: permitía cualquier otro valor, incluso ausente, sin acreditar que WebRTC/LiveKit estuvieran enlazados. En las definiciones instaladas de Expo 58, StoreClient tampoco distingue inequívocamente Go de development client. Esa comparación no prueba capacidad multimedia.
- Evaluar `NativeRoomMedia` ejecuta los imports LiveKit/WebRTC y `registerGlobals` a nivel de módulo. Expo Go no incluye esos SDKs. No bastaba con capturar después una excepción de renderizado.
- No se ha inspeccionado ni operado el teléfono: no se puede atribuir con certeza el `default` ausente observado allí a un fallo concreto de Metro/interoperabilidad o a su valor de runtime. No se afirma que el dispositivo haya devuelto una constante específica. La corrección cubre ambas rutas inseguras sin inventar esa causa.

## Corrección acotada

`RoomMedia` usa `isRunningInExpoGo()` público del Expo instalado. Go se descarta antes de consultar módulos o importar SDKs. Sólo Android/iOS fuera de Go con **ambos** `NativeModules.WebRTCModule` y `NativeModules.LivekitReactNativeModule` pueden mostrar Open shared screens. Una detección fallida o módulos ausentes muestran el fallback.

`createRoomMediaLoader` vuelve a comprobar capacidad inmediatamente antes del import. Si el runtime no está permitido, el import no se invoca, incluso para un lazy que ya estuviera abierto durante Fast Refresh. Si el import falla o su default no es una función/clase, devuelve explícitamente `{ default: Fallback }`. No se silencia LogBox ni se ocultan excepciones globales. El boundary existente conserva el fallback para errores posteriores de renderizado.

No se modifica `NativeRoomMedia`, sus exports, transporte, tokens, permisos, registro de globals ni ciclo de conexión. Tampoco temporizador versionado, heartbeat, ledger, chat, roles, participantes, outbox o registro de tiempo. No hay nuevas dependencias ni módulos nativos.

## Funciones reales

| Función | Implementación existente |
| --- | --- |
| Cámara fotográfica | `camera.tsx` usa expo-camera para evidencias de Daily Records. Es un flujo separado, no una cámara en directo en Study Rooms. No se modifica. |
| Nota de voz | `voice.tsx` usa expo-audio para evidencias. No equivale a conversación/streaming de micrófono en salas. No se modifica. |
| Recepción de pantalla en Mobile | `NativeRoomMedia` recibe pistas `ScreenShare`, permite selección/maximización y desconexión. Solicita token con `publish=false`; `LiveKitRoom` tiene audio/video/screen en false. Requiere binario compatible y servidor LiveKit configurado. |
| Publicación de medios en Mobile | No implementada en este visor: no publica pantalla, cámara ni micrófono, ni graba. Dar permiso desde moderación no implementa la captura/publicación en el dispositivo. |
| Publicación de pantalla en Web | Ya existe por separado en RoomMedia Web. Puede servir como emisor autorizado para probar recepción Android. No se modifica Web. |

Expo Go muestra información estable y mantiene las otras funciones de salas disponibles; no intenta ejecutar LiveKit/WebRTC ni solicitar un token multimedia.

## Pruebas ejecutadas

- Cinco pruebas en `roomMediaSafety.test.mjs`: RoomMedia real bajo runtime Go simulado con módulos ficticios presentes sin resolver imports nativos; ausencia parcial/total de módulos, web y detección fallida; verificación del runtime al invocar un lazy ya creado; namespaces/default inválidos y errores de import convertidos en fallback; funciones y clases válidas renderizadas correctamente por React.lazy/Suspense real.
- Los imports nativos están instrumentados para fallar si llegan a evaluarse en los escenarios bloqueados. No se sustituye LiveKit por una implementación engañosa.
- ESLint, TypeScript y suite Mobile completa (32 archivos).
- Exportación Expo web para ejecutar Chrome aislado. No compila código nativo ni instala dependencias.
- Recorrido Chrome `mobileRoomsResourcesNotifications.browser.mjs` con API simulada: salas, reloj/roles, chat/reintentos, selección de meta, participantes, fallback de medios y otros módulos relacionados. No escribe en PostgreSQL persistente.

## Verificación manual en Android

No se ha iniciado compilación nativa, instalado paquetes ni ejecutado un development build.

**Expo Go:** recargar completamente el bundle actualizado, no sólo conservar una pantalla abierta con Fast Refresh. Si Metro sigue sirviendo una versión anterior, reiniciar manualmente desde frontend-mobile con `npx expo start --clear --lan` y abrir el proyecto en Go. Entrar en una sala de prueba: debe verse el mensaje de development build, sin Open shared screens ni error lazy. Comprobar temporizador, chat, participantes y Back. Cámara y voz de evidencias deben seguir accesibles por sus rutas originales.

**Development build compatible:**

1. Usar un APK de desarrollo construido con las versiones/plugins actuales (`expo-dev-client`, LiveKit y WebRTC ya declarados). Un APK anterior sin esos módulos mostrará fallback; instalar paquetes JS o escanear el QR en Go no añade código nativo. La creación/instalación de un nuevo APK requiere autorización aparte; este cambio no la ejecuta.
2. Con el APK compatible ya instalado, iniciar manualmente `npx expo start --dev-client --lan` y abrir el proyecto **en ese cliente**, no en Go. Conservar la configuración API LAN privada existente; no añadir claves LiveKit ni tokens a variables públicas.
3. Usar cuentas/sala de prueba autorizadas y servidor multimedia ya configurado. Open shared screens debe cargar el visor; con medios deshabilitados en servidor debe verse el estado informativo existente.
4. Compartir pantalla desde Web con un miembro autorizado. En Android, conectar como receptor, ver vacío cuando no hay emisor y comprobar recepción, selección, maximización y cierre. No se espera cámara, micrófono o publicación desde Android.
5. Probar desconexión de red, background/foreground, Back, logout/cambio de cuenta, revocación de permiso/epoch y cierre de sala; el visor debe desconectar o pedir autorización nueva sin bloquear el temporizador/chat. Mantener cambios de datos en entorno de prueba.

Referencias oficiales: [detección directa de Expo Go (fuente Expo)](https://github.com/expo/expo/blob/main/packages/expo/src/environment/ExpoGo.ts), [limitaciones de Expo Go](https://docs.expo.dev/develop/development-builds/faq/), [LiveKit Expo quickstart](https://docs.livekit.io/home/quickstarts/expo). Se contrastó además el código de las versiones instaladas localmente.
