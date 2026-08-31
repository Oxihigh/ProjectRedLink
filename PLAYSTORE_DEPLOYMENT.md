# Project Red-Link - Google Play Store Deployment & Android Guide

This guide walks you step-by-step through generating your signed Android App Bundle (`.aab`), setting up native Firebase push notifications, and publishing **Project Red-Link** to the **Google Play Store**.

---

## 1. Firebase Native Push Setup (Crucial for Real-Time Background Alerts)

To ensure the phone wakes up and rings instantly when an emergency blood request is broadcast:

1. Open your [Firebase Console](https://console.firebase.google.com/) -> Select project `redlinkproject`.
2. Go to **Project Settings** (gear icon) -> Scroll down to **Your Apps** -> Click **Add App** -> Select **Android** (the Android robot icon).
3. Fill in the details:
   - **Android package name**: `com.projectredlink.app`
   - **App nickname**: `Project Red-Link`
4. Click **Register App** and download `google-services.json`.
5. Move the downloaded file into:
   ```
   frontend/android/app/google-services.json
   ```
6. Sync the Android configuration:
   ```bash
   cd frontend
   npm run cap:sync
   ```

---

## 2. Testing Locally on an Android Device / Emulator

### Option A: Open with Android Studio (Recommended)
1. In the `frontend/` directory, run:
   ```bash
   npm run cap:open
   ```
2. Android Studio will open the `frontend/android` project.
3. Connect your Android phone via USB (with Developer Mode & USB Debugging enabled) or choose an Android Emulator.
4. Click the green **Run** ▶ button.

---

## 3. Generate a Release Signing Keystore

Google Play requires your App Bundle (`.aab`) to be cryptographically signed.

Run the following command in PowerShell / Terminal to generate your keystore:

```powershell
keytool -genkey -v -keystore redlink-release-key.keystore -alias redlink-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
*(Store `redlink-release-key.keystore` safely! You will need this same key for all future app updates).*

---

## 4. Build the Signed Android App Bundle (`.aab`) for Google Play

### In Android Studio:
1. In Android Studio, go to the top menu: **Build** -> **Generate Signed Bundle / APK...**
2. Choose **Android App Bundle** (`.aab`) and click **Next**.
3. Select your `redlink-release-key.keystore` file path, enter your keystore password, alias, and key password.
4. Choose build variant: **release**.
5. Click **Create / Finish**.
6. The generated `.aab` file will be in:
   ```
   frontend/android/app/release/app-release.aab
   ```

---

## 5. Google Play Console Publishing Checklist

1. **Google Play Console Account**:
   - Go to [play.google.com/console](https://play.google.com/console) and log in with your developer account ($25 one-time registration).
2. **Create App**:
   - App Name: `Project Red-Link`
   - Default language: English (United States / India)
   - App type: App
   - Free or Paid: Free
3. **Store Listing Details**:
   - **Short description**: Real-time emergency blood donation network connecting patients and eligible donors.
   - **Full description**: Project Red-Link is a life-saving blood donation network designed to rapidly detect emergency blood requirements and alert nearby eligible donors in real time.
   - **App Icon**: 512x512 PNG (Use `frontend/public/icon.png`).
   - **Feature Graphic**: 1024x500 PNG/JPEG.
   - **Phone Screenshots**: At least 2 screenshots of the app screens.
4. **App Content & Data Safety**:
   - **Target Audience**: 18+ (blood donation age limit).
   - **Location Data**: Declare coarse/fine location usage for matching nearby donors with hospitals.
   - **Privacy Policy**: Google requires a public URL to your privacy policy.
5. **Create Release & Upload `.aab`**:
   - Go to **Production** (or **Internal / Closed Testing** for verification first).
   - Click **Create new release**.
   - Drag and drop `frontend/android/app/release/app-release.aab`.
   - Add release notes (e.g. `Initial release of Project Red-Link`).
   - Click **Review release** -> **Start rollout to Production**!

---

## 6. Development Workflow (When making future UI updates)

Whenever you edit frontend components or CSS in the future:
```bash
cd frontend
npm run cap:sync
```
This re-builds the Next.js static bundle and updates the Android assets automatically.
