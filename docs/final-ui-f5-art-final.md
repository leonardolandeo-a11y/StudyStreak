# F5 — Corrección artística del exterior

## Alcance

Sustituye la propuesta visual de `4b49908`: fachada única inclinada con seis grandes aberturas, lateral escalonado de píxel grueso, puente horizontal, vegetación, ladera, costa y ciudad distante. No hay losas apiladas ni composición piramidal. Las referencias se interpretan como geometría SVG local; no se insertan imágenes adjuntas ni se rasteriza la interfaz.

La habitación, escritorio, libros, ventana, formularios y recursos originales de Login/Register permanecen intactos. Solo cambia el paisaje exterior y la franja inferior del sidebar. Se conservan sus colores temáticos y su altura (88 px expandido, 46 px contraído). El paisaje contraído usa una escala menor para mantener visible el edificio y su entorno. El chevron pequeño y la expansión mediante la taza mantienen su implementación anterior.

## Movimiento y revisión visual

Se conservan las tres capas de nubes independientes con ciclos lineales de 60/75/90 segundos, copias para cerrar el bucle y recorte al cielo de la ventana. En Chrome, sin adelantar animaciones, las posiciones X fueron:

| Tiempo real relativo | Nube 1 | Nube 2 | Nube 3 |
| --- | ---: | ---: | ---: |
| 0 s | −1,93 | −1,55 | −1,29 |
| 10,13 s | −42,47 | −33,97 | −28,31 |
| 20,25 s | −83,00 | −66,40 | −55,33 |

Unidades SVG. Edificio, marco e imagen mantuvieron sus transformaciones. Background pausa el movimiento y Reduce Motion lo desactiva. Se inspeccionaron capturas reales del exterior diurno/nocturno y del sidebar expandido/contraído; la aprobación artística final corresponde al usuario.

[Antes Login](images/f5-art-final/before-login.png) · [Antes sidebar](images/f5-art-final/before-sidebar.png)

[Mañana](images/f5-art-final/after-login-morning.png) · [Tarde](images/f5-art-final/after-login-afternoon.png) · [Noche](images/f5-art-final/after-login-night.png)

[Nubes 0 s](images/f5-art-final/after-clouds-t00.png) · [10 s](images/f5-art-final/after-clouds-t10.png) · [20 s](images/f5-art-final/after-clouds-t20.png)

[Expandido](images/f5-art-final/after-expanded.png) · [Contraído](images/f5-art-final/after-collapsed.png)

## Pruebas

- ESLint, `npx tsc -b --pretty false`, build Web: aprobados. Se conserva el aviso previo de chunks mayores de 500 kB.
- `node tests/authPixelHotfix.browser.mjs`: aprobado, movimiento real durante 20 segundos, estructura del paisaje, teclado/foco/colapso, background, Reduce Motion, tres franjas horarias, 390/768/1440/1920 px y combinaciones de apariencia.
- `SIDEBAR_CAPTURES=../../.local/f5-pixel/art-sidebar/ node --test --test-concurrency=1 tests/authScenes.test.mjs tests/sidebarBackground.test.mjs`: 4 pruebas aprobadas; autenticación simulada, fallback, escenas y 80 combinaciones de familia/modo/acento con contraste. Después del ajuste de escala contraída se repitió el navegador dirigido, que incluye el colapso y las combinaciones de apariencia.
- API simulada, sin escrituras persistentes. No son pruebas en teléfono físico. Los 39 archivos ajenos presentes del inventario conservan sus checksums y no se modifican los recursos de `public/auth`.

## Archivos y commit

`frontend-web/src/components/branding/BarrancoSilhouette.tsx`, `frontend-web/src/components/auth/StudyScene.tsx`, `frontend-web/src/components/layout/sidebar.css`, `frontend-web/tests/authPixelHotfix.browser.mjs`, este informe y `docs/images/f5-art-final/`.

Commit aislado: `style(web): refine pixel UTEC and coastal landscapes`. Hash consultable mediante `git log -1 --format=%h -- docs/final-ui-f5-art-final.md`.

Sin cambios en Mobile, backend, funcionalidades ni F1–F4. Sin push. Se detiene antes de F6.
