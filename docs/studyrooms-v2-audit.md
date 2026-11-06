# StudyStreak V2 — auditoría, persistencia y estadísticas

Rama: `feat/studyrooms-v2-collaboration-analytics`, PR #119. La primera entrega reforzó las salas; esta revisión incorpora un historial autoritativo y sustituye el guardado basado únicamente en la declaración del cliente. No se fusiona ni despliega automáticamente.

## Hallazgos y correcciones

| Prioridad | Hallazgo | Resultado |
| --- | --- | --- |
| Alta | Un POST podía sumar la duración elegida sin que hubiera inicio validado. | Inicio registrado en PostgreSQL, observaciones de tiempo del servidor y finalización condicionada al deadline. El POST antiguo ya no inserta sesiones sin evidencia. |
| Alta | Dos dispositivos podían registrar periodos simultáneos con UUID distintos. | Índice UNIQUE parcial de una sesión activa por cuenta, bloqueo de usuario y UUID idempotente. Una segunda grabación recibe 409. |
| Alta | Membresía/presencia no demostraban participación grupal. | Ronda grupal separada, selección privada y participación única `(run_id,user_id)`, iniciada únicamente con Goal propio activo y estado studying. |
| Alta | Reintentos y respuestas desordenadas podían alterar minutos/estado. | Bloqueos transaccionales, PK/UNIQUE, comandos de sala con versión esperada, snapshots ordenados y contadores leídos de PostgreSQL. |
| Alta | La cola descartaba entradas después de 100 y el estado de una pestaña podía reemplazar el de otra. | Sin truncamiento; outbox con una clave por UUID/cuenta en Web y archivo por UUID/cuenta en Mobile. Los pendientes se eliminan tras respuesta del servidor, sin sumar optimistamente. |
| Alta | Eliminar Goals eliminaba el historial asociado. | El nuevo historial conserva nombre e ID original; la FK editable pasa a NULL. Los reintentos ya confirmados siguen reconociéndose tras eliminar el Goal. |
| Media | La finalización grupal dependía de consultar el timer. | Scheduler del servidor completa rondas vencidas y participa en las mismas transacciones/bloqueos; funciona sin clientes y recupera deadlines tras reiniciar. |
| Media | Estadísticas cargaban sesiones completas en Java. | Agrupación PostgreSQL por fecha local, Goal, tipo, hora, semana y mes; historial paginado e índices. La ruta interna histórica también agrupa en SQL. |
| Media | Recorded no siempre revalidaba ni distinguía error de ausencia de datos. | Refresco después de confirmar, al regresar/recuperar conectividad y periódicamente mientras la pantalla está activa; estados de carga/error separados de cero. |
| Media | Fecha original vulnerable a futuras escrituras ORM. | Además de asignación por Spring y rechazo de cambios por API, `DailyRecord.date` es `updatable=false`. |

Se revisaron `FocusSession`, `StudyRoom`, `StudyRoomMember`, `Goal`, `DailyRecord`, `User`, sus servicios/repositorios/controladores y las pantallas/servicios Web y Expo. Se conservan autenticación, refresh, multipart, validaciones, Tracking Links, notificaciones, Books, navegación, catálogo de doce sonidos y sus pruebas. No se introducen dependencias pagadas.

## Modelo y fuentes de verdad

| Registro | Responsabilidad |
| --- | --- |
| `focus_session` | Datos históricos del modelo anterior. Se conservan; ya no se utiliza para nuevas confirmaciones de la API. |
| `study_room` / `study_room_member` | Sala, host y membresía; `last_seen_at`/`studying` representan presencia temporal, no minutos. |
| `study_run` | Identidad UUID y ciclo RUNNING/PAUSED/COMPLETE/CANCELLED de una ronda grupal de foco. Una sola ronda abierta por sala. |
| `study_room_selection` | Goal privado por sala y usuario. Solo endpoints del propio usuario lo exponen; los snapshots compartidos no lo incluyen. |
| `study_ledger` | Intento por usuario: UUID, fuente INDIVIDUAL/GROUP/LEGACY, Goal original/nombre, duración planificada, tiempo observado, tiempo confirmado, estado y timestamps. Una participación por ronda/usuario y una grabación activa por cuenta. |
| Outbox del cliente | UUIDs cuya confirmación está pendiente. No forma parte de las estadísticas hasta recibir confirmación persistida. |

