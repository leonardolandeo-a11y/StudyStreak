# StudyStreak — Stage 19.2: Android EAS readiness

This stage configures EAS Build for Android. It does **not** publish an app, change AWS/Vercel, or upload secrets.

## Before building

1. Confirm that the Spring Boot API is accessible through a working public **HTTPS** URL. `http://localhost:8080` and private Wi-Fi addresses are not valid production endpoints.
2. Confirm the Android package identifier with your team. The existing `frontend-mobile/app.json` has no `android.package` field. EAS may ask you to choose an identifier during its setup. Do not assume an identifier without checking whether the app was previously registered.
3. Sign in to Expo/EAS using your team's account. Keep credentials out of the repository.
4. `EXPO_PUBLIC_API_URL` is a **public client configuration** value. Store it in EAS **preview** and **production** environments, pointing to the verified HTTPS backend URL. Never place passwords, JWT secrets, AWS credentials, or database passwords in `EXPO_PUBLIC_*` variables. A `.env.production.example` file is documentation, not a deployed environment.
5. If `.env.local` contains a LAN IP, leave it for local Expo Go development; do not assume EAS uses that file. Use EAS environments for cloud builds.

## Suggested manual commands (only after the HTTPS backend is confirmed)

From `frontend-mobile`:

```powershell
npx --yes eas-cli@latest login
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest build:configure --platform android
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

The `production` profile creates an Android App Bundle (AAB) for distribution through an app store. It is not directly installable like an APK. An Expo cloud build link alone does not establish that the deployed app can authenticate against the backend; this must be verified later.

## Verification still pending

- Actual public Spring Boot HTTPS URL, health/availability, and JWT calls.
- Actual Amazon RDS availability from EC2 (RDS should normally remain private).
- Deployed Vercel site URL, CORS origin, and SPA routing.
- EAS project registration, preview APK link, real device API connectivity, and permissions.
- Evidence required by the rubric, plus full end-to-end functional tests.
