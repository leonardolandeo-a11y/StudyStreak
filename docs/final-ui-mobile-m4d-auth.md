# M4d — Autenticación definitiva Web + Mobile

15 de noviembre de 2026 · `feat/ui-ux-web-mobile` · base verificada `bc05dc9`.
Referencia consultada: texto y capturas de las **páginas 11–12** del PDF final. La observación de presencia por dispositivo queda fuera del alcance, según la solicitud.

## Cambios y commits

- **`c21c136` — `style(mobile): refine auth forms and landscape layout`**: marco doble con detalles pixelados discretos, taza existente, título monoespaciado y controles locales de autenticación con tokens M2. No se cambian los controles compartidos del resto de pantallas. Vertical centrado y compacto; horizontal con panel derecho y paisaje visible a la izquierda. SafeArea en cuatro bordes, scroll y KeyboardAvoidingView. La orientación combina dimensiones de ventana/pantalla para que el teclado Android no convierta una pantalla vertical en horizontal. La configuración Expo ya permite orientación `default`; no se modifica.
- **`4e9bb09` — `refactor(web): streamline public authentication entry`**: presentación equivalente con marco, tipografía y controles retro; panel derecho también en viewports horizontales pequeños. La antigua introducción se sustituye por una entrada que envía invitados a `/login` y sesiones autenticadas al Dashboard, esperando la restauración cuando corresponde. `/register` y los enlaces entre formularios permanecen disponibles para invitados; las páginas públicas de autenticación redirigen sesiones existentes al Dashboard.

Los tres escenarios, recursos originales y animaciones independientes se conservan. Se elimina el blur del panel Web; no se añaden animaciones de escena ni ilustraciones. Validaciones, mensajes, proveedores de sesión y servicios/endpoints permanecen intactos. Login/Register Web no cambian sus handlers; en Mobile solo cambian sus imports de presentación.

## Verificación ejecutada

- **Lint y TypeScript aprobados en ambos proyectos:** Mobile `npm run lint` / `tsc --noEmit`; Web `npm run lint` / `tsc -b`. Sin warnings de lint. Exportación Expo **Web** aprobada para pruebas locales; no es un build Android.
- **Mobile: 7/7 archivos dirigidos**, sin skips: `m4dAuth`, `authSession`, `jwt`, `mobileSessionIntegration`, `mobileAppearanceRendering`, `m2Appearance` y `nativeTextRendering`. Incluyen diez combinaciones familia × Light/Dark, campos/botones accesibles, carga/deshabilitado y simulación del viewport vertical reducido por teclado.
- **`mobileAuthScenes.browser.mjs` aprobado:** Login/Register en mañana/tarde/noche; paisaje estático, movimiento independiente, pausa/background y Reduce Motion. Vertical 320/390; horizontal 600×390, 844×390 y 1024×768. Se comprueba acceso por scroll a cada input/botón, foco, Back simulado, formularios, conflictos/credenciales incorrectas, carga bloqueada, registro/login y logout. Capturas de fixtures en `.expo` y `/tmp/m4d-mobile-*-landscape.png`.
- **Web: 12 casos dirigidos aprobados:** `authEntry.test.mjs` (2), `authScenes.test.mjs` (3) y `jwt.test.mjs` (7). Se cubren entrada `/`, enlaces, sesiones existentes en `/login`/`/register`, persistencia por recarga, refresh, logout, rutas protegidas/deep links, errores/carga de formularios y escenas originales. `authEntry` se repitió tras completar el fixture del Goal y ajustar la medición al viewport visible de Chrome; no se ocultan fallos ni se repite toda la suite.
- Web comprueba controles visibles por scroll y alineación en 320/390 vertical, 600/844 horizontal y 1440; la regresión de escenas añade 768/1920, modos/acento y dispositivo restringido. En la emulación a 320 px el viewport de layout puede superar al visible en 16 px: se confirmó que `scrollX` sigue en cero, y se verifican los controles contra el viewport visible. No se altera el dimensionado original del paisaje para compensar esa diferencia del arnés.
- Capturas Web/Mobile inspeccionadas para contrastar marco, legibilidad y composición. Chrome utiliza **APIs simuladas**, no una integración autenticada con backend real.

**Pendiente físico:** no hay acceso a Expo Go/Android ni `adb`. Rotación y teclado reales, notch/SafeArea, Back del sistema, TalkBack, reinicio de app con sesión persistente e interrupciones/rendimiento del dispositivo. No se midieron FPS nativos; la pausa y los mecanismos de Reduce Motion existentes pasan las regresiones simuladas.

## Archivos y alcance

Mobile: `src/components/auth/{AuthScreen,AuthControls}.tsx`, `src/app/{sign-in,sign-up}.tsx`, `tests/m4dAuth.test.mjs`, `tests/mobileAuthScenes.browser.mjs`, soporte de dimensiones en `tests/helpers/appearanceNativeMock.mjs`.
Web: `src/App.tsx`, `src/pages/Home.tsx`, `src/components/auth/{AuthEntry,AuthLayout}.tsx`, `src/components/auth/auth.css`, `tests/authEntry.test.mjs`.

Solo autenticación/presentación y este informe. Sin dependencias nuevas ni cambios en Dashboard, Profile, Drawer, Study Rooms, backend, infraestructura o presencia. Cambios ajenos preservados y fuera del staging. Sin push ni operaciones destructivas. **M4d finaliza aquí; M5 no iniciado.**
