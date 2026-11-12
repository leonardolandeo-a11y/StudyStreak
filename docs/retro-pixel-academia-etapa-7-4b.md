# Etapa 7.4b — Goals y Validations

Rama: `feat/ui-ux-web-mobile`. Base revisada: `4d13504` y `8794498` (7.4 visual). Implementación: HASH_PENDIENTE.

## Cambios visibles

| Área | Web | React Native |
|---|---|---|
| Goals | Tarjeta lavanda con sprite Books/Notebook, identidad completa enlazada, estado visible y planificación secundaria. Sin ID ni View Details. Focus es un enlace separado. | Tarjeta táctil con sprite, pressed discreto y zona principal que abre detalles. Conserva tabs, drawer, Focus y `+` contextual. |
| Crear / editar | Create Goal y Update Goal abren un diálogo dedicado con foco modal, Escape, cancelación y restauración de foco. No quedan formularios permanentemente expandidos. | Reutiliza CreationModal, SafeArea, scroll y ajuste de teclado existentes. Añade acceso explícito Create Goal y agrupa frecuencia/duración. |
| Estado inicial | Sin checkbox Completed al crear; envía `completed: false`. Edición conserva el control. | Conserva la misma regla existente y su validación. |
| Goal Details | Título, estado, totales confirmados y contador real de Daily Records. Tags bajo demanda. Frecuencia/duración secundarias. | Cabecera con sprite y superficies del workspace, número de registros destacado, modales existentes conservados y tags integrados. |
| Daily Records | Filas enlazadas compactas con fecha, nota y disponibilidad de foto/voz. El detalle conserva los controles de evidencias. | Conserva las tarjetas compactas, CRUD y disclosure de evidencias ya implementados. |
| Tags | View Tags muestra badges, desvinculación con confirmación y `+` para abrir editor/búsqueda local. | View Tags, badges táctiles, `+`, editor y confirmación nativos. La ruta anterior de tags sigue disponible. |
| Validations | Stepper horizontal y un único paso visible: Partner → Goal → Record → Evidence → Confirm. | Mismo recorrido dentro del modal nativo, entrada desde lista o `+`, Back anterior y cierre conservados. |

Se reutilizan AcademicHeading, AcademicEmpty, AcademicSprite (recursos originales de 7.4), RecordedSummary, StreakCard, componentes de evidencias, paginación, confirmación y componentes UI existentes. WorkflowDialog/WorkflowStepper y ValidationStepper encapsulan las piezas nuevas. No se agregan dependencias ni assets remotos.

La validación conserva selecciones y borrador al retroceder; cambiar un padre descarta sus selecciones dependientes. Review decision presenta el resumen antes del POST/PUT. Los errores de envío conservan el formulario para reintento. Se bloquea navegación interna durante el envío. Evidencias se desmontan al salir de su paso para liberar reproducción/recursos según el componente existente.

El stepper desplaza únicamente su propia franja para mantener el paso activo visible en anchuras pequeñas. El desplazamiento es inmediato; no añade movimiento animado. La tarjeta Web respeta `prefers-reduced-motion` y `data-motion="reduce"`; Mobile conserva la preferencia global y el comportamiento de CreationModal.

## Dificultad: dependencia real, sin persistencia simulada

Se revisaron `src/main/java/com/example/studystreak/model/Goal.java`, `dto/Goal/GoalRequestDTO.java` y `GoalResponseDTO.java`. Goal no tiene campo de dificultad y los contratos contienen topic/frequency/duration/completed. Los tipos de ambos clientes tampoco incluyen dificultad.

Por tanto **no se muestra selector ni carita/color de dificultad** y no se envía un campo ignorado por el servidor. Los sprites representan metas/registros, sin atribuir una dificultad inventada. Los colores Active/Completed siguen siendo semánticos de estado.

Una etapa backend autorizada necesitaría:

1. Campo `difficulty` de tipo enum, por ejemplo `TRIVIAL | EASY | INTERMEDIATE | HARD`, con etiquetas Intrascendente/Fácil/Intermedio/Difícil en UI.
2. Persistencia en `goal` mediante una columna y restricción de valores. Los registros históricos deberían conservar `NULL` como “sin especificar” hasta decidir un backfill explícito; no inferir dificultad de frecuencia, duración o estado.
3. Incluir el campo en request/response DTO y mapeo de creación/actualización/lectura, con validación de valores y autorización de propietario existente. Acordar si será obligatorio para nuevas metas antes de imponer NOT NULL.
4. Pruebas de round-trip, edición, datos históricos y rechazo de valores no válidos; después ampliar tipos y selector de ambos clientes.

No se escribió ni ejecutó ninguna migración y no se modificó Spring Boot.

