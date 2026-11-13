# Etapa 8.3a — Ambientes ilustrados personalizables, propuesta Web

Rama `feat/ui-ux-web-mobile`, HEAD **`723c275`**. Se comprobó que 8.2 estaba completa y registrada, sin cambios propios pendientes. La solicitud de avanzar a 8.3a da continuidad a esa entrega; sus verificaciones físicas Android siguen documentadas como limitación de Mobile, fuera del alcance Web actual.

**Esta propuesta queda sin staging ni commit hasta la aprobación visual. No se adapta Mobile.** Los 16 elementos ajenos y los antecedentes válidos de 8.1b se conservaron.

## Ambientes y selección

Settings → Appearance incorpora **Study Environment**, con cuatro miniaturas, radios nativos accesibles, vista previa inmediata, Automatic, Ambient movement y Restore default environment. La configuración de temas/paletas y la distribución de widgets no se modifican.

| Elección | Ilustración y ambiente |
| --- | --- |
| Sunset Campus / Campus al atardecer | Campus universitario, nubes doradas, libros, globo, libreta, taza y lámpara. |
| Rainy Library / Biblioteca lluviosa | Estanterías y catálogo, ventana al patio lluvioso, libros y lámpara verde cálida. |
| Night Desk / Escritorio nocturno | Luna creciente, estrellas, escritorio, reloj, gafas, taza y luz ámbar. |
| Cozy Café / Cafetería acogedora | Rincón de lectura, libros, café, máquina de espresso y campus exterior. |

Automatic selecciona **Cozy Café de 05:00 a 11:59**, **Sunset Campus de 12:00 a 17:59** y **Night Desk de 18:00 a 04:59**, reutilizando el reloj/franjas existentes. Rainy Library es manual: no se infiere el clima ni se consulta un servicio meteorológico.

Las elecciones manuales permanecen fijas al cambiar de franja; el saludo sigue la hora local real, independientemente de la ilustración elegida. El reloj ilustrativo no cambia la zona horaria de las estadísticas.

Restaurar el ambiente vuelve a Automatic y movimiento activado, sujeto siempre a Reduce Motion. No restaura temas, paletas o widgets. Los cambios se guardan al seleccionar; el fallo de almacenamiento se comunica y permite reintento sin perder la vista previa temporal.

## Integración visual

Se conserva el tamaño del hero, bienvenida y CTA originales. Sólo cambia la ilustración y su ambientación. En tablet se reforzó el degradado situado detrás del texto para mantener legibilidad sobre todos los escenarios. El escritorio nocturno utiliza encuadre vertical centrado en pantallas anchas para que la luna no quede cortada. No se alteraron tarjetas, gráficos, métricas, su orden o personalización.

Focus Studio sigue sin escenario ni control de ambientación. Login/Register mantiene sus escenas originales; no se editaron sus recursos ni sus hooks horarios/ambientales.

## Recursos originales y generación

Se aplicó la skill **imagegen** mediante la herramienta integrada `image_gen`, sin CLI, claves API ni dependencias nuevas. La ilustración aprobada `frontend-web/public/environments/academy-pixel-static.png` se usó exclusivamente como referencia de familia visual. Se generaron cuatro composiciones originales; no se sustituyeron archivos anteriores.

Recursos finales locales en `frontend-web/public/environments/study-v1/`:

| Escenario | Panorama 2172 × 724 | Miniatura 432 × 144 |
| --- | ---: | ---: |
| campus.webp / campus-thumb.webp | 309288 bytes | 24068 bytes |
| library.webp / library-thumb.webp | 413680 bytes | 28402 bytes |
| night.webp / night-thumb.webp | 289634 bytes | 22822 bytes |
| cafe.webp / cafe-thumb.webp | 366346 bytes | 26980 bytes |

Total de los ocho archivos: aproximadamente **1,48 MB**. Panoramas WebP de calidad 92; miniaturas reducidas con vecino más cercano y WebP de calidad 88. Se inspeccionó la conservación de contornos y detalle. Originales PNG y procedencia se conservan en `.local/stage83a/art-sources/`, sin incorporarlos al bundle ni sobrescribir las imágenes aprobadas.

Sólo se referencia el panorama seleccionado. Las miniaturas son estáticas y de carga diferida; las capas SVG reutilizan la misma URL local. Las ilustraciones se sirven como archivos estáticos del propio frontend: no hay un proveedor externo, generación, búsquedas o descargas imperativas de arte en tiempo de ejecución. Como cualquier recurso Web, el navegador carga inicialmente esos archivos del despliegue; no se añadió un service worker ni se promete funcionamiento offline completo.

### Prompts utilizados

