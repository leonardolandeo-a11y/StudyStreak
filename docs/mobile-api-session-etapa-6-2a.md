# Etapa 6.2a — Configuración API y sesión Mobile

Referencia: [auditoría de paridad](auditoria-paridad-web-mobile.md). Rama `feat/ui-ux-web-mobile`.

## Trabajo recuperado y completado

La interrupción dejó sin commit la integración de configuración, el refresh compartido, las revisiones de sesión y las pruebas de integración. No había un commit previo de 6.2a. Se conservaron esos cambios y se completaron las verificaciones.

- `src/config/api.ts` sigue siendo el único validador y mantiene su contenido preexistente. Se incorpora al commit como dependencia, sin sobrescribirlo (SHA-256 `9b3be0f03e7250be85434fca3b7173e986a8ae82ddd1c31463d85b736c8f5986`). Normaliza espacios/barras finales y rechaza URL relativa, protocolos no HTTP(S), credenciales, query y fragmento. No añade `/api` ni una IP por defecto.
- `apiRuntime.ts` distingue errores de configuración de errores de conectividad mediante un tipo de error seguro. El cliente, refresh, restauración y logout utilizan la misma configuración. La ausencia de configuración no provoca peticiones relativas accidentales. Logout mantiene la limpieza local incluso si la configuración es inválida.
- `sessionRefresh.ts` comparte una única renovación entre restauración y respuestas 401. Conserva las rutas, payloads, timeout, Bearer JWT y reintento único. Los errores de red, timeout, 429 y 5xx conservan los tokens; el rechazo explícito de refresh invalida la sesión correspondiente.
- Las revisiones de sesión rechazan respuestas/reintentos de una cuenta anterior, incluidos requests durante un login. SecureStore conserva las mismas claves; su cola serializa escrituras y eliminaciones para que un refresh tardío no deshaga logout. No se reescribe AuthProvider ni se cambia navegación o UI.
- Se completó el harness de pruebas con Axios real y SecureStore simulado. El primer intento falló porque el entorno bloquea procesos hijos; los escenarios de configuración ahora se aíslan por módulos dentro del mismo proceso. Se corrigieron imports duplicados y se añadió cobertura para requests iniciados durante login. `test:auth` incluye la nueva integración.

## Verificación

Realizada sin fixtures en PostgreSQL, creación de cuentas reales ni tokens de usuario:

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | OK, sin advertencias. |
| `./node_modules/.bin/tsc --noEmit --incremental false` | OK. |
| `node --experimental-strip-types --test tests/*.test.mjs` | 13 archivos aprobados, 0 fallos; la integración contiene 18 casos. |
| Configuración | URL LAN/HTTPS y prefijo explícito; ausente/inválida bloquea transporte sin mostrar valores sensibles. |
| Autenticación aislada | Login/Register, refresh concurrente y compartido con restore, reintento único, rechazo de refresh, errores transitorios, restauración con almacenamiento persistido simulado, logout y cambio de cuenta. |
| Carreras | Respuestas antiguas 200/401, refresh antiguo 200/401, request durante login y logout durante escritura de tokens. |
| Logs | Sin llamadas de diagnóstico en los servicios de sesión; flujos de prueba no emiten credenciales. |
| Backend local, GET anónimo | `/actuator/health` → **401**; `/api/profile` → **401** en `127.0.0.1:8080`. Responde y protege rutas; health no es público, por lo que no se afirma estado UP. |

El primer intento HTTP estaba bloqueado por los permisos de red del entorno; la comprobación autorizada de sólo lectura obtuvo los estados anteriores. Las pruebas Node pueden emitir el aviso de paquete sin `type: module`; no se cambió el formato del proyecto para suprimirlo.

## Expo Go y comprobación manual pendiente

Se conservan Expo, React Native, Router y todas las dependencias; sólo cambia un script de pruebas en package.json. Los cambios de runtime son TypeScript sobre Axios/SecureStore existentes, sin módulos nativos nuevos ni necesidad adicional de development build. El harness Node pertenece exclusivamente a tests. No se certifica la ejecución en el teléfono desde estas herramientas.

Pasos mínimos en Expo Go, usando cuentas autorizadas existentes y sin compartir tokens:

1. Mantener `EXPO_PUBLIC_API_URL` apuntando al origen LAN alcanzable del equipo, sin añadir `/api`, credenciales o tokens; si necesita cambiarse, hacerlo localmente y reiniciar Expo. No usar localhost en el teléfono. No se modificó ningún `.env` privado.
2. Iniciar sesión y abrir una pantalla que consulte la API. Cerrar completamente/reabrir la app y comprobar restauración. Cuando el access token expire naturalmente, comprobar que la consulta recupera sesión mediante refresh.
3. Desactivar temporalmente la conexión del teléfono, reintentar una consulta/restauración y volver a conectarlo: un fallo de red no debe borrar la sesión. No simular expiración manipulando tokens reales.
4. Cerrar sesión, entrar con otra cuenta autorizada y comprobar que no aparecen respuestas de la anterior. Comprobar logout también sin conexión. La UI de Register conserva su flujo; su envío y errores se probaron con fixtures para no crear usuarios en la base habitual.

## Alcance de Git

Archivos de producción de esta etapa: `src/config/api.ts` (preexistente, incorporado intacto), `apiRuntime.ts`, `services/apiClient.ts`, `authService.ts`, `authSession.ts`, `tokenStorage.ts`, `sessionRefresh.ts` y `utils/apiError.ts`, todos dentro de `frontend-mobile`. Se añaden `tests/mobileSessionIntegration.test.mjs` y tres helpers en `tests/helpers/`; se actualiza únicamente `scripts.test:auth` en package.json, además de este documento.

Los demás elementos preexistentes, incluido el informe 6.1 y los tests/configuración ajenos de Web, quedan fuera del commit. Sin cambios de Web, backend, PostgreSQL, Docker, AWS, dependencias, archivos privados, pantallas o estilos. No se inicia 6.2b.