## Contratos y límites conservados

- Goals: GET/POST `/users/{userId}/goals`; GET/PUT/DELETE `/users/{userId}/goals/{goalId}`.
- Tags: GET/POST `/users/{userId}/goals/{goalId}/tags`; PATCH/DELETE `.../tags/{tagId}`.
- Validación: GET/POST/PUT `/api/goals/{goalId}/daily-records/{recordId}/validation`.
- Listado/total de registros: GET `/api/goals/{goalId}/daily-records`. Web consulta una página de tamaño 1 en detalles para leer `totalElements`; no descarga todo el historial ni añade consultas por tarjeta. Mobile reutiliza `records.data.totalElements`.
- Se conservan streak y focus summary: ningún porcentaje inventado, tiempo estimado acreditado, UUID, outbox o ledger alterado.
- Tags: el catálogo disponible es el de la meta y página actual. Se filtra localmente esa página y se puede seleccionar un tag para renombrarlo. POST con un nombre existente del propietario lo vincula según TagService; otro nombre lo crea. No existe búsqueda global de etiquetas en el contrato actual, por lo que no se presenta un directorio ficticio. Renombrar avisa que afecta a otras metas que usen la misma etiqueta; borrar solo desvincula de esta meta.
- Las rutas/IDs contextuales desde Notifications permanecen intactos. El editor compartido añade la revisión final también al acceso directo de un registro, sin cambiar sus permisos.
- JWT, refresh, clientes API, aislamiento entre cuentas, subida/descarga y permisos de evidencias no se modifican.

## Comparación visual

Capturas con identidades y API ficticias. Las de Web “antes” se tomaron de la base anterior; las de React Native Web “antes” reutilizan las capturas existentes de los mismos módulos sin cambios desde esa base. Se inspeccionaron Goals, detalles y Validations en **320, 390, 768 y 1440 px**; las capturas siguientes son una selección versionada, no fotografías de Android.

| Pantalla | Antes | Después |
|---|---|---|
| Goals Web | [Antes](images/retro-7-4b/before-goals-web.png) | [Después](images/retro-7-4b/after-goals-web.png) |
| Goal Details Web | [Antes](images/retro-7-4b/before-details-web.png) | [Después](images/retro-7-4b/after-details-web.png) |
| Validations Web | [Antes](images/retro-7-4b/before-validations-web.png) | [Evidencias](images/retro-7-4b/after-validations-web.png) |
| Goals Native Web | [Antes](images/retro-7-4b/before-goals-mobile.png) | [Después](images/retro-7-4b/after-goals-mobile.png) |
| Goal Details Native Web | [Antes](images/retro-7-4b/before-details-mobile.png) | [Después](images/retro-7-4b/after-details-mobile.png) |
| Validations Native Web | [Antes](images/retro-7-4b/before-validations-mobile.png) | [Después](images/retro-7-4b/after-validations-mobile.png) |

Detalles adicionales: [Crear a 320 px](images/retro-7-4b/create-web-320.png), [Editar Web](images/retro-7-4b/edit-web-1440.png), [Evidencias Web a 320 px](images/retro-7-4b/evidence-web-320.png), [Confirmación Web](images/retro-7-4b/confirm-web-390.png), [Evidencias Mobile a 320 px](images/retro-7-4b/evidence-mobile-320.png) y [Confirmación Mobile](images/retro-7-4b/confirm-mobile-390.png).

Se corrigió durante la inspección la franja que dejaba el paso activo fuera de pantalla. No hay desbordamiento horizontal del documento; el stepper tiene su propio scroll. Web mantiene Dark/Light/System × las cuatro paletas en la matriz automatizada. Las pruebas de apariencia Mobile cubren persistencia, System y accesibilidad; la regresión social también comprueba temas/paletas. Las capturas seleccionadas muestran Dark/Mint.

## Pruebas ejecutadas

Todas las escrituras de pruebas se interceptan con mocks locales; no se conecta a PostgreSQL persistente.

