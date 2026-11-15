# M4c — Profile, Settings y Drawer Mobile

15 de noviembre de 2026 · `feat/ui-ux-web-mobile` · base verificada **`2a5b6e4`**.
Referencia consultada: texto y capturas de las **páginas 6–10** de `Documento sin título (8).pdf`.

## Cambios y commits

- **`4e9b57f` — Profile:** cabecera compartida propia/ajena integrada en la página, banner ancho, avatar circular de 96 px superpuesto, identidad/bio y separador. Edit Profile con lápiz solo en el perfil propio. Se conservan fecha, estadísticas, permisos, estados, reintentos y editor de imágenes/datos. El editor conserva su preview anterior. Logout se retira de Profile.
- **`415df7c` — Drawer/Settings:** avatar de 80 px centrado, display name y username separados, Settings junto a la identidad, separación antes de enlaces, iconos de 26 px y estrella decorativa en la selección. Skyline con los mismos rectángulos del original Web, renderizados con Views y tokens M2. Taza existente con inclinación de 320 ms al pulsar, detenida con Reduce Motion/desmontaje. Logout rojo junto a la marca llama al mismo `signOut()`; antes no había confirmación. No cambian AuthProvider, authService ni su limpieza de sesión/cachés/navegación.

**Settings reproducido antes del arreglo:** el primer acceso a `/settings` mostraba un botón visible `Home`. Era un fallback local de `headerLeft`, seleccionado mediante `navigation.canGoBack()`, que reemplazaba el Back automático. Se elimina el override, se configura `anchor: '(main)'` compatible con el Router instalado y se abre Settings con `withAnchor`. Se comprueba el Back nativo y el retorno a la sección de origen, incluido Focus Studio.

## Verificación ejecutada

- Lint y `tsc --noEmit`: aprobados, sin warnings de lint. Exportación Expo **Web** aprobada para el arnés local.
- Profile: cuatro archivos dirigidos aprobados antes de su commit. Verificación integrada: **8/8 archivos**, sin fallos ni skips: `authSession`, `m2Appearance`, `m4cDrawer`, `mobileAppearanceRendering`, `mobileMenuNavigation`, `nativeTextRendering`, `ownProfileMedia`, `profileRendering`. Cubren familias Light/Dark, acentos existentes, cabecera propia/ajena, permisos, imágenes/caché con mocks, selección/contador/logout y ausencia de strings fuera de Text. La geometría del skyline se compara íntegramente con Web.
- **`m4cNavigation.browser.mjs` aprobado:** primer Settings sin Home, Back nativo/origen y rutas por URL autenticada; perfiles propio/ajeno, edición cancelada y acceso revocado; identidad centrada, estrella, skyline/taza, animación/Reduce Motion y logout. Anchos **320/390/768** y orientación **768×390**. Capturas de fixtures del perfil y Drawer inspeccionadas en `/tmp/m4c-{profile,drawer}.png`.
- **`mobileProfile.browser.mjs` aprobado:** cancelación, validación de campos, PATCH/DELETE, identidad compartida actualizada, 403/reintento de imágenes, editor/Back, logout y aislamiento al cambiar de cuenta; anchos 320–1440. Sus capturas locales permanecen en `.expo`.
- **`m4Notifications.browser.mjs` aprobado:** logout desde Drawer con apertura pendiente y cambio de cuenta; no navega una respuesta tardía de la sesión anterior.

Chrome utiliza **APIs simuladas**. No acredita Android/Expo Go físico ni integración con backend real. Sin `adb` accesible: pendientes Back del sistema, TalkBack, SafeArea/teclado e imágenes/fluidez reales del dispositivo. Las pruebas de URL son navegaciones autenticadas dentro de la sesión; el arranque frío mediante deep link queda pendiente. Los escenarios de imágenes en Chrome cubren fallback/error/reintento; bytes y caché nativos se verifican con mocks.

## Archivos y alcance

Código bajo `frontend-mobile/src`: `app/(app)/{profile,_layout}.tsx`; `components/profile/{ProfileCover,ProfileHeader}.tsx`; `components/social/MemberProfileContent.tsx`; `components/navigation/{StudyDrawerContent,SidebarSkyline}.tsx`; `components/branding/StudyBrand.tsx`; `components/ui/AppIcon.tsx`.

Pruebas: nuevos `m4cDrawer.test.mjs` y `m4cNavigation.browser.mjs`; ajustados `profileRendering`, `mobileMenuNavigation`, `mobileAppearanceRendering`, `helpers/appearanceAuthMock`, `mobileProfile.browser` y `m4Notifications.browser`. Se adapta también el acceso a logout de `m2Appearance.browser`, `mobileAuthScenes.browser` y `mobileSocial.browser`; estos tres escenarios completos no se ejecutaron en M4c.

Solo Mobile y este informe. Cambios ajenos preservados y excluidos del staging. Sin dependencias nuevas ni modificaciones de Web, backend, infraestructura, servicios API, contrato de presencia o Dashboard M3. Sin push ni operaciones destructivas. **M4c finaliza aquí; M4d/M5 no iniciados.**
