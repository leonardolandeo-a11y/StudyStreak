# Etapa 8.2 — Dashboard personalizable

Rama `feat/ui-ux-web-mobile`. El usuario aprobó explícitamente Web 8.1c y Mobile 8.1d antes de comenzar. Se registraron por separado: **`52ddaa9`** (Web) y **`238a823`** (Mobile). No se mezclaron esos cambios con widgets ni con los 16 elementos ajenos.

## Comportamiento

El hero aprobado permanece fijo, con las mismas ilustraciones y variantes horarias. **Customize Dashboard** abre un panel integrado con interruptores de visibilidad, botones accesibles de subir/bajar y restauración predeterminada. La cuadrícula real situada debajo es la vista previa: los cambios se aplican y guardan automáticamente, sin duplicar componentes de preview ni peticiones. Done customizing cierra el panel sin deshacer la distribución.

| Widget | Datos y acciones conservados |
| --- | --- |
| Focus Summary | Minutos y sesiones de `verifiedPeriod`; promedio diario calculado sobre los 7/30 días completos. |
| Study Streak | Racha registrada real con aclaración histórica; la mejor racha sigue en los detalles de Journey. |
| Study Activity | Gráfico verificado, 7/30, barras/líneas, valores diarios, refresh/retry y estados existentes. |
| Active Goals | Servicio y tarjetas actuales, targets reales y navegación a detalle/registros. |
| Study Journey | Totales guardados, distinción verificado/histórico, Activity/Goals/Together/History y calendario mensual. |
| Recent Activity | Historial existente, tiempos guardados, fuente/estado y fechas locales. |
| Study Partners | Hasta tres identidades de vínculos ACCEPTED en la primera página, avatares protegidos y acceso a perfil/Tracking. |
| Quick Focus | Acceso a Focus Studio; no crea ni inicia una sesión automáticamente. |

Los ocho widgets están disponibles y visibles inicialmente; cada cuenta puede ocultarlos todos sin perder acceso a Customize Dashboard. Los widgets ocultos conservan su posición relativa en la configuración. Al mostrarlos vuelven al lugar guardado. La vista no personaliza el hero ni añade destinos, recompensas, XP o progresos ficticios.

El calendario Web pasó del bloque exterior a los detalles existentes de Study Journey, igual que en Mobile. Sigue mostrando exclusivamente los días registrados disponibles y no se duplica. No hay un noveno widget ni una nueva semántica de datos.

## Datos, rendimiento y permisos

Se conserva **un único snapshot de estadísticas por período en cada Dashboard**. Focus Summary, Study Streak, Study Activity y Journey lo comparten. Reordenar no cambia las claves de los componentes ni vuelve a consultar las estadísticas. Las preferencias se hidratan antes de montar los widgets de datos; no se descargan metas/compañeros ocultos inicialmente. Ocultar y volver a mostrar un widget con servicio propio puede volver a cargar su snapshot para tener datos actuales.

Servicios/endpoints reutilizados, sin contratos nuevos:

- `/api/focus-sessions/stats`.
- Servicios actuales de metas activas y `/api/study/history`.
- `/api/tracking-links/active` y sistema existente de avatares protegidos.
- Navegación actual a `/api/users/{id}/profile` a través de la pantalla de perfil autorizado.

Study Partners es un resumen de la primera página; no afirma mostrar todas las conexiones ni calcula un total de usuarios online. Sólo acepta relaciones ACCEPTED de la cuenta actual, excluye solicitudes pendientes y vínculos ajenos. El nombre procede de Tracking; no se consulta un perfil por usuario sólo para mostrarlo. No infiere presencia, no añade polling de presencia ni heartbeats y no duplica la administración del panel social. Tracking permite consultar y administrar el resto de vínculos. Los permisos del perfil siguen en el backend; una relación revocada puede dar 403/404 al abrirlo y nunca se eluden esos controles.

Web reutiliza TrackingAvatarProvider/TrackingAvatar y libera Object URLs al desmontar. Mobile reutiliza SocialAvatar y SocialDirectory, con caché, revocaciones y archivos temporales por cuenta ya existentes. Una imagen denegada/no disponible mantiene el fallback. No se modificaron esos mecanismos.

## Persistencia e aislamiento

Clave por cuenta: `studystreak-dashboard-v1-<userId>`. El valor contiene exclusivamente un array de `{ id, visible }`; el orden del array es el orden de los widgets. No contiene tokens, nombres, imágenes, datos sociales, métricas, temas o preferencias de Focus.

