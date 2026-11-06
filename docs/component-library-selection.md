# Componentes recomendados para StudyStreak

Las bibliotecas sugeridas por los TAs son referencias y opciones, no dependencias que deban instalarse todas. StudyStreak ya tiene React + Tailwind Web, Expo Mobile y el lenguaje visual carbón/menta.

| Caso de uso | Recomendación | Decisión |
|---|---|---|
| Web: pestañas, diálogos y botones | shadcn/ui | Empezar por primitivas de código propio y accesibles, conservando Tailwind. La primera es `StudyTabs`. No se afirma haber instalado shadcn CLI o Radix. |
| Web: gráficos de estadísticas | Recharts | Evaluar después del primer cambio; preferirlo cuando mejore ejes, tooltips y legibilidad sin penalizar en exceso el bundle. |
| Web: historial grande | TanStack Table | Añadir si se requieren filtros/ordenación y la API admite paginación de servidor. |
| Mobile: controles y formularios | React Native Paper | Evaluar compatibilidad Expo y costos de mezclar temas antes de instalar. Gluestack/Tamagui son alternativas, no dependencias complementarias automáticas. |
| Bibliotecas Web alternativas | Material UI, Ant Design, Mantine, Medusa UI | No combinarlas por defecto con shadcn; cubren requisitos superpuestos. |
| Calendarios | FullCalendar / React Native Calendars | Usar cuando haya una vista de agenda real. |
| Mapas/diagramas | React Leaflet, MapLibre GL JS, React Flow | No hay un caso de uso actual que justifique instalarlas en StudyStreak. |

## Primer paso implementado

`frontend-web/src/components/study/StudyTabs.tsx` aporta roles ARIA, relación tab-panel, foco y teclas ArrowLeft/ArrowRight/Home/End. `StudyAnalyticsDetails` utiliza esa navegación. Reutiliza el tema existente, no introduce nuevas dependencias y no cambia los datos, backend ni LiveKit.

Pruebas previstas: `npm ci && npm run lint && npm run build && npm run test:web` dentro de `frontend-web`, más validación manual de teclado y responsive.
