# Dashboard web — Etapa 2

El Dashboard utiliza los tokens oscuros/menta de la Etapa 1. No modifica Focus
Studio, Settings, Profile, navegación compartida, autenticación ni mobile.

## Datos y presentación

- `GET /api/focus-sessions/stats?days=7|30`: gráfico, minutos y sesiones utilizan
  exclusivamente `verifiedPeriod`. El promedio diario es `minutes / days`,
  incluidos los días sin actividad. No reutiliza `averageMinutes` ni `daily`.
- `studyStreak` conserva su semántica: días completos de estudio, incluidas las
  estimaciones históricas. La tarjeta lo explica y no depende del periodo.
- Los buckets del servidor se muestran como fechas de calendario, sin convertir
  sus medianoches a la zona horaria del navegador. La zona de la cuenta aparece
  junto al intervalo. Hay tabla diaria accesible con los 7/30 días.
- Se rechazan reportes incompletos, negativos, no finitos, con fechas repetidas o
  totales inconsistentes. Un backend anterior sin `verifiedPeriod` muestra un
  aviso de indisponibilidad; no se presentan datos históricos como verificados.
- Metas: reutiliza el servicio paginado de metas activas; presenta hasta tres y
  enlaza a sus detalles y registros. Frecuencia/duración son objetivos planeados,
  no porcentajes de progreso inventados.
- Actividad reciente: hasta cuatro intentos de la primera página de
  `/api/study/history`, ordenados por inicio por el backend. Puede mostrar
  completados, cancelados y estimaciones con etiquetas explícitas. Se indica que
  este historial filtra por inicio, mientras el gráfico atribuye por finalización.
  **Nunca se usa este historial paginado para calcular totales del gráfico.**
- Se eliminó por completo Keep your momentum, sin otra cuadrícula de navegación.
  Se conserva Start focusing en el encabezado y los accesos existentes del
  sidebar. Cada meta enlaza a sus registros; el historial completo existente se
  consulta en Focus Studio → estadísticas → History.

La tabla puede expandirse con teclado. Los filtros usan `aria-pressed`; cambiar
periodo conserva el foco y el tipo de gráfico. Los requests se cancelan al
cambiar de periodo/usuario o salir, y cada respuesta queda asociada a su loader.
No se muestra el snapshot anterior como si correspondiera al nuevo periodo.
Actualizar se hace con el icono **Refresh progress**, de 44 × 44 px, junto a los
filtros del gráfico. Mantiene el mismo callback, nombre accesible y tooltip; al
cargar queda deshabilitado, con `aria-busy` y un icono animado que respeta
movimiento reducido. No se añadió polling. Los fallos tienen acción de reintento
y no se representan como ceros. La animación del gráfico está deshabilitada,
también con movimiento reducido.

En escritorio el gráfico ocupa aproximadamente 62 % y las métricas 38 % de la
fila. En pantallas menores se apilan. No hay tarjeta Account redundante; se
conservan el menú de usuario, salida y notificaciones de la aplicación.

## Dependencia

Se añadió **Recharts 3.10.1**, compatible con React 19, con sus dependencias
transitivas, fijadas en `frontend-web/package-lock.json`. No se instaló shadcn/ui
ni ninguna otra biblioteca de componentes. No se actualizaron las versiones de
paquetes preexistentes. Se conservaron los metadatos libc del lockfile anterior.

`npm install` informó 11 vulnerabilidades transitivas (10 moderadas, 1 alta).
`npm audit --json` falló en el servicio del registro con HTTP 400; se compararon
ambos lockfiles usando el endpoint oficial de avisos bulk de npm. Los paquetes
con avisos son los mismos antes/después: `follow-redirects` (alta) y `minimatch`
(moderada). No aparecieron paquetes nuevos afectados. No se aplicaron arreglos
forzados ni actualizaciones ajenas a esta etapa.

## Ejecutar y verificar

Con el backend local actualizado en `http://localhost:8080` y el entorno de
desarrollo existente, el frontend mantiene su `.env.local` apuntando a esa URL:

```bash
cd frontend-web
npm ci
npm run dev
```

Abrir `http://localhost:5173`, iniciar sesión y entrar en Dashboard. La interfaz
no incluye datos de demostración. Para verificar los gráficos se necesitan
sesiones completadas y verificadas de esa cuenta. Una cuenta sin ellas muestra
el estado vacío con acceso a Focus Studio.

Comprobaciones automatizadas desde `frontend-web`:

```bash
npm run lint
npx tsc -b
npm run build
npm run test:web
```

Resultado: TypeScript, ESLint y build correctos; **76 tests web pasan** (58 de
lógica y 18 de renderizado/sistema visual), sin omitidos. La suite incluye
regresión de foco real con Chrome cuando está instalado. Los nuevos tests
verifican separación de históricos, precisión, ventanas y fechas, contrato
antiguo sin bloque, reportes inconsistentes, estados loading/error/empty,
promedio diario, definición de racha, tabla y rutas existentes. Las regresiones
de distribución comprueban la ausencia de la navegación redundante, el nombre
y estado accesibles de Refresh y los estados independientes de actividad reciente.

