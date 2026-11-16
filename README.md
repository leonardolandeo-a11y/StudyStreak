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
    W -->|API REST / JWT| B
    M -->|API REST / JWT| B
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

El repositorio incorpora pruebas automatizadas para los tres componentes. GitHub Actions ejecuta los flujos de integración continua definidos en `.github/workflows/ci.yml` y `.github/workflows/frontend-ci.yml`.

| Área | Cobertura |
| --- | --- |
| Backend | Autenticación JWT, permisos, servicios, reglas de negocio, repositorios e integración con PostgreSQL |
| Web | Sesiones y renovación de tokens, navegación, componentes, formularios, paginación, manejo de errores, Focus Studio e interfaz |
| Android | Sesiones, JWT, navegación, paginación, apariencia y funciones de concentración |

**Backend:** con el entorno Docker local ya iniciado, la prueba `py scripts/check-local-auth.py http://127.0.0.1:18081` comprueba el registro, inicio de sesión, rotación de refresh tokens, autorización y cierre de sesión sin mostrar credenciales.

**Web:** desde `frontend-web/`:

~~~powershell
npm run lint
npm run test:web
npm run build
~~~

**Android:** desde `frontend-mobile/`:

~~~powershell
npm run lint
npx --no-install tsc --noEmit
npm run test:auth
npm run test:appearance
npm run test:pagination
npm run test:review
npm run test:focus
~~~

Las funcionalidades de cámara, micrófono, permisos del sistema y sesiones multimedia también se prueban en un dispositivo Android. Para la interacción completa entre usuarios pueden utilizarse dos cuentas de prueba conectadas a la misma API.

### Recorrido funcional entre Web y Android

1. Registrar dos cuentas e iniciar sesión desde la Web y Android.
2. Crear una meta, asignar sus características y registrar el progreso diario.
3. Adjuntar evidencias de estudio mediante fotografía o grabación de voz cuando corresponda.
4. Establecer una relación de seguimiento entre las cuentas y validar una actividad autorizada.
5. Consultar rachas, estadísticas, notificaciones y el historial desde las dos aplicaciones.
6. Buscar recursos académicos mediante Google Books y utilizar las herramientas de concentración o las salas colaborativas.

Este recorrido permite comprobar la persistencia en PostgreSQL, el control de acceso, los estados de interfaz y la coherencia de los datos compartidos entre plataformas.

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

## Infraestructura y despliegue

StudyStreak dispone de configuración de infraestructura para separar el desarrollo local de la distribución pública. El backend se prepara para AWS EC2 con PostgreSQL en Amazon RDS; la Web está preparada para Vercel y Android utiliza perfiles de compilación EAS.

| Componente | Configuración y recursos |
| --- | --- |
| API Spring Boot | `Dockerfile`, `compose.local.yaml` y configuración de variables de entorno del servidor |
| Base de datos | PostgreSQL; scripts en `db/migrations/` y configuración JDBC para el entorno correspondiente |
| Web React | `frontend-web/vercel.json` para navegación SPA y `VITE_API_BASE_URL` para la URL pública de la API |
| Android | `frontend-mobile/app.json` y `frontend-mobile/eas.json`; `EXPO_PUBLIC_API_URL` para conectar con el backend |
| Seguridad | JWT, configuración de CORS mediante `APP_CORS_ALLOWED_ORIGINS` y credenciales privadas del lado del servidor |
| Integraciones | Google Books y LiveKit con configuración de sus servicios en el backend |

En producción, la Web y la API deben comunicarse mediante **HTTPS**. Las credenciales de PostgreSQL, JWT, correo y servicios externos se suministran mediante variables privadas; las variables `VITE_*` y `EXPO_PUBLIC_*` son visibles en los clientes y se utilizan únicamente para configuración pública.

**Referencias de publicación:**

