# Revisión 7.2 — Fullscreen Animated Pixel Art

Base: `fdfb079`, rama `feat/ui-ux-web-mobile`. Esta revisión sustituye la composición de dos columnas y las escenas estáticas descritas en la entrega inicial de 7.2. Sólo se modifica Login/Register Web y Mobile, sus componentes gráficos, generadores y pruebas. Se reutilizan branding, reloj local, proveedores de apariencia y autenticación.

## Composición y dirección artística

El fondo ocupa la ventana completa. La tarjeta flotante contiene logo de taza, firma, título y formulario. En escritorio queda a la derecha para mostrar ventana y escritorio; en tablet/teléfono se centra. Desaparece el contenedor compartido ilustración/formulario y sus márgenes vacíos. La tarjeta conserva los tokens y tiene una superficie con aproximadamente 96 % de opacidad, borde fino y foco visible.

La habitación original se amplió de 160×104 a **400×250**. Contiene 800 rectángulos de detalle más la taza de 7.1: ventana con profundidad y cortinas, cielo, montañas y población exterior, estantería con libros individuales, notas botánicas, escritorio con vetas, molduras/cajones, cuaderno con líneas, gafas, papeles, lápiz, planta, lámpara, silla y alfombra. La arquitectura, plano medio y primer plano comparten la misma geometría en las tres franjas.

- **05:00–11:59:** cielo rosado, sol bajo, nubes y rayos cálidos sobre el escritorio.
- **12:00–17:59:** cielo azul/dorado, luz diurna y nubes en movimiento.
- **18:00–04:59:** luna, estrellas, paisaje índigo y cono cálido de lámpara.

La escena depende exclusivamente de la hora local. El formulario depende de Dark/Light/System y Mint/Blue/Purple/Orange. No se cambian permisos, contratos REST, mensajes, validaciones, JWT, refresh, restauración ni aislamiento entre cuentas.

## Evaluación de motores y compatibilidad

Instalado y comprobado en el repositorio: Expo **58.0.23**, React Native **0.88.1**, Reanimated **4.7.1**. El manifiesto bundledNativeModules de Expo 58 recomienda Skia **2.14.0**, coherente con la [documentación de Skia para SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/skia/), que lo incluye en Expo Go. Skia no estaba instalado; su soporte web requiere CanvasKit. No se afirma haber instalado ni ejecutado Skia en el teléfono.

