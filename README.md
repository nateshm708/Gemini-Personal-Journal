# Gemini Journal & Reflection: Secure Multi-Turn Reflection Companion

A production-grade, user-authenticated journaling web application combining **Firebase Authentication**, **Cloud Firestore**, and the **Gemini 3.6 Flash API** via a resilient server-side proxy. Built to demonstrate zero-trust user data isolation, defensive payload sanitization, and automated model fallback ladders.

---

## Architecture & Technology Stack

| Layer | Technology | Operational Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Google Federated Sign-In (no emails/passwords stored or handled by app code). |
| **Database** | Cloud Firestore | Isolated document storage scoped to `/users/{userId}/interactions/{interactionId}`. |
| **AI Reasoning** | Gemini 3.6 Flash API | Multi-turn contextual reflections, executive summarization, and brainstorming. |
| **Backend Proxy** | Express.js + Vite | Full-stack server running on port `3000` with strict body parsing and API key isolation. |
| **Secret Management** | Secret Manager / Env Vars | Secure storage and runtime injection of `GEMINI_API_KEY`. |

---

## 1. Environment & Prerequisites

Ensure you have installed and authenticated the **Google Cloud SDK (`gcloud`)** and the **Firebase CLI**:

```bash
# Authenticate gcloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

---

## 2. Secret Management Setup (Zero-Hardcoding)

All Gemini API requests are executed server-side. Never expose API keys to client browsers.

```bash
# Create and populate the secret in Google Cloud Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Retrieve your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant the Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure total tenant isolation.

### `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global Safety Net: default deny
    match /{document=**} {
      allow read, write: if false;
    }

    // User-isolated interactions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development & Testing

```bash
# Install dependencies
npm install

# Run unified full-stack development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```

The application runs on `http://0.0.0.0:3000`.

---

## 5. Google Cloud Run Deployment Flow

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
# Build and deploy service to Cloud Run
gcloud run deploy gemini-journal-app \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

---

## 6. Required Campaign Verification Binding

Apply the mandatory challenge verification label to register the Cloud Run deployment for verification:

```bash
gcloud run services update gemini-journal-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## 7. Model Resilience & Fallback Ladder

The server route `/api/gemini/reflect` implements a resilient fallback sequence to eliminate downtime during quota exhaustion or service transitions:

1. **Primary**: `gemini-3.6-flash`
2. **High-Availability Fallback**: `gemini-3.1-flash-lite`
3. **Dynamic Alias**: `gemini-flash-latest`
4. **Deep Reasoning Fallback**: `gemini-3.7-flash`

All outbound calls are tagged with the telemetry header `User-Agent: aistudio-build`.
