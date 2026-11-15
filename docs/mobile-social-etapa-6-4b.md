# Perfiles sociales, presencia y privacidad Mobile — Etapa 6.4b

## Alcance

Se añade `/(app)/users/[userId]/profile`, con Back del Stack y redirección al perfil propio cuando el ID es el de la cuenta actual. No hay edición de miembros. La vista reutiliza ProfileCover/OwnAvatar, Screen, Card, StatusMessage y los tokens globales; conserva el editor propio refinado en `0a943f1`.

Muestra nombre disponible, username, bio y fecha válida exclusivamente del backend. Sólo muestra los campos de estadísticas que devuelve la proyección autorizada: minutos y sesiones verificados por separado, sin sustituirlos por estadísticas propias, rachas o históricos. ONLINE es texto verde, OFFLINE gris, HIDDEN «Status hidden» y ausencia/error «Status unavailable». No hay puntos sobre avatares ni deducciones desde salas/notificaciones. Last seen se muestra sólo con un timestamp válido entregado por el servidor. HIDDEN puede incluir Last seen si el usuario autorizó compartir última actividad: son permisos independientes.

## API existente reutilizada

| Método/ruta | Función |
| --- | --- |
| GET `/api/users/{id}/profile` | Perfil, estadísticas consentidas y presencia autorizada. |
| GET `/api/users/{id}/profile/avatar` y `/banner` | Imágenes protegidas; fallback si faltan/no hay acceso. |
| GET `/api/users/{id}/presence` | Revalidación dedicada al refrescar explícitamente el perfil. |
| GET/PUT `/api/profile/privacy` | Cuatro booleanos obligatorios: showPresence, showLastSeen, shareVerifiedMinutes, shareVerifiedSessions. |
| POST `/api/presence/heartbeat` | `{ sessionId: UUID }`, propietario derivado del JWT. |
| GET `/api/tracking-links/active?page=…&size=10` | Lista paginada de autorizaciones ACCEPTED; se comprueba pertenencia del vínculo a la cuenta actual. |

No hay endpoints ni dependencias nuevos. Todos usan el cliente autenticado de 6.2a y su refresh existente. Las operaciones capturan la revisión de sesión para impedir que una petición encolada bajo otra cuenta use credenciales nuevas. 403/404 de perfil producen la misma vista de acceso no disponible, sin revelar existencia. Un fallo de carga retira el perfil y sus imágenes; no se clasifica como Offline.

## Presencia y privacidad

Hay un solo SocialProvider dentro del layout autenticado, ligado a la cuenta. PresenceSession crea un UUID nuevo en memoria mediante el generador existente; nunca reutiliza un UUID de grabación de estudio. Consulta preferencias y sólo emite heartbeat si showPresence o showLastSeen está confirmado como true.

Con AppState activo envía inmediatamente y aproximadamente cada 30 segundos, sin solapamiento. Inactive/background aborta el heartbeat y elimina el intervalo; foreground reanuda. Logout/desmontaje cancela peticiones, listeners y timers; una cuenta nueva parte sin datos anteriores. Cambiar sólo el consentimiento de estadísticas no crea otro heartbeat ni reinicia su intervalo. No se añaden servicios/tareas de segundo plano ni se modifica el heartbeat de salas o Study Ledger.

El servidor usa TTL de 90 segundos. Tras minimizar/cerrar sesión puede seguir apareciendo Online hasta vencer el último heartbeat; el cliente no promete desconexión instantánea ni continuidad mientras Android está suspendido. Last seen es actividad confirmada, no una hora inferida de logout.

Settings añade cuatro filas compactas con Switch. Lee los valores actuales; mientras no se conocen, muestra carga y deshabilita controles. El estado confirmado no cambia durante PUT: se actualiza sólo con la respuesta válida del servidor. Los fallos conservan el último valor confirmado y ofrecen retry. No se activan opciones automáticamente ni se persisten estas preferencias en el almacenamiento de apariencia local. Se muestran carga, guardado, éxito y error.

## Imágenes, autorización y rendimiento

