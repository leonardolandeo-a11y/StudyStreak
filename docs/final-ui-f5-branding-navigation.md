# F5 — Identidad visual y navegación Web

Base `a91f20b`, rama `feat/ui-ux-web-mobile`. Se conserva F1–F4; no hay cambios en Mobile, servicios API, autenticación, backend, infraestructura ni recursos históricos.

## Refinamientos

- Sidebar: taza de 44 px (antes 36), título centrado debajo y tagline existente visible al hover/foco. Tooltip relacionado mediante `aria-describedby`, descartable con Escape; transición de 180 ms y gesto único de taza de 320 ms. Ambas animaciones respetan Reduce Motion del sistema y de Settings.
- El bloque de marca sigue ocupando 76 px: no se reduce el alto útil del menú. Colapso/expansión, tooltips de navegación, contadores, avatar, Settings y logout permanecen.
- `BarrancoSilhouette` reemplaza la ciudad genérica dentro del mismo viewBox/alto. Combina terrazas de campus, puente, perfil costero y casas bajas. SVG original local y reutilizable, pintado con tokens de fondo/acento en el sidebar. Es una interpretación decorativa, no una reproducción arquitectónica ni un mapa.
- En Login/Register esa geometría se integra con baja opacidad en el área ya recortada de la ventana, detrás del marco. Se mantienen los recursos, los formularios y su composición. Las nubes se desplazan más lentamente, la iluminación de tarde varía tenuemente y las estrellas tienen un destello suave. Los efectos siguen pausando en background y con movimiento reducido.
- La marca de autenticación utiliza la misma interacción opcional que el sidebar; la marca compacta conserva su disposición horizontal.
- Cabecera autenticada: en pantallas principales se conserva el título sin Back ni atajo repetido a Dashboard. En detalles se mantienen jerarquía útil y Back: historial si se llegó navegando; padre de la ruta como fallback de un deep link directo. Member Profile evita los antiguos enlaces intermedios `/users` y `/users/:id`, que no eran destinos válidos. Study Partners y acciones contextuales permanecen. Dashboard/Focus conservan su cabecera inmersiva.
- Validations: se elimina exclusivamente el enlace textual View profile y su import. No se alteran selección, pasos, IDs, evidencias, formularios ni operaciones. Los accesos a perfiles de Tracking, Study Partners y Study Rooms permanecen.

Referencia conceptual de las terrazas: [descripción oficial del campus UTEC](https://utec.edu.pe/blog-de-carreras/utec/por-que-el-campus-de-utec-no-esta-pintado). No se descargaron ni incorporaron fotografías, logos institucionales o imágenes externas.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| ESLint | Aprobado, sin warnings |
| `npx tsc -b --pretty false` | Aprobado |
| Build Web | Aprobado; sigue el aviso previo de chunk multimedia >500 kB |
| `headerNavigation.test.mjs` | Títulos principales sin shortcuts repetidos, padres de detalles, Member Profile y rutas con slash final |
| `branding.test.mjs` | Geometría original de taza, identidad compacta/firma, contraste, responsive y navegación |
| `authScenes.test.mjs` | Escenas locales, franjas/foreground, movimiento, fallback estático, recursos limitados, formularios Login/Register, errores/loading y autenticación simulada |
| `goalWorkflows.test.mjs` | Cinco pasos completos del wizard, borrador, evidencias, confirmación, creación/actualización y permisos/IDs con API simulada |
| `sidebarBackground.test.mjs` | 80 combinaciones de familias/modos/sistema/acento, contraste, geometría nueva acotada, independencia del acento y controles del sidebar |
| `finalBrandingNavigation.browser.mjs` | Taza/title/tooltip/foco/Escape, animación efectiva, banda de 76 px, colapso, seis escenas Login/Register, background/Reduce Motion, rutas protegidas, deep links, Back/historial, selección del wizard, logout y responsive |

Las cuatro regresiones existentes sumaron siete pruebas aprobadas; la prueba visual nueva y la suite de navegación también pasaron. Capturas inspeccionadas a 390, 768, 1440 y 1920 px. Los tests usan Chrome headless, respuestas de contrato y escrituras simuladas; no se utilizaron cuentas personales ni PostgreSQL persistente. Pendiente manual: revisión con lector de pantalla y preferencias reales del dispositivo.

## Capturas

| Vista | Antes | Después |
| --- | --- | --- |
| Sidebar y navegación | [Antes](images/final-ui-f5/before-sidebar-navigation.png) | [Marca enfocada](images/final-ui-f5/after-sidebar-title-focus.png), [contraído](images/final-ui-f5/after-sidebar-collapsed.png) |
| Login | [Antes](images/final-ui-f5/before-login.png) | [Mañana](images/final-ui-f5/after-login-morning.png), [tarde](images/final-ui-f5/after-login-afternoon.png), [noche](images/final-ui-f5/after-login-night.png) |
| Register | — | [Mañana](images/final-ui-f5/after-register-morning.png), [tarde](images/final-ui-f5/after-register-afternoon.png), [noche](images/final-ui-f5/after-register-night.png) |
| Validations | [Antes](images/final-ui-f5/before-validations.png) | [Después](images/final-ui-f5/after-validations-no-profile.png) |

Responsive autenticado: [390](images/final-ui-f5/after-workspace-390.png), [768](images/final-ui-f5/after-workspace-768.png), [1440](images/final-ui-f5/after-workspace-1440.png), [1920](images/final-ui-f5/after-workspace-1920.png). Autenticación: [390](images/final-ui-f5/after-auth-390.png), [768](images/final-ui-f5/after-auth-768.png), [1440](images/final-ui-f5/after-auth-1440.png), [1920](images/final-ui-f5/after-auth-1920.png).

## Archivos y Git

Todos bajo `frontend-web/src`, salvo tests y este informe:

- `components/branding/StudyBrand.tsx`, `brand.css`, `BarrancoSilhouette.tsx`.
- `components/layout/AppSidebar.tsx`, `SidebarSkyline.tsx`, `sidebar.css`.
- `components/auth/AuthLayout.tsx`, `StudyScene.tsx`, `auth.css`.
- `components/navigation/AuthenticatedLayout.tsx`, `Breadcrumbs.tsx`, `BackButton.tsx`, `headerNavigation.ts`.
- `pages/Validations.tsx`.
- `frontend-web/tests/finalBrandingNavigation.browser.mjs`, `headerNavigation.test.mjs`, `sidebarBackground.test.mjs`. Esta última actualiza la expectativa de geometría y permite guardar capturas de regresión fuera de evidencias anteriores.
- Este informe y 23 capturas en `docs/images/final-ui-f5/`.

Commit: `style(web): refine branding navigation and auth scenes`. Hash consultable con `git log -1 --format='%h %s' -- docs/final-ui-f5-branding-navigation.md` e informado en la entrega. Cambios ajenos y recursos históricos preservados y excluidos del staging. Sin push, merge, amend ni operaciones destructivas. F5 finaliza aquí.