Se evaluó [Application de PixiJS 8](https://pixijs.com/8.x/guides/components/application): ofrece renderer WebGL/WebGPU, sprites, ticker y gestión de recursos, pero esta escena no necesita física, interacción sobre sprites ni render dinámico complejo. Introducir dos motores añadiría inicialización, otro ciclo de vida y dependencias para animar cuatro capas.

**Elección:** SVG local más grupos SVG animados mediante CSS en Web; texturas PNG originales locales más React Native Animated con native driver en Android/iOS. No se instalan paquetes, cambian versiones, lockfiles ni plugins. Expo Go conserva sólo módulos ya presentes (Animated y expo-device). React Native Web utiliza el driver web disponible para las pruebas; no equivale al driver nativo del teléfono.

## Assets reproducibles

```bash
node scripts/create-study-room.mjs
node scripts/generate-auth-scenes.mjs
node scripts/create-study-room.mjs --check
node scripts/generate-auth-scenes.mjs --check
```

`create-study-room.mjs` es la fuente de autoría de la geometría: genera `assets/auth/study-room.json` con detalle determinista, sin recursos descargados. Conserva las paletas existentes. `generate-auth-scenes.mjs` incorpora la taza original, valida coordenadas/roles y produce:

- Tres SVG completos en `assets/auth/` para revisar/exportar la escena.
- Tres SVG base y tres PNG completos de respaldo en `frontend-web/public/auth/`.
- Dieciocho PNG en `frontend-mobile/assets/auth/`: base, fallback completo, clouds, steam, stars y glow por franja.
- `sceneData.ts` compartido en ambos frontends con dimensiones, paletas y efectos; no envía las 800 piezas como nodos nativos. `sceneImages.ts` registra imports estáticos para Metro.
- Las copias existentes de `studyPeriod.ts`, sin cambiar su lógica.

El generador PNG usa zlib y un encoder RGBA/CRC local, sin paquetes gráficos nuevos. Rasteriza coordenadas enteras; el fallback compone también las opacidades de iluminación y vapor. SVG usa crispEdges y Web image-rendering pixelated; en React Native Web se configura igualmente el muestreo pixelado. Las texturas conservan relación 400:250 y todas las capas usan el mismo cálculo cover. El muestreo final y densidad Android quedan sujetos a inspección física.

## Animación, accesibilidad y recursos

| Capa | Movimiento |
| --- | --- |
| Nubes | Desplazamiento horizontal corto, tramos de 26 s. Sólo de día. |
| Vapor | Ascenso de 7 unidades y disolución, ciclo de 4,5 s. |
| Estrellas | Variación suave de opacidad cada 8 s, sin flashes rápidos. Sólo de noche. |
| Luz | Opacidad aproximada 0,06–0,16, tramos de 9 s. |
| Profundidad | Web: desplazamiento de pocos píxeles por puntero, con distinta amplitud entre base/efectos. Mobile: leve deriva de base respecto a capas ambientales, sin sensores. |

No se animan formularios ni se solicitan permisos. El fondo está fuera del árbol accesible y no recibe puntero/toques; los controles permanecen encima.

Web pausa CSS al ocultar la pestaña y al activar Reduce Motion global o del sistema. Con movimiento reducido se elimina la animación CSS; la escena permanece visible. Detecta conservadoramente memoria <=2 GiB, <=2 núcleos o Save-Data y mantiene el fondo estático. Listeners de visibilidad/media query y MutationObserver se eliminan al desmontar. El parallax sólo procesa eventos de ratón cuando la política permite movimiento; no tiene un loop JS propio.

Mobile combina la preferencia global/sistema existente con foco de ruta y AppState. Detiene y reinicia valores/loops al salir, ocultarse o reducir movimiento; se simplifica a escena estática con memoria <=3 GiB conocida o memoryWarning. No ejecuta un setInterval/render React por frame. La limpieza tolera plataformas que no devuelven suscripción para memoryWarning; el recorrido Login/Register cubre esta regresión detectada en React Native Web.

El reloj existente mantiene un único timeout al siguiente límite y lo cancela en background/desmontaje. Se conservan sus pruebas de fronteras, DST y limpieza.

No hay un contexto gráfico nuevo que pueda impedir el formulario. Ante error del SVG base Web se muestra el PNG completo y se retiran las capas animadas; ante error de carga de la base nativa se utiliza su PNG completo. Si tampoco carga el respaldo, la superficie ambiental y el formulario siguen disponibles. La prueba de fallo se inyecta en Web; no se simula una avería física de GPU/decoder Android.

Los assets de ejecución Web y Mobile suman aproximadamente **217 KiB** sin comprimir (duplicados por plataforma incluidos); no requieren Internet. Una textura RGBA 400×250 representa unos 0,4 MB descomprimida: las cinco capas visibles suponen alrededor de 2 MB, sin contar caché del sistema. Es una estimación de tamaño, no una medición de RAM/FPS en teléfono. Se cargan imports locales y el sistema puede conservar texturas de franjas anteriores en su caché.

## Formularios y Mobile

SafeArea y KeyboardAvoidingView envuelven el contenido, con fondo a tamaño de ventana fuera de SafeArea. El scroll permite llegar al último campo y enviar. Con teclado o altura <600, la marca cambia a compacta y se reduce el margen; el fondo se mantiene. No se oculta la escena ni se crea un segundo contenedor opaco por campo/formulario. Los listeners de teclado existentes mantienen limpieza.

Los cambios de sign-in/sign-up son exclusivamente de superficie/padding de la Card para evitar una tarjeta dentro de otra. No se modifican AuthProvider, apiClient, SecureStore, servicios, rutas ni lógica de submit.

## Pruebas y evidencias

- ESLint Web/Mobile y TypeScript Web/Mobile: aprobados.
- Build Web: aprobado. AuthLayout ronda 5,75 kB JS minificado (2,39 kB gzip) y 4,14 kB CSS; no se añade motor. Persiste E-05, advertencia conocida del chunk Study Rooms >500 kB, sin modificar ese módulo.
- Exportaciones Expo web y Android: aprobadas. Sin compilación nativa ni instalación.
- Web: 14 pruebas aprobadas entre authScenes, apiAccountIsolation, apiConfigurationIntegration y authenticatedApiRendering; 4 casos temporales en studyPeriod. La ampliación visual comprueba cobertura exacta [0,0,ancho,alto], movimiento numérico del vapor, parada por visibilidad/Reduce Motion, dispositivo limitado y fallback PNG.
- Mobile: authScenes, mobileAppearanceRendering y mobileSessionIntegration aprobados (3 archivos, 24 casos internos). Conservan regresiones de refresh, restauración, logout, red y cuentas.
- Chrome sobre exportación React Native Web: tres franjas/foreground, movimiento real del vapor, pausa en background/sistema, fullscreen 320/390/768, paisaje 600×390, foco de input, registro 409/éxito, login 401/éxito, navegación autenticada, Settings Light/Orange y retorno al login después de logout; aprobación final registrada en `.expo/fullscreen-browser.log`.
- Los tests utilizan únicamente API simulada. No hay pruebas con escrituras sobre PostgreSQL ni peticiones de prueba al backend habitual.

Capturas inspeccionadas en Chrome (artefactos locales ignorados, no assets de la app):

- `/tmp/studystreak-auth-{morning,afternoon,night}.png`: escritorio 1440, tres iluminaciones.
- `/tmp/fullscreen-{login,register}-{320,390,768,1440,1920}.png`: ambas pantallas, fullscreen y recorte cover; los recorridos comprueban además Dark/Light/System y todas las paletas.
- `/tmp/studystreak-auth-mobile-light.png`: Register Web a 320, Light/Orange y foco visible.
- `frontend-mobile/.expo/auth72-mobile-{morning,afternoon,night}.png`: nuevas capturas de Mobile Web a 390; se esperan texturas decodificadas antes de capturar.
- `.expo/fullscreen-light-login.png` y `.expo/fullscreen-light-register.png`: ambas pantallas Mobile Web en Light/Orange tras modificar preferencias existentes.

La inspección confirma fondo hasta los bordes, ausencia de columnas/márgenes de lienzo vacíos, detalle académico, identidad común y controles legibles. El test de paisaje comprueba espacio reducido y foco; no acredita un teclado Android físico.

## Archivos y cierre

Código Web: `components/auth/{AuthLayout,StudyScene,useAmbientMotion,sceneData,auth.css}` y `tests/authScenes.test.mjs`. Código Mobile: `components/auth/{AuthScreen,StudyScene,sceneData,sceneImages,images.d.ts}`, `app/{sign-in,sign-up}.tsx`, tests authScenes/mobileAuthScenes y mocks appearanceNative/appearanceTestLoader. Recursos y generadores descritos arriba. Se actualiza el documento inicial con enlace a esta revisión.

Se crea un commit local de corrección independiente con staging explícito. Los 16 elementos preexistentes ajenos se conservan fuera del commit. No se modifican backend, base de datos, infraestructura, dependencias, archivos privados ni pantallas posteriores al login.

Pendiente en Expo Go Android real: teclado y selección/autocompletado en ambos formularios, SafeArea/gestos y orientación, densidad/nitidez, TalkBack/fuente grande, cambio de franja y foreground reales, Reduce Motion y fluidez/consumo en equipo modesto. Probar con API LAN configurada y cuenta autorizada; para crear cuentas usar entorno aislado. No se afirma prueba física ni FPS medidos. No se inicia 7.3.
