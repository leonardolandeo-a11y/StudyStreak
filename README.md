# StudyStreak

**Seguimiento colaborativo de hábitos de estudio**  
Proyecto de **CS2031 — Desarrollo Basado en Plataformas | UTEC | 2026-2**

StudyStreak ayuda a convertir objetivos académicos en hábitos medibles. Cada estudiante puede planificar metas, registrar avances y mantener una racha de constancia; además, puede conectar con otros estudiantes para compartir seguimiento y validar actividades. La misma información se consulta desde la aplicación web y la aplicación Android mediante una API propia.

## ¿Qué permite hacer?

| Área | Funcionalidad |
| --- | --- |
| Cuenta y perfil | Registro, inicio y cierre de sesión, perfil personal, edición de datos y preferencias |
| Metas | Crear, consultar, editar y eliminar objetivos; organizar por etiquetas y dificultad |
| Registro de progreso | Registrar actividades diarias, consultar historial y añadir evidencias según el flujo |
| Seguimiento | Solicitar seguimiento entre estudiantes, aceptar o rechazar solicitudes y consultar compañeros |
| Validación | Revisar y aprobar o rechazar registros de un compañero autorizado |
| Rachas y notificaciones | Consultar continuidad, resultados y avisos relacionados con la actividad |
| Dashboard | Resumen del estudio, indicadores y acceso a las funciones principales |
| Focus Studio | Sesiones de concentración, temporizador Pomodoro y ambientes sonoros |
| Study Rooms | Salas compartidas, participantes, temporizador sincronizado y funciones multimedia mediante LiveKit |
| Recursos | Búsqueda de libros con Google Books a través del backend |
| Personalización | Temas visuales, ajustes de apariencia, navegación responsive y accesibilidad básica |

La persistencia de las funciones académicas principales reside en PostgreSQL a través de Spring Boot. Los temporizadores, preferencias visuales y datos temporales de interfaz pueden usar estado local, pero no sustituyen a la API para las operaciones principales.

## Arquitectura

~~~mermaid
flowchart TB
    W["Aplicación web<br/>React + TypeScript + Vite"]
    M["Aplicación Android<br/>React Native + Expo Router"]
    B["API REST<br/>Spring Boot + Spring Security"]
    DB[("PostgreSQL")]
    BOOKS["Google Books API"]
    MEDIA["LiveKit<br/>comunicación en tiempo real"]
    W -->|HTTPS / JWT| B
    M -->|HTTPS / JWT| B
    B -->|JPA / transacciones| DB
    B -->|Consulta de libros| BOOKS
    W <-->|Sesiones multimedia| MEDIA
    M <-->|Sesiones multimedia| MEDIA
    B -->|Autorización de salas y tokens| MEDIA
~~~

- **Backend (`src/`):** Java 21, Spring Boot 4.1.1, Spring Security, Spring Data JPA, validación, JWT, eventos y tareas asíncronas.
- **Web (`frontend-web/`):** React 19, TypeScript, Vite, React Router, componentes reutilizables, hooks y cliente Axios.
- **Mobile (`frontend-mobile/`):** React Native, Expo SDK 58, Expo Router, Expo SecureStore, cámara, micrófono y cliente Axios.
- **Datos (`db/`):** PostgreSQL, entidades relacionales y scripts de evolución del esquema.
- **Infraestructura:** Docker Compose para desarrollo y verificación aislada; configuración de AWS EC2/RDS, Vercel y EAS para publicación.
- **Pruebas (`src/test/`, `frontend-web/tests/`, `frontend-mobile/tests/`):** verificaciones de servicios, API, sesión, navegación, interfaz y lógica de estudio.

### Flujo académico principal

~~~text
Registro e inicio de sesión
         ↓
Creación de meta → Registro diario → Seguimiento de compañero
                                            ↓
                                  Validación del registro
                                            ↓
                                Racha, progreso y avisos
~~~

### Seguridad e integración

La API autentica mediante access tokens JWT y refresh tokens, protegidos por Spring Security. El backend comprueba la autorización sobre recursos de cada usuario. En Android, los tokens se guardan mediante Expo SecureStore; en Web se utiliza una sesión de navegador con interceptores para autenticación y renovación de tokens. Las claves privadas, contraseñas y tokens de firma se configuran únicamente del lado del servidor. `VITE_*` y `EXPO_PUBLIC_*` son variables públicas, **nunca** deben contener secretos.

