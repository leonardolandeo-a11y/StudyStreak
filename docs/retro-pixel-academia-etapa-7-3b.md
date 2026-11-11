# Etapa 7.3b — Retro Pixel Academia en los módulos restantes

Rama: `feat/ui-ux-web-mobile`. Base: `3544011`, entrega 7.3a. Se consultaron 7.1, la revisión fullscreen de 7.2 y 7.3a. Git comenzó con los mismos **16 elementos ajenos** (dos modificados y catorce sin seguimiento), sin staging previo. No se descartan ni incorporan a esta entrega.

## Cambios por módulo

| Módulo | Web | React Native |
| --- | --- | --- |
| Goals / Daily Records / tags | AcademicHeading en listas, detalle, registros y tags; superficies compactas, campos de radio discreto y estados vacíos ilustrados. | Encabezados académicos, radios de tarjetas/formularios más discretos, estados vacíos compactos y cabecera de formularios con nota pixelada. Se conservan las listas separadas de los formularios y el `+` contextual. |
| Tracking | Encabezado con compañeros, tarjetas y campos alineados con el ámbito académico. | Encabezado, filas y estados vacíos con avatar/fallback original, acciones y estados textuales intactos. |
| Validations | Encabezado de revisión, superficies del recorrido y estados vacíos. | Encabezado y tarjetas de compañeros/metas/registros; modales conservan pasos y controles. |
| Study Rooms | Reloj pixelado en cabecera; lobby, formularios y paneles con radios/sombras discretos. | Cabecera con reloj, tarjetas de sala y participantes compactas; el temporizador, chat, reacciones y controles mantienen su implementación. |
| Resources | Encabezado de biblioteca, buscador/resultados y detalle bajo el mismo estilo de campos/controles. | Encabezado, tarjetas y estados vacíos; el placeholder de portada reutiliza el libro pixelado. |
| Notifications | Campana pixelada en cabecera, filtros/acciones y tarjetas compactas. | Cabecera, estados vacíos y tarjetas refinadas. Se conservan textos de tipo/estado, filtros, contador y navegación contextual. |
| Profile / Member Profile / Study Partners | Cabeceras, contorno fino del perfil, detalles discretos en métricas, editor y encabezado del panel. | AcademicPanel en los perfiles, cabeceras propias/sociales, métricas de radio moderado e icono de compañeros en el panel. El editor reutiliza la cabecera de modal académica. |
| Settings / privacidad | Cabecera con engranaje pixelado y superficies coherentes; controles de apariencia, accesibilidad, cuenta y privacidad originales. | Cabecera, paneles y selectores visuales más compactos (sin reducir objetivos táctiles por debajo de 44 px). Los switches y engranajes funcionales permanecen reconocibles. |

Las imágenes de usuario conservan dimensiones, superposición de avatar y banner, recorte cover y formas circulares. No se añaden marcos gruesos sobre ellas. ONLINE/OFFLINE/HIDDEN y los datos consentidos siguen dependiendo de las respuestas existentes. Los textos Pending/Accepted/Rejected y leída/no leída permanecen; el color no sustituye al texto.

## Componentes y fuente gráfica

Se reutilizan **AcademicHeading, AcademicEmpty, AcademicPanel, PixelGlyph, StudyMark/StudyBrand y PixelRule**. AcademicHeading y AcademicEmpty admiten ahora un glifo opcional; sus valores por defecto conservan 7.3a.

Nuevos glifos originales en `assets/academic/glyphs.json`: `clock`, `people`, `note`, `bell`, `gear`. Las dos representaciones se regeneran con `scripts/generate-academic.mjs`; no se duplican coordenadas manualmente. Se mantienen los glifos book/chart/lamp/spark.

PixelProgress continúa disponible. No se inventa un porcentaje para metas o rachas que sólo exponen objetivos planificados/conteos; esta entrega mantiene sus indicadores reales existentes.

Web activa el estilo mediante `academic-page academic-module` en las rutas correspondientes. Los selectores de superficies/campos se limitan a ese ámbito; no se cambian tokens globales. El editor y Study Partners optan explícitamente al ámbito. EmptyState reutiliza AcademicEmpty y reduce el bloque vacío anterior. MetricCard añade el acento pequeño ya utilizado en 7.3a.

Mobile adapta la composición a View/Text: AcademicPanel donde existía Card, radios discretos en las superficies existentes y cabecera de CreationModal con un glifo decorativo. No se introduce un proveedor, envoltorio de navegación ni sistema de formularios nuevo. Se conservan SafeArea, scroll, teclado, drawer, pestañas, `+`, Back y modales existentes.

## Movimiento, temas y accesibilidad

Los glifos son estáticos, sin timers, sensores ni animación por tarjeta. Web incorpora respuestas de borde/fondo de 200 ms; la preferencia global y prefers-reduced-motion las desactivan. Mobile mantiene las respuestas táctiles y transiciones existentes de sus controles. No hay trabajo ambiental continuo nuevo en background ni motores gráficos nuevos. No se instalan dependencias.

