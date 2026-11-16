# StudyStreak Android con Expo EAS

El proyecto [`studystreak-team/studystreak`](https://expo.dev/accounts/studystreak-team/projects/studystreak) usa el paquete Android `com.srhouse.studystreak`. El identificador del proyecto y el paquete Android se conservaron al cambiar de organización.

## Generar el APK

Desde la raíz del repositorio, con acceso al proyecto de Expo:

```bash
cd frontend-mobile
npm ci
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest project:info
npx --yes eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_API_URL --value https://54.92.245.208 --visibility plaintext
npx --yes eas-cli@latest build --platform android --profile preview
```

El perfil `preview` genera un APK instalable sin Expo Go ni Metro. El perfil `development` es para desarrollo con Metro y el perfil `production` genera un AAB para una tienda. Usa las credenciales de firma existentes para mantener la compatibilidad con instalaciones previas.

`EXPO_PUBLIC_API_URL` es la URL pública del backend y se incluye al compilar. No compartas claves de firma, credenciales ni secretos en variables `EXPO_PUBLIC_*`. Si la API cambia de dirección, actualiza la variable y compila de nuevo.

## Verificar en un dispositivo Android

1. Abre el enlace de instalación de Expo en un navegador sin sesión y comprueba que permita descargar el APK.
2. Instala el APK y prueba el inicio de sesión y la persistencia de una meta contra la API pública.
3. Adjunta una foto y una nota de voz a un registro diario. Verifica el comportamiento al denegar y conceder permisos.
4. Busca un libro en Recursos. En Study Rooms, usa Android para ver una pantalla que comparte otro participante desde la web.

La compilación y descarga no sustituyen las pruebas en un dispositivo real.
