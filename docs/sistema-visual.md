# Sistema visual — Etapa 1

Estado: implementado, corregido tras auditoría y verificado; pendiente de
autorización de commit. No se instala ninguna biblioteca en esta etapa.
Base de Git revisada: `84f2e0f` (`fix: stabilize local backend and authentication`).
Los cambios previos de infraestructura, Google Books y configuración permanecen
fuera de esta etapa. No se modifican pantallas, rutas, servicios, temporizador,
audio, estadísticas ni backend.

## Tokens y uso

La fuente de los tokens es `frontend-web/src/styles/tokens.css`, importada desde
`src/index.css`. Se conservan Tailwind 4 y los componentes existentes. No se
añadieron bibliotecas, fuentes remotas ni dependencias; el lockfile no cambia.
La paleta histórica de compatibilidad también vive en `tokens.css`. Los valores
compartidos `--ss-palette-*` se declaran una sola vez y alimentan tanto los
semánticos como los alias históricos; `index.css` no declara colores literales.
Los componentes no deben utilizar directamente esos valores privados.

| Propósito | Token CSS | Utilidad Tailwind |
|---|---|---|
| Fondo de aplicación | `--ss-background` | `bg-canvas` |
| Tarjetas y superficies | `--ss-surface`, `--ss-surface-hover` | `bg-surface`, `hover:bg-surface-hover` |
| Bordes decorativos / controles | `--ss-border`, `--ss-border-strong` | `border-outline`, `border-outline-strong` |
| Texto principal / secundario / auxiliar | `--ss-text`, `--ss-text-secondary`, `--ss-text-muted` | `text-content`, `text-content-secondary`, `text-content-muted` |
| Acción y selección | `--ss-accent`, `--ss-accent-hover`, `--ss-accent-soft`, `--ss-on-accent` | `bg-accent`, `hover:bg-accent-hover`, `bg-accent-soft`, `text-on-accent` |
| Foco | `--ss-focus`, `--ss-focus-width`, `--ss-focus-offset` | Foco global `:focus-visible` |
| Estados | `--ss-danger`, `--ss-success`, `--ss-warning`, `--ss-info` y sus superficies | `text-danger`, `bg-danger-surface`, etc. |
| Tipografía activa | `--ss-font-body`, tamaños caption/label/body, `--ss-weight-*` | `font-sans`, `text-xs`, `text-sm`, `text-base`, pesos existentes |
| Espaciado activo | `--ss-space-1` | Unidad base Tailwind `--spacing` (4 px con raíz de 16 px) |
| Bordes y radios | `--ss-border-width`, `--ss-radius-control`, `--ss-radius-panel`, `--ss-radius-pill` | `rounded-control`, `rounded-panel`; ancho y radio pill disponibles para futuros componentes |
| Tamaño y movimiento | `--ss-control-height`, `--ss-motion-fast` | Botones compartidos de 44 px mínimos y transiciones; movimiento reducido respetado |

Los colores se eligen por función, no por nombre de pigmento. Por ejemplo, el
texto sobre una acción utiliza `text-on-accent`; no debe utilizar `text-slate-950`
suponiendo que el fondo seguirá siendo menta. Los nuevos componentes pueden usar
las utilidades semánticas o las clases compartidas existentes:

```tsx
<section className="study-panel">
    <p className="study-kicker">Study activity</p>
    <button className="study-button" type="button">View details</button>
</section>
```

`study-panel`, `study-kicker`, `study-button`, `study-tabs`, `study-tab` y
`study-empty` ahora utilizan tokens; `study-status` centraliza el estado de carga.
LoadingState, EmptyState, ErrorMessage y PaginationControls consumen esta base y
conservan sus interfaces, contenido, callbacks y cálculo de páginas.

### Activos y reservados