Los títulos mantienen jerarquía y tipografía de lectura; la monoespaciada se limita a los pequeños acentos de cabecera. Los decorativos están ocultos para lectores de pantalla. No se eliminan etiquetas, foco visible, botones de cierre ni nombres accesibles. Los controles de imágenes siguen siendo personalizados; el input file Web continúa oculto.

Dark/Light/System y las cuatro paletas proceden del sistema existente. Las preferencias locales de apariencia siguen separadas de la privacidad social persistida en backend. No se modifican preferencias de Focus ni se trasladan controles de cuenta.

## Integridad y limitaciones

No se modifican servicios, contextos de sesión/presencia, configuración de API, contratos REST, algoritmos, permisos ni reglas de negocio. Quedan intactos JWT/refresh, CRUD, paginación/debounce, tags, rachas, evidencias autenticadas, cachés/limpieza de imágenes, estadísticas consentidas, Pomodoro, UUID, outbox, reloj versionado, heartbeats, idempotencia y ledger.

No se modifican los servicios multimedia ni se añade publicación de cámara, micrófono o pantalla. Se conserva el fallback Expo Go para LiveKit y la capacidad móvil existente de recepción. No hay cambios en Spring Boot, PostgreSQL, Docker, AWS, producción, dependencias ni archivos privados.

**Resources real continúa pendiente de verificar en deployment.** Las búsquedas de esta etapa se comprobaron con respuestas simuladas y a través del cliente existente hacia Spring Boot. No se crean claves ni se cambia Google Books, proveedor o servidor. Las pruebas no acreditan funcionamiento de un despliegue remoto.

## Pruebas y ajustes de la instrumentación

La implementación se dividió en grupos: Goals/Records/Tracking/Validations; Rooms/Resources/Notifications; perfiles/Partners/Settings. Cada grupo recibió comprobaciones dirigidas antes del cierre global.

- Generadores `generate-academic`, `generate-branding`, `create-study-room` y `generate-auth-scenes` con `--check`: aprobados. Los recursos de 7.1/7.2 permanecen sincronizados.
- ESLint y TypeScript Web/Mobile: aprobados, sin advertencias de lint al finalizar.
- Build Web: aprobado. Persiste la advertencia conocida E-05 de chunk Study Rooms >500 kB; no se amplía la lógica de ese módulo.
- Exportaciones Expo **web y Android**: aprobadas. Sin compilación nativa ni instalación.
- Pruebas lógicas Web dirigidas: pageBounds, validationAccess, recordAccess, studyRoomClock y mediaCapture aprobados.
- Suite UI Web: **60 casos**, incluyendo la nueva revisión académica de módulos y regresiones de formularios, perfiles, privacidad, avatares, sesiones, navegación y apariencia. Los fallos de instrumentación descritos abajo se corrigieron y se verificaron mediante repetición dirigida antes de la ejecución final.
- Mobile: **18 archivos** de pruebas aprobados: academic, goalsParity, ownProfileMedia, profileRendering, socialService, socialSession, socialRendering, studyPartnersSession, studyPartnersRendering, roomsResourcesNotifications, roomMediaSafety, studyRoomClock, mobileAppearanceRendering, appearanceState, pagination, reviewNavigation, voicePlaybackLifecycle y mobileMenuNavigation.
- Cinco recorridos Chrome sobre React Native Web aprobados: mobileGoalsParity, mobileSocial, mobileProfile, mobileRoomsResourcesNotifications y mobilePartners. Comprueban CRUD/tags, validaciones contextuales, permisos y revocación, ONLINE/OFFLINE/HIDDEN/no disponible, consentimientos, caché de imágenes/cambio de cuenta, editor/cancelación, roles de sala, chat/reacciones/moderación, fallback multimedia, búsquedas/cancelación/errores, enlaces externos, notificaciones y badges sin cero.

Todas las operaciones con escrituras de esos recorridos son respuestas de **mocks**. No se escriben usuarios, metas, relaciones, sesiones o preferencias en PostgreSQL persistente. La galería Web nueva es de lectura y comprueba que no haya mutaciones.

Ajustes de pruebas necesarios, sin cambios funcionales:

1. Appearance esperaba `.min-h-screen` en Login/Register, sustituido por fullscreen en 7.2. La prueba ahora distingue el formulario de autenticación del lienzo de las rutas funcionales y sigue comprobando tema, texto y navegación.
2. El test de avatares tomaba la referencia de peticiones antes de que empezase la tercera descarga de la cola (concurrencia dos). Espera las tres peticiones iniciales y mantiene la aserción de que refrescar la sala no descarga otra vez.
3. La prueba social activaba el polling simulado mientras el refresh anterior aún descargaba imágenes. Espera el recurso actualizado antes de activar el siguiente tick. No se cambia el guard pending de producción.
4. Las capturas esperan el contenido de la ruta visible; un enlace de perfil también podía pertenecer al tab anterior retenido por Native. Los selectores de Settings se pulsan como acciones separadas para reflejar su estado real.

