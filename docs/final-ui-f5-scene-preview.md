# F5 — Verificación de animaciones y previsualización local

## Uso

Con `npm run dev` en `frontend-web`, Login y Register muestran un selector compacto **Auto | Morning | Afternoon | Night**. También admiten:

- `/login?scene=morning`
- `/login?scene=afternoon`
- `/login?scene=night`
- `/register?scene=night`

Auto elimina el parámetro y usa el reloj local existente. Valores inválidos equivalen a Auto. La selección solo vive en la URL, sin escribir preferencias, modificar el reloj ni llamar al backend. Recargar una URL forzada conserva esa previsualización; abrir una ruta sin parámetro vuelve al comportamiento normal.

`AuthLayout` utiliza `import.meta.env.DEV` para incluir el componente de previsualización únicamente en desarrollo. En producción se renderiza directamente `StudyScene`: el selector no está en el DOM ni en JavaScript compilado y `?scene=night` no fuerza el escenario.

## Auditoría de animaciones existentes

No fue necesario modificar el motor ni las animaciones. Se conservaron el arte original, formularios y escenarios.

- Morning: tres nubes independientes con desplazamiento horizontal continuo y ciclos de 60/75/90 segundos.
- Afternoon: las mismas nubes y variación de iluminación `auth-afternoon-light` de 22 segundos.
- Night: nubes, parpadeo de estrellas y la iluminación ambiental existente.
- Reduce Motion del sistema y StudyStreak desactivan las animaciones. Una pestaña oculta las pausa y al volver se reanudan. La política existente para dispositivos limitados/ahorro de datos sigue aplicándose, incluso al forzar una escena.

## Evidencia real en Chrome

Se capturaron dos instantes separados por aproximadamente 4,5 segundos reales para cada combinación de ruta y escena. No se adelantó el reloj de animación. En las seis combinaciones, la primera nube se desplazó entre 18,0 y 18,2 unidades SVG; las otras dos también se desplazaron. El paisaje permaneció fijo.

En Afternoon, la opacidad de luz pasó aproximadamente de 0,070 a 0,079. En Night, la opacidad de estrellas pasó de 0,55 a 0,85 y la luz ambiental de 0,080 a 0,087. Son variaciones deliberadamente sutiles, no un cambio artístico.

| Ruta / escena | Primer instante | Segundo instante |
| --- | --- | --- |
| Login Morning | [0 s](images/f5-scene-preview/login-morning-t0.png) | [4,5 s](images/f5-scene-preview/login-morning-t4.png) |
| Login Afternoon | [0 s](images/f5-scene-preview/login-afternoon-t0.png) | [4,5 s](images/f5-scene-preview/login-afternoon-t4.png) |
| Login Night | [0 s](images/f5-scene-preview/login-night-t0.png) | [4,5 s](images/f5-scene-preview/login-night-t4.png) |
| Register Morning | [0 s](images/f5-scene-preview/register-morning-t0.png) | [4,5 s](images/f5-scene-preview/register-morning-t4.png) |
| Register Afternoon | [0 s](images/f5-scene-preview/register-afternoon-t0.png) | [4,5 s](images/f5-scene-preview/register-afternoon-t4.png) |
| Register Night | [0 s](images/f5-scene-preview/register-night-t0.png) | [4,5 s](images/f5-scene-preview/register-night-t4.png) |

[Mediciones](images/f5-scene-preview/motion-measurements.json) · [390 px](images/f5-scene-preview/preview-390.png) · [768 px](images/f5-scene-preview/preview-768.png). Se inspeccionaron capturas reales del selector y los escenarios.

## Pruebas y alcance

- ESLint, TypeScript (`npx tsc -b --pretty false`) y build Web: aprobados. Permanece el aviso previo de chunks mayores de 500 kB.
- `node tests/authScenePreview.browser.mjs`: aprobado. Seis escenas, movimiento real, selector, Auto/URL inválida, recarga, almacenamiento sin cambios, foreground/background, ambos controles de movimiento reducido y responsive.
- `SCENE_PRODUCTION=1 node tests/authScenePreview.browser.mjs`: aprobado contra el build servido localmente. Login y Register ignoran el parámetro y usan la hora normal; interfaz y código JavaScript de previsualización ausentes.
- `node --test --test-concurrency=1 tests/authScenes.test.mjs`: 3 pruebas aprobadas, incluidos flujos de Login/Register con errores/carga y fallback estático. Respuestas API simuladas, sin escrituras persistentes.
- Recursos originales sin cambios; 39 archivos ajenos presentes del inventario conservan sus checksums. Sin modificaciones en Mobile, backend o autenticación.

Archivos: `auth/AuthLayout.tsx`, nuevo `auth/DevScenePreview.tsx`, `auth/auth.css`, nueva prueba `tests/authScenePreview.browser.mjs`, este informe y `docs/images/f5-scene-preview/`.

Commit local: `feat(web): add development auth scene preview`. Consultar hash con `git log -1 --format=%h -- docs/final-ui-f5-scene-preview.md`. Sin push; no se inicia F6.
