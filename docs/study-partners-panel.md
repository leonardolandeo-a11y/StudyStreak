# Etapa 5.3: panel desplegable de compañeros

## Comportamiento

El botón Study partners (icono de usuarios) aparece en el encabezado de toda pantalla autenticada. El panel está cerrado por defecto y no se persiste su apertura. Desde 1024 px ocupa 288 px a la derecha del contenido, sin superponer el sidebar izquierdo. En móvil web usa un dialog modal nativo a la derecha, con fondo inerte, scroll propio, cierre X/Escape, ciclo Tab/Shift+Tab y devolución del foco al botón visible que lo abrió. Apertura/cierre de 240 ms, desactivados con la preferencia del sistema o Settings. Cambiar de anchura no reinicia consultas.

Online y Offline contienen exclusivamente estados explícitos autorizados del backend. Other partners agrupa HIDDEN (Status hidden, sin punto) y fallos/ausencia de estado (Status unavailable, sin punto). La última actividad sólo se muestra cuando el servidor entrega lastSeenAt. Un HIDDEN con última actividad autorizada permanece en el grupo neutral. Los contadores corresponden a la página visible, nunca a una presencia global inferida.

Cada fila navega al perfil social y cierra el panel; Back conserva el historial de la pantalla anterior. Manage Tracking conserva la administración en Tracking. Hay carga, lista vacía, error con retry, fallo parcial, avatar ausente con iniciales, error de avatar con retry individual y paginación. No se introducen chats, invitaciones o mensajería.

## API reutilizada y coste

- `GET /api/tracking-links/active?page=…&size=10`: única fuente de miembros. Se comprueba ACCEPTED, participación del usuario actual, ID válido y deduplicación. Se revalida en cada apertura y cada 60 segundos mientras el panel está abierto y la pestaña visible.
- `GET /api/users/{id}/profile`: datos iniciales de cada compañero de la página, al abrir/cambiar página o refrescar. La autorización 403/404 retira la fila; un fallo transitorio no inventa presencia ni lo clasifica Offline.
- `GET /api/users/{id}/presence`: actualización cada 60 segundos para los estados visibles o última actividad compartida. HIDDEN sin última actividad se consulta cada tercer ciclo (180 segundos), porque no aporta detalle de conexión mientras permanece oculto. Una nueva apertura o Refresh vuelve a consultar perfiles y permisos.
- `GET /api/users/{id}/profile/avatar`: cliente apiClient autenticado, sólo cuando la fila entra en pantalla (IntersectionObserver), como máximo dos descargas simultáneas. No se descargan banners para la lista.

Un ciclo de Tracking permanece activo como máximo una vez; no se solapan ticks o recuperación de visibilidad. Perfiles/presencia tienen concurrencia máxima dos. El cierre aborta solicitudes y elimina el intervalo/listener; logout y cambio de cuenta desmontan el estado y la caché. La presencia propia sigue a cargo de SocialProvider: el panel no emite heartbeats.

Los avatares se deduplican por ID mientras están en vuelo y se conservan como Blob en memoria de la cuenta hasta cinco minutos, con límite de entradas y descarte de miembros retirados/de la página anterior. Reabrir una página revalida perfiles antes de mostrar avatares cacheados. Refresh invalida explícitamente la caché. No hay persistencia en localStorage ni descargas de imágenes en cada polling. Las object URLs pertenecen a cada fila y se revocan al cambiar de grupo, cerrar tras la transición o desmontarse. Si falla Tracking se retiran los datos anteriores; las relaciones revocadas se retiran en cuanto responde la lista, antes de esperar las demás consultas.

## Limitación y ampliación mínima propuesta (sin implementar)

Las API actuales proporcionan todos los datos, pero no ofrecen proyección agrupada de compañeros/presencia ni versión de avatar. Por ello hay una consulta por compañero de la página cuando hace falta actualizar su estado, limitada a diez por ciclo. El nombre visible se refresca al abrir o usar Refresh; no se vuelve a consultar el perfil completo cada minuto. Los cambios a presencia antes oculta pueden tardar hasta 180 segundos en aparecer; los demás cambios/revocaciones se detectan en el siguiente ciclo visible o Refresh. Con la pestaña oculta no hay polling y al volver se revalida.

Una optimización futura sería `GET /api/companions?page=…&size=10`, derivando al solicitante del JWT y devolviendo en lote únicamente Tracking ACCEPTED vigente, identidad mínima, presencia/lastSeenAt autorizados y una versión opaca del avatar. La autorización de imágenes existente se mantendría. Esto permitiría reemplazar las consultas individuales por una sola consulta paginada. No se modifica Spring Boot ni se crea ese endpoint en esta etapa; tampoco se ejecutan migraciones.

## Archivos y verificación

- Layout: `frontend-web/src/components/navigation/AuthenticatedLayout.tsx`, `frontend-web/src/components/layout/MobileTopbar.tsx`.
- Componentes: `StudyPartnersPanel.tsx`, `StudyPartnerRow.tsx` y opción compact de `PresenceStatus.tsx`, en `frontend-web/src/components/social/`.
- Datos: `frontend-web/src/hooks/useStudyPartners.ts`, `frontend-web/src/utils/requestQueue.ts`.
- Estilos: `frontend-web/src/index.css`.
- Pruebas: `frontend-web/tests/studyPartnersRendering.test.mjs`, `frontend-web/tests/helpers/profileBrowser.mjs`, `frontend-web/package.json` y este documento. El helper distingue la cancelación esperada de una interceptación Chrome y el cierre de sus pipes de los errores de la aplicación.

Cinco pruebas Chrome dirigidas con fixtures REST: ciclo del panel, privacidad y última actividad, concurrencia/caché, polling y revocación, navegación y Back, error/retry/empty, paginación, foco y Escape, logout con panel abierto, aislamiento de cuentas, avatares diferidos, ausencia de heartbeats duplicados y regresiones de Dashboard/Focus Studio con panel abierto. Responsive a 320, 375, 768, 1024 y 1440 px, Dark/Light/System y las cuatro paletas. Capturas revisadas en /tmp a 320 y 1440 px; no forman parte del commit.

Resultado final: ESLint, TypeScript y build aprobados; suite web completa con 100 pruebas aprobadas (60 de lógica y 40 de UI), incluidas las cinco pruebas Chrome nuevas y regresiones de Profile, Dashboard y Focus Studio. Vite conserva el aviso de tamaño del chunk de Study Rooms. El dialog móvil se retira del DOM después del cierre para no interferir con los modales de Profile. Todas las mutaciones de escenarios usan fixtures; ninguna prueba de esta etapa consulta o modifica PostgreSQL habitual, Spring Boot, React Native, AWS o producción.