## Evidencia visual

Se renderizaron e inspeccionaron vistas representativas de los ocho módulos en **Web y React Native Web**, además de detalle de meta, tags, registros, Member Profile y editor. Las comprobaciones de overflow cubren **320, 390, 768 y 1440 px**. Se mantienen los desbordamientos horizontales intencionales de filtros/paginación y no se confunden con overflow del documento.

La matriz Web aplica Dark/Light/System y Mint/Blue/Purple/Orange a las rutas funcionales. Settings se captura con controles reales de Light/Orange y Dark/Mint; las regresiones de apariencia verifican también el modo del sistema. Mobile utiliza una matriz representativa Dark/Mint, Light/Blue, System/Purple y Light/Orange en Settings, junto a los temas y permisos de los recorridos sociales/perfil; el renderizado aislado comprueba las combinaciones del proveedor.

Artefactos temporales (no forman parte del bundle/commit):

- `/tmp/73b-web-{goals,goal-detail,tags,records,record-detail,tracking,validations,rooms,resources,notifications,profile,member,settings}-{320,390,768,1440}.png` y variantes `-dark.png`.
- `/tmp/73b-web-profile-editor.png`.
- `frontend-mobile/.expo/73b-{goals,goals-goal,goals-tags,tracking,validations,room,resources,notifications,profile,member}-{320,390,768,1440}.png`.
- `.expo/73b-settings-{Dark-Mint,Light-Blue,System-Purple,Light-Orange}-{320,390,768,1440}.png`.
- Capturas existentes actualizadas de los recorridos: `.expo/profile-editor*.png`, `.expo/partners-panel.png`, `.expo/social-member.png`, `.expo/parity65b-*.png`.

La inspección confirmó campos y acciones legibles, tarjetas compactas, ausencia de solapamientos en las vistas revisadas y recorte de imágenes conservado. Los datos visibles son fixtures de prueba, no actividad real del usuario.

## Archivos de la entrega

- Fuente y recursos: `assets/academic/glyphs.json`; copias generadas `frontend-{web,mobile}/src/components/academic/glyphs.ts`.
- Web académico: `components/academic/{Academic.tsx,academic.css}`; `components/ui/EmptyState.tsx`.
- Web rutas: Goals, GoalDetails, Tags, DailyRecords, DailyRecordDetails, TrackingLinks, Validations, StudyRoomsPage, Resources, Notifications, Profile, SocialProfile y Settings.
- Web compartidos: `components/profile/{ProfileIdentity,ProfileEditDialog}.tsx`, `components/social/StudyPartnersPanel.tsx`, `components/study/MetricCard.tsx`.
- Mobile rutas: las cuatro pestañas del área Menu; Resources y Notifications; detalles de meta, registro y tags; Profile y Settings.
- Mobile compartidos: `components/academic/Academic.tsx`; presentación de StreakCard, TrackingLinkCard, PartnerSearch, ProfileStudyStats, MemberProfileContent, StudyPartnersPanel, BookCover, CreationModal y MetricCard. Los formularios de metas y registros reciben el encabezado de CreationModal sin cambiar sus archivos ni handlers. Se conservan ProfileCover, servicios y almacenamiento de imágenes.
- Pruebas: nueva `frontend-web/tests/academicModules.test.mjs`, scripts test:ui, ajustes en appearance/socialAvatarCompletion/socialRendering; helper `frontend-mobile/tests/helpers/academicModuleReview.mjs` y ampliación de cuatro recorridos Mobile.
- Este documento. El listado exacto queda en `git show --stat` del commit de implementación.

## Android real y cierre

No se operó un teléfono físico. Pendiente en Expo Go: SafeArea/gestos, teclado y selección de texto en formularios/modales, fuente grande/TalkBack, contraste y nitidez a densidad real, cámara/micrófono y cancelación de evidencias, descarga/subida/limpieza de imágenes, background/foreground durante sala y sesiones, recepción multimedia en development build cuando corresponda. Usar cuentas autorizadas y un entorno aislado para escenarios con escrituras.

Se registra el commit local solicitado mediante staging explícito. Un segundo commit sólo documental incorpora el hash real de implementación, evitando amend y una autorreferencia imposible. No hay push, merge, reset ni deployment. Los 16 elementos ajenos permanecen fuera de ambos commits. Fin de 7.3b; no comienza otra etapa.

## Commit de implementación

`db1f967 feat(ui): extend retro pixel styling across app modules` registra los 55 archivos de implementación, recursos, pruebas e informe inicial. Este añadido se registra por separado, sólo en documentación, para incluir el hash real sin amend. Estado posterior a la implementación: únicamente los 16 elementos preexistentes ajenos, sin archivos de la etapa pendientes.