Los tiempos de sesión son `timestamptz` y se calculan con el reloj de PostgreSQL. Los cambios de estado se realizan en transacciones. Para salas, el orden de bloqueo es sala → usuario → participación; la tarea de expiración usa `SKIP LOCKED` sobre salas ocupadas. No hay contador acumulado mutable: los totales se agregan desde filas persistidas.

Los registros anteriores se copian por UUID al historial una sola vez de forma idempotente. Son `LEGACY`, `verified=false`: preservan minutos y fecha originales, pero no se presentan como tiempo observado. No se inventan inicios históricos ni participación pasada.

## Reglas de validez y cálculo

1. **Individual:** iniciar online con UUID, Goal propio activo y duración de 5–120 minutos. Una repetición idéntica devuelve el mismo intento; cambiar usuario/Goal/duración con ese UUID produce conflicto. Un timer sin Goal puede seguir utilizándose localmente, pero no crea registros.
2. **Participación grupal opcional:** elegir privadamente un Goal propio y marcarse estudiando. El siguiente heartbeat durante una ronda FOCUS activa crea la participación. Entrar a la sala o aparecer online no crea minutos. Estudiar sin Goal sigue permitido.
3. **Una cuenta, una grabación:** Web y Mobile pueden observar el mismo intento; cada intervalo se suma una sola vez bajo bloqueo. No pueden grabar dos intentos activos distintos. Una sesión individual obsoleta sin observaciones durante más de 35 s puede cancelarse al iniciar otra; su UUID anterior no se reactiva. Una grabación grupal no desplaza automáticamente otra grabación activa.
4. **Tiempo observado:** cada heartbeat calcula el intervalo desde la observación anterior, usando reloj del servidor y un límite de 35 s entre observaciones. Si el hueco supera 35 s, el hueco completo aporta cero; la nueva observación sirve de base para intervalos posteriores. El deadline y la duración planificada limitan el acumulado.
5. **Pausas:** no suman tiempo. Al reanudar un individual, el deadline se reconstruye a partir del tiempo todavía no observado. En grupo manda el timer del host y cada participante debe volver a estar studying; los periodos de pausa no se acreditan.
6. **Finalización:** un individual necesita petición de confirmación después del deadline del servidor y estado RUNNING; no basta que el cliente declare terminado. Una ronda grupal termina en el servidor, incluso sin navegadores. El último intervalo grupal hasta el deadline solo se cuenta si está cubierto por la ventana de 35 s.
7. **Minutos confirmados:** `floor(observed_ms / 60000)`. Se requiere al menos un minuto observado y haber llegado al final de la ronda/timer; de lo contrario queda CANCELLED con cero confirmado. Puede haber menos minutos confirmados que planificados. COMPLETE significa timer finalizado con participación elegible, no que se hayan observado todos los minutos planificados.
8. **Salir, cerrar, resetear o cambiar de fase:** cancela las participaciones todavía abiertas afectadas; no transforma minutos incompletos en confirmados. Desconectarse no implica estudiar: solo se conservan los intervalos ya observados. Una participación cancelada no se recrea para la misma ronda.
9. **Goal eliminado:** la atribución histórica y los minutos permanecen; la navegación al Goal deja de estar disponible. `original_goal_id` permite reconocer un reintento de una sesión ya confirmada aunque la FK actual sea NULL.
10. **UUID y límites:** PK para el intento, UNIQUE de participación y restricciones CHECK impiden tiempos negativos, duraciones fuera del rango y completados sin minuto elegible. Repetir COMPLETE devuelve el resultado persistido. Los errores 400/403/404/409 se muestran; no se convierte un error en cero ni en éxito optimista.

“Verificado” significa **intervalos observados por el servidor**, no una prueba de atención humana. La app no puede demostrar que una persona estudió mentalmente. Tampoco acredita trabajo offline sin evidencia retroactivamente.

## Estadísticas

`GET /api/focus-sessions/stats?days=7|30` agrega el historial bajo una lectura repetible:

- Totales y sesiones completadas, con minutos verificados e históricos estimados separados.
- Periodo actual y periodo anterior del mismo tamaño; cambio porcentual NULL cuando no existe base anterior.
- Minutos individuales/grupales, sesiones grupales, promedio de duración y días activos.
- Porcentaje de intentos verificados iniciados en el periodo que están COMPLETE. Los intentos abiertos/cancelados forman parte del denominador; LEGACY queda fuera por falta de historial de intentos.
- Días de estudio consecutivos y mejor racha, independientes de las rachas y validaciones de Daily Records. La racha actual permite hoy o ayer como último día activo.
- Series diarias, semanales (lunes) y mensuales; resumen de la semana actual; mapa de 365 días.
- Distribución por **hora local de finalización**. Es una atribución temporal por cierre, no una reconstrucción de cada minuto atravesando horas/días. Las series diarias también atribuyen los minutos a la fecha local de finalización.
- Tiempo por Goal; los eliminados conservan su nombre.

