# Study Partners Mobile — Etapa 6.4c

## Panel y navegación

El encabezado principal del área Menu, Dashboard, Focus Studio, Resources y Notifications incluye un botón Study Partners con icono nativo de usuarios. Está cerrado por defecto y no se persiste. Se conserva el drawer y la barra de cuatro pestañas, sin rutas o pestañas permanentes adicionales.

Se utiliza Modal de React Native: slide de apertura/cierre, sin animación con Reduce Motion, SafeArea, scroll propio y cierre X/onRequestClose. Android utiliza modal con Back del sistema; iOS pageSheet permite el gesto de cierre nativo. El foco de teclado vuelve al disparador al cerrar. Elegir un miembro cierra el modal y abre la ruta Member Profile existente; Back vuelve a la pantalla de origen, sin reabrir el panel. Manage Tracking cierra y navega a la pestaña existente. Cada apertura comienza en la primera página.

La lista contiene hasta diez compañeros de la página actual, con nombres truncados, avatar circular/fallback y PresenceLabel reutilizado. Online sólo admite ONLINE explícito; Offline sólo OFFLINE; HIDDEN y desconocidos van a Other partners. La última actividad procede exclusivamente del servidor; HIDDEN con lastSeenAt autorizado permanece neutral y conserva ese texto. No hay puntos sobre el avatar ni inferencias desde salas. Las pistas accesibles de las filas incluyen estado y última actividad permitida. Los contadores son de la página visible, no del conjunto global.

Hay carga, refresco en curso, vacío, error/retry, fallos parciales y paginación. Un fallo transitorio de presencia muestra desconocido; mantiene un avatar previamente autorizado porque la relación se acaba de revalidar. Un error de carga completa no reutiliza datos de un perfil sin revalidar. Las denegaciones 403/404 retiran la fila, sin transformarla en Offline.

## Datos, privacidad y coste

Se reutiliza socialService y el apiClient autenticado de 6.2a, capturando la revisión de sesión:

- GET `/api/tracking-links/active?page=…&size=10`: única fuente de filas; filtra ACCEPTED, pertenencia a la cuenta, IDs válidos, duplicados y auto-vínculos. Se revalida al abrir y cada 60 segundos mientras está visible/activo.
- GET `/api/users/{id}/profile`: identidad mínima y presencia inicial al abrir/cambiar página o refrescar. No se guardan bio ni estadísticas en el modelo de la lista.
- GET `/api/users/{id}/presence`: cada 60 segundos; HIDDEN sin lastSeenAt se consulta cada tercer ciclo (180 segundos). Abrir/refrescar fuerza revalidación completa.
- GET `/api/users/{id}/profile/avatar`: sólo tras confirmar el vínculo y leer correctamente el perfil. No se descargan banners para el panel.

El API no ofrece proyección agregada: hay hasta diez lecturas individuales por ciclo cuando corresponde. Se limita a **dos** trabajos simultáneos de perfil/presencia/avatar y se comparte además el límite de imágenes de SocialDirectory (tres). No se solapan ciclos del mismo panel. Un cambio de página cancela su generación anterior; páginas que dejan de existir vuelven a una página válida. La eliminación de filas se publica en cuanto responde Tracking o se confirma una denegación, antes de esperar otras filas lentas.

No se envían heartbeats desde el panel. El único emisor sigue siendo PresenceSession de 6.4b, con sus preferencias, AppState y TTL de 90 segundos. Los consumidores de 6.4b que permanezcan enfocados conservan su revalidación propia de 30 segundos; no se detiene el seguimiento que necesitan otras filas al cerrar este modal.

## Caché y ciclo de vida

No hay segundo sistema de descarga: SocialDirectory expone acceso al mismo OwnProfileMedia y la misma cola nativa de 6.4b. Las promesas y URIs se comparten con Tracking/Validations/salas. Reabrir revalida perfiles antes de utilizar avatares cacheados; no descarga imágenes en cada poll. Refresh invalida los avatares de la página. Cambiar de página limpia el estado visible, conservando caché temporal autorizada de la cuenta para evitar descargas repetidas.

Cerrar, background o desmontar aborta las peticiones del panel y elimina su intervalo/listener. Se cancela una descarga pendiente sin otros consumidores; si otra fila social aún necesita la misma petición, ésta se conserva y el panel descarta su resultado. El caché compartido retira datos/archivos al confirmar revocación y al pasar a background, cerrar sesión o cambiar de cuenta, como en 6.4b. El panel recibe esas invalidaciones y elimina inmediatamente la fila afectada. No hay Object URLs, persistencia en Documents ni tokens en URIs.

