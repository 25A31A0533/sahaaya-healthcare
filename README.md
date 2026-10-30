# Sahaaya Health (సహాయ హెల్త్)

**Offline-First, Mobile-First Clinical Decision Support PWA for ASHA & ANM Healthcare Workers**  
*Configured for: Kothavalasa PHC, Visakhapatnam Rural, Andhra Pradesh*  
*Villages: Chinnaipalem, Gollalapalem, Ramabhadrapuram, Tallavalasa, Kothavalasa*

---

> [!CAUTION]
> **Clinical Disclaimer:**  
> **Decision-support only. A doctor decides.**  
> Sahaaya Health is a community health triage and clinical decision-support tool designed for Accredited Social Health Activists (ASHAs) and Auxiliary Nurse Midwives (ANMs). It does not prescribe medications, calculate pharmaceutical dosages, or formulate definitive medical diagnoses. All emergency danger signs must be immediately escalated to medical officers at the Primary Health Centre (PHC) or Community Health Centre (CHC).

---

## 1. Project Overview & Architectural Principles

- **100% Offline in Airplane Mode:** Works with zero external APIs, zero CDNs, zero cloud dependencies, and zero user authentication.
- **Installable Progressive Web App (PWA):** Built with React 18, Vite, Tailwind CSS, and `vite-plugin-pwa` (Workbox). Provides a valid `manifest.webmanifest`, SVG and maskable PNG icons (192px and 512px), in-app install banner via `beforeinstallprompt`, and service worker update notifications.
- **Mobile-First Touch Ergonomics:** Constrained to maximum width of `430px`, minimum `16px` typography throughout, minimum `48px × 48px` touch targets, and high contrast palette (Deep Green `#0F6E56` primary, Red `#E5484D` for emergencies).
- **Bilingual Interface:** Default Telugu script labels with one-touch English toggle.
- **Deterministic Clinical Guardrails:**
  1. **Stage 1 (Danger Detection):** Scans inputs first for maternal and neonatal danger signs across English, Hinglish, and transliterated Telugu.
  2. **Stage 2 (Refusal):** Refuses prescription dosages, diagnostic requests, and non-clinical questions.
  3. **Stage 3 (Retrieval):** In-browser BM25 / TF-IDF scoring over protocol chapters with citations (`Source: <Doc>, Section <X>`).
  4. **Stage 4 (SLM Hook):** Isolated, inactive extension point for future on-device Small Language Models.

---

## 2. Quickstart & Commands

### Prerequisites
- Node.js (v18+ or v22 LTS)
- npm (v9+)

### Installation
```powershell
npm install
```

### Automated Test Suites
Run Vitest unit tests (BM25, Danger Signs, Refusals, Visit Planner, Clinical Engine):
```powershell
npm test
```

Run Playwright end-to-end tests across Chromium (Splash, Language Switch, Viewports 360/768/1024/1440px, Ask AI, Visit Plan, Evaluator Tools, Offline Airplane Mode):
```powershell
npm run test:e2e
```

Run ESLint code verification:
```powershell
npm run lint
```

### Development Server
```powershell
npm run dev
```

### Production Build & PWA Generation
Generates the production bundle in `dist/` with Workbox service worker precaching and GitHub Pages `404.html` fallback:
```powershell
npm run build
```

### Local Production Preview
Serves the built PWA on local port `4173`:
```powershell
npm run preview
```

---

## 3. Production Deployment Options

Sahaaya Health is pre-configured for static hosting platforms and containerized deployment:

