# Etapa 6.5a — Goals, Daily Records, Tracking y Validations Mobile

Referencia: `auditoria-paridad-web-mobile.md`, implementación Web y contratos existentes. Alcance exclusivo de React Native; no hay cambios de backend, Web, dependencias ni migraciones.

## Paridad completada

- **Goals:** se conserva CRUD, estado completed, paginación y botón + contextual. La edición y confirmación de eliminación usan el modal nativo reutilizable; la lista no contiene formularios. Lista, detalle, rachas y resumen de sesiones consumen los tokens globales. Se mantienen las rutas con `goalId` hacia Focus Studio y la búsqueda de Resources con `topic`.
- **Tags:** nueva pantalla desde Manage tags, con GET/POST `/users/{userId}/goals/{goalId}/tags`, PATCH/DELETE `/{tagId}`. Usa cliente autenticado, páginas de diez, validación de nombre obligatorio de hasta 50 caracteres, loading/empty/error/retry y confirmación antes de desvincular. El backend decide propiedad y permisos. Se advierte que renombrar una etiqueta compartida puede afectar otras metas. Eliminar desvincula esta meta; no se simula una eliminación global.
- **Daily Records:** se conserva CRUD y fecha asignada por servidor (la fecha original sigue siendo de solo lectura). Crear/editar usa modal separado; eliminar exige confirmación. Tarjetas compactas muestran nota y disponibilidad real de evidencias. Manage evidence despliega los controles existentes de foto/voz y evita descargar automáticamente evidencias de toda la página. View record permite leer la nota completa y evidencias guardadas.
- **Evidencias:** se conserva multipart autenticado (`photo`, JPEG; `audio`, audio/mp4), captura, grabación, validación y límite existente de 2 MiB. Las descargas aceptan cancelación al perder foco; comprueban tamaño real y revisión de sesión antes/después de escribir, eliminando archivos temporales si se cancela o cambia la cuenta. Los reproductores y su limpieza siguen siendo los existentes. No se usan Object URLs.
- **Tracking:** búsqueda con debounce, selección y envío, pendientes/accept/reject, activos, historial y eliminación con confirmación siguen intactos. Se mantienen paginación, avatares compartidos con Study Partners y enlaces sociales sujetos a autorización. Se compactan tarjetas y acciones; Refresh tiene área táctil de 48 px y nombre accesible por sección.
- **Validations:** se conserva el recorrido compañero → meta → registro → evidencia → decisión, creación/actualización y comentarios. Se mantienen avatares, enlaces sociales, IDs, Back interno del flujo y retorno desde Notifications. Se eliminan superficies anidadas del editor y se compactan los pasos sin cambiar permisos ni reglas de aprobación.

## Integridad conservada

No se altera la semántica de rachas: días consecutivos con registros aprobados. El progreso sigue comparando racha actual con mejor racha; no se usa para inventar progreso temporal de una meta. El resumen por meta sigue mostrando las sesiones guardadas del endpoint `/api/goals/{id}/focus-sessions/summary`, sin reinterpretarlas como `verifiedPeriod` del Dashboard. Se conserva la renovación JWT/SecureStore de 6.2a, el aislamiento de cuentas y los proveedores sociales existentes. El reintento manual del resumen conserva una dependencia observable bajo React Compiler.

Los botones compactos conservan 48 px mínimos, foco visible y estados deshabilitados/loading. Las nuevas superficies usan Dark/Light/System y las cuatro paletas. No se añaden animaciones; los modales siguen la preferencia de movimiento reducido existente. El Back nativo evita enlaces Back duplicados en detalles.

## Verificación automatizada aislada

- ESLint y TypeScript (`tsc --noEmit`).
- Suite Mobile completa: 30 archivos `tests/*.test.mjs`, incluidos seis escenarios nuevos en `goalsParity.test.mjs`: CRUD/contratos de tags, validación, aislamiento de cuenta, permisos, descarga/cancelación/límites/limpieza y multipart de foto/voz.
- Exportación Expo offline para web y Android, sin instalar dependencias ni ejecutar build nativo.
- Chrome headless contra exportación web de Expo, con todas las peticiones externas interceptadas: `mobileGoalsParity.browser.mjs` comprueba edición/eliminación de metas, CRUD de registros, fecha inmutable, controles de evidencias bajo demanda, CRUD/cancelación/retry de etiquetas, Back, reintento del resumen y anchos 320/390/768/1440.
- Regresiones Chrome: `mobilePolish.browser.mjs` (creación, validación y Notifications/Back, movimiento reducido), `mobileSocial.browser.mjs` (búsqueda/Tracking/avatares/permisos/revocación/temas/cuentas), `mobileFocus.browser.mjs` (integración Focus).
- Inspección de imágenes generadas por Chrome de detalle de meta y etiquetas. Ninguna prueba escribe en PostgreSQL persistente.

## Pendiente en Expo Go real

No se ha operado el teléfono desde estas herramientas. Chrome/React Native Web y mocks no acreditan comportamiento físico de Android/iOS. Comprobar:

1. En Menu → Goals, crear/editar/cancelar una meta de prueba, abrir tags, renombrar y desvincular; verificar confirmaciones y Back sin perder la pestaña.
2. Crear/editar un registro; confirmar que la fecha es informativa. Abrir Manage evidence; permitir/denegar cámara y micrófono, cancelar captura/grabación, subir/reemplazar/eliminar una imagen y audio de prueba. Reproducir/pausar y salir mientras carga o reproduce; volver sin audio residual.
3. Con cuentas de prueba autorizadas, recorrer Validations hasta decisión y actualización; entrar también desde una notificación. Comprobar evidencia con foto/voz y errores de permisos sin accesos alternativos.
4. Revisar Tracking con varias páginas, búsqueda rápida, solicitud, aceptar/rechazar y revocar. Confirmar fallback de avatar y perfil restringido; no modificar relaciones reales para generar estos escenarios.
5. Abrir Focus desde una meta y Resources desde su tema, regresar con Back. Comprobar rachas y totales reales sin mezclar datos históricos con métricas verificadas del Dashboard.
6. Cambiar Dark/Light/System y las cuatro paletas; revisar campos con teclado Android abierto, pantallas pequeñas, lector de pantalla, foco externo y Reduce Motion. Cerrar sesión/cambiar cuenta durante carga de evidencia y comprobar que no aparece información de la cuenta anterior.

No se comienza 6.5b ni el rediseño retro.
