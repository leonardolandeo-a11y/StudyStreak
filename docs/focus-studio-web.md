# Focus Studio web — Etapa 3

La composición se centra en el Pomodoro, con Now Playing debajo y un lateral de
meta/configuración. En tablet y móvil los bloques se apilan en ese mismo orden.
El catálogo horizontal aparece después del panel principal y las estadísticas
existentes quedan en un details al final. Se retiró el antiguo bloque Featured
focus mix. No se modifica Dashboard, Settings global, Profile ni React Native.

## Componentes y conservación de comportamiento

- FocusStudio conserva sus estados, efectos, servicios y handlers de temporizador,
  grabación, recuperación, outbox y audio. Se comparó por texto todo el cuerpo
  funcional anterior al return; es idéntico. pomodoroState, pomodoroAudio,
  soundscapes, studyTracking y focusSessionService permanecen sin cambios.
- TrackArtwork reutiliza los iconos y gradientes de las doce pistas existentes,
  con una variante pequeña para las tarjetas del carrusel.
- SoundscapeCarousel es presentacional: recibe las pistas filtradas y delega la
  selección al chooseTrack existente. Filtrar no cambia ni detiene la pista activa.
- RecordedSummary añade `compact`, opcional y false por defecto. Conserva la
  presentación anterior para los demás consumidores y las distinciones entre
  confirmados, pendientes, desconocidos y errores. Focus Studio usa la variante
  compacta con actualización accesible por icono.
- El contador de ciclos se etiqueta como local al dispositivo. No se presenta
  como contador de sesiones verificadas: los valores confirmados siguen viniendo
  del backend y se muestran en la meta y las estadísticas.

Las superficies y controles nuevos usan tokens semánticos de la Etapa 1. La
apariencia predeterminada sigue siendo oscura/menta. Se conservan las preferencias
locales Aurora/Sunset/Ocean de Focus Studio, sin introducir temas globales,
estética retro, imágenes de fondo ni cambios en Login/Register.

## Carousel de shadcn/ui

