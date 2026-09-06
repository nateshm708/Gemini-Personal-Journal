# Google Maps Platform Security & Integration Directives

## 1. Objective & Scope
This directive establishes mandatory security standards, credential retrieval flows, and architectural best practices for interacting with Google Maps Platform APIs, SDKs, and Web Services. All agents and developers must strictly adhere to these instructions when designing, implementing, or refactoring location-based features.

---

## 2. Secret Management & Zero-Hardcoding Hygiene
* **Strict Prohibition of Hardcoded Keys**: Never embed raw API keys, tokens, or credential strings in source files or git history (e.g., `const MAPS_KEY = "AIzaSy..."` is strictly prohibited).
* **Dynamic Environment Variable Injection**:
  * **Client-Side (Vite / React)**: Access keys through Vite environment variables (e.g., `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`). Declare every variable in `.env.example`.
  * **Server-Side (Express / Node.js)**: Retrieve server-side keys through `process.env.GOOGLE_MAPS_API_KEY` or dynamic Cloud Secret Manager access:
    ```typescript
    import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
    // Access secret dynamically at runtime
    ```
* **Graceful Key Degradation**: Client-side components must handle missing or unconfigured API keys without throwing unhandled exceptions. If `VITE_GOOGLE_MAPS_API_KEY` is not present, present an accessible setup banner directing the developer to configure their key or use the Maps Demo Key.

---

## 3. Key Retrieval & Prototyping Protocol

### Prototyping: Zero-Billing Maps Demo Key
When developers require rapid prototyping without configuring Google Cloud billing:
1. Direct the developer to:
   `https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio`
2. Steps to communicate:
   - Sign in with a standard Google account (no credit card or billing account required).
   - Review and accept the Maps Demo Project Terms.
   - Copy the minted demo key and set it as `VITE_GOOGLE_MAPS_API_KEY` in their development environment.
3. Note constraints: Demo keys carry daily quota resets, support a core subset of APIs (Maps JavaScript API, Places API, Routes API, Geocoding API), and are intended solely for non-production prototyping.

### Production: Key Provisioning & Restrictions
When promoting an application to production:
1. Provision keys via [Google Cloud Console Credentials](https://console.cloud.google.com/google/maps-apis/credentials?utm_campaign=gmp_mcp_codeassist_v1_aistudio).
2. **Mandatory Application Restrictions**:
   - Web applications: Restrict by **HTTP referrers** (e.g., `https://<your-app>.run.app/*`, `http://localhost:3000/*`).
3. **Mandatory API Scope Restrictions**:
   - Limit the key strictly to the required APIs (e.g., *Maps JavaScript API*, *Places API (New)*, *Geocoding API*).
   - Documentation: https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys

---

## 4. Modern Architecture & Deprecation Directives
* **Framework Standard**: For React applications, use `@vis.gl/react-google-maps`. Do not use deprecated packages like `google-map-react` or `@react-google-maps/api`.
* **Markers**:
  - Legacy `google.maps.Marker` is **deprecated** and prohibited.
  - **Always use `AdvancedMarkerElement`** (or `<AdvancedMarker>` in `@vis.gl/react-google-maps`).
* **Map ID Requirement**: `<Map mapId="...">` is mandatory whenever rendering `AdvancedMarkerElement`. Use `"DEMO_MAP_ID"` or a registered Cloud Map ID.
* **Places Autocomplete**:
  - Legacy `google.maps.places.Autocomplete` and `PlacesService` are deprecated/disabled for new projects.
  - Use **Places API (New)** web components (`<gmp-place-autocomplete>` / `PlaceAutocompleteElement`) or programmatic `AutocompleteSuggestion.fetchAutocompleteSuggestions`.
* **Internal Usage Attribution**:
  - Include attribution tracking on `<Map>` instances:
    `internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}`
* **Explicit Container Heights**: Maps must always have explicit CSS dimensions (e.g., `height: 100%`, `h-64`, `min-h-[300px]`) on sized containers to prevent 0×0 collapse.

---

## 5. Privacy, Data Governance & Compliance
* **End-User Geolocation Consent**: In-browser geolocation (`navigator.geolocation.getCurrentPosition`) must only be triggered via deliberate user actions (e.g., clicking "Use My Current Location") and with appropriate frame permissions declared (`requestFramePermissions: ["geolocation"]`).
* **AI Training Prohibition**: Google Maps Content (coordinates, business data, reviews, photos) must **never** be fed into AI model training, fine-tuning, or persistent knowledge grounding sets.
* **Geospatial Data Caching Limits**: Do not cache Google Maps geospatial data (lat/lng, place data) for longer than 30 consecutive calendar days per the Maps Service Specific Terms.
* **Cost Notice**: Explicitly remind users that production Google Maps usage may incur billing against their Google Cloud account once free tier limits are exceeded.