| Plataforma / comprobación | Resultado |
|---|---|
| Web `npm run lint`, `npx --no-install tsc -b`, `npm run build` | Aprobados. Build mantiene el aviso de chunk grande de StudyRooms; no se amplía ese módulo. |
| Web `node --test tests/goalWorkflows.test.mjs` | Aprobado: modales, creación sin Completed, error conservando borrador, guardar, navegación por identidad, edición, tags, cancelar desvinculación, wizard, Back/borrador, confirmación sin envío prematuro, POST/PUT con IDs originales, foco/Escape y matriz de tamaños/temas. |
| Web recordAccess, validationAccess, pageBounds y uiRendering | Aprobados. Autorización y fechas de registros conservadas. |
| Web `node --test tests/socialRendering.test.mjs` | Aprobado en Chrome: permisos, enlaces desde Validations, privacidad, teclado y temas. La primera ejecución sin permiso de servidor local no pudo iniciar Chrome; se repitió con el permiso necesario. |
| Mobile `npm run lint`, `npx --no-install tsc --noEmit` | Aprobados. |
| Mobile appearanceState, mobileAppearanceRendering, mobilePolish, goalsParity, reviewNavigation, socialRendering, voicePlaybackLifecycle | 7 archivos de regresión aprobados: tags/contratos/autorización, aislamiento y limpieza de evidencias, apariencia, formularios, navegación contextual y reproducción. |
| Mobile `node tests/mobileGoalsParity.browser.mjs` | Aprobado: CRUD de metas y registros, tags CRUD/retry, confirmaciones, evidencias bajo demanda y responsive. |
| Mobile `node tests/mobilePolish.browser.mjs` | Aprobado: creación dedicada, wizard, Continue bloqueado sin selección, borrador al volver, confirmación previa, fallo 503 simulado sin perder comentario, reintento con los mismos IDs y navegación desde Notifications. |
| Mobile `node tests/mobileSocial.browser.mjs` | Aprobado: acceso social desde Validations, 403/404, revocación, aislamiento y navegación. |
| Expo export Web y Android | Aprobadas con `EXPO_PUBLIC_API_URL=https://mobile-fixture.invalid`, salida en `.expo/integration-export` y `.expo/74b-android`. Sin cambios de dependencias ni build nativo. |

Una prueba compilada de Mobile detectó que React Compiler anticipaba `partner!.id`/`goal!.id` antes de seleccionar una entidad. Se añadieron guards explícitos en los loaders; los flujos compilados ya pasan. No se cambió el servicio ni el contrato.

## Pendiente de verificación física

En Expo Go Android: teclado al editar, cierre con Back del dispositivo entre pasos y modales, TalkBack y selección/recepción real de foto/voz. Probar crear/editar con una cuenta de pruebas, cancelar tags y volver Evidence ↔ Confirm conservando el comentario. Se preserva el código de permisos/cachés, pero Chrome y los mocks no certifican hardware ni permisos del teléfono. No se ha probado Android físico en esta entrega.

## Archivos de la etapa

- `frontend-web/package.json`
- `frontend-web/src/components/dailyRecords/DailyRecordCard.tsx`
- `frontend-web/src/components/goals/GoalCard.tsx`
- `frontend-web/src/components/goals/GoalForm.tsx`
- `frontend-web/src/components/goals/GoalTags.tsx`
- `frontend-web/src/components/navigation/AuthenticatedLayout.tsx`
- `frontend-web/src/components/navigation/Breadcrumbs.tsx`
- `frontend-web/src/components/validations/ValidationForm.tsx`
- `frontend-web/src/components/workflows/WorkflowDialog.tsx`
- `frontend-web/src/components/workflows/WorkflowStepper.tsx`
- `frontend-web/src/components/workflows/workflows.css`
- `frontend-web/src/pages/GoalDetails.tsx`
- `frontend-web/src/pages/Goals.tsx`
- `frontend-web/src/pages/Validations.tsx`
- `frontend-web/tests/goalWorkflows.test.mjs`
- `frontend-mobile/src/app/(app)/(main)/(menu)/goals/index.tsx`
- `frontend-mobile/src/app/(app)/(main)/(menu)/validations/index.tsx`
- `frontend-mobile/src/app/(app)/goals/[goalId].tsx`
- `frontend-mobile/src/app/(app)/goals/[goalId]/tags.tsx`
- `frontend-mobile/src/components/goals/GoalForm.tsx`
- `frontend-mobile/src/components/tags/GoalTags.tsx`
- `frontend-mobile/src/components/tags/TagForm.tsx`
- `frontend-mobile/src/components/validations/ValidationEditor.tsx`
- `frontend-mobile/src/components/validations/ValidationStepper.tsx`
- `frontend-mobile/tests/mobileGoalsParity.browser.mjs`
- `frontend-mobile/tests/mobilePolish.browser.mjs`
- `frontend-mobile/tests/mobileSocial.browser.mjs`
- `docs/retro-pixel-academia-etapa-7-4b.md`
- 18 capturas en `docs/images/retro-7-4b/`.

## Git y alcance

Staging explícito de los archivos anteriores. Se conservan los 16 elementos preexistentes ajenos sin incluirlos. Sin cambios de backend, PostgreSQL, Docker, AWS, autenticación o multimedia de Study Rooms; sin push, merge, amend ni reset. La etapa se detiene aquí; dificultad persistida y 7.4c no se implementan.