- [Repositorio del proyecto](https://github.com/leonardolandeo-a11y/StudyStreak)
- [Compilación Android de desarrollo en Expo EAS](https://expo.dev/accounts/srhouse/projects/studystreak/builds/8c6f383f-93f7-418d-8144-632a902d4c40)

La compilación EAS enlazada es de desarrollo y requiere el servidor Metro. La aplicación Android de distribución independiente se obtiene con el perfil `preview` (APK) o `production` (Android App Bundle), según el canal de publicación elegido.

Los pasos de configuración y publicación están descritos en `deployment/README.md` y `deployment/EXPO_DEPLOYMENT.md`. Las direcciones definitivas de Web y API se incorporan cuando se confirme su disponibilidad pública.

## Equipo y contribuciones

El desarrollo del proyecto se distribuyó entre backend, aplicaciones cliente, interfaz e integración. La siguiente tabla resume las responsabilidades de cada integrante y el **porcentaje de cumplimiento de sus tareas asignadas**.

| Integrante | Responsabilidades principales | Cumplimiento |
| --- | --- | ---: |
| **Fabricio Nick Tumialan Maihua** | Lógica de rachas y validaciones; seguridad, pruebas e integración del backend; desarrollo de React Native y recursos externos | **100 %** |
| **Leonard Alexander Landeo Huatay** | Backend inicial y Docker; desarrollo de la Web; funcionalidades académicas, Focus Studio, Study Rooms y colaboración en tiempo real | **100 %** |
| **Jared Eloy Daniel Chala Lastra** | Controladores y seguridad del backend; diseño e implementación UI/UX de Web y Android; personalización, navegación y ajustes funcionales | **100 %** |

### Fabricio Nick Tumialan Maihua

**Lógica de negocio y servicios del backend.** Desarrolló la implementación inicial de `StreakService` y `ValidationService`, junto con los repositorios y consultas asociados al seguimiento de hábitos de estudio. Implementó controladores para los registros diarios, las rachas, los vínculos de seguimiento y las validaciones. Incorporó el tratamiento de excepciones HTTP y ajustes de las operaciones académicas. Referencias: [PR #12](https://github.com/leonardolandeo-a11y/StudyStreak/pull/12), [#18](https://github.com/leonardolandeo-a11y/StudyStreak/pull/18), [#20](https://github.com/leonardolandeo-a11y/StudyStreak/pull/20) y [#24](https://github.com/leonardolandeo-a11y/StudyStreak/pull/24).

**Seguridad, integración y calidad.** Reforzó la autenticación y autorización JWT, el manejo de refresh tokens y logout, las verificaciones de acceso y los casos de prueba relacionados con sesiones. Trabajó en escenarios de concurrencia, persistencia con PostgreSQL, zonas horarias, expiraciones, paginación y manejo de errores. Participó en la preparación de pruebas automatizadas y CI para facilitar la integración del proyecto. Referencias: [PR #50](https://github.com/leonardolandeo-a11y/StudyStreak/pull/50) y [#52](https://github.com/leonardolandeo-a11y/StudyStreak/pull/52).

**Aplicación móvil React Native.** Desarrolló e integró la aplicación Android con la API Spring Boot, incluyendo la sesión segura, navegación, servicios HTTP, manejo de estados y funciones de metas y seguimiento. Implementó las evidencias de estudio con cámara y micrófono, junto con la búsqueda de recursos de Google Books mediante el backend. Participó en las pruebas de integración móvil y en la preparación de compilaciones Android mediante Expo/EAS. Referencia: [PR #107](https://github.com/leonardolandeo-a11y/StudyStreak/pull/107).

### Leonard Alexander Landeo Huatay

**Servicios e infraestructura del backend.** Implementó DTOs, operaciones de usuarios, metas y registros diarios, así como componentes de la configuración inicial de Spring Security y autenticación JWT. Preparó la infraestructura Docker/PostgreSQL que facilita la ejecución e integración de los servicios, además de contribuir a procesos relacionados con eventos y tareas asíncronas. Referencias: [PR #4](https://github.com/leonardolandeo-a11y/StudyStreak/pull/4), [#8](https://github.com/leonardolandeo-a11y/StudyStreak/pull/8), [#10](https://github.com/leonardolandeo-a11y/StudyStreak/pull/10) y [#28](https://github.com/leonardolandeo-a11y/StudyStreak/pull/28).

**Aplicación Web e integración con la API.** Desarrolló la estructura de React/Vite y las funciones de autenticación, metas, registros diarios, seguimiento, validaciones, notificaciones y navegación. Adaptó a la Web funciones disponibles en la experiencia móvil, entre ellas recursos académicos, búsqueda de libros y evidencias multimedia. También trabajó en la integración HTTP con el backend y la configuración de Google Books. Referencias: [PR #56](https://github.com/leonardolandeo-a11y/StudyStreak/pull/56), [#108](https://github.com/leonardolandeo-a11y/StudyStreak/pull/108) y [#110](https://github.com/leonardolandeo-a11y/StudyStreak/pull/110).

**Concentración y colaboración.** Incorporó herramientas de Focus Studio, sesiones Pomodoro, sonidos ambientales, estadísticas de actividad y salas de estudio privadas. Trabajó en la integración de LiveKit/WebRTC, la sincronización de sesiones y los componentes necesarios de Web, Android y backend para la colaboración entre estudiantes. Referencias: [PR #117](https://github.com/leonardolandeo-a11y/StudyStreak/pull/117), [#118](https://github.com/leonardolandeo-a11y/StudyStreak/pull/118) y [#119](https://github.com/leonardolandeo-a11y/StudyStreak/pull/119).

### Jared Eloy Daniel Chala Lastra

**Backend y operaciones de la API.** Participó en los servicios y controladores de metas, etiquetas y notificaciones; trabajó en controles de seguridad y autorización, además de contribuir a la documentación de las peticiones de API. Sus cambios incluyen lógica funcional y componentes del backend. Referencias: [PR #11](https://github.com/leonardolandeo-a11y/StudyStreak/pull/11), [#22](https://github.com/leonardolandeo-a11y/StudyStreak/pull/22), [#25](https://github.com/leonardolandeo-a11y/StudyStreak/pull/25), [#35](https://github.com/leonardolandeo-a11y/StudyStreak/pull/35) y [#53](https://github.com/leonardolandeo-a11y/StudyStreak/pull/53).

**Diseño de interfaces Web y Android.** Trabajó en la identidad visual de StudyStreak, la organización de pantallas, los temas y las opciones de personalización. Refinó dashboards, widgets, perfiles, formularios, navegación y componentes de las vistas académicas, incluyendo aspectos de diseño responsive, estados de interfaz y accesibilidad.

**Integración y refinamiento funcional.** Además de los estilos, contribuyó a la experiencia de Focus Studio, Study Rooms, notificaciones y navegación entre secciones. Su trabajo incluyó ajustes de controladores y servicios, cambios de base de datos, dependencias, pruebas y CI para mantener la coherencia entre las aplicaciones. Referencia: [PR #122](https://github.com/leonardolandeo-a11y/StudyStreak/pull/122).
