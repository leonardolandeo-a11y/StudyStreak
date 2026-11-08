# Etapa 6.2b — Apariencia y navegación Mobile

Rama `feat/ui-ux-web-mobile`. Base de sesión conservada: `fd56939`. Referencias: [auditoría de paridad](auditoria-paridad-web-mobile.md) y [sistema visual Web](sistema-visual.md).

## Sistema de apariencia

Un único `AppearanceProvider` en el layout raíz envuelve a AuthProvider y permanece durante login/logout y cambios de cuenta. Expone preferencias, tema resuelto, movimiento efectivo, estado de hidratación y errores de persistencia. No depende de endpoints ni datos de usuario.

- Modos **Dark / Light / System**; paletas **Mint / Blue / Purple / Orange**. Predeterminado Dark/Mint, equivalente a Web.
- `features/appearance/theme.ts` mapea los roles de `frontend-web/src/styles/tokens.css` a objetos TypeScript: fondo, superficies, bordes, texto secundario/muted, acción/on-accent/selección/foco y estados independientes de la paleta. Incluye espaciado, radios y tipografía; se conserva la fuente del sistema, escalado de texto y mínimo táctil de 48 dp.
- System responde a `Appearance.addChangeListener`. Movimiento efectivo es preferencia local **o** accesibilidad del dispositivo; apagar el switch no anula el SO. Se limpian listeners al desmontar y se evita que una consulta inicial tardía sobrescriba un evento reciente.
- `appearanceStorage` reutiliza FileSystem: `Paths.document/appearance/preferences-v1.json`, escritura temporal y reemplazo, con cola de persistencia. Guarda únicamente `{mode, accent, reduceMotion}`. Para preview web móvil usa `studystreak:appearance:v1` de localStorage, sólo con datos de apariencia.
- Hidratación antes de mostrar rutas; preferencias inválidas vuelven a valores seguros. Un fallo de almacenamiento mantiene el tema en memoria y muestra un error/retry en Settings. No altera SecureStore, tokens, outbox, preferencias de Focus ni privacidad social.

## Settings, navegación y aplicación inicial

Nueva ruta `/(app)/settings`: controles con estado seleccionado y check además de color, muestras de paleta, switch de movimiento reducido, estado efectivo del dispositivo, preview y restauración de apariencia predeterminada. Los cambios son inmediatos y locales; no se añaden opciones sociales.

El Stack autenticado conserva las rutas y utiliza encabezados nativos con títulos legibles, Back nativo y acceso a Settings. El acceso se marca seleccionado y se deshabilita en Settings para evitar duplicados. Un enlace directo a Settings sin historial ofrece Home. Home conserva sus accesos y añade Settings. No se cambia a tabs/drawer ni se implementa Dashboard.

Login/Register/Home y Settings consumen el tema completo. Se actualizan `ActionButton`, `FormField`, `StatusMessage`, `PageControls` y `Screen`, y se añaden `Card` y `PageHeading`. Botones y campos reservan bordes de foco sin desplazar contenido; labels, disabled/busy/selected, alertas de error y mensajes de éxito conservan semántica accesible. Screen evita duplicar SafeArea superior cuando hay encabezado y permite ajustes de teclado en iOS. StatusBar sigue el tema efectivo. Las transiciones del Stack, el modal de Resources y el pulso decorativo del reproductor de voz respetan movimiento reducido; no se cambia reproducción, grabación ni sensores.

## Superficies pendientes y migración progresiva

Los siguientes módulos conservan sus tarjetas, textos, gráficos e ilustraciones basados en `constants/palette.ts` o colores literales: Goals/Daily Records/rachas, Tracking, Validations, Study Rooms/medios/chat, Resources, Notifications, cámara/voz y estadísticas de Focus. El encabezado y los controles compartidos sí consumen el tema.

`Screen` mantiene por defecto el canvas oscuro de esas pantallas. Las pantallas migradas usan `<Screen themed>`. Esto evita poner sus textos claros fijos sobre un fondo Light antes de migrarlas. FormField y PageControls aportan su propia superficie temática para conservar contraste incluso dentro de tarjetas antiguas. No se presenta este resultado como paridad Light completa de todos los módulos.

Para una migración posterior: usar `useAppearance` / `useThemedStyles`, sustituir colores de contenido/superficie por roles semánticos, activar `themed` y comprobar los ocho temas. Las ilustraciones decorativas pueden conservar su identidad si el texto mantiene contraste. No hay segundo proveedor o estado de apariencia para pantallas antiguas.

