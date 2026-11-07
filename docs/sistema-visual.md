# Sistema visual de StudyStreak Web

La Etapa 1 estableció los tokens y el foco accesible. La Etapa 4 activa su uso
para toda la aplicación: Settings en `/settings`, desde la zona de usuario del
sidebar y del menú móvil web. Dark/Mint sigue siendo el valor predeterminado.
No se implementa Profile, estética retro ni un tema nativo en esta etapa.

Settings presenta Dark/Light como muestras visuales y las cuatro paletas como
cuadrados de color, con radios nativos y check de selección. Use device theme es
un switch independiente: activa System y bloquea la selección manual; al apagarlo
conserva el tema efectivo como modo manual, sin añadir campos de persistencia.
UserPanel comparte la fila avatar/nombre/correo/engranaje entre sidebar y menú
móvil. El engranaje navega a Settings; Sign out conserva su mecanismo anterior.

## Arquitectura y primer pintado

- `src/styles/tokens.css` centraliza colores, tipografía, espaciado, radios y foco.
  `light-dark()` y `color-scheme` resuelven Dark/Light/System. System responde a
  cambios del sistema sin recargar.
- `public/appearance.js` valida y aplica preferencias antes de React. Es un script
  clásico bloqueante, cargado antes del CSS bloqueante en `index.html`; la misma
  validación se utiliza desde React. No hay colores ni CSS duplicados en el HTML.
- `ThemeProvider` conserva las preferencias de presentación y expone contexto
  tipado mediante `useAppearance`. `useResolvedTheme` y `useReducedMotion` usan
  `useSyncExternalStore`; retiran sus listeners al desmontarse.
- `<html>` recibe `data-theme="dark|light|system"`,
  `data-accent="mint|blue|purple|orange"` y `data-motion="system|reduce"`.
- La clave `studystreak:appearance:v1` de localStorage solo guarda
  `{mode, accent, reduceMotion}`. No contiene información de cuenta ni tokens.
  Los valores inválidos o antiguos usan valores seguros; si el almacenamiento
  falla, el tema funciona en memoria y Settings indica que no pudo persistirse.
  Los cambios de esa clave desde otra pestaña también se aplican.
- Restore default appearance vuelve a Dark/Mint y deja el movimiento reducido
  explícito desactivado. La preferencia de movimiento del SO siempre se respeta.

La personalización es **local al navegador**, compartida por sus sesiones de uso;
no se sincroniza con la cuenta ni entre dispositivos. No requiere endpoints.
Cerrar sesión utiliza el mecanismo existente. Actualmente no existe una ruta
funcional de Profile y Settings no inventa un enlace o editor de perfil.

## Tokens y compatibilidad

| Función | Token CSS | Utilidad |
|---|---|---|
| Fondo | `--ss-background` | `bg-canvas` |
| Superficies | `--ss-surface`, `--ss-surface-hover` | `bg-surface`, `bg-surface-hover` |
| Bordes | `--ss-border`, `--ss-border-strong` | `border-outline`, `border-outline-strong` |
| Texto | `--ss-text`, `--ss-text-secondary`, `--ss-text-muted` | `text-content`, `text-content-secondary`, `text-content-muted` |
| Acción | `--ss-accent`, `--ss-accent-hover`, `--ss-on-accent` | `bg-accent`, `text-on-accent` |
| Selección | `--ss-accent-soft` | `bg-accent-soft` |
| Foco | `--ss-focus`, `--ss-focus-width`, `--ss-focus-offset` | regla global `:focus-visible` |
| Estados | `--ss-danger`, `--ss-success`, `--ss-warning`, `--ss-info` y superficies | utilidades semánticas de estado |
| Calendario | `--ss-chart-empty`, `--ss-chart-low`, `--ss-chart-medium`, `--ss-accent` | colores de presentación de actividad |