SocialDirectory comparte permisos, imágenes y perfiles entre consumidores enfocados. Usa snapshots inmutables con useSyncExternalStore para que React Compiler observe cambios de permisos/datos. Consulta la lista ACCEPTED completa y paginada cuando existen consumidores sociales, revalidándola cada 30 segundos en foreground. Sin consumidores no hay polling de esa lista; el heartbeat propio es independiente.

Search, Tracking, Validations y participantes de sala sólo solicitan imágenes sociales después de confirmar ACCEPTED. Una búsqueda o pertenecer a una sala nunca otorga permiso. Los enlaces a miembros se muestran con esa autorización; el backend vuelve a comprobarla al abrir perfil/imagen. El propio usuario utiliza su avatar compartido y su ruta Profile existente.

Se amplía de forma compatible OwnProfileMedia para escoger el recurso de lectura y el prefijo de caché; sus valores por defecto, validaciones y operaciones propias permanecen intactos. Las descargas sociales usan ArrayBuffer autenticado y archivos `social-profile-*` en el caché privado de Expo, con un máximo de **tres trabajos de imagen simultáneos**, promesas compartidas y sin Object URLs. No hay almacenamiento en Documents ni tokens en URIs/archivos.

Se reutilizan imágenes entre filas/vistas de la misma cuenta y foreground; no se vuelven a descargar en cada poll. Refresh explícito invalida avatar/banner. Una revocación local retira inmediatamente datos y archivos del miembro; cambios remotos se detectan al revalidar o al recibir denegación. La detección remota depende del próximo poll y de la latencia de red, no es instantánea. Los fallos de autorización retiran información, nunca amplían permisos. Las peticiones antiguas no pueden sustituir una nueva carga.

Background, logout y cambio de cuenta cancelan descargas, vacían estado y eliminan archivos sociales. El siguiente montaje limpia restos de ejecuciones anteriores sin tocar caché de perfil propio, audio u outbox. Un avatar/banner 404 aislado se trata como imagen ausente; la revalidación de perfil/Tracking sigue comprobando acceso. URI/bitmap reales y limpieza física requieren comprobarse en dispositivo.

## Integración

- **Tracking:** avatar en búsqueda, vínculos activos e historial cuando están autorizados; View profile; estados/solicitudes/confirmación de eliminación conservados. Aceptar/rechazar/eliminar/refrescar revalida el directorio; una eliminación confirmada invalida el miembro afectado. Los nuevos elementos y su canvas usan los tokens globales.
- **Validations:** avatar, perfil y View goals sin botones anidados. Conserva la selección, evidencias y pasos. El modal se suspende al perder foco para mostrar Member Profile y reaparece al volver, sin limpiar el estado del flujo.
- **Study Rooms:** avatar/perfil autorizados, roles y controles existentes. La etiqueta «Connected/Disconnected from room» distingue su conexión de la presencia social. El bloque de participantes usa superficies temáticas legibles. Temporizador, chat, medios, moderación y heartbeat de sala permanecen sin cambios funcionales. Otras superficies legadas de Rooms siguen con su estilo previo; no se hizo un rediseño completo.
- **Navegación:** se conserva drawer y barra inferior. Sólo se registra la ruta secundaria Member profile; no se añade panel de compañeros.

## Pruebas aisladas

Desde `frontend-mobile`:

- `npm run lint` y `npx tsc --noEmit`: correctos.
- `node --experimental-strip-types --test tests/*.test.mjs`: **27 archivos aprobados, 0 fallos**, incluyendo auth, perfil propio, Focus y navegación anteriores.
- `tests/socialSession.test.mjs`: ocho casos de ciclo de vida/privacidad, confirmación de servidor, heartbeat único/UUID, background/foreground, concurrencia, revocación, limpieza y snapshots/respuestas tardías. Reloj, HTTP y medios simulados.
- `tests/socialService.test.mjs`: tres casos de contratos/JWT, ACCEPTED paginado, recursos de imagen/cachés separados y rechazo de peticiones de otra revisión de sesión.
- `tests/socialRendering.test.mjs`: tres casos para estados de presencia y Last seen, estadísticas opt-in sin edición, fecha nullable, ocho combinaciones de modo/acento y controles de privacidad confirmados/deshabilitados.
- `EXPO_OFFLINE=1 CI=1 ./node_modules/.bin/expo export --platform web --output-dir .expo/integration-export`: correcto, como verificación de UI compartida y rutas; no equivale a un build Android/iOS.
- Chrome con todas las peticiones externas interceptadas: `tests/mobileSocial.browser.mjs`. Verifica búsqueda/salas sin descargas para usuarios no aceptados, enlaces desde Tracking/Validations/modal/salas y Back, estados ONLINE/OFFLINE/HIDDEN/desconocido, Last seen, estadísticas consentidas/retiradas, 403/404, guardado de privacidad correcto/fallido, ausencia de heartbeat con permisos desactivados, revocación, logout/cuenta nueva, claro/oscuro, acento y Reduce Motion, anchos 320/390/768/1440. Se inspeccionaron capturas del miembro y Settings.
- Regresiones Chrome aprobadas: `tests/mobilePolish.browser.mjs`, `tests/mobileProfile.browser.mjs` y `tests/mobileFocus.browser.mjs`, siempre con fixtures. Se ajustó una etiqueta del test de búsqueda al nuevo nombre accesible del resultado.

Chrome detectó y permitió corregir una suscripción que leía datos mutables fuera del snapshot de React y la revalidación tras un acceso temporalmente prohibido. Se añadió regresión para snapshots inmutables y para foreground mientras queda una respuesta antigua pendiente. No se ejecutaron migraciones, pruebas backend ni escrituras contra PostgreSQL persistente.

## Verificación pendiente en Expo Go

1. Con cuentas de prueba autorizadas, abrir perfiles desde las tres áreas y desde el modal de validación; volver al mismo origen y continuar el flujo. Comprobar imágenes reales, fallback y revocación desde otra cuenta.
2. Comparar presencia y Last seen con otra sesión autorizada al activar/desactivar cada permiso. Minimizar, bloquear/desbloquear y reabrir; aceptar el TTL de 90 segundos y no asumir Online con Android suspendido.
3. Guardar privacidad con red interrumpida y restaurarla; confirmar que un cambio fallido no se anuncia como guardado. Probar permisos de minutos/sesiones por separado.
4. Logout/cambio de cuenta con descargas pendientes; comprobar que no quedan imágenes visibles ni archivos sociales de la cuenta anterior. El almacenamiento real y las políticas del SO no se probaron en hardware.
5. Lector de pantalla, teclado/Back Android, orientación/pantalla pequeña, Dark/Light/System, las cuatro paletas y Reduce Motion.

No se afirma haber usado el teléfono ni la instancia persistente real. La entrega termina en 6.4b; no incluye 6.4c, foro, chat nuevo, rediseño retro ni cambios de Web/backend/dependencias.

## Archivos de la etapa

En `frontend-mobile/`:

- Layout/rutas: `src/app/(app)/_layout.tsx`, `settings.tsx`, `users/[userId]/profile.tsx`, y rutas existentes `(main)/(menu)/tracking/index.tsx`, `validations/index.tsx`, `study-rooms.tsx`.
- UI social: `src/components/social/MemberProfileContent.tsx`, `MemberReference.tsx`, `PresenceLabel.tsx`, `SocialPrivacySettings.tsx`.
- Filas existentes: `src/components/tracking/PartnerSearch.tsx`, `TrackingLinkCard.tsx`, `src/components/study/ParticipantCard.tsx`.
- Estado/API: `src/contexts/SocialContext.tsx`, `src/features/social/presenceSession.ts`, `socialDirectory.ts`, `src/services/socialService.ts`.
- Reutilización de caché: `src/features/profile/ownProfileMedia.ts`.
- Pruebas: `tests/socialSession.test.mjs`, `socialService.test.mjs`, `socialRendering.test.mjs`, `mobileSocial.browser.mjs`, `mobilePolish.browser.mjs`, `tests/helpers/appearanceRouterMock.mjs`.

Documentación: este archivo `docs/mobile-social-etapa-6-4b.md`. Los 17 elementos ajenos preexistentes se conservan fuera del commit.