`GET /api/study/history?from=YYYY-MM-DD&to=YYYY-MM-DD&page=0` devuelve páginas de 25 intentos ordenados por inicio/UUID, con periodo inclusivo máximo de 366 días, estado, tipo, planificado, confirmado y etiqueta verificada/estimada. El historial filtra por fecha de **inicio**; las estadísticas por fecha de **finalización**. Un intento que cruza medianoche puede aparecer en días distintos según la vista, intencionalmente.

La zona se obtiene de la cuenta y se valida mediante la política existente (fallback America/Lima). Las fronteras locales se convierten a UTC y SQL agrupa mediante `AT TIME ZONE`. Se prueban ambos lados de medianoche. No se añade caché sin una medición que la justifique. Las consultas son agregadas en número constante, sin una consulta por sesión; el lobby de salas aún puede beneficiarse de paginación futura.

## Clientes y Recorded

El inicio y los comandos de pausa/reanudación se confirman antes de cambiar una grabación vinculada. El cliente recupera el intento activo y el deadline del servidor al abrir/regresar a Focus y periódicamente; el UUID no se regenera al recuperar una sesión.

La outbox Web usa claves independientes en localStorage. Mobile usa archivos en Documents con escritura temporal seguida de rename, evitando el límite de tamaño de valores SecureStore. La escritura de cada pendiente ocurre antes de su POST y su eliminación después del acuse. El núcleo de outbox se prueba con archivos reales, reconstruyendo la instancia y simulando pérdida de red/reintentos/cuentas distintas. El estado anterior del Pomodoro mantiene compatibilidad y sus pendientes se incorporan a la nueva cola.

Recorded en Focus, detalles del Goal y selección privada de sala proviene de PostgreSQL. Se revalida al confirmar, regresar a la pantalla y en intervalos de 12–30 s según la vista. Las estadísticas/gráficos también revalidan. No se suman minutos en memoria como si fueran confirmados. Los datos que no pueden verificarse permanecen pendientes con el error devuelto por el servidor; los pendientes de versiones antiguas sin inicio registrado no se convierten artificialmente en registros verificados.

## Migración y despliegue seguro

Se conserva `ddl-auto=update` para las entidades existentes: cambiarlo de golpe sin un baseline inventariado puede impedir arrancar instalaciones anteriores. No se introduce Flyway/Liquibase con un baseline supuesto.

Las tablas nuevas se gestionan con `src/main/resources/db/study-tracking-v3.sql`, ejecutado después del EntityManager. La migración es transaccional, idempotente y está serializada mediante advisory lock PostgreSQL; usa CREATE/ALTER IF NOT EXISTS e INSERT ON CONFLICT. No borra ni reescribe los registros históricos existentes. Se prueba su repetición y un cierre/reinicio real del contexto Spring sobre la misma base.

Antes de producción: backup, ejecutar en copia de la base y revisar el tiempo de copia/creación de índices. El backfill puede retener locks durante el despliegue en bases grandes. Para instalaciones donde la cuenta de aplicación no tiene DDL, aplicar el mismo SQL con la cuenta de migración y conceder los permisos apropiados; configurar `study-ledger.migrate-on-start=false` después de aplicar la migración. En ese modo el arranque verifica la tabla sin ejecutar DDL. El resto de entidades sigue sujeto a la configuración Hibernate existente.

Desplegar Backend y actualizar ambos clientes coordinadamente. Los clientes antiguos que solo envían COMPLETE sin haber registrado inicio recibirán error: es una restricción intencional para eliminar el guardado no autoritativo. El código previo puede seguir leyendo sus tablas, pero una reversión a UI antigua no mostrará las nuevas sesiones; no se elimina el nuevo historial durante rollback.

## Verificación y límites

Pruebas PostgreSQL: UUID concurrentes al iniciar/completar, una grabación por cuenta, huecos de conexión y pausas, participación/opt-in/expiración grupal, cancelación, permisos y privacidad, eliminación de Goals/reintento, fechas locales, agregados, migración repetida y recuperación después de detener y recrear Spring. Se conservan las regresiones anteriores de salas, auth, multimedia y Daily Records. Pruebas cliente: estado serializado/reloj desfasado, outbox persistente en disco, cuentas aisladas, duplicados/reintentos y restauración de más de 100 pendientes.

