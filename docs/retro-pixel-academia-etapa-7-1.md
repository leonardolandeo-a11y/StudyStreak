# Etapa 7.1 — Retro Pixel Academia

Rama: `feat/ui-ux-web-mobile`. Base: `c1728c0`, cierre técnico de 6.7. Alcance de esta entrega: marca y elementos de identidad compartidos de navegación. Se conserva la implementación funcional de la Etapa 6.

## 1. Concepto elegido

**Una taza para estudiar, una sesión más cada día.** El isotipo original combina una taza de café pixelada, vapor en escalones y una base de cuaderno/platillo. La taza es el elemento dominante. Un pequeño dial de cinco unidades, su aguja y un acento ámbar aluden al Pomodoro dentro del cuerpo; no es un temporizador como símbolo principal ni una ilustración de cocina. El nombre StudyStreak y la firma «Small sessions. Lasting progress.» sitúan el símbolo en el contexto de estudio y constancia.

La geometría se dibujó para este proyecto, sin copiar recursos de otras apps ni descargar imágenes/fuentes. La retícula es 32×32, con rectángulos de coordenadas enteras, sin filtros, gradientes, bitmap incrustado o dependencias de red. El vapor y el asa identifican la taza en tamaños pequeños; el detalle del dial se simplifica por debajo de 25 px.

## 2. Logo, variantes y fuente única

Fuente editable: **`assets/branding/coffee-mark.json`**. Contiene la retícula y rectángulos con roles semánticos. Ejecutar desde la raíz:

```bash
node scripts/generate-branding.mjs
node scripts/generate-branding.mjs --check
```

El primer comando regenera los recursos; el segundo comprueba que siguen sincronizados, sin modificarlos. Las copias TypeScript de cada frontend son artefactos generados, no fuentes que deban editarse por separado. Las pruebas comparan ambas copias entre sí y con el JSON canónico.

| Variante | Uso y recursos |
| --- | --- |
| Horizontal / `navigation` | Isotipo 36 px + nombre + firma. Sidebar Web y pie del drawer Mobile. |
| Compacta / `compact` | Isotipo 32 px + nombre, sin firma. Topbar de Web en anchuras pequeñas. |
| Firma / `signature` | Isotipo 64 px, nombre y firma apilados, regla pixel decorativa. Preparada como componente reutilizable para usos futuros; **no aplicada a Login/Register**. |
| Sólo isotipo / `StudyMark` | Acepta tamaño; comprobado a 16/24/32/48/96 px. A 16/24 se omiten las dos piezas finas de la aguja para evitar ruido. |
| SVG claro | `assets/branding/studystreak-mark-light.svg`, transparente, contraste para fondo claro, Mint como paleta de referencia. |
| SVG oscuro | `assets/branding/studystreak-mark-dark.svg`, transparente, contraste para fondo oscuro. |
| SVG monocromo | `assets/branding/studystreak-mark-mono.svg`, silueta de taza/vapor. Usa currentColor al incrustarlo inline; para un `<img>` sobre oscuro debe elegirse el SVG oscuro. |
| Favicon | `frontend-web/public/favicon.svg`, mismo isotipo con colores que resuelven claro/oscuro mediante prefers-color-scheme. Mantiene el enlace existente del HTML. |

Los componentes de UI resuelven dinámicamente las cuatro paletas existentes, a diferencia de los SVG de exportación, cuya referencia es Mint. La variante de firma no incluye un formulario ni presupone una pantalla de autenticación nueva.

**Web:** SVG inline, shape-rendering crispEdges. **Mobile:** las mismas coordenadas se dibujan mediante View nativos posicionados y escalados a partir de la retícula. No se importa SVG como componente nativo ni se añade react-native-svg; tampoco se utilizan Object URLs o un SDK que no exista en Expo Go. Esto conserva una representación escalable de la geometría, sin rasterizar recursos para cada densidad.

## 3. Colores, tipografía y lenguaje visual

Se reutilizan `frontend-web/src/styles/tokens.css` y `frontend-mobile/src/features/appearance/theme.ts`, con sus proveedores y persistencia actuales. No se añade una segunda apariencia ni se cambian los colores globales de pantallas.

