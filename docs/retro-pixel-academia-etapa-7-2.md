# Etapa 7.2 — Autenticación Retro Pixel Academia

> Registro de la entrega inicial. La composición de dos columnas y las escenas estáticas fueron sustituidas por la [revisión fullscreen animada](retro-pixel-academia-etapa-7-2-fullscreen.md). Consultar esa revisión para el estado actual.

Rama: `feat/ui-ux-web-mobile`. Base: `f866d23`, documentación de 7.1. Alcance: presentación de Login/Register Web y Mobile. No se cambia ningún servicio, contrato, proveedor de autenticación ni otro módulo.

## Recuperación de la interrupción

Antes de la caída de Internet quedaron implementados los recursos originales, el generador, los layouts compartidos, los hooks de hora local y su integración en las cuatro pantallas. No había commit parcial ni archivos staged. Se conservaron íntegramente esos cambios y los 16 elementos preexistentes ajenos.

Los registros recuperados mostraban ESLint/TypeScript Web y Mobile, build Web, exportaciones Expo web/Android y 13 pruebas Web aprobadas. Quedaban dos comprobaciones fallidas: una expectativa Mobile buscaba el antiguo encabezado en mayúsculas; la prueba de horario de verano no obtenía salida del subproceso. Se actualizó la expectativa a la identidad accesible StudyStreak y se comprobó DST con un TZ temporal restaurado en finally. No requirieron cambios en código ejecutable.

Después de reanudar se completaron esas pruebas, un recorrido Chrome de React Native Web, la comprobación Web de foco/pantalla baja, la inspección visual de capturas y este documento. El recorrido nativo selecciona los inputs visibles: Expo Router puede conservar pantallas anteriores montadas y los selectores globales no representan la interacción del usuario.

## Escenas e identidad

La misma habitación, sobre retícula **160×104**, contiene ventana, escritorio, libros, cuaderno abierto, lápiz, planta, taza y lámpara. Las variantes comparten geometría; cambian colores e iluminación:

| Hora local | Escena |
| --- | --- |
| 05:00–11:59 | Mañana: cielo rosado, sol bajo y luz cálida. |
| 12:00–17:59 | Tarde: cielo azul, sol alto y escritorio dorado. |
| 18:00–04:59 | Noche: cielo índigo, luna/estrellas e iluminación cálida de lámpara. |

La taza deriva del recurso original `assets/branding/coffee-mark.json` de 7.1. No se copian ilustraciones externas. Se reutiliza `StudyBrand` en variante signature con «Small sessions. Lasting progress.». Los controles siguen los tokens del proveedor de apariencia existente; una escena nocturna puede acompañar un formulario Light y viceversa. Se conservan las cuatro paletas, sin introducir un segundo proveedor.

Fuente editable: `assets/auth/study-room.json`; lógica temporal canónica: `assets/auth/studyPeriod.ts`. Desde la raíz:

```bash
node scripts/generate-auth-scenes.mjs
node scripts/generate-auth-scenes.mjs --check
```

El generador valida coordenadas/roles y produce tres SVG locales de exportación y copias TypeScript idénticas para ambos frontends. No editar las copias generadas por separado. Web dibuja SVG inline con crispEdges; Mobile usa View nativos escalados, sin Object URLs, módulos nativos nuevos, descargas ni dependencias adicionales.

## Hora local y ciclo de vida

`studyPeriod` consulta getHours del dispositivo. El siguiente límite se calcula con fecha de calendario local, incluyendo medianoche, año nuevo y horario de verano. No se utiliza geolocalización ni un servicio remoto.

El scheduler mantiene como máximo un timeout hasta 05:00, 12:00 o 18:00. Web cancela en background, recalcula al recibir visibilitychange/focus y elimina timer/listeners al desmontar. Mobile utiliza useFocusEffect y AppState: detiene el timer al perder foco o pasar a background y recalcula al regresar; elimina su suscripción al salir. El render inicial neutro evita diferencias de hidratación por la zona horaria del servidor de Expo web.

Las ilustraciones son estáticas: no hay vapor, estrellas o superficies en loop ni transiciones automáticas. Esto satisface Reduce Motion sin introducir nuevas animaciones. Los controles reutilizan la accesibilidad y preferencias existentes.

## Integración y accesibilidad

**Web:** AuthLayout separa ilustración y formulario en dos columnas hasta 1040 px. Por debajo de 760 px se apilan; se reduce la marca y se recorta la escena. En alturas menores de 520 px se oculta la decoración. Campos de 16 px, controles de al menos 44–48 px, etiquetas asociadas, foco global visible, errores con role alert y confirmación con role status. La escena se excluye del árbol accesible.

**Mobile:** AuthScreen conserva SafeArea, scroll y KeyboardAvoidingView con padding en iOS; Android conserva el ajuste de ventana existente. Al abrir el teclado o con altura menor de 600 se oculta la cabecera decorativa para priorizar las credenciales. Los listeners de teclado se limpian. Formularios con Card compacta, FormField subtle y botones existentes; se mantienen selección de texto, autocompletado, tipos de teclado, validaciones y acciones. No se cambia navegación ni configuración nativa.

