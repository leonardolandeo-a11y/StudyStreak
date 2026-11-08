# Perfil propio Mobile — Etapa 6.4a

## Alcance

La ruta existente `/(app)/profile` conserva su acceso desde avatar/nombre del drawer y el Back del Stack. No hay Back adicional en la pantalla ni en el editor. No se cambian pestañas, autenticación, Focus, Web ni backend. No se añaden perfiles ajenos, presencia o compañeros.

La pantalla usa banner compacto, avatar circular parcialmente superpuesto, nombre visible, username y bio. `ProfileCover` se comparte con la vista previa del editor. `ProfileStudyStats` utiliza únicamente `statistics` de `/api/profile`: minutos/sesiones vitalicios verificados, metas activas y rachas rotuladas como inclusivas de históricos. No agrega historial paginado ni convierte estimaciones en verificadas; omite estadísticas ausentes.

La fecha se muestra sólo cuando se recibe una fecha válida `registrationDate`. El DTO actual `ProfileResponse` **no incluye ese campo**; Web lo obtiene de su proveedor social. Esta etapa no incorpora ese proveedor ni hace consultas sociales para suplirlo. Por tanto, el backend actual no mostrará Joined en esta pantalla. El fixture con fecha verifica la presentación condicional, sin afirmar que la API actual la devuelve. Una incorporación posterior al contrato requiere su propio alcance autorizado.

## Editor y API

`ProfileEditor` reutiliza CreationModal, FormField, ActionButton, StatusMessage, NavigationPressable y la apariencia global. Tiene borradores independientes de nombre, bio y ambas imágenes; selección, preview, Remove/Undo, Save/Cancel, carga, éxito y errores. Cancelar no envía PATCH/PUT/DELETE. Durante guardado/selector se bloquea el cierre para evitar acciones simultáneas; el picker nativo conserva su propia cancelación. Un desmontaje aborta las operaciones pendientes y limpia las copias de preview.

| Operación | Endpoint existente | Uso |
| --- | --- | --- |
| Leer/editar identidad | GET/PATCH `/api/profile` | Sólo displayName y bio; nunca username/email/contraseña. |
| Leer imagen | GET `/api/profile/avatar`, GET `/api/profile/banner` | Cliente autenticado, respuesta ArrayBuffer, archivo privado temporal. |
| Crear/reemplazar imagen | PUT a las mismas rutas | ArrayBuffer binario con Content-Type real, no multipart, JSON ni base64 en el cuerpo. |
| Borrar imagen | DELETE a las mismas rutas | Sólo después de confirmar Save; conserva idempotencia del endpoint. |

Límites alineados con Web/backend: nombre de 60 escalares Unicode con normalización de espacios exteriores, bio de 300 escalares y controles permitidos; PNG/JPEG/WebP; avatar 2 MiB y banner 5 MiB. Se comprueban tamaño real, firma de formato, MIME coherente y dimensiones declaradas por el picker (8192 por lado y 16 millones de píxeles). La decodificación completa/integridad final sigue validándose en el backend existente; una firma correcta no garantiza una imagen íntegra.

Las escrituras son independientes, como en Web. Ante fallo parcial se refresca el perfil compartido y se informa de que algunos cambios pueden haberse guardado; el editor conserva los borradores para corregir/reintentar. No se promete una transacción inexistente.

## Imágenes, concurrencia y sesión

`NavigationDataProvider` sigue siendo el único proveedor de identidad del drawer. Comparte perfil y avatar con Profile, y pide el banner sólo cuando Profile lo necesita. Refresco explícito/guardado invalida las imágenes; navegar y renderizar no vuelve a descargarlas. Las descargas y refrescos concurrentes se deduplican. Una revisión por imagen impide que respuestas antiguas sustituyan el resultado del último refresco.

`OwnProfileMedia` pertenece a la vida del proveedor autenticado, que ya se remonta por cuenta. Guarda archivos `own-profile-*` en el caché privado de Expo y mantiene URIs locales sin tokens. Los previews son copias propias; no se borran originales de la fototeca. Se eliminan temporales generados por el picker sólo dentro de su carpeta de caché, previews reemplazados/cancelados, imágenes invalidadas y los archivos del proveedor al desmontarse/cerrar sesión/cambiar de cuenta. Al inicializar se limpian restos `own-profile-*`/`own-avatar-*` de ejecuciones anteriores, sin tocar audio, outbox ni otros archivos.

No se crean Object URLs ni URLs de imagen públicas. GET/PATCH/PUT/DELETE usan el cliente autenticado de 6.2a, con refresh/reintento existentes. Los pasos de una edición y las descargas capturan la revisión de sesión: un cambio de cuenta bloquea los pasos siguientes y descarta resultados tardíos. Los fallos de red no limpian tokens por decisión de Profile. Un 404 de imagen es ausencia/fallback; 403/otros fallos se muestran con retry, sin ampliar permisos.

## Expo

Única dependencia directa añadida: `expo-image-picker ~58.0.10`, exactamente la recomendada por `expo/bundledNativeModules.json` del SDK instalado. Única transitiva nueva: `expo-image-loader 58.0.3`. Se preservan versiones y metadatos de los demás paquetes del lockfile.