El build del Dashboard es aproximadamente 405 kB / 116 kB gzip, cargado por la
ruta lazy existente. Permanece el aviso previo de chunk grande de StudyRoomsPage
(~564 kB); no se modificó esa pantalla.

## Integración y evidencia visual local

Se probó el jar construido contra PostgreSQL **desechable**, base
`studystreak_schema_check`, puerto `55436`, sin volumen persistente. No se
crearon fixtures en `studystreak_local`. La suite backend pasó **185 tests**,
incluidos 11 nuevos para el contrato aditivo; ver
[la auditoría de datos](dashboard-etapa-2-datos.md).

Un backend temporal en `18083` y Vite en `5177` permitieron comprobar la ruta
Dashboard con JWT real y respuestas reales. Las sesiones sintéticas se
almacenaron solo en la base desechable; no se interceptaron respuestas del
frontend. Resultados HTTP:

| Comprobación | Resultado |
|---|---|
| Registro / login | 201 / 200 |
| Refresh / logout | 200 / 204 |
| Stats 7 días | 200, 165 min, 5 sesiones verificadas |
| Stats 30 días | 200, 210 min, 6 sesiones verificadas |
| Históricos | 90 min excluidos del bloque nuevo; campos anteriores los conservan |
| Cuenta vacía | 0 reales, todos los días presentes, UI vacía correcta |

Chrome headless verificó 320, 390, 768, 1024 y 1440 px sin overflow horizontal;
barras/líneas; cambio 7/30 con Enter; cambios rápidos con latencia; desconexión y
reintento; navegación a Goals, registros y Validations; ausencia de excepciones
JavaScript; tabla de 30 días; movimiento reducido. Se verificaron 18 controles
con foco computado de 2 px sólido y contraste mínimo de texto muestreado **6.72:1**.

Capturas e informes están en `.local/ui-stage2/` (ignorados por Git):

- `dashboard-1440.png`, `dashboard-1024.png`, `dashboard-768.png`,
  `dashboard-390.png`, `dashboard-320.png`.
- `dashboard-lines-30.png`, `dashboard-empty-390.png`.
- `api-results.json`, `browser-results.json`, `accessibility-results.json`.

### Revisión de distribución

Se repitió la revisión de Chrome con los ajustes compactos, en los mismos cinco
tamaños. Se conservaron filtros, barras/líneas y foco con teclado. Se verificaron
el refresh durante carga (44 px, disabled, aria-busy, tooltip) y el movimiento
reducido. Se provocaron fallos de red de estadísticas y, por separado, del
historial: ambos muestran su error y se recuperan al reintentar; ninguno muestra
un cero o una lista vacía ficticios.

No hay alturas mínimas reservadas para carga, error o ausencia de sesiones. Con
datos, el área del gráfico conserva 256 px / 288 px según el breakpoint. En
escritorio, el panel completo midió 588 px con datos, 317 px en error y 409 px
vacío; actividad reciente sin registros midió 126 px. Con cuatro intentos reales
del entorno desechable, sus filas compactas conservan tiempo, fuente, estado y
fecha local. El historial se puede consultar aunque falte `verifiedPeriod`,
utilizando solo las fechas del periodo del reporte, nunca para calcular totales.

En el escenario de escritorio de 1440 px, la altura de página pasó de 1775 a
1219 px; a 390 px, de 3273 a 2450 px. El gráfico sigue a la izquierda y las
métricas a la derecha en escritorio; en tablet/móvil se apilan. No se instalaron
dependencias ni se cambió el backend durante estos ajustes.

Evidencia actualizada, también ignorada por Git:

- `compact-dashboard-{1440,1024,768,390,320}.png`.
- `compact-dashboard-lines-30.png`, `compact-dashboard-error-1440.png`,
  `compact-dashboard-empty-390.png`.
- `compact-browser-results.json`, `compact-accessibility-results.json`.

Los archivos de sesión de pruebas se mantienen ignorados y con permisos 0600;
no deben adjuntarse ni publicarse. Para repetir el recorrido con cuentas reales,
usar únicamente una base desechable y su propio backend temporal.

## Backend habitual durante esta revisión

Se guardó el jar anterior en
`.local/ui-stage2/backend-before-dashboard.jar` y se cargó el jar validado en el
mismo contenedor local `studystreak-local-app-1`, sin eliminarlo ni recrearlo.
Respondió en `localhost:8080` (401 al endpoint protegido sin JWT, como corresponde).
Se comprobó que el jar coincide por SHA-256 y que la configuración externa
permanece idéntica: Hibernate `validate`, SQL init `never`, migración del ledger
deshabilitada y esquema `public`. No se ejecutaron pruebas con escrituras contra
la base persistente. No se modificaron Compose ni archivos `.env.local`.

Esta copia del jar es el estado de ejecución local actual; una futura
reconstrucción del contenedor debe usar esta rama para incluir ambos commits.
No requiere migración adicional. Se mantienen disponibles el jar anterior y el
respaldo de base de datos preexistente, sin tocarlos.