Referencia de estilo: imagen aprobada del escritorio/campus de 8.1c. Herramienta: generación integrada con esa referencia local, sin editar el original.

- **Campus:** composición original panorámica 3:1, pixel art académico elaborado y nítido, lavanda/ciruela, acentos mint y luz melocotón; 30 % izquierdo tranquilo para texto HTML; ventana amplia aproximadamente en x43–84 %, y10–60 %, con parteluces; campus universitario al atardecer, nubes doradas, escritorio con libros, libreta, taza y lámpara. Sin UI, texto, realismo, difuminado, marcas de agua o personajes nuevos.
- **Base común para los otros tres:** ilustración original de la misma familia visual, 3:1, píxeles cuadrados y contornos ciruela, sombreado escalonado, libros y café detallados; izquierda tranquila para texto y objetos principales a la derecha; ventana amplia y taza alrededor de x74 %, y76 %. Sin UI, texto, foto, pintura borrosa ni rectángulos vectoriales como sustituto de ilustración.
- **Biblioteca:** rincón universitario con estanterías repletas, madera violeta tallada, encuadernaciones, catálogo de cajones, libreta, lámpara verde y taza; patio índigo lluvioso, gotas y reflejos pixelados. Arquitectura reconocible de biblioteca, sin personas ni afirmaciones de clima real.
- **Nocturno:** escritorio de escritura privado, ventana con luna creciente y estrellas, tejados universitarios lejanos, lámpara ámbar, libros, lápices, taza con vapor, reloj y gafas. Sombras lavanda y detalle por grupos de píxeles; sin texto legible ni personas.
- **Cafetería:** rincón de lectura en cafetería universitaria lavanda, mesa de madera, banqueta ciruela, máquina de espresso y tarros al fondo; libro abierto, libros, taza y lámpara; ventana a calle universitaria arbolada y edificios terracota, cielo melocotón/mint. Sin personas, rótulos ni texto de menú.

## Movimiento, rendimiento y fallback

- Campus/Café: desplazamiento muy lento de nubes dentro de las ventanas.
- Biblioteca: lluvia tenue, recortada dentro de los cristales.
- Escritorio nocturno: brillo suave de estrellas.
- Todos: vapor e iluminación discretos. Los objetos, marcos y controles no se desplazan.

Se reutilizan `useStudyPeriod` y `useAmbientMotion`, sin modificarlos. Se combinan la preferencia de movimiento del ambiente, Reduce Motion global/dispositivo, ahorro de recursos, visibilidad del documento e IntersectionObserver. Tanto el hero como la vista previa pausan sus animaciones cuando no son visibles y limpian observadores/listeners al desmontar. No hay polling ni bucles JavaScript por frame.

Si falla el panorama, se muestra el recurso estático local independiente de 8.1c y un mensaje discreto, sin animaciones ni reintentos infinitos. Si tampoco pudiera cargarse ese fallback, el fondo y el texto del hero continúan disponibles. Las miniaturas fallidas no bloquean los radios ni sus nombres accesibles.

## Persistencia y autorización

Clave: `studystreak:study-environment:v1:<userId>`. Valor limitado a `{ selection, motion }`, sin tokens, nombres, imágenes privadas o estadísticas.

El hook se utiliza dentro de subárboles con clave de cuenta. Cada store captura su propia clave y no usa una caché global compartida entre usuarios. La hidratación evita mostrar la preferencia de la cuenta anterior; los eventos de almacenamiento actualizan sólo la cuenta correspondiente. Valores desconocidos, antiguos o JSON corrupto se normalizan a una elección segura, sin escribir automáticamente sobre ellos.

No se modifica la persistencia de widgets (`studystreak-dashboard-v1-*`) ni la apariencia global. No hay nuevos endpoints, cambios de permisos, backend o migraciones.

## Capturas finales

Capturas de Chrome headless con cuentas/API simuladas, no datos de la base habitual. Las capturas aprobadas de 8.1c/8.1d/8.2 permanecen intactas.