| Rol del isotipo | Web | Mobile | Propósito |
| --- | --- | --- | --- |
| ink | --ss-text | colors.text | Contorno y base, legibles en ambos modos. |
| accent | --ss-accent | colors.primary | Cuerpo de la taza y «Streak»; Mint/Blue/Purple/Orange. |
| paper | --ss-on-accent | colors.primaryText | Reflejo y pequeño dial sobre el color principal. |
| muted | --ss-text-muted | colors.muted | Vapor y firma secundaria. |
| warm | --ss-warning | colors.pending | Marca ámbar mínima, secundaria. |

Se mantienen fondo oscuro azul tinta `#0b1014` y superficie `#141c22`, con capas distinguibles; no se introduce negro puro como lienzo. El modo claro conserva sus superficies y contrastes existentes. No se usa el ámbar para comunicar presencia ni estados inventados.

- **Lectura:** tipografía de sistema existente, sin cambios en formularios, contenidos o módulos.
- **Acento de marca:** monoespaciada local, de carácter académico/terminal. Web: ui-monospace/SFMono-Regular/Consolas/Liberation Mono/monospace. Native: Menlo en iOS, monospace en Android/web. No se requiere cargar fuentes para ver el logo.
- **Escala:** nombre 16 px/sp en navegación, 24 en firma; texto auxiliar 11, 12 en firma. El cuerpo de la aplicación conserva su escala legible. El texto nativo sigue admitiendo el escalado del sistema; se debe comprobar su comportamiento físico con fuente grande.
- **Bordes/sombra:** el contorno escalonado pertenece al isotipo. `PixelRule` aporta una barra de dos unidades con una segunda capa desplazada y color de borde, sin sombra amplia ni efecto neón. No se convierten las tarjetas de la aplicación en marcos gruesos.
- **Iconografía:** los iconos funcionales actuales permanecen; el logo no se reutiliza como icono de Dashboard/Menu. La marca deja de emplear una inicial genérica o el mosaico de Dashboard.
- **Hover/focus/pressed:** permanecen las respuestas y foco visible de los componentes de navegación existentes. La marca es informativa, no un botón nuevo; no se inventa una acción al pulsarla. `NavigationPressable` conserva el pressed nativo y los enlaces Web sus estados de foco/hover.
- **Movimiento:** el logo y PixelRule son estáticos, sin vapor en loop, parpadeos ni animación automática. Las microanimaciones de navegación existentes conservan Reduce Motion. No se toca la configuración global.

## 4. Componentes reutilizables y accesibilidad

En cada frontend, **`components/branding/StudyBrand.tsx`** exporta:

- `StudyMark`: isotipo aislado, con nombre accesible cuando se usa solo.
- `StudyBrand`: variantes horizontal, compacta y de firma; una única identidad accesible «StudyStreak», evitando anunciar cada rectángulo o duplicar el texto.
- `PixelRule`: detalle decorativo oculto para lectores de pantalla, aplicado sólo en la firma preparada.

Los elementos decorativos no son controles ni añaden rutas/tab stops funcionales. Los botones táctiles, perfil, Settings, contador, cierre del drawer y navegación existente conservan su implementación. En Web, el CSS está acotado a study-brand/study-mark; no cambia los selectores ni fuentes de Login/Register o del contenido principal.

## 5. Integración aplicada

- `frontend-web/src/components/layout/AppSidebar.tsx`: marca horizontal donde antes estaba la «S» y el texto.
- `frontend-web/src/components/layout/MobileTopbar.tsx`: variante compacta en el encabezado de identidad existente.
- `frontend-mobile/src/components/navigation/StudyDrawerContent.tsx`: marca horizontal al pie del drawer, conservando avatar/nombre del usuario, Settings, orden y acciones.
- Favicon Web sustituido; no se cambia app.json, icono del launcher, plugins ni configuración nativa de compilación.

No se editan Login/Register, Dashboard, Focus Studio, Goals o Study Rooms. Verlos en las capturas de fixtures sólo da contexto a la navegación compartida; no significa que se hayan rediseñado. No se cambian servicios, autenticación, audio, temporizadores, permisos, contratos REST, backend ni base de datos.

## 6. Archivos de esta etapa

- Canónico y SVG: `assets/branding/coffee-mark.json`, `studystreak-mark-light.svg`, `studystreak-mark-dark.svg`, `studystreak-mark-mono.svg`.
- Generador: `scripts/generate-branding.mjs`.
- Web: `src/components/branding/StudyBrand.tsx`, `brand.css`, `mark.ts`; `src/components/layout/AppSidebar.tsx`, `MobileTopbar.tsx`; `public/favicon.svg`; `tests/branding.test.mjs`; `package.json` (agrega las regresiones de marca a test:ui, sin dependencias).
- Mobile: `src/components/branding/StudyBrand.tsx`, `mark.ts`; `src/components/navigation/StudyDrawerContent.tsx`; `tests/branding.test.mjs`, `tests/mobileBranding.browser.mjs`.
- Documentación: este archivo.

