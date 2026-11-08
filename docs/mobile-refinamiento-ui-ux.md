# Mobile — Refinamiento de navegación, Settings y Dashboard

Base `590b35b`, rama `feat/ui-ux-web-mobile`. Se conserva apariencia 6.2b, sesión 6.2a, rutas, servicios y datos existentes. No hay etapas o funcionalidades sociales nuevas.

## Cambios

- **Drawer:** filas compactas con icono y texto, selección mediante superficie sutil, avatar/nombre pulsables, engranaje pequeño sin fondo verde y marca StudyStreak al pie. Notifications mantiene ese texto; el badge junto al icono sólo aparece para un entero positivo (99+ visual a partir de cien; la descripción accesible conserva el número). No se muestran `(0 unread)` ni sufijos visibles.
- **Iconos/movimiento:** `AppIcon` usa trazos y formas de vistas nativas, sin bibliotecas nuevas. Al presionar, el mosaico se separa, auriculares oscilan, una página individual gira y regresa sin mover el libro, y la campana tintinea. Secuencia única de 300 ms, con limpieza al desmontar y sin bucles. La preferencia efectiva de movimiento reducido detiene/reinicia a cero. Los nombres accesibles pertenecen a los controles; las figuras son decorativas.
- **Settings:** muestras Dark/Light/System con etiqueta debajo, icono de dispositivo para System y check discreto; cuatro muestras de acento equilibradas. Reduce motion es una fila con switch; sólo se mantiene la aclaración relevante cuando el SO fuerza reducción. Se eliminan preview redundante y explicaciones extensas. Restaurar y errores/retry de persistencia siguen disponibles. No se modifica el proveedor ni el almacenamiento de preferencias.
- **Dashboard:** segmento compacto 7/30 e iconos de barras/líneas arriba a la derecha. Se elimina Refresh activity de la tarjeta. Se mantienen carga al entrar/regresar/cambiar período y retry ante error; el refresco manual se ofrece mediante pull-to-refresh nativo. Se reducen márgenes, tarjetas y el control de valores diarios pasa a enlace táctil. No se altera `verifiedPeriod`, validación, promedio, racha, históricos, ejes o selección de fechas.

El adjunto disponible sólo contenía texto. Se comprobó en código que el engranaje verde junto al perfil era nuestro (`StudyDrawerContent`); se sustituyó allí. No existe evidencia suficiente para atribuir otro engranaje flotante de una captura a Expo/Android. No se modificaron overlays del dispositivo ni herramientas Expo, ni el control de preferencias de Focus Studio.

## Creación y Back

`CreationModal` proporciona una superficie de creación dedicada, encabezado Back/Cancel, SafeArea y scroll con ajuste de teclado. Reutiliza los formularios y handlers de las cuatro pestañas, sin renderizar las listas principales dentro del modal.

- New Goal contiene sólo el formulario, errores y confirmación. No muestra Completed y su payload fuerza `completed: false`. El checkbox sigue disponible al editar una meta existente.
- Send Tracking Request contiene búsqueda/selección/envío existentes; no incluye historial, invitaciones o conexiones activas.
- New Validation usa los pasos existentes de compañero → meta → registro → decisión. Cada paso muestra únicamente la selección pertinente; Back recorre los pasos antes de cerrar. Una decisión guardada cierra el modal y refresca la lista. El contexto local del modal registra Back y bloquea su cierre durante una escritura; no es otro proveedor de apariencia.
- New Study Room contiene sólo nombre y creación, sin Join ni salas existentes. Tras confirmación cierra el modal, conserva la entrada a la sala creada y refresca el lobby, como antes.

No se envían escrituras al abrir/cancelar. Se conservan validaciones, borradores durante error, estados busy y la lógica de los servicios. Campos, validación y evidencias consumen colores del tema; sus superficies propias conservan contraste también cuando aparecen en detalles antiguos oscuros. No se cambia descarga, audio, cámara, UUID, Pomodoro u outbox.

El Stack exterior ya ocultaba su encabezado para `(main)` y el drawer ya suministraba la hamburguesa: la redundancia visible procedía de enlaces Back antiguos dentro de Focus Studio, Resources y Notifications. Se retiraron esos enlaces sin tocar su lógica. Se elimina además el acceso Settings redundante del encabezado exterior. Detalles, Profile, edición y modales conservan su Back. Un guard central en el encabezado principal respeta primero el historial nativo; sólo si no existe historial devuelve una sección principal al Menu, o una pestaña enlazada directamente a Goals, en lugar de salir inmediatamente. En la raíz Goals se mantiene el comportamiento normal del SO, sin atrapar al usuario.