Pendiente de validación física: suspender y matar Expo en Android/iOS, comportamiento del sistema de archivos ante terminación durante una escritura, lectores de pantalla, tamaños grandes y audio/interrupciones. Una app suspendida que deja de enviar heartbeats no recibe crédito por ese hueco. Borrar datos de navegador/app elimina pendientes locales; el historial confirmado permanece en PostgreSQL. El limitador de invitaciones sigue siendo por instancia, no una cuota distribuida. No se prometen créditos completos para tiempo no observado ni precisión de atención humana.

### Cierre de recuperación — 2026-11-04

Se recuperaron los cambios modificados/no rastreados en la misma rama; no se encontraron los scripts antiguos de `/tmp`, por lo que no es posible atribuirles cambios concretos. La documentación ya contenía la fase 2. Se corrigieron el reemplazo indebido de participaciones grupales obsoletas por un inicio individual y la lectura concurrente de una outbox cuyo UUID acaba de confirmar otra pestaña. Se ampliaron pruebas de dos dispositivos, participantes con Goals privados, reconexión y reinicio con minutos confirmados.

- Maven `verify`, PostgreSQL 17, `STUDYSTREAK_POSTGRES_INTEGRATION=true`: **154 pruebas, 0 fallos, 0 errores, 0 omitidas**. Esquema `ss_audit_v2` en base desechable. La configuración de CI habilita ahora estas integraciones en `ss_audit_ci`.
- Web: lint, TypeScript/build y **49 pruebas** aprobadas.
- Mobile: lint con cero warnings, TypeScript; auth **8**, pagination **5**, review **6**, focus **26**, todas aprobadas.
- El aviso `Failed to create stream fd: Operation not permitted` aparece también al iniciar Node fuera de los tests. Las suites se comprobaron adicionalmente con `NODE_OPTIONS=--test-isolation=none`, obteniendo resultados por caso y sin omisiones.
- HTTP sobre backend/base locales: resumen y estadísticas devuelven 5 minutos verificados/1 sesión después de dos confirmaciones del mismo UUID. Renderizado del componente React real con esos datos: valores coincidentes. El reloj de esa sesión usa un fixture SQL exclusivo de pruebas.
- Chrome no pudo navegar mediante la herramienta de automatización (`timeoutMs`); no se afirma validación visual interactiva ni de Mobile nativo. Audio, notificaciones y suspensión/terminación real de Android/iOS siguen requiriendo dispositivos.

Para reproducir las integraciones, usar una base desechable vacía, crear un esquema `ss_audit_*`, indicar `currentSchema` en JDBC y `-Dspring.jpa.properties.hibernate.default_schema=<esquema>` a Maven. Se observó que Hibernate puede omitir secuencias cuando ya existen homónimas en otro esquema de la misma base. Las pruebas HTTP de login también requieren la migración existente `db/migrations/2026-10-30_create_refresh_sessions.sql` y un secreto JWT Base64 válido.

## Fase 3 — recuperación y rediseño Web/Mobile (2026-11-05)

### Estado recuperado

Se conservó la rama `feat/studyrooms-v2-collaboration-analytics` y el PR #119. Al iniciar había un commit local no publicado, `3699890` (tokens carbón/menta, BarChart, MetricCard y helpers en ambos clientes, Screen/ActionButton y navegación), sin staging pendiente. Los archivos modificados eran:

- Web: `FocusInsights.tsx`, `StudyAnalyticsDetails.tsx`, `StudyRoomGoal.tsx`, `AppSidebar.tsx`, `StudyRoomsPage.tsx`.
- Mobile: `study-rooms.tsx`, `FocusInsightsMobile.tsx`, `StudyAnalyticsDetails.tsx`, `StudyRoomGoal.tsx`.
- Sin seguimiento: `ParticipantCard.tsx` y `RecordedSummary.tsx` de ambos clientes. Existían y tenían contenido completo; se inspeccionaron, integraron y mejoraron.

`/tmp/phase3-rooms.py` no existía. No se ejecutó ningún script antiguo, ni se descartaron archivos, staging o commits. El commit de Fase 2 seguía siendo `dd6a102`.

### Resultado implementado

