# Etapa 7.3a — Dashboard y Focus Studio

Rama: `feat/ui-ux-web-mobile`. Base: `1eb2a49`. Se extiende la identidad Retro Pixel Academia de 7.1/7.2 sólo a Dashboard y Focus Studio Web/Mobile. Se conservaron los 16 elementos ajenos encontrados al empezar, sin staging inicial ni trabajo de esta etapa pendiente de otra sesión.

## Dashboard Web

- Encabezado académico con libro pixelado, acento monoespaciado pequeño y divisor de 7.1. El título y la lectura principal conservan tipografía de sistema.
- Tarjetas de métricas con esquina escalonada, borde fino, radio de 8 px y sombra desplazada 2 px. Se conserva la columna de tarjetas complementarias a la derecha en escritorio.
- Gráfico protagonista con barras de radio más discreto y los mismos ejes, tabla accesible, 7/30 y barras/líneas.
- Indicador segmentado de **días activos del período**, calculado como antes con `period.daily.filter(day => day.minutes > 0).length`. No representa puntos, XP ni progreso inventado de metas. Mantiene etiqueta y valor accesible.
- Metas con pequeño libro y estados vacíos de actividad/metas con ilustración compacta. Se conservan targets, registros, enlaces, actividad reciente y todos los textos sobre verificación.

No se cambia `verifiedActivity`, `verifiedPeriod`, el endpoint ni el origen de minutos. El test utiliza `totalMinutes/periodMinutes=99999` como señuelo y verifica que no se muestran como tiempo verificado. La racha histórica conserva su aclaración y separación respecto del período.

## Dashboard Mobile

Mantiene gráfico primero, filtros compactos, métricas apiladas y navegación existente. Se aplican encabezado académico, superficies compactas, iconos estadísticos pixelados y barra de días activos, adaptados a View/Text nativos. Los estados vacíos llevan un libro pequeño; los detalles de metas conservan destino y comportamiento. No se copia la cuadrícula de escritorio.

## Focus Studio Web

- Encabezado con la taza original de 7.1, firma de espacio de concentración y separador.
- Pomodoro circular central con doce marcadores decorativos pequeños, una superficie suave y numeración monoespaciada con sombra mínima. El anillo sigue usando exactamente el progreso original.
- Start/Pause/Resume/Reset mantienen manejadores y estados. El engranaje existente se ubica al costado derecho de la cabecera del temporizador y abre el mismo diálogo. No se añade otra configuración.
- Now Playing permanece debajo; metas y volumen siguen en las herramientas de sesión. Carrusel de los doce soundscapes con esquinas discretas y superficie seleccionada existente. No se cambian categorías, pistas, descripciones ni arte identificativo por sonido.
- Se conservan indicadores de ciclos, estadísticas, vínculo a Study Rooms y sus reglas de registro.

## Focus Studio Mobile

Pomodoro centrado, diámetro adaptable (máximo 230), dimensiones idénticas y radio mitad del diámetro. Borde fino, marcadores interiores y estado activo mediante acento. Se conserva engranaje real y controles táctiles de 48 px. Now Playing y meta vinculada permanecen después; tarjetas y portadas incorporan detalles compactos, sin escenas grandes. El indicador de progreso usa el mismo porcentaje ya calculado por la pantalla.

La ruta sólo incorpora el encabezado y reemplaza la presentación de Card por AcademicPanel. Los efectos, outbox, temporizadores, UUID, sincronización, audio y controladores de la ruta no se modifican.

## Reutilización, temas y accesibilidad

Fuente única para cuatro detalles originales (`book`, `chart`, `spark`, `lamp`): `assets/academic/glyphs.json`, retícula 24×24. Se reutilizan StudyMark y PixelRule de 7.1; no se carga ni duplica la habitación fullscreen de autenticación.

```bash
node scripts/generate-academic.mjs
node scripts/generate-academic.mjs --check
```

El generador valida límites/roles y produce las copias `components/academic/glyphs.ts` idénticas. Editar el JSON, no las copias. Las representaciones se adaptan a SVG en Web y View nativos en Mobile.

Componentes compartidos por módulo/plataforma: **AcademicHeading, PixelGlyph, AcademicEmpty, PixelProgress**; Mobile añade **AcademicPanel**. Los tokens y proveedores existentes resuelven color de texto, superficie, acento y borde. No se cambian tokens globales ni se introduce otro proveedor. Los decorativos no reciben foco ni etiquetas individuales.

El CSS Web está acotado a `academic-page` para los controles/superficies de estas páginas. Los controles mantienen foco visible y nombres anteriores. Native conserva NavigationPressable y sus estados accesibles. El progreso nativo expone tanto accessibilityValue como los alias ARIA soportados por las versiones instaladas: React Native Web no traducía el objeto accessibilityValue a aria-valuenow. Los recorridos comprueban los valores reales (1 día activo y 0 % al reset), además del renderizado aislado de 25 %.

## Movimiento y rendimiento

- Web: transiciones de 220 ms en controles/selección y 250 ms en indicadores. Se conservan las microinteracciones/carousel existentes; no se introduce animación automática de ilustraciones.
- Mobile: el nuevo relleno segmentado interpola escala horizontal durante 250 ms con Animated/native driver y `isInteraction:false`. No cambia estado React por frame ni añade timers/intervalos.
- La interpolación se detiene al perder foco, ir a background o desmontarse. Con Reduce Motion global/sistema, memoria conocida <=3 GiB o memoryWarning se aplica directamente el valor final. La limpieza de suscripciones tolera plataformas sin memoryWarning.
- Web desactiva las transiciones del ámbito académico por preferencia global o media query. No hay vapor continuo, fondos animados ni bucles nuevos en estas pantallas; no quedan trabajos ambientales para el background.
- Sin PixiJS, Skia, fuentes externas, nuevos paquetes o cambios de lockfile. Se generan sólo pequeños vectores locales. El build mantiene tamaños comparables: Focus Studio ~78,93 kB JS minificado; Dashboard ~403,24 kB, incluyendo su gráfica existente. No son mediciones de FPS ni consumo en teléfono.

