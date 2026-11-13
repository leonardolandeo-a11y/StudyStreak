# Etapa 8.3b — Ambientes ilustrados en Mobile

Rama `feat/ui-ux-web-mobile`, HEAD **`723c275`**. La revisión inicial comprobó la implementación real, documentación, recursos y cambios sin commit de Web 8.3a. Se reutilizaron tal como estaban y permanecen intactos, incluidos sus originales y capturas. **8.3b fue aprobada explícitamente por el usuario al iniciar 8.4; se autoriza su registro local independiente.**

## Hero y paridad con Web

Dashboard Mobile utiliza los mismos cuatro ambientes originales:

- Sunset Campus / Campus al atardecer.
- Rainy Library / Biblioteca lluviosa.
- Night Desk / Escritorio nocturno.
- Cozy Café / Cafetería acogedora.

Se preserva el bloque integrado de 8.1d: panorama 3:1 a ancho completo, bienvenida y CTA en la misma superficie. No se añade una miniatura flotante o una tarjeta de imagen independiente. El panorama se adapta al ancho móvil sin recortar objetos como la luna; la bienvenida permanece sobre una superficie con contraste estable. Screen, SafeArea, scroll y navegación no cambian.

El contrato de preferencias coincide con Web: `{ selection, motion }`; mismos IDs, nombres y valores predeterminados. Automatic mantiene exactamente las franjas existentes: 05:00–11:59 → Cozy Café; 12:00–17:59 → Sunset Campus; 18:00–04:59 → Night Desk. La biblioteca lluviosa es manual y decorativa, sin clima real. Las elecciones manuales no cambian con la hora. El saludo continúa usando la hora local independientemente de la ilustración.

No se modificaron Dashboard, sus gráficos/métricas, la personalización de widgets, Focus Studio ni Login/Register. Sólo se actualizó el componente del hero que ya consume Dashboard.

## Settings → Appearance

Se añadió Study Environment a la pantalla Settings existente, sin un proveedor de apariencia adicional:

- Cuatro miniaturas en dos columnas con nombre, selección visible y estado accesible.
- Automatic y explicación de las franjas.
- Vista previa inmediata a ancho completo.
- Switch nativo Ambient movement.
- Restore default environment, separado de Restore default appearance.
- Errores de persistencia y reintento.

Los controles reutilizan AcademicPanel, NavigationPressable, ActionButton, StatusMessage y Switch. Los toques tienen áreas de 44–48 px o superiores. Una inspección visual detectó que Image conservaba una altura intrínseca excesiva en las miniaturas: se corrigió con un marco 3:1 explícito y se verificó su proporción en Chrome.

Dark/Light/System, las cuatro paletas y Reduce Motion siguen perteneciendo al sistema global existente. Restaurar el ambiente no modifica esas preferencias ni los widgets.

## Recursos y animación Native

No se generó arte nuevo. Se derivaron PNG locales de los originales de 8.3a, con reducción exacta 2:1 y vecino más cercano para los panoramas, conservando composición y colores. Las miniaturas usan los mismos originales.

Ubicación: `frontend-mobile/assets/environments/study-v1/`.

| Recurso | Panorama 1086 × 362 | Miniatura 432 × 144 |
| --- | ---: | ---: |
| campus.png / campus-thumb.png | 590301 bytes | 115048 bytes |
| library.png / library-thumb.png | 683454 bytes | 129398 bytes |
| night.png / night-thumb.png | 574401 bytes | 113022 bytes |
| cafe.png / cafe-thumb.png | 645551 bytes | 124540 bytes |

Son recursos empaquetados con Expo, sin URLs externas ni descargas de proveedores gráficos. Se reutiliza el fallback PNG estático de 8.1d. No hay Object URLs de navegador ni permisos nuevos.

EnvironmentScene es reutilizable por el hero y la vista previa. Animated controla únicamente opacidad y transformaciones con `useNativeDriver`: nubes dentro de las ventanas, lluvia recortada, vapor y estrellas. Los marcos, libros y controles permanecen fijos. Las coordenadas normalizadas y el tipo de efecto coinciden con Web y tienen una prueba de paridad.

Cada instancia pausa y limpia sus bucles al perder el foco de su pantalla, pasar a background o desmontarse. Reduce Motion global/dispositivo, preferencia de movimiento desactivada, memoria limitada (≤3 GiB o aviso de memoria) y fallo de imagen producen una escena estática. Los listeners opcionales de memoria se manejan también en React Native Web. No hay otro heartbeat, audio, polling o trabajo de animación ligado a los widgets.