| Escenario | Hero comparativo | 390 | 768 | 1440 | 1920 |
| --- | --- | --- | --- | --- | --- |
| Campus | [Hero](images/academia-pixel-viva-8-3a/campus-hero.png) | [390](images/academia-pixel-viva-8-3a/campus-390.png) | [768](images/academia-pixel-viva-8-3a/campus-768.png) | [1440](images/academia-pixel-viva-8-3a/campus-1440.png) | [1920](images/academia-pixel-viva-8-3a/campus-1920.png) |
| Biblioteca | [Hero](images/academia-pixel-viva-8-3a/library-hero.png) | [390](images/academia-pixel-viva-8-3a/library-390.png) | [768](images/academia-pixel-viva-8-3a/library-768.png) | [1440](images/academia-pixel-viva-8-3a/library-1440.png) | [1920](images/academia-pixel-viva-8-3a/library-1920.png) |
| Nocturno | [Hero](images/academia-pixel-viva-8-3a/night-hero.png) | [390](images/academia-pixel-viva-8-3a/night-390.png) | [768](images/academia-pixel-viva-8-3a/night-768.png) | [1440](images/academia-pixel-viva-8-3a/night-1440.png) | [1920](images/academia-pixel-viva-8-3a/night-1920.png) |
| Cafetería | [Hero](images/academia-pixel-viva-8-3a/cafe-hero.png) | [390](images/academia-pixel-viva-8-3a/cafe-390.png) | [768](images/academia-pixel-viva-8-3a/cafe-768.png) | [1440](images/academia-pixel-viva-8-3a/cafe-1440.png) | [1920](images/academia-pixel-viva-8-3a/cafe-1920.png) |

Selector: [Settings escritorio](images/academia-pixel-viva-8-3a/settings-1440.png), [Settings estrecho](images/academia-pixel-viva-8-3a/settings-390.png). Más estados: [Light/Orange](images/academia-pixel-viva-8-3a/library-light-orange.png), [fallo y fallback](images/academia-pixel-viva-8-3a/fallback.png).

Se inspeccionaron los cuatro ambientes en Dashboard, el selector y las variantes estrechas. Se corrigieron el recorte de la luna a 1920 px y el contraste sobre la ilustración en tablet. No cambia la geometría de los widgets.

## Pruebas

Logs ignorados en `.local/stage83a/`:

- ESLint: aprobado (`lint.log`).
- TypeScript `tsc -b`: aprobado; también se ejecuta dentro del build.
- Build Web: aprobado (`build.log`). Persiste la advertencia preexistente del chunk Study Rooms superior a 500 kB, sin cambios en ese módulo.
- 21 tests dirigidos aprobados (`tests.log`): normalización/persistencia de ambientes, aislamiento entre cuentas, fallos y reintento de almacenamiento; contrato de widgets, métricas/renderizado e aislamiento del cliente API.
- Regresión Chrome previa del hero horario y Focus sin escenario: aprobada (`hero-regression.log`). Se actualizó el helper para verificar estrellas del nuevo nocturno en vez de la antigua capa de paisaje, conservando la prueba de movimiento real. Sus capturas van a `.local/stage83a/environment-regression/`.
- Recorrido Chrome nuevo: cuatro ambientes y vista previa, persistencia tras recargar, cuenta 101/202/101, modo automático y cambios de franja, movimiento manual/Reduce Motion, background/foreground y viewport, 12 combinaciones de modo/paleta, fallback ante un fallo real de recurso y responsive 390/768/1440/1920 (`browser.log`).
- El recorrido verifica que la configuración personalizada de widgets y la clave de apariencia no cambian al seleccionar ambientes; los gráficos 7/30 y barras/líneas siguen funcionando y Focus no contiene escenario.
- Selección mediante radios nativos, navegación por flechas y conservación del foco comprobadas en Chrome. Los efectos reales de nubes, lluvia y estrellas cambian sus transformaciones/opacidad cuando están activos.
- Comprobación de hashes de los 16 elementos ajenos y de todos los archivos previamente rastreados: sólo se modificaron los cinco archivos Web existentes listados abajo. Mobile, los widgets y los demás módulos permanecen intactos.

No se hicieron escrituras en PostgreSQL ni pruebas con cuentas reales. No se afirma validación física Android: esta etapa es exclusivamente Web.

## Archivos modificados

Existentes:

- `frontend-web/src/components/environment/{StudyEnvironment,PanoramicScene}.tsx`.
- `frontend-web/src/components/environment/study-environment.css`.
- `frontend-web/src/pages/Settings.tsx`: importación e integración de la sección.
- `frontend-web/tests/helpers/panoramicReview.mjs`.

Nuevos:

- `frontend-web/src/components/environment/{StudyEnvironmentSettings.tsx,scenes.ts}`.
- `frontend-web/src/features/environment/environmentPreferences.ts`.
- `frontend-web/src/hooks/useEnvironmentPreferences.ts`.
- `frontend-web/tests/{environmentPreferences.test,environmentSettings.browser}.mjs`.
- Ocho recursos WebP en `frontend-web/public/environments/study-v1/`.
- Este documento y las capturas `docs/images/academia-pixel-viva-8-3a/`.

HEAD permanece en `723c275`, staging vacío y sin commit nuevo. Se detiene para aprobación visual de 8.3a, antes de Mobile u otra funcionalidad.