- Web: localStorage.
- Mobile nativo: archivos documentales `dashboard-layouts/<clave>.json`, usando el patrón de expo-file-system ya instalado; escritura temporal y movimiento con reemplazo.
- React Native Web: localStorage para la previsualización.

Cada Dashboard está montado con la clave de cuenta existente. Su store captura una única clave/ruta, serializa escrituras y no aplica una lectura tardía por encima de una edición reciente. Cerrar sesión desmonta esa instancia; los layouts de las otras cuentas siguen separados. No se borra la preferencia válida al cerrar sesión, por lo que vuelve al entrar en la misma cuenta.

La normalización descarta IDs desconocidos, duplicados y campos adicionales, conserva el orden/visibilidad válidos y añade al final los widgets conocidos ausentes de configuraciones antiguas. JSON malformado u otro formato usa la distribución predeterminada. No se escribe automáticamente sobre una lectura inválida. Errores de lectura/escritura son explícitos; el layout sigue funcionando temporalmente y Retry layout permite reintentar el guardado.

Los dos frontends conservan su arquitectura de compilación independiente. Comparten el mismo contrato puro de preferencias, mantenido en archivos equivalentes con una prueba que verifica su igualdad; los adaptadores de almacenamiento y controles son propios de cada plataforma. No hay dependencias nuevas ni otro proveedor de apariencia.

## Diseño y accesibilidad

- Web: cuadrícula adaptable de una a tres columnas. Summary, Activity y Journey pueden ocupar dos columnas en escritorio. El orden DOM coincide con el visual y el de lectura, sin empaquetado denso que lo altere.
- Mobile: flujo vertical y dos columnas para widgets compactos cuando hay ancho suficiente; se conservan Screen/SafeArea, scroll, drawer y navegación existentes.
- Tarjetas lavanda y sprites originales existentes; hero y superficies aprobadas conservados.
- Controles de 44–48 px, labels explícitos, límites de orden deshabilitados y anuncios de cambios. El reordenamiento no depende de arrastrar.
- Web anima el cambio de posición durante 220 ms; Mobile usa una transición de opacidad de 220 ms. No hay animaciones continuas dentro de los widgets. Se respeta Reduce Motion global/sistema.

No se cambiaron Focus Studio, Login/Register, UUID, audio, Pomodoro, outbox, ledger, Goals Difficulty, autenticación, backend, PostgreSQL o infraestructura.

## Capturas antes/después

Chrome headless con API interceptada y cuentas sintéticas. **No son datos reales ni una prueba de Android físico.** Las capturas aprobadas de 8.1c/8.1d permanecen intactas.

| Vista | Antes aprobado | Después |
| --- | --- | --- |
| Web escritorio | [8.1c](images/academia-pixel-viva-8-1c/after-web-dashboard-1440.png) | [1440](images/academia-pixel-viva-8-2/web-default-1440.png) |
| Web estrecho | [8.1c](images/academia-pixel-viva-8-1c/after-web-dashboard-390.png) | [390](images/academia-pixel-viva-8-2/web-default-390.png), [320](images/academia-pixel-viva-8-2/web-default-320.png) |
| Mobile | [8.1d](images/academia-pixel-viva-8-1d/dashboard-390.png) | [390](images/academia-pixel-viva-8-2/mobile-default-390.png), [320](images/academia-pixel-viva-8-2/mobile-default-320.png) |
| Tablet | [8.1d](images/academia-pixel-viva-8-1d/dashboard-768.png) | [Mobile 768](images/academia-pixel-viva-8-2/mobile-default-768.png), [Web 768](images/academia-pixel-viva-8-2/web-default-768.png) |

Personalización: [panel Web](images/academia-pixel-viva-8-2/web-customize.png), [resultado Web](images/academia-pixel-viva-8-2/web-customized-390.png), [panel Mobile](images/academia-pixel-viva-8-2/mobile-customize.png), [resultado Mobile](images/academia-pixel-viva-8-2/mobile-customized-390.png). Apariencia: [Web Light/Orange](images/academia-pixel-viva-8-2/web-light-orange.png), [Mobile Light/Purple](images/academia-pixel-viva-8-2/mobile-light-purple.png).

## Pruebas

Logs ignorados en `.local/stage82/`:

- ESLint Web y Mobile: aprobado (`web-lint.log`, `mobile-lint.log`).
- TypeScript Web mediante build y Mobile mediante `tsc --noEmit`: aprobado.
- Build Web: aprobado (`web-build.log`). Sigue la advertencia previa del chunk Study Rooms superior a 500 kB, ajeno a esta etapa.
- Expo export Android/iOS/Web: aprobado (`mobile-export.log`), sin instalar módulos.
- Web: 17 tests aprobados de preferencias, renderizado/métricas e aislamiento del cliente autenticado (`web-tests.log`).
- Mobile: cinco archivos dirigidos aprobados: preferencias, almacenamiento documental aislado, renderizado Dashboard, sesión y StudyPartnersSession (`mobile-tests.log`). Renderizado adicional final verifica Summary/Streak/Activity independientes en las ocho combinaciones Dark/Light y paleta (`mobile-rendering-final.log`).
- Los modelos comprueban JSON corrupto/antiguo/parcial, IDs desconocidos/duplicados, campos privados descartados, movimientos límite, ocultar todo/restaurar, separación entre cuentas, recarga con una nueva instancia, escrituras serializadas, lectura tardía y error/reintento de persistencia.
- Chrome Web y React Native Web: mostrar/ocultar, reordenar con preview, recargar, restaurar, alternar entre cuentas 101/202/101, configuración inválida, gráficos, temas y Reduce Motion. Las cuentas son sólo fixtures y todas las peticiones quedan interceptadas. Se comprueban vínculos ACCEPTED/PENDING/ajenos y fallback con 403 de avatar. Los cambios de orden no generan nuevas peticiones de estadísticas. Logs `web-browser.log` y `mobile-browser.log`.
- Responsive: 320/390/768/1440 en Web y 320/390/768 en React Native Web, sin overflow horizontal de página. Inspección de las capturas de composición y controles.
- Regresión Chrome adicional de hero y Focus: aprobada (`environment-regression.log`); capturas generadas exclusivamente en `.local/stage82/environment-regression/`.
- `git diff --check` y hashes de los 16 elementos ajenos: verificados antes del staging.

La prueba SSR se adaptó a la hidratación de preferencias: antes de ella se muestra el acceso a personalización y todavía no se montan los widgets de datos. Los tests anteriores de calendario/hero se adaptaron a la nueva cuadrícula; sus nuevas capturas de regresión se dirigen a `.local/stage82/` para no sobrescribir las aprobadas.

## Límites y verificación física pendiente

No se ejecutó Android físico. En Expo Go falta comprobar: reordenamiento táctil/lector de pantalla, cierre y reapertura para confirmar persistencia documental real, salida/entrada con dos cuentas autorizadas, tema System del dispositivo y Reduce Motion. Las pruebas de archivos usan mocks y la exportación valida el bundle; no sustituyen esas interacciones.

El resumen de compañeros muestra hasta tres conexiones de la primera página y usa username; para ver más compañeros o su presencia se mantiene el panel social existente. No hay un nuevo endpoint agregado ni sincronización de layout entre dispositivos. El layout es local a cada instalación/navegador, como se solicitó.

## Archivos y registro

- Web: `src/pages/Dashboard.tsx`, `src/components/dashboard/{DashboardMetrics,CustomizeDashboard,DashboardPartners}.tsx`, `cozy-dashboard.css`, `src/hooks/useDashboardWidgets.ts`, `src/features/dashboard/widgetPreferences.ts`.
- Mobile: `src/app/(app)/(main)/dashboard.tsx`, `src/components/dashboard/{DashboardActivity,CustomizeDashboard,DashboardPartners}.tsx`, `src/hooks/useDashboardWidgets.ts`, `src/features/dashboard/widgetPreferences.ts`, `src/services/dashboardWidgetStorage.ts`.
- Tests de ambas plataformas: `dashboardWidgets.test.mjs`, `dashboardWidgets.browser.mjs`; Web `dashboardRendering.test.mjs`, `helpers/panoramicReview.mjs`; Mobile `dashboardWidgetStorage.test.mjs`, `dashboardRendering.test.mjs`.
- Revisión Chrome compartida: `scripts/tests/dashboardWidgetsReview.mjs`.
- Este documento y `docs/images/academia-pixel-viva-8-2/`.

Commit local de esta etapa: **`feat(dashboard): add customizable study widgets`**. El hash se entrega en el informe final y se obtiene de forma inequívoca con `git log -1 --format=%h -- docs/academia-pixel-viva-etapa-8-2.md`.

Se preservan los 16 elementos ajenos y los antecedentes válidos no registrados de 8.1b. Sin push, merge, amend, reset o clean. La etapa termina aquí; no se comienza 8.3 ni nuevos ambientes.
