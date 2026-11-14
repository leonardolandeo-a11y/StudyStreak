# F1 Hotfix — Sidebar y Background Theme

Base `dfb2e79`, rama `feat/ui-ux-web-mobile`.

La excepción lavanda conservada en F1 era incorrecta: `sidebar.css` redefinía cinco tokens e imponía colores fijos a iconos y selección. La ciudad era una imagen SVG externa con su propia paleta, incapaz de heredar los tokens del documento.

## Corrección

- Sidebar, navegación, bordes, hover, botones y zona de cuenta heredan los tokens globales de la familia elegida.
- La opción activa mantiene borde, indicador y estrella retro con el acento seleccionado. Su tinte se limita al 8 % para conservar contraste, incluida la combinación Sky Dark + Blue.
- `SidebarSkyline.tsx` conserva exactamente los **91 rectángulos**, coordenadas y orden de pintura del SVG original. Sólo cambia su pintura: edificios y sombras según la familia; ventanas y estrellas como pequeños acentos. Sin filtros aproximados ni cambios en el recurso original utilizado como referencia.
- Sin cambios de dimensiones, rutas, logo, permisos, preferencias, tooltips, controles de expansión ni microanimaciones. No se modificó UserPanel: sus tokens ya eran semánticos y ahora heredan los valores correctos.

## Pruebas

Chrome con peticiones GET simuladas, sin backend ni datos personales:

- **80 combinaciones** de cinco familias, Light/Dark/System y cuatro acentos; System comprobado en ambos esquemas del dispositivo.
- Fondo del sidebar idéntico al canvas seleccionado; colores de edificios independientes del acento y diferentes para cada familia.
- Contraste mínimo medido: **4,86:1** para texto normal/muted/activo; **4,06:1** para bordes de controles. Iconos superiores a 3:1. No constituye una certificación de cada píxel decorativo.
- Hover real en las cuatro combinaciones solicitadas; foco visible, tooltip accesible, Escape, expansión 84/264 px, animación del libro y Reduce Motion.
- Regresiones existentes de navegación/interacciones y avatares/microanimaciones: **3/3 aprobadas**.
- ESLint, TypeScript y build Web aprobados. Permanece el aviso previo de chunks mayores de 500 kB.

El primer ensayo detectó un contraste activo de 4,496:1 en Sky Dark + Blue; se corrigió antes del cierre. Otros ajustes intermedios del test esperaron las transiciones existentes y usaron el nombre accesible del botón Expand, que no muestra texto. La ejecución final completa pasó.

Desde `frontend-web`:

```sh
npm run lint
npx tsc -b
npm run build
node --test tests/sidebarBackground.test.mjs
node --test --test-concurrency=1 tests/workspaceInteractions.test.mjs tests/socialAvatarCompletion.test.mjs
```

Logs y mediciones: `.local/f1-sidebar/` (fuera de Git).

## Capturas inspeccionadas

| Combinación | Captura |
| --- | --- |
| Defecto anterior: Sage Dark + Mint con sidebar morado | [Antes](images/final-ui-f1-sidebar/before-sage-dark-mint.png) |
| Sage Dark + Mint | [Corregido](images/final-ui-f1-sidebar/sage-dark-mint.png) |
| Lavender Dark + Purple | [Captura](images/final-ui-f1-sidebar/lavender-dark-purple.png) |
| Neutral Light + Blue | [Captura](images/final-ui-f1-sidebar/neutral-light-blue.png) |
| Amber Light + Orange | [Captura](images/final-ui-f1-sidebar/amber-light-orange.png) |

## Archivos y Git

Tres archivos de implementación: `frontend-web/src/components/layout/AppSidebar.tsx`, `sidebar.css` y `SidebarSkyline.tsx`. Regresión nueva: `frontend-web/tests/sidebarBackground.test.mjs`. Este informe, una aclaración en el informe original F1 y cinco capturas completan el hotfix.

Se conservaron los 39 archivos pendientes preexistentes, incluidos los 16 elementos ajenos y 8.1b. Commit local exclusivo **`fix(web): apply background themes to sidebar`**, identificable con `git log -1 --format=%h -- docs/final-ui-f1-sidebar-hotfix.md`. Sin cambios Mobile, backend, infraestructura ni otras funcionalidades; sin push, merge, amend, reset o clean. Se detiene el trabajo sin iniciar F2.