Foreground comienza una revalidación completa. Las respuestas antiguas se descartan incluso si un adaptador tarda en resolver después de abortarse. Cada apertura tiene un modelo nuevo sin datos de otro usuario; el layout autenticado se remonta por cuenta. Las revocaciones remotas se detectan en el siguiente ciclo/Refresh, no instantáneamente antes de consultar al servidor. Identidad/avatares cambiados se actualizan al reabrir o refrescar; no hay versión de imagen en el contrato actual.

## Verificación aislada

Desde `frontend-mobile`:

- `npm run lint`, `npx tsc --noEmit`: correctos.
- `node --experimental-strip-types --test tests/*.test.mjs`: **29 archivos aprobados, 0 fallos**; incluye auth, Focus, perfiles y capa social previa.
- `studyPartnersSession.test.mjs`: siete casos con reloj/HTTP simulados: ACCEPTED y grupos, intervalos 60/180, última actividad, errores parciales, revocación inmediata frente a solicitudes lentas, paginación/página inválida, error/retry, background/foreground/dispose, ticks duplicados, límite de dos trabajos y respuestas tardías, recuperación de presencia conservando avatar autorizado.
- `studyPartnersRendering.test.mjs`: dos casos con las ocho combinaciones de Dark/Light y paletas, grupos, pistas accesibles, callbacks, vacío/error/partial y paginación.
- `socialService.test.mjs`: se añaden dos casos de reutilización real del módulo de caché con FileSystem/HTTP simulados: una sola descarga para fila y panel, cancelación que respeta al consumidor restante, y aborto/limpieza sin consumidores. No se descargan imágenes reales ni se prueban archivos físicos del teléfono.
- Exportación Expo web correcta (`EXPO_OFFLINE=1 CI=1 … expo export --platform web`), como verificación de rutas/UI compartida, no como build Android/iOS.
- Chrome `tests/mobilePartners.browser.mjs`, API totalmente interceptada: cerrado por defecto, apertura/X/Escape, grupos explícitos, Last seen, errores parciales/403–404/error global/retry/vacío, páginas de diez, navegación al perfil y Back, Manage Tracking, caché al reabrir, revocación, expiración de sesión con el panel abierto y otra cuenta sin filas previas, ausencia de heartbeats extra con preferencias desactivadas, claro/oscuro, Purple, Reduce Motion y anchuras 320/390/768. Captura visual inspeccionada.

Regresiones Chrome aprobadas: `tests/mobileSocial.browser.mjs` y `tests/mobileFocus.browser.mjs`, con fixtures aislados.

La prueba Chrome espera a la presentación del modal antes de Escape y al final del refresco antes de repetirlo; no intenta pulsar un control deshabilitado. Las pruebas de tiempos usan reloj simulado en vez de esperar minutos o alterar datos persistentes. No se toca PostgreSQL, backend, Web, dependencias ni archivos privados.

## Verificación pendiente en Expo Go

1. Abrir/cerrar desde cada encabezado; Back Android debe cerrar únicamente el modal, con foco/lector de pantalla adecuados. Comprobar el gesto iOS si se usa esa plataforma. Verificar animación y Reduce Motion del dispositivo/Settings.
2. Con cuentas de prueba autorizadas, comprobar fotos reales/fallback, nombres largos, grupos y Last seen. Cambiar de página, entrar al perfil y volver al origen, y Manage Tracking sin perder las pestañas.
3. Minimizar/bloquear/reabrir con el panel visible: verificar recuperación, cancelación de red y que no se mantiene Online por tareas en background. El TTL remoto sigue siendo de 90 s.
4. Revocar una relación desde otra cuenta y comprobar retirada al siguiente ciclo o Refresh. Cortar/restaurar red para fallos parciales; cerrar sesión/cambiar de cuenta durante cargas.
5. Revisar SafeArea, orientación, teclado externo/TalkBack, Dark/Light/System, todas las paletas y limpieza física de temporales. No se afirma haber utilizado un teléfono ni un backend persistente real.

## Archivos

- `src/app/(app)/(main)/_layout.tsx`: botón y apertura/navegación.
- `src/components/social/StudyPartnersPanel.tsx`: modal y contenido; `PresenceLabel.tsx`: descripción accesible compartida.
- `src/components/ui/AppIcon.tsx`: usuarios.
- `src/features/social/studyPartnersSession.ts`: modelo del panel; `socialDirectory.ts`: acceso compartido a avatar e invalidación.
- `src/services/socialService.ts`: lectura de página activa con el cliente existente.
- `tests/studyPartnersSession.test.mjs`, `studyPartnersRendering.test.mjs`, `mobilePartners.browser.mjs`, `socialService.test.mjs`.

Las rutas anteriores son relativas a `frontend-mobile/`. Este documento es `docs/mobile-study-partners-etapa-6-4c.md`. No se inicia 6.5, chat, foro ni rediseño retro.