Los clientes comparten contratos HTTP y utilizan manejo de errores, estados de carga y validaciones. La interfaz web incorpora rutas protegidas y dinámicas, indicadores de navegación, componentes reutilizables y paginación conectada con el backend.

## Estructura del repositorio

~~~text
StudyStreak/
├── src/                         API Spring Boot y pruebas
├── frontend-web/                Aplicación React
│   ├── src/                     Páginas, componentes, hooks y servicios
│   └── tests/                   Pruebas Web
├── frontend-mobile/             Aplicación React Native / Expo
│   ├── src/                     Rutas, pantallas, componentes y servicios
│   ├── tests/                   Pruebas Mobile
│   ├── app.json                 Configuración de Expo
│   └── eas.json                 Perfiles de compilación Android
├── db/migrations/               Scripts SQL
├── scripts/                     Verificaciones y utilidades
├── assets/                      Recursos compartidos
├── .github/workflows/           Integración continua
├── Dockerfile
├── compose.local.yaml           Backend y PostgreSQL aislados
└── README.md
~~~

## Ejecutar el proyecto localmente

**Requisitos:** Git, Docker Desktop con Compose, Node.js y npm; Java 21 y Maven Wrapper para ejecutar el backend fuera de Docker. Para Android se requiere un teléfono y una compilación de desarrollo de Expo si se desean usar los módulos nativos de LiveKit/WebRTC.

### 1. Backend y PostgreSQL de pruebas

Desde la raíz, crear un archivo privado de configuración:

~~~powershell
Copy-Item .env.docker.local.example .env.docker.local
notepad .env.docker.local
~~~

Antes de levantar los servicios, configurar `LOCAL_LAN_IP` con la IPv4 actual del equipo, un puerto disponible (`LOCAL_API_PORT`), un nombre **nuevo** para `LOCAL_DB_VOLUME` y credenciales locales generadas para pruebas. No reutilizar bases o volúmenes con datos importantes.

~~~powershell
docker compose -p studystreak-qa --env-file .env.docker.local -f compose.local.yaml config -q
docker compose -p studystreak-qa --env-file .env.docker.local -f compose.local.yaml up -d --build
docker compose -p studystreak-qa --env-file .env.docker.local -f compose.local.yaml ps
~~~

Si se usa `LOCAL_API_PORT=18081`:

~~~powershell
py scripts/check-local-auth.py http://127.0.0.1:18081
~~~

Una ruta protegida sin credenciales debe responder con HTTP `401`. **No utilizar `docker compose down -v`**: elimina el volumen de base de datos del proyecto.

### 2. Aplicación Web

Crear `frontend-web/.env.local` con la dirección local del backend:

~~~ini
VITE_API_BASE_URL=http://127.0.0.1:18081
~~~

~~~powershell
cd frontend-web
npm ci
npm run lint
npm run test:web
npm run build
npm run dev
~~~

Abrir `http://localhost:5173`. Al cambiar variables de Vite, reiniciar el servidor de desarrollo.

### 3. Aplicación Android

En `frontend-mobile/.env.local`, usar la IPv4 del equipo que ejecuta Docker, **no** `localhost`:

~~~ini
EXPO_PUBLIC_API_URL=http://IP_DEL_EQUIPO:18081
~~~

~~~powershell
cd frontend-mobile
npm ci
npx --no-install expo install --check
npm run lint
npx --no-install tsc --noEmit
npm run test:auth
npm run test:pagination
npm run test:review
npm run test:focus
npm run test:appearance
npx --no-install expo start --dev-client --lan --clear
~~~

Instalar antes la APK de desarrollo y conectar el celular a la misma red Wi-Fi. Expo Go no incluye los módulos nativos personalizados necesarios para todas las funciones multimedia.

## Pruebas y calidad

Las verificaciones automatizadas se encuentran en los respectivos proyectos y se ejecutan también desde `.github/workflows/ci.yml` y `.github/workflows/frontend-ci.yml`.

| Área | Evidencia comprobada en la rama de auditoría |
| --- | --- |
| Backend | Docker/PostgreSQL aislados, verificación de autenticación local y Backend CI aprobado |
| Web | **154/154 pruebas aprobadas**, ESLint y build de producción aprobados |
| Dependencias Web | `npm audit --omit=dev`: **0 vulnerabilidades reportadas** durante la auditoría |
| Mobile | **75/75 pruebas aprobadas**, ESLint y TypeScript sin errores |
| Expo | Compatibilidad SDK 58 comprobada; exportación del bundle Android completada |
| Android nativo | EAS development build finalizada y aplicación abierta en teléfono físico |
| CI | Backend CI y Frontend/Mobile CI aprobados para el commit `667b779c` de la rama auditada; comprobar de nuevo tras cada commit posterior |

