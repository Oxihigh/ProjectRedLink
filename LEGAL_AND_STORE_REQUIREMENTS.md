# Project Red-Link - Software & Documentation Requirements Guide

This master guide outlines the **Software Requirements** (technical implementations) and **Documentation Requirements** (legal policies, hosting locations, and required contents) for **Project Red-Link** to satisfy Indian law (DPDP Act 2023, Drugs & Cosmetics Act 1940) and pass **Google Play Store** and **Apple App Store** review without rejections.

---

# SECTION 1: SOFTWARE REQUIREMENTS (Technical Implementations)

The following software features are implemented directly in the app code to comply with Apple App Store Guideline 5.1.1(v) and Google Play User Data Policies:

### 1.1 In-App Account & Data Deletion
* **Requirement**: Any app allowing account registration must provide an immediate, self-service in-app deletion mechanism.
* **Implementation**: Added in `frontend/src/components/CommandCenter.js` under the **Profile Tab > Delete My Account & Personal Data**.
* **Behavior**: Permanently deletes the user record, blood group, phone number, and location from Supabase PostgreSQL database, clears the session, and reloads the app.

### 1.2 Built-in Legal Web Routes
* **Requirement**: Privacy Policy and Terms must be accessible inside the app and via direct public web URLs.
* **Implementation**: Built as Next.js pages at `/privacy` and `/terms` (statically exported to `frontend/out/privacy/` and `frontend/out/terms/`).

### 1.3 Permission Rationale & Runtime Prompts
* **Push Notifications** (`POST_NOTIFICATIONS` on Android / APNs on iOS): Used solely for real-time emergency blood dispatch notifications.
* **Location** (`ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` / `NSLocationWhenInUseUsageDescription`): Used strictly for 10km proximity matching between hospital requests and donors.
* **Camera / Photos** (`NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription`): Used for optional medical prescription verification.

### 1.4 Data Security & Masking
* **Encryption in Transit**: All API traffic encrypted over HTTPS (TLS 1.3).
* **Phone Number Masking**: Donor contact numbers are masked by default and only revealed upon explicit voluntary confirmation for an emergency request.

### 1.5 In-App Navigation & Footer
* **Implementation**: Direct clickable links to Privacy Policy and Terms of Service located in the landing page footer (`frontend/src/app/page.js`) and within the authenticated Profile tab (`frontend/src/components/CommandCenter.js`).

---

# SECTION 2: DOCUMENTATION REQUIREMENTS (Policies, Locations & Content)

Below is the complete list of legal and store documents you must maintain, where each document must be added, and what each document must contain:

---

## 2.1 Complete List of Required Documents

| # | Document Name | Where to Add / Host | Store Submission Location |
| :- | :--- | :--- | :--- |
| **1** | **Privacy Policy** | `frontend/src/app/privacy/page.js`<br>➔ Live URL: `https://theredlinkproject.vercel.app/privacy` | **Google Play Console** > App Content > Privacy Policy<br>**App Store Connect** > App Information > Privacy Policy URL |
| **2** | **Terms of Service** | `frontend/src/app/terms/page.js`<br>➔ Live URL: `https://theredlinkproject.vercel.app/terms` | Linked inside the App, Play Store description, and TestFlight review notes |
| **3** | **Data Deletion Policy & Instructions** | Included inside `/privacy#deletion` and in-app Profile tab | **Google Play Console** > App Content > Data Safety > Data Deletion Request URL |
| **4** | **Medical & Non-Commercialization Disclaimer** | Included in `/terms` and landing page footer | **Google Play Console** & **App Store Connect** App Descriptions |

---

## 2.2 Detailed Breakdown of Each Document

### Document 1: Privacy Policy

* **Where to Add**:
  * In the codebase: `frontend/src/app/privacy/page.js`
  * Live URL: `https://theredlinkproject.vercel.app/privacy`
  * In Google Play Console: **Policy and programs > App content > Privacy policy**
  * In Apple App Store Connect: **App Information > General Information > Privacy Policy URL**

