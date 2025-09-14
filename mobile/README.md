NewsFlow Mobile (Expo)

Quick start

- Prereqs: Node 18+, Xcode (for iOS simulator), Expo CLI (npx is fine).
- From `mobile/`, install deps: `npm install`.
- Optional: set API base: `export EXPO_PUBLIC_API_BASE_URL=http://localhost:3001`.
- Start dev and open iOS simulator: `npm run ios` (or `npm start` then press `i`).

Notes

- The app uses Expo Router with two routes: `/` (swipe deck) and `/search`.
- It attempts to fetch from `${EXPO_PUBLIC_API_BASE_URL}/api/news` with fallback to mock data.
- iOS simulator can reach your local API on `http://localhost:3001`.
- Android emulator uses `http://10.0.2.2:3001` by default.