Los manejadores de Login/Register y sus validaciones se conservaron. No se modificaron JWT, refresh, SecureStore, restauración, logout, aislamiento entre cuentas, API ni destinos autenticados.

## Verificaciones

Se reutilizaron los resultados válidos de build/exportación del mismo código, sin repetir suites completas ajenas a esta entrega.

| Comprobación | Resultado |
| --- | --- |
| Generador `--check` y `git diff --check` | Aprobados. |
| ESLint Web/Mobile | Aprobados. |
| TypeScript Web (`tsc -b` en build) / Mobile (`tsc --noEmit`) | Aprobados. |
| Build Web | Aprobado. Persiste advertencia E-05 del chunk Study Rooms >500 kB; no se modifica ese módulo. |
| Expo export web y Android | Aprobados. Sin compilación nativa ni instalación de paquetes. |
| `studyPeriod.test.mjs` | 4 casos: franjas, límites/año nuevo, único timer/foreground/dispose, DST y equivalencia de fuentes generadas. |
| Web authScenes + apiAccountIsolation + apiConfigurationIntegration + authenticatedApiRendering | 13 pruebas aprobadas; el recorrido authScenes se volvió a ejecutar tras ampliar foco y viewport bajo: 2/2. |
| Mobile authScenes + mobileAppearanceRendering + mobileSessionIntegration | 3 archivos aprobados, 24 casos internos. Incluyen renderizado de escenas/formularios, apariencia y 18 regresiones de configuración, sesión, refresh y aislamiento. |
| `mobileAuthScenes.browser.mjs` | Aprobado sobre exportación React Native Web en Chrome. |

Los recorridos Chrome usan exclusivamente respuestas simuladas: registro 409/éxito, login 401/éxito, estados loading y navegación autenticada. Las regresiones de sesión cubren refresh concurrente, fallo de refresh, restauración, logout, errores de red y respuestas tardías de otra cuenta. No se escriben usuarios ni otros datos en PostgreSQL.

Se verifican las tres escenas y retorno de background, Web 320/375/768/1440, Dark/Light/System y cuatro paletas; reducción de movimiento sin animaciones ambientales. En Mobile se comprueban primitivas y apariencia mediante renderizado, anchos 320/390/768, paisaje 600×390, foco de input, registro y navegación autenticada. La pantalla baja simula espacio limitado; **no acredita el funcionamiento de un teclado Android físico**.

Capturas inspeccionadas: escenas Web mañana/tarde/noche en escritorio; Register Web Light/Orange a 320 px con foco visible; escenas de React Native Web a 390 px. Artefactos temporales en `/tmp/studystreak-auth-*.png` y `.expo/auth72-mobile-*.png`, fuera del commit.

## Archivos de esta etapa

- Recursos: `assets/auth/study-room.json`, `studyPeriod.ts`, `study-room-morning.svg`, `study-room-afternoon.svg`, `study-room-night.svg`.
- Generador: `scripts/generate-auth-scenes.mjs`.
- Web: `src/components/auth/{AuthLayout.tsx,StudyScene.tsx,useStudyPeriod.ts,studyPeriod.ts,sceneData.ts,auth.css}`, `src/pages/{Login.tsx,Register.tsx}`, `tests/{authScenes.test.mjs,studyPeriod.test.mjs}`, `package.json` (sólo scripts de tests).
- Mobile: `src/components/auth/{AuthScreen.tsx,StudyScene.tsx,useStudyPeriod.ts,studyPeriod.ts,sceneData.ts}`, `src/app/{sign-in.tsx,sign-up.tsx}`, `tests/{authScenes.test.mjs,mobileAuthScenes.browser.mjs,mobileAppearanceRendering.test.mjs}`, `tests/helpers/appearanceNativeMock.mjs`.
- Este documento.

## Pendientes en Expo Go real y cierre

No se operó un dispositivo Android/iOS físico. En Expo Go, con la configuración LAN existente:

1. Abrir Login/Register en retrato y paisaje; comprobar teclado, scroll hasta enviar, volver, cancelar teclado y SafeArea con navegación por gestos.
2. Cambiar temporalmente la hora local a 04:59/05:00, 11:59/12:00 y 17:59/18:00; comprobar cambio al cruzar el límite y al salir/regresar a la app. Restaurar hora automática al terminar.
3. Probar Dark/Light/System y cuatro paletas; cambiar el tema del SO en System. Activar Reduce Motion, fuente grande y TalkBack: decoración sin anuncios individuales ni controles ocultos por la cabecera.
4. Iniciar sesión con una cuenta autorizada, reiniciar y cerrar sesión; probar otra cuenta. Usar un entorno aislado para crear cuentas de prueba. Sin conexión, el dibujo debe seguir disponible aunque la petición de autenticación falle.

La exportación Android valida el bundle, no sustituye esas pruebas físicas. No se modifican backend, PostgreSQL, infraestructura, archivos privados ni dependencias. Los 16 elementos ajenos permanecen fuera del staging. Se registra la etapa con `feat(auth-ui): add dynamic retro pixel study scenes`, mediante staging explícito; el hash real se informa en la entrega. Fin de 7.2, sin iniciar 7.3.
