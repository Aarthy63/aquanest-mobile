# AquaNest env setup (frontend + backend separate)

## Backend — `backend/.env`

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `4000`) |
| `JWT_SECRET` | Sign auth tokens |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Separate admin-panel login (not mobile) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay (empty = demo mode) |
| `SMTP_*` | Real email (empty = log to console) |
| `FIREBASE_*` | Optional Firebase Admin for mail metadata / FCM |

## Mobile — `mobile/.env`

```bash
cd mobile
copy .env.example .env
npx expo start -c
```

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | API base URL the phone can reach |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Public Razorpay key only (never the secret) |
| `EXPO_PUBLIC_FIREBASE_*` | Optional Firebase web client config |

### Device tips

- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000`
- Physical phone: `EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:4000`
- Restart Expo with `-c` after changing `.env`

## Auth behaviour

- Login uses the email/password you enter (not forced to demo).
- Demo is optional via “Use demo account”.
- After login or register → **Home** tab.

## Razorpay

1. Put **matching** Key ID + Secret in `backend/.env`
2. Put the **same Key ID** in `mobile/.env` as `EXPO_PUBLIC_RAZORPAY_KEY_ID`
3. Checkout opens real Razorpay (Checkout.js WebView). Demo mode only if keys are missing.
4. Restart Expo with `-c` after changing `mobile/.env`

## Admin panel — `admin/`

Separate app and credentials from the mobile customer login.

```bash
cd admin
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5174  
Default credentials (override in `backend/.env`): `admin@aquanest.in` / `admin123`

Admin tokens cannot be used in the mobile app, and customer accounts cannot sign in to the admin panel.

## How to test push (Expo Go)

1. Start backend: `cd backend && npm run dev`
2. Start mobile: `cd mobile && npx expo start` → open in Expo Go, **sign in**
3. Admin → **Notifications** → send a test message
4. Within ~8 seconds the app shows an **Alert** + home **bell** badge  
   (Expo Go cannot show remote FCM tray notifications — that needs `npx expo run:android`)

## Daily AI social posts

Backend job (no manual input when scheduled):

| What | How |
|---|---|
| Schedule | Every day at `AI_POST_HOUR` (default 9:00 server time) |
| Image | OpenAI DALL·E if `OPENAI_API_KEY` set, else Pollinations AI |
| Caption + hashtags | OpenAI if key set, else AquaNest template |
| Delivery | Saved under Admin → **AI Posts** + emailed via SMTP |

```bash
# backend/.env
AI_POST_SCHEDULE=1
AI_POST_HOUR=9
OPENAI_API_KEY=sk-...   # optional
```

Admin → **AI Posts** → **Run AI post now** to test immediately.

## Push notifications (phone)

| Mode | Works in | How |
|---|---|---|
| **Local phone banners** | Expo Go + native builds | App polls API → shows system tray notification. Permission dialog on login/open. |
| **Remote FCM push** | **Development / production build only** | Not available in Expo Go Android (SDK 53+). Set `EXPO_PUBLIC_ENABLE_NATIVE_PUSH=1` and build with `npx expo run:android`. |

If you see `ExpoTopicSubscriptionModule` errors, restart Expo with cache clear:

```bash
cd mobile
npx expo start -c
```

On Android 13+, if you previously tapped “Deny”, open **Settings → Apps → Expo Go → Notifications → Allow**.

## Firebase email

Transactional email is sent by the **backend** (SMTP). Firebase Admin is optional for project stamping / FCM. Configure SMTP for real inbox delivery.

## Firestore (database)

Today the API uses a local JSON DB: `backend/data/store.json` (`backend/src/db.js`).

Firebase Admin credentials are already in `backend/.env`. To start using **Cloud Firestore** as the database:

1. In [Firebase Console](https://console.firebase.google.com/) → project `saiacs-159763` → **Build → Firestore Database** → Create database (start in test mode for dev, then lock rules).
2. In `backend/.env` add:
   ```bash
   USE_FIRESTORE=1
   ```
3. Helpers live in `backend/src/firestore.js`:
   - `upsertUserDoc(user)`
   - `addUserNotification(userId, notification)`
   - `listUserNotifications(userId)`

### Suggested collections (map from store.json)

```
users/{userId}
  cart, wishlist, addresses, devices, dealer, settings…
  notifications/{id}
  loginHistory/{id}
  orders/{id}
  bookings/{id}

products/{productId}     # optional; catalog.js can stay in code
meta/counters            # next ids
```

### Minimal write example (backend)

```js
import { upsertUserDoc, addUserNotification } from "./firestore.js";

await upsertUserDoc(user);
await addUserNotification(user.id, {
  id: "N123",
  title: "New sign-in",
  body: "Signed in on Android",
  kind: "login",
  read: false,
});
```

Keep using `db.js` until you migrate each API route to read/write Firestore. Do not flip `USE_FIRESTORE=1` in production until users/orders are fully moved.