- Activos: superficies, bordes y textos semánticos; acento y foco; estado de error;
  valores privados y alias de compatibilidad; familia de texto y tamaños/pesos
  existentes; `--ss-space-1`; radios control/panel; altura mínima de controles;
  ancho/separación de foco y duración de transición.
- Reservados: `--ss-font-display`, `--ss-type-heading`, `--ss-leading-body`,
  `--ss-leading-reading`, `--ss-border-width`, `--ss-radius-pill` y los estados
  semánticos success/warning/info. Tienen valores o utilidades disponibles, pero
  no se aplican todavía a los componentes de producto migrados en esta etapa.
- `--ss-space-2` … `--ss-space-12` son referencias reservadas. Las utilidades de
  Tailwind como `p-6` calculan su valor desde `--spacing`, que utiliza
  `--ss-space-1`; cambiar solo `--ss-space-6` no cambia `p-6`.
- La paleta histórica permanece fija: no se sustituye un alias oscuro por un
  semántico que cambie con el tema. Así se conservan también diferencias
  intencionales como `slate-700` y `border-outline-strong`.

La selección aprobada para etapas posteriores es Recharts para Dashboard web y
shadcn/ui selectivo para Carousel, Dialog, Avatar, Dropdown Menu y Switch,
adaptados a nuestros tokens. React Native conserva sus componentes actuales. No
se instalan ni incorporan esas bibliotecas en la Etapa 1, ni se añaden otros kits.

## Preparación de temas

El valor predeterminado continúa siendo **oscuro con acento menta**, incluso si
el sistema operativo usa modo claro. Se preparan estos atributos en `<html>`:

| Atributo | Resolución de tokens semánticos |
|---|---|
| Sin atributo o `data-theme="dark"` | Oscuro |
| `data-theme="light"` | Claro |
| `data-theme="system"` | Preferencia del sistema operativo |

Las parejas de colores se resuelven con `light-dark()` y `color-scheme`, sin
JavaScript de temas. [Referencia de la función CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark).

La selección de tema, su persistencia, las otras paletas y la página Settings
pertenecen a la Etapa 4. **Los temas claro y automático no se ofrecen todavía al
usuario.** Las clases históricas `slate`, `sky` y `emerald` se conservan para no
reescribir pantallas en esta etapa. Las pantallas que aún usan esas clases deben
migrarse antes de presentar el tema claro como una opción completa de la app.
La verificación de temas de esta etapa cubre los componentes y tokens migrados.

## Accesibilidad y alcance de la revisión

- LoadingState anuncia el texto con `role="status"`; el indicador visual es
  decorativo (`aria-hidden`) y se detiene cuando se solicita movimiento reducido.
- ErrorMessage conserva `role="alert"`. Los mensajes siguen escapándose como
  texto de React, sin HTML inyectado.
- Paginación conserva `nav`, nombre accesible, `aria-current`, controles nativos
  deshabilitados y etiqueta del selector; no cambia la lógica de navegación.
- El foco de teclado utiliza un contorno visible de 2 px, con separación de 3 px.
  La regla está deliberadamente fuera de las capas CSS para que las utilidades
  heredadas `outline-none` y `focus:outline-none` no puedan ocultarlo. Se limita
  a controles nativos, enlaces con href, summary, medios con controles,
  contenteditable y elementos con tabindex no negativo. No selecciona contenido
  normal ni destinos no interactivos con tabindex negativo; omite deshabilitados.
  No utiliza `!important`, no reemplaza sombras y solo se activa con
  `:focus-visible`, conservando el comportamiento de puntero y hover.
- Los botones compartidos y el selector de paginación alcanzan 44 px de altura.
- Los campos mantienen un tamaño mínimo de letra de 16 px.
- Se mantienen las reglas de movimiento reducido para animaciones, transiciones
  y scroll. No se añade almacenamiento ni detección JS de preferencias.

## Verificación realizada

Desde `frontend-web`:

```bash
npm run lint
npm run build
npm run test:web
```