Las utilidades históricas slate/sky y los colores de estados se adaptan desde
el mismo archivo de tokens; no forman un segundo sistema de temas. Se migran
los textos sobre acciones a `text-on-accent` y los controles a bordes semánticos.
Las utilidades slate se conservan por compatibilidad, pero los componentes nuevos
deben utilizar nombres semánticos. Éxito, advertencia y error no cambian con el
acento. Las ilustraciones de sonidos conservan su propia paleta decorativa.

Recharts ya utiliza variables semánticas; las barras y el calendario secundarios
también consumen tokens. Solo cambian colores, no datos, umbrales ni cálculos.
Carousel de shadcn/ui/Embla conserva su navegación circular y adopta la preferencia
reducida tanto en CSS como en sus desplazamientos JavaScript. No se añade otro
componente de shadcn ni otra dependencia: Settings usa controles HTML nativos.

Se conservan las familias `--ss-font-*`, los tamaños/pesos, `--ss-space-1` como
unidad de Tailwind, los radios y controles compartidos de 44 px. Los demás pasos
de espacio y tamaños de lectura/display siguen disponibles para nuevas pantallas.
No se modifican duraciones, reproducción, sonidos o preferencias del Pomodoro:
esas opciones permanecen exclusivamente en el engranaje de Focus Studio.

## Valores reutilizables en React Native

En una futura implementación nativa, declarar un objeto de tema con los mismos
roles y valores. **No importar variables CSS en React Native.** Los cuatro IDs
`mint`, `blue`, `purple`, `orange` y los modos `dark`, `light`, `system` son el
contrato visual; Appearance del SO nativo resolverá `system`.

| Rol | Light | Dark |
|---|---|---|
| background | `#f8fafc` | `#0b1014` |
| surface | `#ffffff` | `#141c22` |
| content | `#0f172a` | `#f1f5f9` |
| muted | `#475569` | `#94a3b8` |
| onAccent | `#ffffff` | `#0b1014` |
| mint / hover / soft | `#126449` / `#0e503b` / `#e0f5eb` | `#94e8c3` / `#75dab0` / `#183b31` |
| blue / hover / soft | `#1d4ed8` / `#1e40af` / `#eff6ff` | `#93c5fd` / `#60a5fa` / `#172d49` |
| purple / hover / soft | `#6d28d9` / `#5b21b6` / `#f5f3ff` | `#d8b4fe` / `#c084fc` / `#342445` |
| orange / hover / soft | `#9a3412` / `#7c2d12` / `#fff7ed` | `#fdba74` / `#fb923c` / `#332317` |

## Accesibilidad y verificación

El foco de 2 px y separación de 3 px sigue deliberadamente fuera de las capas
CSS: `outline-none` no puede ocultarlo. Solo afecta a controles y elementos
interactivos, no al contenido normal. Los estados seleccionados incluyen el
control nativo marcado y una señal adicional; no dependen solo del color.

Las pruebas de apariencia verifican las ocho combinaciones tema/acento mediante
colores computados, contraste de texto >=4,5:1 y bordes de control >=3:1. También
cubren System dinámico, primer pintado con React bloqueado, persistencia, valores
inválidos, almacenamiento denegado, navegación, diálogos, Recharts/Pomodoro,
movimiento reducido y responsive 320–1440 px. Son comprobaciones representativas,
no una certificación WCAG de todo el producto. No generan capturas ni acceden a
bases persistentes: las respuestas de estudio de la prueba son fixtures de UI.
En Chrome se midieron mínimos de **6,62:1** para los pares de texto comprobados
y **3,71:1** para bordes de controles. Pasaron las once rutas principales en claro,
con recorridos representativos adicionales en oscuro, y el cierre de sesión local.

Desde `frontend-web`:

```bash
node --test tests/appearance.test.mjs
npm run lint
npm run build       # incluye TypeScript (tsc -b)
npm run test:web
npm run dev
```

Las pruebas Chrome requieren Chrome/Chromium; puede indicarse su ejecutable con
`STUDYSTREAK_CHROME_BIN`. Los logs locales de revisión están en `.local/ui-stage4/`
(ignorado por Git). No se cambian backend, contratos REST, autenticación, audio,
reglas de estudio ni archivos de React Native.