Estos resultados **no equivalen** a una prueba funcional completa de todas las pantallas ni garantizan que `main` o los servicios de producción contengan esa revisión. En Mobile, la auditoría de dependencias reportó **cuatro avisos moderados** relacionados con una dependencia transitiva de Expo; no se aplicó una degradación forzada del SDK para silenciarlos.

La validación integral pendiente cubre registro e inicio de sesión, metas, registros, seguimiento y validaciones entre dos cuentas, rachas, recursos externos, notificaciones, evidencias, permisos, Focus Studio, Study Rooms, recuperación ante errores y sincronización entre Web y Android.

## API y servicios externos

| Servicio | Uso |
| --- | --- |
| `POST /register`, `POST /login`, `POST /refresh` y `POST /logout` | Identidad y sesión |
| `/users/{userId}/goals` | Metas del estudiante |
| `/api/goals/{goalId}/daily-records` | Registro del progreso |
| `/api/tracking-links` | Relaciones de seguimiento |
| `/api/goals/{goalId}/daily-records/{dailyRecordId}/validation` | Validaciones |
| `/api/resources/books` | Consulta de Google Books a través del servidor |
| `/api/study-rooms` | Operaciones de las salas de estudio |

Los recursos privados requieren autenticación. Las operaciones HTTP, las restricciones de acceso y los parámetros de paginación dependen del endpoint correspondiente. La colección `postman_collection.json` ofrece peticiones adicionales para inspeccionar la API.

**Google Books:** `GOOGLE_BOOKS_API_KEY` se configura exclusivamente en el backend.  
**LiveKit:** las credenciales de firma se mantienen en el backend; los clientes reciben únicamente las autorizaciones necesarias para las salas.

## Publicación y estado de entrega

La publicación completa exige una Web y una API accesibles mediante HTTPS, PostgreSQL administrado, CORS configurado para el dominio real, JWT funcionando de extremo a extremo y Android conectado a los mismos servicios.