Se adaptó el componente oficial [Carousel](https://ui.shadcn.com/docs/components/carousel),
basado en Embla, conservando su composición Carousel/Content/Item/Previous/Next.
La licencia MIT y atribución se incluyen junto al componente.

Única dependencia directa nueva: **embla-carousel-react 8.6.0**. Dependencias
transitivas: embla-carousel y embla-carousel-reactive-utils, ambas 8.6.0.
No se ejecutó el inicializador de shadcn ni se sobrescribieron tokens. Se usan
botones nativos y study-button; no hacen falta otro kit de componentes, cn,
clsx o tailwind-merge para esta composición.

Adaptaciones:

- Controles de 44 px dentro del ancho del panel, con nombre accesible.
- Región y slides etiquetados, filtros aria-pressed y selección independiente
  del estado de reproducción. La etiqueta ofrece Play/Pause según corresponda.
- Teclado por flechas y Tab; Embla desplaza las tarjetas al recibir foco.
- Gesto táctil horizontal, manteniendo el desplazamiento vertical de la página.
- Sin autoplay, loop o plugins adicionales. Filtrar reinicia solo la posición
  del carrusel, no el temporizador o el audio.
- Movimiento reducido: controles con salto sin animación y duración cero en la
  opción correspondiente de Embla. Los estilos globales existentes desactivan
  animaciones decorativas. Hay espacio alrededor del viewport para el foco.
- La disponibilidad de las flechas se suscribe a Embla con useSyncExternalStore,
  evitando actualizaciones de estado síncronas en effects. Se retiran los listeners
  de select/reInit al desmontar.

## Comprobaciones

Desde frontend-web:

```bash
npm ci
npm run lint
npx tsc -b
npm run build
npm run test:web
npm run dev
```

Resultado automatizado: **81 tests web correctos** (58 de lógica y 23 de
renderizado/sistema visual). Las cinco regresiones nuevas verifican orden de
paneles, estados del temporizador, las doce pistas, filtros/selección y la
semántica de la variante compacta de confirmados/errores/pendientes.

Chrome headless verificó 320, 390, 768, 1024 y 1440 px, sin overflow horizontal:
Now Playing queda bajo el temporizador; las tarjetas laterales se apilan en
anchos menores; todos los controles nuevos visibles tienen al menos 44 px.
Pasaron flechas, botones, Tab, gesto táctil, filtros de 12/3/4 pistas, selección,
reproducción/pausa de Web Audio y cambio de volumen. Las preferencias se conservan
al recargar; el audio no arranca automáticamente. Se comprobó foco visible de
2 px en menta y movimiento reducido. No hubo excepciones JavaScript.

Las primeras comprobaciones del guion incluyeron controles de las estadísticas
cerradas al medir tamaño y leyeron el DOM previo antes de finalizar una recarga.
Se corrigieron esas condiciones del guion (visibilidad y Page.loadEventFired),
sin alterar la lógica de la aplicación.

Los artefactos de revisión están en `.local/ui-stage3/layout/`, ignorados por Git:
`focus-{1440,1024,768,390,320}.png`, layout-results.json e integration-results.json.
Los archivos de sesión tienen permisos 0600 y no deben publicarse.

## Integración con Study Ledger y Dashboard

Se utilizó exclusivamente PostgreSQL desechable en 55436, base
studystreak_schema_check. Backend temporal 18083, Vite 5177 y cuentas sintéticas.
No se crearon usuarios, refresh sessions ni sesiones Pomodoro de prueba en la
base persistente. La aplicación habitual en 8080 se comprobó por arranque,
comparación de datos/esquema y respuesta 401 correcta sin JWT.

Se repitieron **202 tests backend**, sin fallos, errores ni omitidos. La migración
local de precisión y su respaldo son una operación previa independiente, cuyo
informe y restauración están en la carpeta de respaldo ignorada por Git. No se
incluyen cambios de backend ni infraestructura en el commit visual.

Autenticación real aislada: registro 201, login 200, JWT protegido 200, refresh
200/rotación, rechazo de refresh reutilizado 401 y logout 204; credenciales y
tokens no se imprimieron.

El flujo real de cinco minutos desde la nueva UI comprueba:

1. Meta vinculada y UUID iniciado en el servidor. RUNNING sigue excluido de las
   estadísticas verificadas; finalización anticipada devuelve 409.
2. Pausa y recarga recuperan el mismo UUID/meta/tiempo observado. La pausa no añade
   concentración; al reanudar se usa el reloj del servidor.
3. Finalización: 300 segundos confirmados, 5 minutos y 1 sesión en resumen de meta,
   Focus Studio/FocusInsights y verifiedPeriod del Dashboard para 7/30 días.
4. Reintentos idempotentes; intento posterior pausado/reanudado y cancelado sin
   crédito adicional; no quedan finalizaciones pendientes en el dispositivo.

Resultado de la sesión real final: correcto, con 300 segundos confirmados,
5 minutos y 1 sesión en ambos módulos, para 7 y 30 días. La recuperación tras
pausa/recarga, los reintentos idempotentes y la cancelación posterior pasaron;
no quedaron finalizaciones pendientes ni excepciones JavaScript. El recorrido
duró 306 segundos de reloj, incluida la pausa, en PostgreSQL desechable.

## Límites

Las preferencias siguen siendo locales y el audio se genera en el navegador.
El trabajo móvil nativo, Settings global y Profile pertenecen a etapas posteriores.
No se añadió polling ni se cambió el existente. No se modificó el significado
histórico de las estadísticas existentes de FocusInsights.

npm informó los 11 avisos transitivos ya presentes (10 moderados y 1 alto).
No se actualizaron versiones preexistentes ni se ejecutó audit fix. Permanece el
aviso previo de chunk grande de StudyRoomsPage; esa pantalla no se modificó.