La pausa de Native se basa en foco de ruta/AppState; no se añadió seguimiento de scroll del Dashboard ni se modificó Screen para detectar cuándo el hero queda fuera del viewport. La vista previa puede animarse mientras Settings es la pantalla activa.

## Persistencia y ciclo de vida

- Native: `Paths.document/study-environments/account-<userId>.json`, mediante expo-file-system ya instalado.
- React Native Web: clave local `studystreak:study-environment:v1:<userId>`, con el mismo contrato de Web.
- Valor: únicamente selección y movimiento. Sin tokens, nombres, fotos privadas, estadísticas u otra información sensible.

Se usan subárboles con clave de cuenta y stores independientes. Las escrituras atómicas con archivo temporal se serializan por cuenta **entre instancias de Settings y Dashboard**, porque Expo Router puede conservar ambas rutas montadas. Una lectura al volver con Back espera las escrituras pendientes para mostrar la selección recién guardada. Las operaciones no comparten valores de preferencias entre usuarios.

La rehidratación ocurre al recuperar foco. Las lecturas tardías o canceladas no reemplazan una vista previa más reciente. Preferencias ausentes, JSON inválido y valores desconocidos se normalizan de forma segura. Los errores de disco se notifican, conservando una vista previa temporal y permitiendo reintentar; una escritura fallida no sustituye el archivo válido anterior.

Las preferencias sobreviven a una nueva instancia gracias al almacenamiento documental. No se cambió SecureStore, JWT o restauración de sesión. Los valores son locales a cada instalación: no se sincroniza automáticamente la elección entre el navegador Web y Expo Go, ya que no se añadieron endpoints.

## Capturas y comparación

Capturas de **Chrome headless ejecutando React Native Web con API y cuentas simuladas**. No representan métricas reales ni validación de Android físico. Se inspeccionaron los cuatro ambientes, miniaturas y layouts a 320/390/768 px.

| Ambiente | Web 8.3a conservado | Hero Mobile | 320 | 390 | 768 |
| --- | --- | --- | --- | --- | --- |
| Campus | [Web](images/academia-pixel-viva-8-3a/campus-hero.png) | [Hero](images/academia-pixel-viva-8-3b/campus-hero.png) | [320](images/academia-pixel-viva-8-3b/campus-320.png) | [390](images/academia-pixel-viva-8-3b/campus-390.png) | [768](images/academia-pixel-viva-8-3b/campus-768.png) |
| Biblioteca | [Web](images/academia-pixel-viva-8-3a/library-hero.png) | [Hero](images/academia-pixel-viva-8-3b/library-hero.png) | [320](images/academia-pixel-viva-8-3b/library-320.png) | [390](images/academia-pixel-viva-8-3b/library-390.png) | [768](images/academia-pixel-viva-8-3b/library-768.png) |
| Nocturno | [Web](images/academia-pixel-viva-8-3a/night-hero.png) | [Hero](images/academia-pixel-viva-8-3b/night-hero.png) | [320](images/academia-pixel-viva-8-3b/night-320.png) | [390](images/academia-pixel-viva-8-3b/night-390.png) | [768](images/academia-pixel-viva-8-3b/night-768.png) |
| Cafetería | [Web](images/academia-pixel-viva-8-3a/cafe-hero.png) | [Hero](images/academia-pixel-viva-8-3b/cafe-hero.png) | [320](images/academia-pixel-viva-8-3b/cafe-320.png) | [390](images/academia-pixel-viva-8-3b/cafe-390.png) | [768](images/academia-pixel-viva-8-3b/cafe-768.png) |

Settings: [320](images/academia-pixel-viva-8-3b/settings-320.png), [390](images/academia-pixel-viva-8-3b/settings-390.png), [768](images/academia-pixel-viva-8-3b/settings-768.png). Más estados: [Light/Orange](images/academia-pixel-viva-8-3b/library-light-orange.png), [fallback](images/academia-pixel-viva-8-3b/fallback.png).

## Pruebas realizadas

Logs ignorados en `.local/stage83b/`:

- ESLint `npm run lint`: aprobado (`lint.log`).
- TypeScript `npx tsc --noEmit`: aprobado (`types.log`).
- `npx expo export --platform web --platform android --output-dir .expo/integration-export`: aprobado en ambas plataformas (`export.log`), después de la corrección de miniaturas.
- Seis archivos dirigidos aprobados (`tests.log`): preferencias del ambiente, archivos/atomicidad, renderizado, Dashboard, contrato de widgets y componentes globales de apariencia. Comprobación final de renderizado/paridad de coordenadas aprobada (`rendering-final.log`).
- Preferencias: mismas opciones/normalización/mapeo automático que Web, cuentas independientes, recreación del store, descarte de campos ajenos, lectura tardía/cancelada y fallos de lectura/escritura con reintento.
- Archivos con mocks: varios stores de la misma cuenta serializan escrituras y Back lee la última; cuenta diferente queda aislada; el archivo de widgets permanece intacto; un movimiento atómico fallido conserva el archivo previo y un reintento limpia el temporal.
- Chrome (`browser.log`): cuatro escenas, vista previa/Back, recarga y login simulado, cuentas 101/202/101, Automatic y franjas locales, efectos realmente cambiantes, pausa de movimiento en background/por preferencia/Reduce Motion, doce combinaciones de apariencia y 320/390/768 px. También verifica proporción de miniaturas, configuración de widgets intacta, gráfico 7/30/líneas, Focus sin escena visible y fallback ante un fallo real de carga de imagen.
- Regresión heredada de ambientes y Focus (`environment-regression.log`): aprobada tras actualizar selectores de efectos y recursos, esperando la rehidratación al volver de Settings. Incluye fases y círculo del Pomodoro existentes, sin modificar su implementación. Sus capturas van a `.local/stage83b/environment-regression/`, sin sobrescribir las históricas.
- Hashes antes/después: Web completo, documentación/capturas de 8.3a, widgets y los 16 elementos ajenos permanecen intactos. Sólo se editaron los tres archivos Mobile existentes listados abajo.

Todas las peticiones de las pruebas visuales se interceptan. No se hicieron escrituras sobre PostgreSQL ni se modificaron relaciones o perfiles reales.

## Verificación pendiente en Expo Go Android

No se accedió a un teléfono físico. La exportación Android y los mocks no sustituyen estas comprobaciones:

1. Abrir Settings, seleccionar cada ambiente y volver con Back: comprobar hero y miniaturas a los tamaños y orientación del dispositivo.
2. Seleccionar Biblioteca con movimiento desactivado, cerrar Expo Go completamente y reabrir: confirmar persistencia documental real y restauración de sesión existente.
3. Salir y entrar con dos cuentas autorizadas: comprobar que cada una conserva su selección.
4. Probar Automatic al cambiar la hora/franja local o regresar de background, sin modificar datos de estudio.
5. Comprobar Reduce Motion del dispositivo y de la app, pausa/reanudación al cambiar de pantalla/background, comportamiento en un dispositivo de memoria limitada y lectura con TalkBack.
6. Comprobar los widgets existentes, navegación hacia Focus y sus controles habituales. No se alteró su código ni se generaron sesiones reales durante las pruebas.

## Archivos de 8.3b

Existentes modificados:

- `frontend-mobile/src/components/environment/StudyEnvironment.tsx`.
- `frontend-mobile/src/app/(app)/settings.tsx`.
- `frontend-mobile/tests/studyEnvironment.browser.mjs`.

Nuevos:

- `frontend-mobile/src/components/environment/{EnvironmentScene,StudyEnvironmentSettings}.tsx` y `scenes.ts`.
- `frontend-mobile/src/features/environment/environmentPreferences.ts`.
- `frontend-mobile/src/hooks/useEnvironmentPreferences.ts`.
- `frontend-mobile/src/services/environmentStorage.ts`.
- `frontend-mobile/tests/{environmentPreferences.test,environmentStorage.test,environmentRendering.test,environmentSettings.browser}.mjs`.
- Ocho PNG en `frontend-mobile/assets/environments/study-v1/`.
- Este documento y `docs/images/academia-pixel-viva-8-3b/`.

Sin cambios en Web, Focus Studio, Login/Register, servicios de negocio, autenticación, backend, PostgreSQL, Docker, AWS, dependencias o archivos privados. HEAD sigue en `723c275`; staging vacío, sin commit, reset, clean, amend, merge o push. Se detiene aquí para revisión visual de 8.3b.

## Cierre autorizado antes de 8.4

El usuario confirmó la finalización y aprobación de 8.3b. Se registra exclusivamente esta entrega Mobile, manteniendo Web 8.3a y los elementos ajenos fuera de su staging. Las comprobaciones físicas Android anteriores permanecen pendientes; la aprobación no las convierte en pruebas ejecutadas.