- Sistema compartido carbón/menta, ámbar para pendientes, superficies y bordes coherentes, foco visible, reducción de movimiento Web y controles táctiles. Sin dependencias nuevas.
- Estadísticas separadas en Actividad, Goals, Together e Historial: barras diarias/semanales/mensuales, heatmap de 365 días, barras por Goal, balance individual/grupal, hora de finalización y comparación con el periodo anterior. Datos reales del contrato existente, ceros sin barras artificiales, Goals eliminados sin enlace e historial paginado con reintento. Los filtros se limitan a 7/30 días porque son los periodos soportados por el backend; las semanas/meses de borde se explican como parciales.
- Mobile usa ScrollView horizontal y controles nativos; heatmap con celdas táctiles de 44 puntos, métricas flexibles y etiquetas accesibles. La hora mostrada corresponde al cierre de la sesión, no a una reconstrucción inventada de asistencia.
- Salas: prioridad al reloj, código copiable en Web, sincronización/acción pendiente/reconexión, pausa y espera de confirmación final diferenciadas. Un snapshot obsoleto se etiqueta como tal. Participantes distinguen rol, presencia y estudio; el recuento de estudiantes excluye offline. Se mantienen permisos/versiones y la selección privada del Goal.
- Focus: reloj y controles antes de los detalles del Goal; estadísticas desplegables; acceso a salas; menos superficies anidadas y fondo musical neutral en Web. Se preservan los 12 sonidos, preferencias, implementación de audio, outbox y lógica de sesión.
- RecordedSummary se reutiliza en Focus, detalles del Goal y selección de sala. Los pendientes del Goal seleccionado se cuentan separadamente en Focus. Un error al refrescar conserva las últimas cifras confirmadas y añade aviso; no convierte ausencia/error en cero ni suma pendientes al total. Las cifras proceden de los endpoints existentes, con revalidación y botón Refresh.
- Goals: acceso directo a Focus desde tarjetas, acceso a salas desde detalles y contadores compartidos. Daily Records: fecha como información sin control editable, texto de asignación por zona horaria al crear y fecha original al editar; notas/evidencias y estado de guardado conservados.

### Verificación de esta fase

- Web: `npm run lint`, `npm run build` correctos; `test:web`: **49 casos, 0 fallos, 0 omitidos**.
- Mobile: `npm run lint -- --max-warnings 0`, `npx --no-install tsc --noEmit` correctos; auth **8**, pagination **5**, review **6**, focus **26**, sin fallos ni omitidos.
- `test:ui`: **5 casos** sobre renderizado TSX real mediante Vite/React: snapshot confirmado conservado ante error, desconocido frente a cero, presencia frente a estudio, barras vacías/cero, fechas informativas al crear/editar. Incluido en `test:web`, ejecutado por Frontend CI sin modificar workflows.
- Los comandos de test normales devolvían resultados por archivo junto al aviso `Failed to create stream fd`. Se ejecutaron de nuevo con `NODE_OPTIONS=--test-isolation=none` para obtener resultados individuales reales. Vite encontró EPERM en su socket local dentro del sandbox; la prueba de renderizado se repitió fuera y pasó sin ese error.
- No se modificaron servicios, entidades, contratos, SQL ni lógica de backend. La integración PostgreSQL de CI permanece habilitada; los 154 casos de Fase 2 son evidencia previa, no una nueva ejecución local de Maven en esta fase.
- `git diff --check` sin errores. Los logs de esta ejecución se conservaron en `/tmp/phase3-*` (temporales del entorno).

### Limitación de revisión visual

La herramienta de Chrome falló primero al cargar la política de cabeceras de la extensión y luego con `Cannot read properties of undefined (reading 'timeoutMs')`. No se pudo realizar inspección visual interactiva de escritorio/responsive, salas con varios usuarios o reconexión. Las pruebas SSR anteriores verifican salida y semántica, **no sustituyen una revisión visual ni interacción en navegador**. No se afirma prueba física de Android/iOS, lectores de pantalla, audio o ciclo de vida nativo. La implementación y las pruebas automáticas se entregan; la aceptación visual en navegador/dispositivos queda pendiente por esta limitación. No se implementó LiveKit ni compartir pantalla.

Publicación: `gh pr edit` falló por Projects Classic; se actualizó el PR con REST. El push HTTPS reveló que la credencial no tiene scope `workflow`. Se conservó el workflow original y se incorporó la suite de renderizado a `test:web`, ya ejecutado por CI, sin ampliar permisos.