| Componente | Enlace / comprobación |
| --- | --- |
| Código fuente | [GitHub — StudyStreak](https://github.com/leonardolandeo-a11y/StudyStreak) |
| Web pública | URL HTTPS por confirmar tras la verificación del despliegue |
| Backend público | URL HTTPS por confirmar tras la verificación del despliegue |
| PostgreSQL administrado | Integración AWS RDS por verificar con el backend desplegado |
| Android — compilación de desarrollo | [EAS Build — StudyStreak](https://expo.dev/accounts/srhouse/projects/studystreak/builds/8c6f383f-93f7-418d-8144-632a902d4c40) |
| Android — distribución independiente de Metro | APK preview / publicación definitiva pendiente de verificar |

**La compilación Android enlazada es de desarrollo:** requiere Metro para cargar el proyecto y no representa por sí misma una aplicación de producción publicada. El entorno local emplea HTTP en una red privada; en producción debe emplearse una API HTTPS.

Para comprobar el despliegue público sin alterar datos:

~~~powershell
node scripts/check-deployment.mjs --api https://URL_BACKEND_VERIFICADA --web https://URL_WEB_VERIFICADA
~~~

Esta comprobación verifica elementos básicos de disponibilidad, carga de la Web, protección de la API y CORS; las acciones de usuario y la multimedia requieren pruebas adicionales.

## Equipo y contribuciones

Los aportes descritos se contrastaron con los pull requests fusionados en GitHub y, para Fabricio, también con el registro de implementación y pruebas del proyecto. **Los porcentajes son el cumplimiento individual de responsabilidades informado por el equipo**, no la fracción de líneas de código escritas por cada integrante. El docente puede verificar y ajustar la valoración individual.

| Integrante | Aportes concretos y evidencia | Cumplimiento individual informado |
| --- | --- | --- |
| **Fabricio Nick Tumialan Maihua** | **Backend:** implementación original de `StreakService`, `ValidationService` y sus consultas; controllers de registros diarios, rachas, seguimiento y validación; excepciones HTTP; refuerzo de JWT, refresh/logout, autorización, manejo de concurrencia, zonas horarias y pruebas con PostgreSQL; configuración de CI. **Mobile:** desarrollo e integración React Native/Expo con la API, sesión segura, evidencias de cámara y micrófono, búsqueda Google Books y detalles (incluida integración backend), notificaciones y preparación de Android/EAS. **Calidad transversal:** correcciones de paginación, errores y timeouts Web/Mobile, pruebas y auditoría de integración. [PR #12](https://github.com/leonardolandeo-a11y/StudyStreak/pull/12), [#18](https://github.com/leonardolandeo-a11y/StudyStreak/pull/18), [#20](https://github.com/leonardolandeo-a11y/StudyStreak/pull/20), [#24](https://github.com/leonardolandeo-a11y/StudyStreak/pull/24), [#50](https://github.com/leonardolandeo-a11y/StudyStreak/pull/50), [#52](https://github.com/leonardolandeo-a11y/StudyStreak/pull/52), [#107](https://github.com/leonardolandeo-a11y/StudyStreak/pull/107). | **100 %** |
| **Leonard Alexander Landeo Huatay** | **Backend:** DTOs, servicios de usuarios, metas y registros, Docker/PostgreSQL, autenticación JWT inicial, eventos y tareas asíncronas. **Web:** estructura React/Vite, autenticación, metas, registros, seguimiento, validaciones, notificaciones, navegación y componentes; adaptación a Web de recursos y evidencias multimedia. **Funciones ampliadas:** correcciones de configuración Google Books, Focus Studio, Pomodoro, estadísticas de estudio, Study Rooms privadas, sincronización y colaboración LiveKit/WebRTC, con componentes backend, Web y Mobile. **Infraestructura:** configuración e integración para despliegue, sin confundirla con producción HTTPS ya verificada. [PR #4](https://github.com/leonardolandeo-a11y/StudyStreak/pull/4), [#8](https://github.com/leonardolandeo-a11y/StudyStreak/pull/8), [#10](https://github.com/leonardolandeo-a11y/StudyStreak/pull/10), [#28](https://github.com/leonardolandeo-a11y/StudyStreak/pull/28), [#56](https://github.com/leonardolandeo-a11y/StudyStreak/pull/56), [#108](https://github.com/leonardolandeo-a11y/StudyStreak/pull/108), [#110](https://github.com/leonardolandeo-a11y/StudyStreak/pull/110), [#117](https://github.com/leonardolandeo-a11y/StudyStreak/pull/117), [#118](https://github.com/leonardolandeo-a11y/StudyStreak/pull/118), [#119](https://github.com/leonardolandeo-a11y/StudyStreak/pull/119). | **100 %** |
| **Jared Eloy Daniel Chala Lastra** | **Backend inicial:** servicios adicionales, controllers de metas, etiquetas y notificaciones, mejoras de seguridad/autorización y documentación de API. **Web y Mobile:** diseño UI/UX, branding, temas y personalización, navegación, dashboard y widgets, perfiles, formularios, Focus Studio, Study Rooms, notificaciones, adaptación responsive y accesibilidad. **Cambios también funcionales:** ajustes de controllers/servicios y perfil, base de datos, pruebas, dependencias y estabilización de CI; su trabajo no se limita a estilos visuales. [PR #11](https://github.com/leonardolandeo-a11y/StudyStreak/pull/11), [#22](https://github.com/leonardolandeo-a11y/StudyStreak/pull/22), [#25](https://github.com/leonardolandeo-a11y/StudyStreak/pull/25), [#35](https://github.com/leonardolandeo-a11y/StudyStreak/pull/35), [#53](https://github.com/leonardolandeo-a11y/StudyStreak/pull/53), [#122](https://github.com/leonardolandeo-a11y/StudyStreak/pull/122). | **100 %** |

Las contribuciones se construyeron sobre una misma base y fueron integradas en conjunto; un PR puede modificar capas de otro integrante por compatibilidad o corrección. Los enlaces acreditan cambios en GitHub, no certifican por sí solos la ejecución de una demo o un despliegue final.

## Presentación

La exposición se organiza como un pitch tecnológico de **20 minutos**: introducción y gancho (1 min), problema (2 min), solución (4 min), arquitectura (2 min), demostración funcional (6 min) y preguntas técnicas (5 min). La demostración debe usar cuentas de prueba y datos previamente preparados, mostrar el recorrido principal entre Web, Android y backend, y permitir justificar las decisiones técnicas.

La documentación del repositorio describe la implementación y las verificaciones disponibles; el cumplimiento definitivo de la rúbrica también depende de la prueba funcional, la publicación comprobada y la exposición de cada integrante.