* **What It Must Include**:
  1. **Entity Identification**: Platform name (*Project Red-Link*), operator type (*Open Emergency Volunteer Initiative*), and contact email (*support@projectredlink.app* or your official email).
  2. **Categories of Data Collected**:
     * Identity Data: Name, Email (Google OAuth).
     * Sensitive Health Data: Blood group (A+, B+, etc.), weight threshold (>45kg), medication eligibility, date of last donation.
     * Location Data: 6-digit residential pincode and approximate GPS coordinates (used only for proximity calculations).
     * Device Identifiers: Firebase/APNs push notification device tokens.
  3. **Purpose Limitation**: Clear statement that health and contact data is used **only** for emergency blood matching and never for commercial profiling or advertising.
  4. **Third-Party Service Providers**: Disclosure of backend infrastructure (Supabase PostgreSQL, Google Firebase Cloud Messaging, OpenStreetMap/Nominatim).
  5. **Data Security & Retention**: Encryption in transit (TLS 1.3) and retention periods (data kept only while the account is active).
  6. **User Rights (DPDP Act 2023 & GDPR)**: Rights to access, update, export, and delete personal data.
  7. **Grievance Officer Contact**: Dedicated email address for privacy inquiries.

---

### Document 2: Terms of Service

* **Where to Add**:
  * In the codebase: `frontend/src/app/terms/page.js`
  * Live URL: `https://theredlinkproject.vercel.app/terms`
  * In the App: In the footer and inside Profile settings.

* **What It Must Include**:
  1. **Strict Prohibition on Blood Commercialization**:
     * Explicit citation of the **Drugs and Cosmetics Act, 1940** and **National Blood Policy of India**.
     * Statement that all blood donations must be **100% voluntary, altruistic, and free of payment**.
     * Zero-tolerance ban on demanding fees, transport charges, or financial compensation for blood.
  2. **Medical Disclaimer & Platform Role**:
     * Statement that *Project Red-Link* is a technical coordination tool, **not a licensed blood bank, medical clinic, or healthcare provider**.
     * Clear warning that biological safety testing (HIV, Hepatitis, cross-matching) **must** be conducted by the certified hospital/blood bank prior to transfusion.
  3. **Donor Responsibility**: Donors agree to provide accurate medical eligibility answers (weight, medication status, 90-day cooldown).
  4. **Code of Conduct & Anti-Abuse**: Prohibition of fake emergency broadcasts, harassment, or misuse.
  5. **Limitation of Liability**: Red-Link is not liable for donor availability, arrival delays, or third-party interactions.

---

### Document 3: Data Deletion & Account Erasure Instructions

* **Where to Add**:
  * Live URL: `https://theredlinkproject.vercel.app/privacy`
  * In Google Play Console: **Data Safety > Data Deletion URL**
  * Inside the App: **CommandCenter > Profile Tab > Danger Zone**

* **What It Must Include**:
  1. Step-by-step instructions for in-app deletion (navigate to Profile > tap "Delete My Account & Personal Data").
  2. Alternative web/email request procedure for users who uninstalled the app (emailing your support email with their registered Google account).
  3. Confirmation that deletion permanently purges name, phone, blood group, location, and records from the database.

---

### Document 4: Store Listing & Health Disclaimers

* **Where to Add**:
  * In **Google Play Console** (Full Description & Health Category declaration).
  * In **Apple App Store Connect** (Promotional Text / Review Notes).

* **What It Must Include**:
  * Short disclaimer text:
    > *"Project Red-Link is a volunteer emergency coordination network connecting blood requesters with local voluntary donors. We are not a medical device or medical provider. Commercial sale of blood is strictly prohibited. Always seek certified medical guidance from registered blood banks and hospitals."*

---

## 2.3 Exact Form Answers for App Store & Play Store Submissions

### Google Play Console (Data Safety Questionnaire):
* **Data encrypted in transit?** ➔ **Yes**
* **Provides a way for users to request data deletion?** ➔ **Yes** (`https://theredlinkproject.vercel.app/privacy`)
* **Data Types Collected**:
  * *Location*: Approximate Location (App Functionality - 10km proximity matching).
  * *Personal Info*: Name, Email, Phone number (Account Management & Emergency Coordination).
  * *Health Info*: Blood Group, Donation Eligibility (App Functionality - Emergency matching).
  * *Device Identifiers*: FCM Token (Push Notifications).
* **Is data shared with 3rd-party advertisers?** ➔ **No**

### Apple App Store Connect (App Privacy Questionnaire):
* **Privacy Policy URL**: `https://theredlinkproject.vercel.app/privacy`
* **Data Linked to User**: Contact Info (Name, Email, Phone Number), Health Data (Blood Group), Approximate Location.
* **Data Used for Tracking**: **None** (Select *"No, we do not track users across other apps/websites"*).