El [picker está incluido en Expo Go](https://docs.expo.dev/versions/latest/sdk/imagepicker/) y utiliza el selector del sistema, sólo imágenes y sin recorte forzado ni selección múltiple. No se solicita acceso general a fototeca/cámara desde esta función. La cancelación devuelve null y los fallos de acceso se muestran. El plugin añade la explicación de fotos y conserva las explicaciones/permisos de cámara y micrófono existentes para no afectar evidencias/audio. La caché usa [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/), ya instalado. No se requiere un módulo nativo adicional de terceros ni se actualiza Expo/React Native.

## Verificación aislada

Desde `frontend-mobile`:

- `npm run lint`: correcto.
- `npx tsc --noEmit`: correcto.
- `node --experimental-strip-types --test tests/*.test.mjs`: 24 archivos aprobados, 0 fallos; incluye sesión/restauración/refresh/logout, Focus y componentes existentes.
- `node --experimental-strip-types tests/ownProfileMedia.test.mjs`: diez casos de servicio/caché con Axios, FileSystem y picker simulados. Comprueban JWT sin imprimirlo, 401/refresh, 403, 404, bytes PUT, DELETE, validación, cancelación, archivos originales, limpieza, fallo parcial y cambio de cuenta durante peticiones.
- `node --experimental-strip-types tests/profileRendering.test.mjs`: dos casos, con ocho combinaciones Dark/Light y paletas, preview de ambas imágenes, fallback, campos permitidos, métricas diferenciadas e identidad del drawer.
- Exportación Expo web correcta para comprobar la UI compartida; no equivale a compilar Android/iOS.
- `node tests/mobileProfile.browser.mjs`: Chrome con todas las peticiones externas interceptadas. Carga, cancelación sin escrituras, edición, PATCH/DELETE confirmados sobre fixtures, error 403/reintento, actualización del nombre en drawer, Back, logout/cambio de cuenta, anchos 320–1440 y editor 320–768, tema claro Purple, Reduce Motion y teclado. La primera ejecución adelantó la aserción de foco a la transición; se corrigió la espera del test, sin cambiar la política del modal.
- `node tests/mobileNavigation.browser.mjs`: regresión de navegación con fixtures aislados.

Las pruebas no leen credenciales privadas ni escriben en PostgreSQL. Chrome comprueba presentación y flujos de texto/borrado con imágenes ausentes; la lectura/subida de bytes y los previews con URIs privadas se prueban con módulos nativos simulados. No se afirma haber ejercitado el selector ni el almacenamiento físico de un teléfono.

## Comprobación pendiente en Expo Go

1. Recargar Metro tras instalar el picker. Entrar por el avatar del drawer, comprobar banner/avatar existentes, bio, estadísticas y Back.
2. Editar nombre/bio; cancelar y volver a abrir. Guardar y comprobar nombre/avatar en el drawer sin reiniciar.
3. Seleccionar PNG, JPEG y WebP pequeños para ambas imágenes. Comprobar preview superpuesto, volumen de archivo y resultado tras guardar/reabrir. Probar límites 2/5 MiB, imagen no admitida, cancelación del selector y acceso denegado cuando el SO lo permita.
4. Remove/Undo, cancelar el editor y borrar definitivamente tras Save. El original en la fototeca debe permanecer intacto.
5. Con cuenta de prueba, interrumpir/restaurar red durante guardado; revisar el mensaje de guardado parcial y reintentar. Cerrar sesión/cambiar de cuenta durante una descarga y verificar ausencia de identidad/imágenes previas. Reiniciar la app y comprobar recuperación de sesión existente.
6. Dark/Light/System, cuatro paletas, cambio del tema del dispositivo, Reduce Motion, lector de pantalla, teclado abierto, orientación y pantalla pequeña. Confirmar controles táctiles y que el avatar no queda recortado.

La verificación física de Expo Go queda pendiente. Esta entrega termina en perfil propio, sin etapa social siguiente.

## Archivos de esta entrega

Todos los siguientes pertenecen a `frontend-mobile/`, salvo este documento:

- Configuración: `app.json`, `package.json`, `package-lock.json`.
- Ruta: `src/app/(app)/profile.tsx`.
- Identidad compartida y API: `src/contexts/NavigationDataContext.tsx`, `src/services/ownProfileService.ts`.
- UI: `src/components/profile/ProfileCover.tsx`, `ProfileEditor.tsx`, `ProfileStudyStats.tsx`.
- Soporte: `src/features/profile/ownProfileMedia.ts`, `pickProfileImage.ts`, `profileValidation.ts`, `saveOwnProfile.ts`.
- Pruebas: `tests/ownProfileMedia.test.mjs`, `tests/profileRendering.test.mjs`, `tests/mobileProfile.browser.mjs`.
- Mocks: `tests/helpers/appearanceFileSystemMock.mjs`, `appearanceTestLoader.mjs`, `profilePickerMock.mjs`.
- Documentación: `docs/mobile-profile-etapa-6-4a.md` en la raíz del repositorio.
