# SmartGES Student

Standalone Expo and React Native student app. The existing web app remains in `frontend/` and continues to use the same Django backend.

## MVP screens

- Student ID and password sign-in
- Student dashboard and assignment summary
- Term grades and subject scores
- Published report status
- Assignment list and submission status
- Secure token storage, refresh, sign-out, and pull-to-refresh

## API setup

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the backend API root, including `/api`.

- Android emulator with Django running on the development computer: `http://10.0.2.2:8000/api`
- Physical phone: use the computer's LAN IP, for example `http://192.168.1.20:8000/api`
- Production: use the deployed backend's HTTPS API URL

The development computer and phone must be on a reachable network. Do not commit `.env` or production secrets.

## Run on Android

```powershell
cd mobile-app
Copy-Item .env.example .env
npm install
npx expo install expo-secure-store
npx expo start --android
```

Use Expo Go for an initial development run. Native push notifications and store builds will be planned after the first student flows are validated against test accounts.