Screen evita duplicar el inset inferior que ya aporta la barra de pestañas. Los flujos modales administran su propia SafeArea y la barra no ocupa espacio en ellos. No se modifican rutas de notificaciones ni referencias a registros ajenos. Username y displayName se conservan intactos.

## Verificación

- `npm run lint`: **OK**, sin advertencias.
- `./node_modules/.bin/tsc --noEmit --incremental false`: **OK**.
- `node --experimental-strip-types --test tests/*.test.mjs`: **19 archivos aprobados**, 0 fallos. Incluye las regresiones previas de sesión, tema/persistencia, Focus, reloj y evidencias; cinco casos nuevos comprueban badges cero/positivos, creación/edición de Completed, modal, controles y recuperación de Back.
- Exportación Metro/React Compiler a `.expo/integration-export`: **OK**, sin instalar paquetes.
- Chrome sobre React Native web, con API exclusivamente simulada: los cuatro flujos de creación, error/retry y busy, payload de meta sin completar, cierre y actualización de listas, Back de cada paso de validación, badge positivo y perfil; movimiento real de la página al presionar (transform antes/después), campana estática con Reduce Motion; Settings Light/Purple y persistencia existente; Dashboard con iconos y sin Refresh; Notifications → registro `review=1` → Back; responsive sin overflow de documento a 320/390/768/1440 px.
- Regresiones Chrome de Dashboard y navegación anteriores: **OK**, adaptadas a la retirada autorizada de botones y a los modales. Las cuentas y escrituras de escenarios son fixtures interceptadas; no hay consultas ni mutaciones de PostgreSQL habitual. No se imprimen credenciales.
- Capturas revisadas de drawer, Settings y Dashboard en `.expo/polish-*.png`, ignoradas por Git. Son datos sintéticos de navegador, no capturas del teléfono del usuario.

Comandos de integración: exportar con `EXPO_OFFLINE=1 CI=1 ./node_modules/.bin/expo export --platform web --output-dir .expo/integration-export`, ejecutar `node tests/mobilePolish.browser.mjs`, `node tests/mobileDashboard.browser.mjs` y `node tests/mobileNavigation.browser.mjs`. Requieren Chrome y permisos de procesos/servidor local. El pull-to-refresh físico no se certifica en la exportación web.

## Archivos de la tarea

Dentro de `frontend-mobile`:

- `src/app/(app)/(main)/(menu)/{goals/index,tracking/index,validations/index,study-rooms}.tsx`.
- `src/app/(app)/(main)/{_layout,dashboard,focus-studio,resources/index,notifications/index}.tsx`, `src/app/(app)/{_layout,settings}.tsx`.
- `src/components/ui/{AppIcon,CreationModal,SegmentedControl,Screen}.tsx`.
- `src/components/navigation/StudyDrawerContent.tsx`, `src/features/navigation/menu.ts`.
- `src/components/dashboard/{ActivityPlot,DashboardActivity}.tsx`.
- `src/components/goals/GoalForm.tsx`, `src/components/tracking/PartnerSearch.tsx`, `src/components/validations/ValidationEditor.tsx`, `src/components/records/{RecordPhoto,RecordVoice}.tsx`.
- Nuevos `tests/mobilePolish.test.mjs`, `mobilePolish.browser.mjs`; ajustes en `mobileAppearanceRendering.test.mjs`, `mobileMenuNavigation.test.mjs`, `mobileNavigation.browser.mjs`, `mobileDashboard.browser.mjs` y helpers `appearanceNativeMock.mjs`, `mobileBrowser.mjs`.

Además, este documento. Sin cambios de dependencias, servicios API, JWT/SecureStore/refresh, backend, Web, PostgreSQL, Docker, AWS o archivos privados. Los 17 elementos ajenos preexistentes permanecen fuera del commit.

## Pendiente en Expo Go

Comprobar las mismas pantallas con texto grande, VoiceOver/TalkBack, teclado y SafeArea reales; gestos/Back físicos de Android/iOS y deep links sin historial; creación/cancelación con la cuenta autorizada, sin datos de prueba innecesarios; pull-to-refresh del Dashboard; microanimaciones táctiles y reducción del SO/local. Confirmar persistencia tras cerrar completamente la app. Los tests de navegador y mocks no sustituyen esas pruebas físicas. No se inicia la siguiente etapa.
