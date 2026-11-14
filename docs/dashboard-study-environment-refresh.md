# Study Environment Web — Ilustraciones aprobadas

## Recursos e integración

Se utilizan los cuatro PNG aportados en Descargas, sin redibujar ni recolorear:

| Ambiente | Original | WebP sin pérdidas |
| --- | --- | ---: |
| Sunset Campus | `study-environment-sunset-campus.png` | 852.630 bytes |
| Rainy Library | `study-environment-rainy-library.png` | 854.436 bytes |
| Night Desk | `study-environment-night-desk.png` | 855.540 bytes |
| Cozy Café | `study-environment-cozy-cafe.png` | 829.646 bytes |

Todos conservan 2172 × 724 píxeles. Se verificó igualdad exacta de los píxeles RGB tras decodificar los WebP. Reducción del 34–37 % frente a los PNG. Las miniaturas locales de 480 × 160 usan nearest-neighbor y WebP sin pérdidas. [Procedencia, hashes y tamaños](images/dashboard-environment-refresh/asset-provenance.json).

Los nuevos archivos viven en `frontend-web/public/environments/study-v2/`; los antiguos no se sobrescriben, evitando afectar recursos compartidos o históricos. Night Desk es la imagen azul con luna y lluvia, independiente de Sunset Campus. Solo se descarga el ambiente seleccionado; las capas que reutilizan su URL aprovechan la caché del navegador. Las miniaturas de Settings mantienen lazy loading.

El hero no tiene fondo propio, borde, radio de tarjeta ni sombra. El saludo y las acciones usan los tokens semánticos; su zona izquierda deja ver el fondo real de la página. Una máscara alfa horizontal funde el borde izquierdo de la imagen, con atenuación adicional de los márgenes superior/inferior y derecho. No se usa el verde del recurso como fondo del contenedor. En móvil se reduce el espacio de ilustración y se mantienen texto y acciones fuera de ella.

Se ajustan las máscaras de ventana y posiciones de vapor/lámpara a las nuevas composiciones. Se reutilizan las animaciones existentes de nubes, lluvia, vapor e iluminación. Night Desk usa la lluvia existente en lugar de estrellas añadidas, de acuerdo con su arte aprobado. Ambient Movement, Reduce Motion, background y visibilidad conservan su política anterior. El fallback estático usa la miniatura aprobada de Sunset Campus.

## Capturas inspeccionadas

- [Sunset Campus — Sage Dark + Mint](images/dashboard-environment-refresh/campus-sage-dark-mint.png) · [Neutral Light + Blue](images/dashboard-environment-refresh/campus-neutral-light-blue.png)
- [Rainy Library — Lavender Dark + Purple](images/dashboard-environment-refresh/library-lavender-dark-purple.png) · [Amber Light + Orange](images/dashboard-environment-refresh/library-amber-light-orange.png)
- [Night Desk — Sage Dark + Mint](images/dashboard-environment-refresh/night-sage-dark-mint.png) · [Neutral Light + Blue](images/dashboard-environment-refresh/night-neutral-light-blue.png)
- [Cozy Café — Lavender Dark + Purple](images/dashboard-environment-refresh/cafe-lavender-dark-purple.png) · [Amber Light + Orange](images/dashboard-environment-refresh/cafe-amber-light-orange.png)
- Responsive Sunset Campus: [390](images/dashboard-environment-refresh/campus-390.png), [768](images/dashboard-environment-refresh/campus-768.png), [1440](images/dashboard-environment-refresh/campus-1440.png), [1920](images/dashboard-environment-refresh/campus-1920.png). La carpeta incluye los mismos tamaños para los cuatro ambientes y Settings a 390/1440.

## Verificación

- ESLint, TypeScript y build Web: aprobados. Continúa el aviso previo de chunks mayores de 500 kB.
- `node tests/environmentSettings.browser.mjs`: aprobado. Cuatro selecciones reales desde Settings, previsualización, recarga, aislamiento por cuenta, Automatic/franjas horarias, controles de widgets y gráfico, teclado, cuatro fondos capturados, 12 combinaciones modo/acento, movimiento real, Reduce Motion, Ambient Movement, pausa por background/viewport y fallo real de recurso con fallback. Se comprueba además fondo transparente, borde cero, sombra ausente y máscara activa.
- `node --experimental-strip-types --test tests/environmentPreferences.test.mjs tests/dashboardWidgets.test.mjs`: 2 pruebas aprobadas.
- `tests/dashboardRendering.test.mjs`: 11 pruebas aprobadas; estadísticas, historial, estados vacíos, calendario y controles sin cambios.
- `node --test tests/studyEnvironment.test.mjs`: aprobado tras adaptar la regresión nocturna a la lluvia del recurso nuevo; composición, calendario único, controles, consultas estadísticas y ausencia de ilustración en Focus conservados.
- Respuestas API simuladas; no se escriben datos persistentes. Los 39 archivos ajenos presentes del inventario mantienen sus checksums. Sin cambios en Mobile, Login/Register, sidebar, backend, servicios, widgets o lógica estadística.

## Archivos y Git

`environment/{PanoramicScene.tsx,scenes.ts,study-environment.css}`, ocho imágenes `public/environments/study-v2/`, `tests/environmentSettings.browser.mjs`, `tests/helpers/panoramicReview.mjs`, este informe y `docs/images/dashboard-environment-refresh/`.

Commit local: `style(web): refresh dashboard study environments`. Hash mediante `git log -1 --format=%h -- docs/dashboard-study-environment-refresh.md`. Staging explícito, sin push ni operaciones destructivas. Se detiene antes de F6.