Focus Studio permanece sin cambios de archivo o lógica. Sus preferencias persistidas de color/sonidos/duración se conservan, sin migración ni sobrescritura en esta etapa. Su futura adaptación visual deberá separar tokens de interfaz de las ilustraciones y preferencias históricas; el registro UUID, outbox y audio quedan fuera de ese ajuste.

## Verificación

- `npm run lint`: **OK**, sin advertencias.
- `./node_modules/.bin/tsc --noEmit --incremental false`: **OK**.
- `node --experimental-strip-types --test tests/*.test.mjs`: **15 archivos aprobados**, cero fallos; incluye las regresiones de sesión 6.2a, Pomodoro, metas vinculadas, reloj de salas, navegación y voz.
- Nuevos tests: **7** de estado/almacenamiento y **5** de renderizado. Cubren valores dañados, persistencia al crear otra instancia, cola de cambios, fallos/retry, System, limpieza, preferencia de movimiento local/SO y carrera inicial; render de ocho temas, contraste mínimo 4.5:1 de combinaciones de texto probadas, formularios, selección, busy/error/success, Settings y configuración del Stack.
- Renderizado con React y primitivas nativas simuladas, FileSystem y Router aislados. No es una prueba visual en hardware: navegación Back, foco nativo, SafeArea, permisos y geometría del teclado requieren Expo Go. No se certifica responsive real mediante esas pruebas. Los helpers sólo se cargan desde tests; no entran al runtime.
- Se añade `npm run test:appearance`; no se instalan dependencias ni se actualizan versiones/lockfiles. No se ejecutan HTTP autenticados ni escrituras de base de datos.

## Comprobación mínima pendiente en Expo Go

1. Abrir Home → Settings; elegir Light/Orange, cerrar completamente y reabrir la app. Comprobar restauración, también tras logout/login. Volver con Back y comprobar que conserva la pantalla anterior; repetir desde otra ruta.
2. Recorrer Dark/Light × cuatro paletas; verificar textos, mensajes, controles, Settings activo y StatusBar. Elegir System y alternar el tema del dispositivo sin recargar.
3. Activar Reduce motion local, navegar y abrir un detalle de libro. Repetir con reducción del SO activada y el switch local apagado: las transiciones siguen reducidas. Durante reproducción de una evidencia, el pulso debe quedar estático sin detener el audio.
4. En teléfono estrecho (aprox. 320–390 dp) y orientación admitida, comprobar scroll, teclado en Login/Register, tamaños grandes de texto, VoiceOver/TalkBack y foco de teclado externo. Las opciones pueden envolver en varias filas y los botones mantienen 48 dp mínimos.
5. Confirmar acceso a rutas existentes y retorno, sin probar creando datos reales. Las pantallas antiguas continúan oscuras; el tema completo de esos módulos se abordará en sus entregas autorizadas.

## Archivos de la etapa

Dentro de `frontend-mobile`:

- `src/features/appearance/{theme,appearanceStore}.ts`, `src/services/appearanceStorage.ts`.
- `src/contexts/AppearanceContext.ts`, `AppearanceProvider.tsx`, `src/hooks/useAppearance.ts`.
- `src/app/_layout.tsx`, `(app)/_layout.tsx`, `(app)/settings.tsx`, `(app)/home.tsx`, `sign-in.tsx`, `sign-up.tsx`.
- `src/components/navigation/SettingsLink.tsx`; `src/components/ui/{ActionButton,FormField,StatusMessage,PageControls,Screen,Card,PageHeading}.tsx`.
- Sólo adaptación de movimiento en `src/components/records/RecordVoice.tsx` y `src/app/(app)/resources/index.tsx`.
- `tests/appearanceState.test.mjs`, `mobileAppearanceRendering.test.mjs`; helpers `appearanceTestLoader`, `appearanceNativeMock`, `appearanceRouterMock`, `appearanceAuthMock`, `appearanceFileSystemMock` en `tests/helpers/`; script `test:appearance` de `package.json`.

Además, este documento. Los elementos preexistentes ajenos se conservan fuera del staging. Sin cambios en frontend-web, API/sesión 6.2a, Spring Boot, PostgreSQL, Docker, AWS, archivos privados, dependencias o Focus Studio. La etapa se detiene aquí, antes de Dashboard y Focus.
