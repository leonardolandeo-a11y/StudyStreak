# Hotfix — Cabecera del sidebar Web

La cabecera expandida pasa de 76 a 104 px para reservar una línea de eslogan y separar la marca de Dashboard. Taza y título siguen centrados, con el chevron pequeño al lado. Las filas del menú conservan 52 px de altura y 4 px de separación.

`StudyBrand` incorpora una opción `taglinePresentation="inline"` usada exclusivamente por `AppSidebar`. El eslogan aparece bajo el nombre, sin rol tooltip, fondo, borde ni sombra. Su espacio permanece reservado: hover/foco no desplazan el menú. Opacidad y desplazamiento vertical de 4 px usan 180 ms; Escape lo oculta sin perder el foco. Reduce Motion del sistema y de StudyStreak eliminan la transición.

Contraído, la cabecera conserva 76 px y solo muestra la taza para expandir; no existe eslogan ni otro botón. El comportamiento predeterminado de la marca en Login/Register se conserva.

## Verificación

- ESLint, TypeScript y build Web aprobados; continúa el aviso previo de chunks mayores de 500 kB.
- `node tests/sidebarHeader.browser.mjs`: aprobado. Hover/foco/Escape, una única instancia sin tooltip, geometría estable, alineación, filas del menú sin cambios, colapso/expansión, recorrido de teclado, 15 combinaciones familia/modo, ambas preferencias de movimiento reducido, navegación y 390/768/1440/1920 px.
- `F5_CAPTURES=../../.local/f5-pixel/header-branding-regression/ node tests/finalBrandingNavigation.browser.mjs`: regresión de marca, Login/Register, navegación, temas y selección de Validations. Se actualizan las expectativas del eslogan y altura, y se espera al renderizado de Back antes de pulsarlo.
- API simulada, sin datos persistentes. Los 39 archivos ajenos presentes conservan sus checksums. No se modifican ilustraciones, Dashboard, escenarios, Mobile ni backend.

[Oculto](images/sidebar-header-hotfix/expanded-hidden.png) · [Hover](images/sidebar-header-hotfix/expanded-hover.png) · [Foco](images/sidebar-header-hotfix/expanded-focus.png) · [Contraído](images/sidebar-header-hotfix/collapsed.png).

Archivos: `branding/StudyBrand.tsx`, `layout/AppSidebar.tsx`, `layout/sidebar.css`, `tests/sidebarHeader.browser.mjs`, `tests/finalBrandingNavigation.browser.mjs`, este informe y sus capturas.

Commit aislado: `fix(web): refine sidebar header spacing and inline tagline`. Hash mediante `git log -1 --format=%h -- docs/sidebar-header-hotfix.md`. Sin push ni operaciones destructivas. Se detiene tras este hotfix.
