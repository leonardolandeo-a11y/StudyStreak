# Mobile — Entrega A: navegación y acciones contextuales

Base: `5b7e08b`, rama `feat/ui-ux-web-mobile`. Se conserva el sistema visual y la seguridad de sesión. Referencia: [auditoría](auditoria-paridad-web-mobile.md).

## Navegación

El Stack autenticado contiene un grupo `(main)` con drawer nativo de Expo Router y un grupo `(menu)` con cuatro pestañas: Goals, Tracking, Validations y Study Rooms. Los grupos no cambian las URL públicas. Los detalles de metas/registros, evidencias, Settings y Profile permanecen en el Stack, fuera de la barra inferior; se mantienen los destinos de notificaciones y el modo de revisión de registros ajenos. Se utilizan las APIs incluidas en Expo Router 58 y las dependencias ya instaladas, sin instalar paquetes.

Home deja de mostrar tarjetas de accesos y redirige a `/goals`. Los enlaces internos a las listas utilizan rutas canónicas sin grupos, ya que los grupos nuevos cambian los identificadores tipados internos. Pestañas y drawer conservan historial; Menu regresa al navegador de pestañas existente, no fuerza siempre Goals. Se mantienen accesos a Focus, Resources, Notifications, Settings y logout (en Profile).

El drawer presenta identidad/avatar y engranaje Settings, Menu, Dashboard, Focus Studio, Resources, Notifications con contador y, abajo, identidad StudyStreak. Cierra al navegar, respeta SafeArea y utiliza gestos/Back nativos. La librería instalada fuerza un resorte incluso con movimiento reducido: para ese caso el mismo contenido se abre en un Modal nativo sin animación, con cierre/Back y retorno del foco al disparador; los gestos de apertura se desactivan. Los controles nuevos tienen foco visible y al menos 48 dp. El encabezado usa un botón hamburguesa compacto.

No había capturas adjuntas disponibles en esta solicitud: Habitica/StayFree se interpretan como referencias funcionales, sin afirmar comparación visual directa con ellas.

## Botón central y conservación de flujos

`MenuActionProvider` registra la acción de la pestaña enfocada. El botón + desplaza el contenido al inicio y abre el flujo existente; no invoca servicios de escritura:

- Goals: muestra `GoalForm`; se conserva la validación, confirmación y servicio actuales.
- Tracking: muestra `PartnerSearch`; la solicitud sólo se envía tras seleccionar y confirmar.
- Validations: inicia el paso de compañero del flujo existente; luego meta, registro y editor. No inventa un registro validable ni envía una decisión automáticamente.
- Study Rooms: muestra el formulario existente de creación. Join, membresía, reloj, heartbeat y controles siguen disponibles.

La barra se oculta durante creación/revisión y dentro de una sala; tampoco ocupa espacio en detalles o con teclado abierto. Android Back cierra el flujo contextual cuando corresponde; los botones Cancel/Close permanecen. Los campos y selección de cada pestaña siguen montados al cambiar entre ellas. Las mutaciones se conservan exclusivamente en sus handlers existentes.

## Identidad y datos

`NavigationDataProvider`, montado una vez por cuenta, consulta `GET /api/profile` y descarga el avatar propio mediante el cliente JWT a un archivo temporal. Comparte esa descarga entre drawer y perfil, ofrece inicial si falta/falla y elimina el archivo al reintentar/desmontar/cambiar de cuenta. No descarga imágenes de terceros ni amplía permisos.

Profile es sólo lectura de nombre, username y biografía reales, con loading/error/retry y logout. No hay editor, presencia ni estadísticas inventadas. El contador usa la API de notificaciones existente cada 30 s sólo con app activa, sin solicitudes solapadas; reemplaza el polling que antes pertenecía a Home. Las preferencias locales de Focus y el registro de estudio no se migran: Focus sólo cambia de ubicación/imports y enlaces internos.

Dashboard queda como ruta preparada en este commit; la entrega B, separada, implementará su contenido real.

## Verificación

- ESLint y TypeScript: aprobados.
- Suite Mobile: 16 archivos aprobados, incluidas sesión, Focus, reloj, evidencias, apariencia y tres casos nuevos de navegación/render. Las pruebas existentes se ajustaron a la sustitución autorizada de Home y a las rutas movidas.
- Exportación Expo web con Metro/React Compiler: aprobada, sin instalar dependencias. Archivos generados bajo `.expo/`, fuera de Git.
- Chrome sobre la exportación React Native web: login con JWT de fixture, cuatro acciones contextuales y cancelación sin mutaciones, ocultación de barra en formulario/perfil, selección persistida al volver a Menu, drawer/perfil mínimo, fallback de avatar 404, badge, Back y ausencia de overflow a 320/390/768 px. Todas las solicitudes fuera del servidor de la exportación se interceptan; ninguna llega a la base habitual.
- Reproducción: `node --experimental-strip-types --test tests/*.test.mjs`; para Chrome, exportar a `.expo/integration-export` y ejecutar `node tests/mobileNavigation.browser.mjs`. Requiere Chrome y permisos de servidor local/procesos.

Pendiente en Expo Go: gestos reales del drawer, Back de Android y gesto Back de iOS, VoiceOver/TalkBack, teclado externo/virtual, renderizado del avatar desde FileSystem y comportamiento en dispositivo tras cambiar cuenta o entrar en una sala. La prueba Chrome no certifica esos puntos. Las superficies antiguas de los cuatro módulos conservan la paleta oscura según 6.2b; drawer, barra y perfil mínimo utilizan el tema global.

Archivos: layouts/grupos y rutas movidas en `src/app/(app)`, dos enlaces canónicos en detalles, componentes `MenuTabBar`, `StudyDrawerContent`, `OwnAvatar`, `NavigationPressable`, contextos `MenuActionContext`/`NavigationDataContext`, servicio `ownProfileService`, catálogo `features/navigation/menu`, extensión de Screen para scroll, tests/harness y este informe. Sin cambios de Web, backend, PostgreSQL, Docker, AWS, dependencias o archivos privados. Los cambios preexistentes ajenos quedan fuera del commit.