## Integridad conservada

No se modificaron servicios, algoritmos o contratos de datos; autenticación/JWT/refresh, navegación, modelos Pomodoro, UUID, outbox, idempotencia, acreditación del servidor, metas vinculadas y ciclo de audio permanecen. `noiseSynthesis.ts` y la corrección `456af2a` no cambian. No se modifican otros módulos, backend, PostgreSQL, infraestructura, dependencias ni archivos privados.

La única nueva derivación visual es la representación segmentada del mismo conteo de días activos que ya figuraba en el gráfico. No se deducen minutos de historiales paginados ni se presentan metas planificadas como actividad cumplida.

## Verificación realizada

- Generador `--check`, igualdad de copias gráficas y `git diff --check`: aprobados.
- ESLint y TypeScript Web/Mobile: aprobados; `tsc -b` también se ejecuta en build Web.
- Build Web: aprobado. Persiste E-05, advertencia conocida de chunk Study Rooms >500 kB, ajeno a esta etapa.
- Expo export web y Android: aprobadas, sin compilación nativa.
- Web: **17 tests UI** aprobados en academic, dashboardRendering y focusStudioRendering; **4 archivos de regresiones lógicas** aprobados (pomodoroState, pomodoroGoalTracking, studyActivity, noiseSynthesis). Incluyen continuidad numérica, controles, diálogos/foco, carrusel y categorías, datos verificados, estados vacíos/error y responsive.
- Mobile: **10 archivos distintos** aprobados entre regresiones de Dashboard/Focus/audio/sesión/outbox/UUID y renderizado académico. Los tres archivos UI se ejecutaron después de los últimos ajustes del indicador.
- Dos recorridos Chrome de la exportación React Native Web: Dashboard y Focus, con API simulada. Verifican 7/30, barras/líneas, metas paginadas, errores/retry, ausencia de verifiedPeriod, selección de meta, Start/Pause/Resume, un único identificador de sesión al navegar, reset/cancelación y permisos de edición del intervalo. No se escriben datos en PostgreSQL.
- Matriz visual Web en 320/390/768/1440/1920 y Dark/Light/System × cuatro paletas. Se comprueba ausencia de overflow, un título principal, círculo cuadrado y cero animaciones en ejecución con Reduce Motion.
- Matriz React Native Web en los mismos anchos; captura adicional de cada modo y paleta a 390. Se verifica respuesta a cambio de tema del sistema mientras System está seleccionado, forma circular, foco y navegación por teclado. Fuente/teclado físicos no quedan acreditados por ese recorrido.

Se inspeccionaron capturas reales, no sólo snapshots de JSX:

- `/tmp/73a-{dashboard,focus-studio}-{320,390,768,1440,1920}-light.png`, y sus vistas `-dark.png` de escritorio.
- `frontend-mobile/.expo/73a-{dashboard,focus}-{320,390,768,1440,1920}.png`.
- `.expo/73a-{dashboard,focus}-{Dark,Light,System}-{Mint,Blue,Purple,Orange}.png`.

Las capturas son artefactos ignorados. Muestran jerarquía, contraste, círculo y controles utilizables sin solapamientos en las vistas inspeccionadas. Las pruebas existentes conservan scroll horizontal intencional del gráfico nativo de 30 días y del carrusel; no se confunde con overflow de la página.

## Archivos y entrega

- Fuente gráfica y generador: `assets/academic/glyphs.json`, `scripts/generate-academic.mjs`.
- Web: `components/academic/{Academic.tsx,academic.css,glyphs.ts}`, `pages/Dashboard.tsx`, `components/dashboard/{DashboardContext,DashboardMetrics,StudyActivityChart,FocusStudio}.tsx`, `components/focus/{SoundscapeCarousel,TrackArtwork}.tsx`, `tests/academic.test.mjs`, `tests/focusStudioRendering.test.mjs`, `package.json` (sólo inclusión del test).
- Mobile: `components/academic/{Academic.tsx,glyphs.ts}`, rutas `(app)/(main)/{dashboard,focus-studio}.tsx`, `components/dashboard/{ActivityPlot,DashboardActivity,DashboardContext}.tsx`, `components/focus/{FocusArtwork,FocusSoundCarousel,FocusTimerPanel}.tsx`, `tests/academic.test.mjs`, recorridos mobileDashboard/mobileFocus, helper academicGallery y mock appearanceNative.
- Este documento.

Commit solicitado: `feat(ui): apply retro pixel styling to dashboard and focus`, mediante staging explícito; hash real en la entrega. Los 16 elementos ajenos permanecen fuera del commit. Sin push, merge, amend ni reset.

## Pendiente en Expo Go Android real

No se operó un teléfono físico. Comprobar círculo y marcadores en densidades/fuente grande; TalkBack (títulos, progreso sin anuncios continuos, engranaje); teclado del diálogo de intervalos; gestos/SafeArea y carrusel; Dark/Light/System y cuatro paletas; Reduce Motion y background/foreground durante sesión/sonido. Usar cuenta autorizada y entorno aislado para registrar sesiones de prueba. Las pruebas automatizadas ya cubren mocks de ese flujo, pero no audio/hardware/FPS reales.

Fin de 7.3a. No comienza 7.3b ni se rediseñan otros módulos.
