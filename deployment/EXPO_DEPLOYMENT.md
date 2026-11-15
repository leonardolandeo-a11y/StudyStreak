# StudyStreak — Stage 19.2: Android EAS readiness

This stage configures EAS Build for Android. It does **not** publish an app, change AWS/Vercel, or upload secrets.

## Before building

1. Confirm that the Spring Boot API is accessible through a working public **HTTPS** URL. `http://localhost:8080` and private Wi-Fi addresses are not valid production endpoints.
2. The existing `frontend-mobile/app.json` declares Android package `com.srhouse.studystreak`, Expo owner `srhouse` and an EAS `projectId`. Confirm with the team that these identifiers belong to the intended Expo account before building; do not replace them during the audit.
3. Sign in to Expo/EAS using your team's account. Keep credentials out of the repository.
4. `EXPO_PUBLIC_API_URL` is a **public client configuration** value. Store it in EAS **preview** and **production** environments, pointing to the verified HTTPS backend URL. Never place passwords, JWT secrets, AWS credentials, or database passwords in `EXPO_PUBLIC_*` variables. A `.env.production.example` file is documentation, not a deployed environment.
5. If `.env.local` contains a LAN IP, leave it for local Expo Go development; do not assume EAS uses that file. Use EAS environments for cloud builds.

## Suggested manual commands (only after the HTTPS backend is confirmed)

From `frontend-mobile`:

```powershell
npx --yes eas-cli@latest login
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest env:list --environment preview
```

Configure `EXPO_PUBLIC_API_URL` in the Expo dashboard or via EAS CLI, substituting the actual HTTPS URL:

```powershell
npx --yes eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_API_URL --value "https://YOUR-VERIFIED-API" --visibility plaintext
npx --yes eas-cli@latest env:set --environment production --name EXPO_PUBLIC_API_URL --value "https://YOUR-VERIFIED-API" --visibility plaintext
```

To create an Android APK for a physical device:

```powershell
npx --yes eas-cli@latest build --platform android --profile preview
```

This project already has `eas.json` with preview APK and production AAB profiles; there is no need to rerun `build:configure` just to generate these profiles. The `production` profile creates an Android App Bundle (AAB) for distribution through an app store. It is not directly installable like an APK. An Expo cloud build link alone does not establish that the deployed app can authenticate against the backend; this must be verified later.

## Native dependencies

The project includes LiveKit/WebRTC native plugins. Expo Go does not contain these custom native modules, so validate any LiveKit-enabled room experience in an EAS APK/development build rather than assuming Expo Go can run it. A successful cloud build alone does not confirm functional media connectivity.

## Verification still pending

- Actual public Spring Boot HTTPS URL, health/availability, and JWT calls.
- Actual Amazon RDS availability from EC2 (RDS should normally remain private).
- Deployed Vercel site URL, CORS origin, and SPA routing.
- EAS project registration, preview APK link, real device API connectivity, and permissions.
- Evidence required by the rubric, plus full end-to-end functional tests.
