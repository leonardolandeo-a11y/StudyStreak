# StudyStreak V2: auditoría y refactorización

Base: `main` con PR #111–#118 fusionados. Árbol inicialmente limpio. Rama: `feat/studyrooms-v2-collaboration-analytics`. No se modifican contratos JWT, multipart, navegación ni las relaciones de Goals/Daily Records. Esta revisión incluye lectura de código y pruebas automatizadas; no equivale a una certificación de dispositivos reales.

## Hallazgos por criticidad

| Prioridad | Evidencia anterior | Corrección / estado |
| --- | --- | --- |
| Alta | `FocusSessionService.recordCompletion`: consultar UUID y después `saveAndFlush` no arbitra reintentos concurrentes; JPA puede hacer merge de UUID asignados. | Inserción PostgreSQL `ON CONFLICT DO NOTHING`, lectura del registro ganador y validación de Goal/duración. Prueba concurrente real de dos reintentos. |
| Alta | `StudyRoomService.leave` cerraba una sala sin el bloqueo utilizado por `join`/timer. | Cierre, salida, heartbeat, transferencia y regeneración comparten bloqueo de fila. Incorporación consulta el código bajo bloqueo en una sola operación. |
| Alta | Web/Mobile aceptaban un polling atrasado después de una acción reciente. | Snapshot con versión de sala, descarte por versión/fecha de servidor e identidad de sala; comandos de timer incluyen `expectedVersion` y devuelven 409 si cambió. |
| Alta | Los heartbeats reenviaban el booleano local cada 12 segundos: un dispositivo podía revertir la selección hecha desde otro. | `studying: null` renueva presencia; solo la acción explícita cambia el estado. UI deriva su selección del snapshot recibido. |
| Alta | Ambos `restorePomodoro` conservaban únicamente las últimas 100 sesiones pendientes. | Eliminado descarte silencioso; prueba de restauración de 125 sesiones. |
| Media | La finalización de la sala era una representación del GET, no un estado persistente. | Tarea Spring cada 5 s con actualización SQL condicional, incremento de versión y recuperación al reiniciar servidor. |
| Media | START repetido recalculaba el deadline con redondeo. | START de timer todavía activo conserva exactamente el deadline. |
| Media | No existían revocación de invitación, transferencia ni limitación de intentos. | Endpoints exclusivos del host, UI de confirmación, códigos anteriores invalidados, validación de longitud y 20 intentos/minuto/usuario/instancia para crear/unirse/regenerar. Mapa acotado a 10.000 ventanas. |
| Media | `GlobalExceptionHandler` convertía `ResponseStatusException` en 500. | Conserva 400/409/429 y demás estados intencionales. Pruebas de 409 y 429. |
| Media | Participantes con usuarios lazy, búsqueda por usuario sin índice propio y barrido de deadlines. | EntityGraph de usuarios e índices de membresía por usuario, estado/deadline y Focus por Goal/fecha. |
| Media | Rechazo de refresh de lobby sin capturar; no había indicador de datos envejecidos. | Error capturado, estado de reconexión a los 15 s sin snapshot, controles suspendidos hasta recibir estado nuevo, reintentos automáticos y reanudación al volver a primer plano/red. |

## Inventario revisado

- **A/B – Focus Studio Web y sonidos:** pantalla independiente, máquina `pomodoroState`, preferencias por usuario, catálogo de 12 sonidos, síntesis local y liberación de AudioContext/nodos. Se conservan controles, categorías y reproducción sin Spotify. Las pruebas existentes de sonidos y timer siguen vigentes.
- **C – Focus Studio Mobile:** `features/focus`, pantalla Expo, WAV/caché, `MobileFocusAudio` y gestión de generaciones/release. Se conservan las 12 opciones y el almacenamiento por usuario. Se verifican catálogo, síntesis y sesión UUID con pruebas; reproducción e interrupciones requieren hardware.
- **D – Pomodoro/Goals:** revisados selección de Goal, atribución al comenzar, cola pendiente, retry, resumen y endpoint idempotente. Correcciones de concurrencia SQL y truncamiento de cola en ambos clientes.
- **E – Estadísticas/Daily Records:** agregados por usuario/Goal, ventanas 7/30, zona de cuenta y fallback America/Lima, series de fecha local y fechas inmutables en actualizaciones de Daily Records. Se conserva separación de sesiones confirmadas/pendientes. Se añade índice compuesto para Focus.
- **F – Study Rooms:** revisados controlador, DTO, entidades, repositorios, servicio y ambas pantallas. Nuevas operaciones de anfitrión, expiración persistente y sincronización descritas arriba.
- **G – Regresiones:** revisados filtros/interceptores JWT y refresh de una sola petición, controles de ownership en Goals/Records/validaciones/tracking/notificaciones y servicios multipart; Google Books conserva su manejo de errores. Se ejecutan las pruebas existentes de backend, auth, navegación, paginación y acceso. No se cambiaron esos flujos salvo conservar los estados HTTP intencionales del manejador global.

## Arquitectura elegida

