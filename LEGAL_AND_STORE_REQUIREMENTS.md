# Project Red-Link - Legal, Privacy & Store Requirements Guide

This master document outlines all **legal requirements**, **required policies**, **hosting locations**, and **exact App Store / Play Store questionnaire answers** to ensure **Project Red-Link** passes Apple & Google review seamlessly without rejections.

---

## 1. What Software Features Were Implemented in Code?

To comply with **Apple App Store Guideline 5.1.1(v)** and **Google Play User Data Policies**, the following features are now live in your codebase:

1. **In-App Account & Data Deletion**:
   - Donors/Requesters can permanently delete their account, phone number, and all associated emergency records from the **Profile Tab > Delete My Account & Personal Data** with 1 click.
2. **Built-in Privacy & Terms Routes**:
   - Direct web routes at `/privacy` and `/terms` rendered cleanly in both the web and mobile app.
3. **Legal Compliance Footer**:
   - Footer links to Privacy Policy and Terms of Service on the home page and in the profile tab.
4. **Anti-Commercialization & Medical Warnings**:
   - Embedded legal notices warning that buying or selling human blood is a non-bailable criminal offense under Indian Law (Drugs and Cosmetics Act, 1940).

---

## 2. Where Are These Documents Hosted?

You **do not need any third-party website hosting**. These pages are built directly into your Next.js frontend and are automatically available on your domain:

| Document | Purpose | Live Hosted URL |
| :--- | :--- | :--- |
| **Privacy Policy** | Explains data collection (blood group, location, phone number, FCM tokens) and DPDP/GDPR rights. | `https://theredlinkproject.vercel.app/privacy` |
| **Terms of Service** | Non-commercialization clause, voluntary blood donation terms, medical disclaimer. | `https://theredlinkproject.vercel.app/terms` |
| **Account Deletion URL** | Required by Google Play Console for data deletion requests. | `https://theredlinkproject.vercel.app/privacy` |

---

## 3. Google Play Console Form Answers (Data Safety & Policies)

When submitting to the **Google Play Console**, use these exact answers:

### A. Data Safety Section:
* **Does your app collect or share any user data?** ➔ **Yes**
* **Is all of the user data collected by your app encrypted in transit?** ➔ **Yes** (HTTPS/TLS 1.3)
* **Do you provide a way for users to request that their data be deleted?** ➔ **Yes**
  * *Deletion URL*: `https://theredlinkproject.vercel.app/privacy`

#### Data Types Collected:
1. **Location**:
   * Approximate Location (Pincode / GPS) ➔ *Purpose: App functionality (Matching nearby donors within 10km)*.
2. **Personal Info**:
   * Name, Email, Phone Number ➔ *Purpose: Account management & volunteer coordination*.
3. **Health Info**:
   * Blood Group, Weight, Donation Eligibility ➔ *Purpose: Emergency blood matching*. (Select *"Not shared with 3rd-party advertisers"*).
4. **Device or other identifiers**:
   * Firebase/APNs Push Notification Token ➔ *Purpose: Real-time emergency dispatch*.

### B. Health & Medical Category:
* Select: **Health & Fitness / Emergency Assistance**.
* Select: *"This app is a peer-to-peer communication tool for voluntary blood donation and is not an FDA/CDSCO regulated medical device."*

---

## 4. Apple App Store Connect Form Answers (App Privacy)

When filling out **App Privacy** in App Store Connect:

1. **Privacy Policy URL**: `https://theredlinkproject.vercel.app/privacy`
2. **Data Collected**:
   * **Contact Info**: Name, Phone Number, Email (Used for App Functionality, linked to user identity).
   * **Health & Medical**: Blood group, donation eligibility (Used for App Functionality, linked to user identity).
   * **Location**: Approximate Location (Used for App Functionality, not used for tracking).
3. **Data Used to Track You**: ➔ **None** (Project Red-Link does not track users across third-party apps or websites).

---

## 5. Contact Information for Legal Inquiries

Ensure you have a dedicated support email in your store listings and privacy policy:
* **Support Email**: `support@projectredlink.app` (or your personal admin email)
* **Entity Type**: Non-commercial Open Emergency Volunteer Initiative / Individual Developer