### Option A: Vercel
Configuration file: [`vercel.json`](file:///c:/Users/rmadh/OneDrive/Desktop/Sahaaya%20Health/vercel.json)
- Includes clean rewrites to `index.html` for single-page routing and PWA headers (`Service-Worker-Allowed: /`).
- Deploy with:
  ```bash
  npx vercel deploy --prod
  ```

### Option B: Netlify
Configuration file: [`netlify.toml`](file:///c:/Users/rmadh/OneDrive/Desktop/Sahaaya%20Health/netlify.toml)
- Pre-configured build command `npm run build` and publish directory `dist`.
- Includes PWA headers (`Cache-Control: no-cache` for `sw.js` and `manifest.webmanifest`, long-term caching for immutable assets) and SPA redirects.
- Deploy with:
  ```bash
  npx netlify deploy --prod --dir=dist
  ```

### Option C: GitHub Pages (Subpath Hosting)
- Vite configuration supports relative assets and customizable subpath:
  ```bash
  VITE_BASE_PATH="/sahaaya-health/" npm run build
  ```
- The postbuild script ([`scripts/postbuild.js`](file:///c:/Users/rmadh/OneDrive/Desktop/Sahaaya%20Health/scripts/postbuild.js)) automatically duplicates `dist/index.html` to `dist/404.html` so client-side routing and PWA navigation function seamlessly on GitHub Pages.

### Option D: Docker & Nginx
Container assets: [`Dockerfile`](file:///c:/Users/rmadh/OneDrive/Desktop/Sahaaya%20Health/Dockerfile), [`nginx.conf`](file:///c:/Users/rmadh/OneDrive/Desktop/Sahaaya%20Health/nginx.conf)
- Multi-stage build (Node 22 alpine builder + Nginx alpine runtime).
- Custom `nginx.conf` with gzip compression, security headers, and PWA MIME types.
- Build and run:
  ```bash
  docker build -t sahaaya-health .
  docker run -d -p 8080:80 sahaaya-health
  ```
- Access at `http://localhost:8080`.

---

## 4. Step-by-Step Offline & Airplane Mode Verification

To verify full offline compliance as required for rural field deployment:

1. **First-Time Online Load:**
   - Run `npm run preview` and navigate to `http://localhost:4173`.
   - The app will load from the server and display a toast notification:  
     `"Ready for offline use! All protocols cached on device."`
   - IndexedDB (`sahaaya_health_db`) is automatically seeded with 30 Vizag households and 10 protocol chapters.

2. **Install the Application:**
   - Click the in-app **"Install App"** button on the Home banner or More screen (or browser install icon).
   - Once installed, the button updates to `"✓ Installed"`.

3. **Switch to Airplane Mode / Disconnect Network:**
   - Turn on Airplane mode on your device (or in Chrome DevTools > Network tab, select **Offline**).
   - **Completely close and kill the browser tab / PWA window.**

4. **Reopen Sahaaya Health While Offline:**
   - Reopen the app or navigate to `http://localhost:4173`.
   - **Result:** The application opens instantly with zero network delay.
   - The green status banner confirms: `"Offline Mode - all features available"`.

5. **Test Core Features in Airplane Mode:**
   - **Home Screen:** Real-time statistics are dynamically computed from local IndexedDB data (30 households, urgent alerts, due immunizations).
   - **Ask AI Decision Support:**
     - Ask: *"Garbhavathi ki raktasravam avtondi, urgently emi cheyali?"*  
       -> Instantly displays inline red **REFER IMMEDIATELY** card with 108 ambulance guidance and citation to Section 1.2.
     - Ask: *"What is dietary advice for high blood pressure and salt?"*  
       -> Confirms no false alarm triggered on "blood pressure"; returns Section 5.1 excerpt and citation in sub-20ms.
     - Ask: *"What is the exact dose in mg of Paracetamol syrup for 4kg child?"*  
       -> Refuses safely: *"This is outside the protocols. ASHA workers do not prescribe dosages or diagnoses. Please consult a doctor at Kothavalasa PHC."*
   - **Daily Visit Plan:**
     - Visits are ordered by clinical priority (Urgent Priority 1 first, then Overdue, then Due soon).
     - Tap **"Mark Completed"** on any visit -> updates local state and writes to IndexedDB `syncQueue`.
   - **Household Register:**
     - Filter 30 families by village (*Chinnaipalem*, *Gollalapalem*, etc.) and category (*Pregnant*, *Child*, *NCD*).
   - **More > Evaluator Tools:**
     - Footprint tab shows real on-device metrics (`0 MB` model size, sub-10ms BM25 latency).
     - Test Console runs all 55 test questions live with 100% pass rates.
   - **More > Offline Data & Sync:**
     - Shows pending offline updates count. Tap **"Sync Now"** to clear the queue locally.

---

## 5. Responsive Layout & Ergonomics

Sahaaya Health is optimized across handheld and desktop form factors:
- **Mobile (<768px):** Clean single-column layout constrained to max `430px`, bottom navigation bar, minimum 48px touch targets, sticky emergency header.
- **Tablet / Desktop (>=768px):** Automatically switches to an ergonomic left sidebar navigation and 2 to 3 column content grids inside a `max-w-6xl` container (no rigid mobile phone frame on desktop).
- **Tested Viewports:** 360px (mobile), 768px (tablet portrait), 1024px (tablet landscape/small laptop), 1440px (desktop) verified free of horizontal scroll.

---

## 6. Transliterated Telugu & Hinglish Keyword Reference (Native Review)

Every non-English term used in `danger_signs.json` has been tagged with `review_status: "needs_native_review"` for validation by regional medical officers and native Telugu speakers:

| Transliterated Term | Language / Origin | Clinical Meaning | Matched Danger Category | Native Review Status |
|---|---|---|---|---|
| `raktasravam` | Telugu Transliterated | Bleeding / Hemorrhage | Maternal Vaginal Bleeding | Needs Native Review |
| `raktha sravam` | Telugu Transliterated | Bleeding / Hemorrhage | Maternal Vaginal Bleeding | Needs Native Review |
| `kallu pothunnayi` | Telugu Colloquial | Severe bleeding / discharge | Maternal Vaginal Bleeding | Needs Native Review |
| `khoon nikal raha` | Hinglish | Bleeding occurring | Maternal Vaginal Bleeding | Needs Native Review |
| `murcha` | Telugu Transliterated | Fainting / Convulsions | Convulsions / Eclampsia | Needs Native Review |
| `kampam` | Telugu Transliterated | Shivering fits / tremors | Convulsions / Eclampsia | Needs Native Review |
| `valippu` | South Regional | Seizure / Fit | Convulsions / Eclampsia | Needs Native Review |
| `tala noppi chekatlu` | Telugu Colloquial | Headache with dark vision | Severe Headache / Pre-eclampsia | Needs Native Review |
| `chekatlu kammadham` | Telugu Colloquial | Blackout / Dim vision | Severe Headache / Pre-eclampsia | Needs Native Review |
| `thala noppi` | Telugu Transliterated | Headache | Severe Headache | Needs Native Review |
| `kadupu noppi` | Telugu Transliterated | Abdominal pain | Severe Abdominal Pain | Needs Native Review |
| `potta noppi` | Telugu Colloquial | Belly pain | Severe Abdominal Pain | Needs Native Review |
| `bidda kadaladam ledu` | Telugu Colloquial | Baby is not moving | Decreased Fetal Movement | Needs Native Review |
| `kadalika ledu` | Telugu Colloquial | No movement | Decreased Fetal Movement | Needs Native Review |
| `baccha hil nahi raha` | Hinglish | Baby not moving | Decreased Fetal Movement | Needs Native Review |
| `tega jwaram` | Telugu Colloquial | Severe high fever | High Fever with Danger Signs | Needs Native Review |
| `daddurlu` | Telugu Transliterated | Skin rash / hives | High Fever with Rash | Needs Native Review |
| `swasa adadam ledu` | Telugu Colloquial | Breathlessness / choking | Severe Difficulty Breathing | Needs Native Review |
| `dummu kattukuntundi` | Telugu Colloquial | Asthma / choking fit | Severe Difficulty Breathing | Needs Native Review |
| `paalu thaagatam ledu` | Telugu Colloquial | Newborn not drinking milk | Neonatal Sepsis / Feeding Failure | Needs Native Review |
| `challaga ayipoyindi` | Telugu Colloquial | Infant turned cold | Neonatal Hypothermia | Needs Native Review |
| `rommu lopadaki` | Telugu Colloquial | Lower chest indrawing | Neonatal Respiratory Distress | Needs Native Review |
| `vesam ga swasa` | Telugu Colloquial | Rapid fast breathing | Neonatal Fast Breathing | Needs Native Review |
| `pasupu arachethulu` | Telugu Colloquial | Yellow palms / soles | Severe Neonatal Jaundice | Needs Native Review |
| `boddu nunchi cheemu` | Telugu Colloquial | Pus oozing from umbilicus | Neonatal Umbilical Infection | Needs Native Review |

---

## 7. Evaluator Tools & Technical Disclosures

- **Evaluator Tools:** Located under `More > Evaluator Tools`, combining the real-time **System Footprint** and **Clinical Rule Test Console**.
- **Search Engine:** Deterministic In-Browser BM25 algorithm with inverse document frequency tokenization.
- **Model Size:** Transparently reported as **`0 MB`**. No neural network or Large Language Model weights are loaded or executed.
- **Voice / Microphone Integration (Web Speech API):** 
  - Integrated using standard browser `SpeechRecognition` / `webkitSpeechRecognition`.
  - Configured for `te-IN` (Telugu) and `en-IN` (English) based on selected UI language.
  - Dictated speech pre-fills the text input box so health workers can review or edit before submitting (never auto-sends).
  - First-use notice informs users: *"Voice input is processed by your browser's speech service and needs internet. Typed questions stay on your device."*
  - **Offline Behavior:** Disabled when offline with a clear notification: *"Voice needs internet. Please type your question."*
  - **Manual Verification Note:** Real hardware microphone input requires user permission and browser cloud speech services, so automated CI tests validate this via mocked SpeechRecognition; physical voice recognition should be verified in Chrome for Android or desktop Chrome.
- **Connection Detection & Auto-Sync:**
  - Real-time reactive status hook (`useConnectionStatus`) combines `navigator.onLine`, window online/offline events, and same-origin ping verification.
  - High-visibility status indicator: Green dot for `"Online - data syncs automatically"`, Amber dot for `"Offline - all features available, changes saved on this device"`.
  - Auto-sync activates when network is restored: flushes pending queue, updates IndexedDB `last_sync_time`, and triggers a confirmation toast (`"Back online — N updates synced"`).
- **Direct Emergency Calling:**
  - Prominent "Call 108" (`tel:108`) buttons added to both the inline emergency danger sign alert card and the dedicated Emergency Screen.
- **Accessibility & Zoom:**
  - Full pinch-to-zoom is supported (`maximum-scale` and `user-scalable=no` removed).
- **Pluggable SLM Hook:** The function `generateWordingWithLocalLLM()` in `src/lib/clinicalEngine.js` is an inactive stub that passes through verified protocol text.
- **Sample Data Notice:** All 30 households in `households.json` are synthetic test representations of Visakhapatnam Rural villages (Chinnaipalem, Gollalapalem, Ramabhadrapuram, Tallavalasa, Kothavalasa). Household `KV-018` is **Simhadri Padmavati** (replacing Madhavi).

---

## 8. Optional: Wrapping PWA as an Android APK with Capacitor

If you wish to distribute Sahaaya Health as a native Android APK:

1. Ensure the PWA is built:
   ```powershell
   npm run build
   ```
2. Install Capacitor packages:
   ```powershell
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
3. Initialize Capacitor project:
   ```powershell
   npx cap init "Sahaaya Health" "org.sahaaya.health" --web-dir dist
   ```
4. Add the Android platform and sync web assets:
   ```powershell
   npx cap add android
   npx cap sync android
   ```
5. Open Android Studio to build the signed APK:
   ```powershell
   npx cap open android
   ```
6. In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 9. License & Attribution

Developed for community health workers in Andhra Pradesh.  
All medical content is illustrative sample material for clinical decision-support evaluation.