REST autenticado existente, polling cada 4 s y heartbeat cada 12 s, sin solapar peticiones del mismo tipo. La presencia caduca a los 35 s sin heartbeat; salir de primer plano deja de renovarla. Es presencia **por cuenta**, no por dispositivo: cualquier dispositivo activo mantiene al usuario online y la última acción explícita decide «studying».

Web responde a `online` y `visibilitychange`; Mobile a foco de navegación y `AppState`. Un fallo de red se reintenta en el siguiente ciclo. No se encolan acciones de anfitrión offline para evitar ejecutarlas fuera de contexto. Las peticiones conservan los timeouts y refresh JWT del cliente API. Respuestas de una sala anterior no cambian la selección actual.

El servidor conserva `endsAt`, fase, estado y `@Version`. El cliente calcula transcurso local con `performance.now()`, inmune a cambios manuales del reloj del dispositivo, y se corrige con cada snapshot. No se promete precisión subsegundo bajo latencia de red: el cálculo comienza cuando llega la respuesta. PostgreSQL serializa mutaciones de una sala; `expectedVersion` es opcional para mantener compatibilidad con clientes anteriores, pero los clientes nuevos lo envían.

La tarea de expiración usa UPDATE condicional, por lo que dos instancias no duplican finalizaciones. Tras una parada del backend, procesa los deadlines vencidos en el siguiente ciclo. GET sigue mostrando COMPLETE desde el deadline aunque aún falten unos segundos para persistirlo. No crea minutos personales ni inicia automáticamente otra fase: las salas y los Pomodoros asociados a Goals mantienen su semántica anterior.

SSE reduciría el intervalo de entrega pero todavía necesitaría REST para comandos, gestión de reconexión/credenciales y distribución entre réplicas. WebSockets añadiría un protocolo bidireccional y gestión de conexiones/presencia. Para estas salas de hasta 12 miembros se conserva el transporte existente y se resuelven primero las carreras de datos; reconsiderar SSE al medir que el polling sea un coste significativo.

## Compatibilidad y despliegue

Los cambios de esquema son índices; no se eliminan ni reinterpretan datos. Hibernate `ddl-auto=update` ya está configurado. Los despliegues con DDL manual deben crear los índices `idx_room_member_user(user_id)`, `idx_room_expiry(timer_status, ends_at)` y `idx_focus_goal_completed(goal_id, completed_at)` en sus tablas correspondientes. Revisar el coste de crear índices en tablas grandes antes de desplegar.

Desplegar Backend antes de ambos clientes: los clientes nuevos envían heartbeat con `studying: null`. Un cliente anterior sigue funcionando pero su heartbeat booleano aún puede sobrescribir la selección; actualizar todos los dispositivos para obtener la nueva semántica. Los códigos son reutilizables para incorporarse mientras estén vigentes, intencionalmente; regenerarlos revoca solo el código anterior, no las membresías ya concedidas.

## Límites y pruebas reales pendientes

- La cuota antiabuso es por instancia y se reinicia con el proceso. No reemplaza un límite global del proxy ni impide acumulación de salas a largo plazo. No se añadió Redis ni servicio de pago.
- El lobby aún realiza una consulta de participantes por sala y no está paginado. EntityGraph evita la consulta adicional por cada usuario, pero conviene medir cuentas con muchas salas.
- La cola personal Web sigue en localStorage y Mobile en SecureStore. Borrar datos del navegador/app o agotar almacenamiento puede perder pendientes. Dos pestañas del Focus Studio Web aún pueden sobrescribir su estado local compartido; el servidor sí deduplica UUID. Una cola duradera por registro y coordinación entre pestañas requiere trabajo adicional.
- Las sesiones Focus pendientes se fechan cuando se confirman en el servidor, como antes; estudiar offline y sincronizar otro día desplaza esas estadísticas al día de sincronización.
- Se conserva lógica de timer/reloj equivalente en ambos proyectos, con pruebas espejo. No se introdujo un paquete compartido que altere la resolución de módulos Expo/Vite; es deuda de mantenimiento explícita.
- Probar dos teléfonos y dos navegadores: pérdida/retorno de red, suspensión prolongada, renovación JWT, rotación de código mientras alguien se une, transferencia/salida simultánea y cierre de sala durante heartbeat.
- Verificar VoiceOver/TalkBack, tamaños de texto grandes, anchuras pequeñas y audio con llamadas/interrupciones. La compilación y las pruebas de funciones no validan esa experiencia visual o nativa.
- Réplicas del backend deben mantener sus relojes sincronizados. La tarea persiste finalizaciones solo mientras alguna instancia del servidor está activa.

## Validación

Se ejecutan lint/build Web, lint/TypeScript Mobile, todas las suites Node de ambos proyectos y Maven con PostgreSQL 17 aislado, incluyendo la suite de integración opt-in existente. Las nuevas pruebas cubren permisos, transferencia, código revocado, cupo concurrente de 12, reintentos Focus concurrentes, expiración persistida, START idempotente, versión obsoleta, heartbeat neutral, 429, respuestas fuera de orden y cola de más de 100 sesiones.

Los resultados definitivos y el estado de CI se registran en el Pull Request. No se realizó merge ni despliegue.