- ESLint: aprobado.
- TypeScript: aprobado mediante `tsc -b`, incluido en build.
- Build Vite: aprobado. Aviso de chunk de Study Rooms superior a 500 kB; no se
  modifican ese módulo ni su distribución de código en esta etapa.
- Suite web: **53 pruebas de lógica y 10 de UI aprobadas**, 0 fallos y 0 omitidas.
  `test:ui` incluye cinco casos de `tests/designSystem.test.mjs`. Las pruebas de
  UI se ejecutan en serie para que sus servidores Vite no compitan por el puerto.
- Regresión persistente en Chrome: compila el CSS real con Vite y renderiza el
  componente real TrackingLinkForm mediante SSR, sin ejecutar sus efectos ni
  peticiones al backend. Chrome navega mediante Tab real: campo de Tracking,
  botón con clases heredadas, campo con `outline-none`, enlace, select, textarea,
  summary y control con tabindex. Se comprueban color menta, estilo sólido,
  ancho 2 px y separación 3 px computados en los ocho controles.
- La misma prueba confirma que se salta el submit deshabilitado, que el foco no
  se fuerza en contenido no interactivo y que un clic con ratón no impone el
  indicador de teclado. Verifica también los ocho colores históricos resueltos
  en Chrome, sin cambios respecto a la paleta anterior.
- El navegador de regresión utiliza un perfil temporal aislado y se cierra al
  terminar. No requiere una dependencia npm nueva. Si Chrome/Chromium no está
  instalado, esa prueba se marca omitida con un motivo explícito; puede indicarse
  la ruta con `STUDYSTREAK_CHROME_BIN`. En esta verificación se ejecutó y aprobó.
- Chrome 153 real, con perfil de prueba aislado: componentes reales renderizados
  en una vista temporal, sin añadir rutas al producto ni simular datos de estudio.
- Viewports: **320, 390, 768 y 1440 px**. No se detectó desbordamiento horizontal.
- **20 escenarios**: predeterminado, oscuro y claro explícitos, y automático con
  preferencias de sistema clara y oscura, en los cuatro tamaños.
- Contraste mínimo medido en los textos comprobados: **6,26:1**; bordes de
  controles comprobados: **3,71:1**. Son mediciones de los componentes migrados,
  no una auditoría completa WCAG de todas las pantallas.
- Foco por Tab visible; el botón Previous deshabilitado queda fuera del recorrido.
- La emulación de movimiento reducido elimina la animación del indicador.
- Navegación real de la app en Chrome: **login → register → login**, aprobada,
  sin enviar formularios ni crear datos.

Las capturas de componentes y `browser-results.json` se conservan en
`.local/ui-stage1/`, ignorado por Git. La vista temporal y el navegador no forman
parte del producto. No se realizaron llamadas de escritura al backend: esta
etapa no modifica su integración.

## Checkpoint de Git

Lista cerrada de archivos de esta etapa:

1. `frontend-web/src/styles/tokens.css`.
2. `frontend-web/src/index.css`.
3. `frontend-web/src/components/ui/LoadingState.tsx`.
4. `frontend-web/src/components/ui/EmptyState.tsx`.
5. `frontend-web/src/components/ui/ErrorMessage.tsx`.
6. `frontend-web/src/components/ui/PaginationControls.tsx`.
7. `frontend-web/tests/designSystem.test.mjs`.
8. `frontend-web/package.json` (incorpora el test y serializa las pruebas de UI).
9. `docs/sistema-visual.md`.

Se revisó el diff y se compararon hashes de los **17 archivos preexistentes**
modificados o sin seguimiento: permanecen intactos. No se preparó staging ni se
creó un commit. Tras autorización expresa, el commit local debe incluir solamente
estos nueve archivos. Mensaje propuesto:
`feat(web): add semantic design tokens and accessible shared UI`.

La Etapa 2 requiere otra indicación del usuario después del checkpoint.