Las dos copias mark.ts y los SVG se regeneran desde el canónico; no se mantienen coordenadas independientes por pantalla. Los 16 elementos preexistentes ajenos se conservan fuera del staging.

## 7. Pruebas y evidencia

- `node scripts/generate-branding.mjs --check`: correcto; sin diferencias entre canónico y recursos generados.
- ESLint Web y Mobile: aprobados sin errores/advertencias. TypeScript Web (`tsc -b` dentro de build) y Mobile (`tsc --noEmit`): aprobados.
- Build Web aprobado. Persiste la advertencia conocida E-05 de chunk Study Rooms superior a 500 kB, sin cambios funcionales en ese módulo ni en su carga.
- Nueve pruebas Web aprobadas entre `branding.test.mjs`, `designSystem.test.mjs`, `profileRendering.test.mjs` y `trackingPolish.test.mjs`. Se comprueban geometría/variantes, una identidad accesible, favicon, temas/paletas, foco y microanimaciones preexistentes. Las pruebas Chrome utilizan API simulada; no escriben en PostgreSQL.
- El recorrido de marca Web verifica 320/375/768/1440 px, Dark/Light/System y cuatro paletas. Nombre/acento sobre el lienzo del tema superan contraste **4,5:1** en los escenarios medidos. No se presenta como auditoría exhaustiva de todo el contraste de la aplicación.
- Tres archivos de tests Mobile aprobados: branding, mobileMenuNavigation y mobileAppearanceRendering. Incluyen renderizado en modos/paletas, tamaños y accesibilidad de marca sin imágenes externas/SDKs.
- Dos recorridos Chrome Mobile aprobados: `mobileBranding.browser.mjs` y `mobileNavigation.browser.mjs`. Verifican primitivas de píxeles, drawer 320/390/768/1440, cierre, Settings/Back, Light/Orange, navegación contextual y contador. React Native Web no equivale a Android físico.
- Exportaciones Expo para **web y Android** aprobadas, sin instalar paquetes ni ejecutar una compilación nativa. No hay errores de importación de recursos.
- Inspección visual de capturas Web en claro/oscuro (isotipos de 16–96 px y firma) y del drawer nativo compartido. Las capturas son artefactos de revisión en /tmp y .expo ignorado, no assets que la aplicación descargue.

No se repiten suites completas de autenticación/ledger: el código de esos módulos no cambió. Las regresiones dirigidas comprueban la navegación compartida afectada.

## 8. Límites y comprobaciones manuales

No se ha operado un teléfono. En Expo Go real queda revisar la nitidez en la densidad de pantalla Android, escalado de fuente, Menlo/monospace según plataforma, TalkBack anunciando una sola marca, estado System al cambiar tema del SO y apertura/cierre físico del drawer. Repetir con fuente grande y Reduce Motion; el logo debe mantenerse estático y no tapar controles.

No se ha creado development build ni se cambian iconos nativos de launcher/splash. El favicon usa Mint y tema del navegador, no sincroniza la paleta guardada dentro de la aplicación. Para exportación externa elegir SVG claro/oscuro según fondo; el monocromo permite controlar el color cuando se usa inline.

La firma reutilizable para autenticación sólo se prepara como recurso. Su aplicación, ilustraciones o escenarios dinámicos pertenecen a 7.2, que **no comienza aquí**. No se crean fondos o mascotas de otras apps ni se copia CSS/DOM dentro de React Native.

## 9. Commit y cierre

Commit principal: **`3d1bd60 feat(ui): establish retro pixel academia branding`**, con los 18 archivos de código, recursos y pruebas. Este documento se registra en un commit documental separado para incluir el hash real, sin amend ni referencias circulares al hash del propio documento.

Estado final: corrección de marca y documento registrados mediante staging explícito; sin cambios de esta etapa pendientes. Permanecen los 16 elementos preexistentes ajenos fuera de ambos commits. El hash documental se informa en la entrega final y se consulta en git log.

Sin push, merge, reset o cambios en AWS, producción, Docker, PostgreSQL, Spring ni archivos privados. La etapa se detiene después de 7.1.
