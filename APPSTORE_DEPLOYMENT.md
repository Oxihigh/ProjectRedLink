# Project Red-Link - Apple App Store & TestFlight Deployment Guide

This guide walks you step-by-step through setting up your **Apple iOS App**, configuring push notifications with APNs/Firebase, and publishing **Project Red-Link** to **Apple TestFlight** and the **App Store**.

---

## 1. Firebase iOS Push Configuration

To enable native emergency push notifications on iPhones:

1. Open your [Firebase Console](https://console.firebase.google.com/) -> Select project `redlinkproject`.
2. Go to **Project Settings** -> Under **Your Apps**, click **Add App** -> Select **iOS**.
3. Fill in:
   - **Apple bundle ID**: `com.projectredlink.app`
   - **App nickname**: `Project Red-Link`
4. Download `GoogleService-Info.plist`.
5. Place the file inside:
   ```
   frontend/ios/App/App/GoogleService-Info.plist
   ```
6. Sync the iOS platform:
   ```bash
   cd frontend
   npm run cap:sync:ios
   ```

---

## 2. Testing Locally on a Mac (Optional)

If you or a team member have a Mac with Xcode:
1. Open the project in Xcode:
   ```bash
   cd frontend
   npm run cap:open:ios
   ```
2. In Xcode:
   - Select your target device (iPhone simulator or plugged-in iPhone).
   - Under **Signing & Capabilities**, select your Apple Developer Team.
   - Click the **Play / Run ▶** button.

---

## 3. Automated Cloud Compilation via GitHub Actions

You don't need a Mac to compile the iOS app! Our automated GitHub Actions workflow (`build-ios.yml`) runs on GitHub's Apple Silicon macOS cloud runners to compile the Xcode project on every push.

1. Go to your repository's **[Actions](https://github.com/Oxihigh/ProjectRedLink/actions)** tab.
2. Select **"Build iOS App (Xcode)"**.
3. Download the compiled **`RedLink-iOS-App`** artifact.

---

## 4. Distributing to Apple TestFlight & App Store

1. **Apple Developer Account**:
   - Register at [developer.apple.com](https://developer.apple.com) ($99/year).
2. **App Store Connect**:
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) -> **Apps** -> Click **+** (New App).
   - Bundle ID: `com.projectredlink.app`.
   - SKU / Name: `Project Red-Link`.
3. **Upload Archive**:
   - From Xcode: **Product > Archive > Distribute App > App Store Connect / TestFlight**.
   - Or upload via the free Apple `Transporter` app.
4. **Invite TestFlight Testers**:
   - Under the **TestFlight** tab, add email addresses of your team or emergency responders to test the live app on their iPhones before public App Store release.
5. **Submit for App Store Review**:
   - Fill in App Store descriptions, screenshots (6.7" and 6.5" displays), privacy policy, and submit for Apple Review!
